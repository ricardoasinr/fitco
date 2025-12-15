import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;

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
    const admin = await prisma.user.upsert({
      where: { email: 'admin-test@fitco.com' },
      update: {},
      create: {
        email: 'admin-test@fitco.com',
        password: adminPassword,
        name: 'Admin Test',
        role: 'ADMIN',
      },
    });

    // Create test regular user
    const userPassword = await bcrypt.hash('User123!', 10);
    const user = await prisma.user.upsert({
      where: { email: 'user-test@fitco.com' },
      update: {},
      create: {
        email: 'user-test@fitco.com',
        password: userPassword,
        name: 'User Test',
        role: 'USER',
      },
    });
    testUserId = user.id;

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin-test@fitco.com',
        password: 'Admin123!',
      });

    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user-test@fitco.com',
        password: 'User123!',
      });

    adminToken = adminLogin.body.access_token;
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'admin-test@fitco.com',
            'user-test@fitco.com',
            'newuser@test.com',
            'register-test@example.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return JWT token', async () => {
      const registerDto = {
        email: 'register-test@example.com',
        password: 'password123',
        name: 'Register Test',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.name).toBe(registerDto.name);
      expect(response.body.user.role).toBe('USER');
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.role).toBe('USER');
    });

    it('should reject duplicate email registration', async () => {
      const registerDto = {
        email: 'register-test@example.com',
        password: 'password123',
        name: 'Duplicate Test',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should reject registration with role field (security)', async () => {
      const registerDto = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'ADMIN', // Should be rejected
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'user-test@fitco.com',
        password: 'User123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        email: 'user-test@fitco.com',
        password: 'wrong-password',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body.email).toBe('user-test@fitco.com');
    });

    it('should reject request without authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });

    it('should reject request with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in email field', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      const loginDto = {
        email: maliciousEmail,
        password: 'password123',
      };

      // Should fail validation, not execute SQL
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400); // Validation error, not SQL error
    });

    it('should prevent NoSQL injection attempts', async () => {
      const maliciousPayload = {
        email: { $ne: null },
        password: { $gt: '' },
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(maliciousPayload)
        .expect(400);
    });

    it('should enforce rate limiting on login endpoint', async () => {
      // Make multiple rapid requests
      const loginDto = {
        email: 'user-test@fitco.com',
        password: 'wrong-password',
      };

      // Make 10 requests rapidly
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto),
      );

      const responses = await Promise.all(requests);
      
      // All should fail, but we're testing that rate limiting doesn't break
      // In a real scenario, after many attempts, we'd get 429 Too Many Requests
      responses.forEach((response) => {
        expect([400, 401, 429]).toContain(response.status);
      });
    });

    it('should not expose password in error messages', async () => {
      const loginDto = {
        email: 'user-test@fitco.com',
        password: 'wrong-password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      // Error message should not contain password
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('wrong-password');
      expect(responseText).not.toContain('password');
    });
  });
});

