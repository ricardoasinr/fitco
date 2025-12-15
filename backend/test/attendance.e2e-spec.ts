import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testRegistrationId: string;
  let testEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.user.upsert({
      where: { email: 'admin-attendance@fitco.com' },
      update: {},
      create: {
        email: 'admin-attendance@fitco.com',
        password: adminPassword,
        name: 'Admin Attendance',
        role: 'ADMIN',
      },
    });

    // Create test regular user
    const userPassword = await bcrypt.hash('User123!', 10);
    const user = await prisma.user.upsert({
      where: { email: 'user-attendance@fitco.com' },
      update: {},
      create: {
        email: 'user-attendance@fitco.com',
        password: userPassword,
        name: 'User Attendance',
        role: 'USER',
      },
    });

    // Create test exercise type
    const exerciseType = await prisma.exerciseType.upsert({
      where: { name: 'Test Exercise' },
      update: {},
      create: {
        name: 'Test Exercise',
        isActive: true,
        createdBy: user.id,
      },
    });

    // Create test event
    const event = await prisma.event.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Event',
        description: 'Test Event Description',
        startDate: new Date(),
        endDate: new Date(),
        time: '10:00',
        capacity: 10,
        recurrenceType: 'SINGLE',
        exerciseTypeId: exerciseType.id,
        createdBy: user.id,
        isActive: true,
      },
    });
    testEventId = event.id;

    // Create test event instance
    const eventInstance = await prisma.eventInstance.create({
      data: {
        eventId: event.id,
        dateTime: new Date(),
        capacity: 10,
        isActive: true,
      },
    });

    // Create test registration
    const registration = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId: event.id,
        eventInstanceId: eventInstance.id,
      },
    });
    testRegistrationId = registration.id;

    // Create attendance record
    await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        attended: false,
      },
    });

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-attendance@fitco.com',
        password: 'Admin123!',
      });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user-attendance@fitco.com',
        password: 'User123!',
      });

    adminToken = adminLogin.body.access_token;
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.attendance.deleteMany({
      where: {
        registration: {
          eventId: testEventId,
        },
      },
    });
    await prisma.registration.deleteMany({
      where: { eventId: testEventId },
    });
    await prisma.eventInstance.deleteMany({
      where: { eventId: testEventId },
    });
    await prisma.event.deleteMany({
      where: { id: testEventId },
    });
    await prisma.exerciseType.deleteMany({
      where: { name: 'Test Exercise' },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin-attendance@fitco.com', 'user-attendance@fitco.com'],
        },
      },
    });
    await app.close();
  });

  describe('POST /attendance/mark', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/attendance/mark')
        .send({ registrationId: testRegistrationId })
        .expect(401);
    });

    it('should fail with user token (requires ADMIN)', () => {
      return request(app.getHttpServer())
        .post('/attendance/mark')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ registrationId: testRegistrationId })
        .expect(403);
    });

    it('should mark attendance successfully with admin token', async () => {
      // First, ensure attendance is not marked
      await prisma.attendance.updateMany({
        where: { registrationId: testRegistrationId },
        data: { attended: false },
      });

      const response = await request(app.getHttpServer())
        .post('/attendance/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registrationId: testRegistrationId })
        .expect(201);

      expect(response.body).toHaveProperty('attended');
      expect(response.body.attended).toBe(true);
    });

    it('should reject invalid registrationId', () => {
      return request(app.getHttpServer())
        .post('/attendance/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ registrationId: 'invalid-uuid' })
        .expect(400);
    });

    it('should reject missing registrationId', () => {
      return request(app.getHttpServer())
        .post('/attendance/mark')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /attendance/event/:eventId', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/attendance/event/${testEventId}`)
        .expect(401);
    });

    it('should fail with user token (requires ADMIN)', () => {
      return request(app.getHttpServer())
        .get(`/attendance/event/${testEventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return attendance list with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject invalid eventId format', () => {
      return request(app.getHttpServer())
        .get('/attendance/event/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /attendance/event/:eventId/stats', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/attendance/event/${testEventId}/stats`)
        .expect(401);
    });

    it('should return stats with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get(`/attendance/event/${testEventId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('attended');
      expect(response.body).toHaveProperty('notAttended');
    });
  });
});
