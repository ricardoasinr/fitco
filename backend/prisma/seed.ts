import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Script de seed para crear usuario administrador
 * 
 * Uso:
 * npm run seed
 * 
 * O directamente:
 * npx ts-node prisma/seed.ts
 */
async function main() {
  console.log('🌱 Starting seed...\n');

  // Datos del admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fitco.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  // Verificar si ya existe un admin con ese email
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`⚠️  Admin user already exists with email: ${adminEmail}`);
    console.log(`   User ID: ${existingAdmin.id}`);
    console.log(`   Role: ${existingAdmin.role}\n`);

    // Si existe pero no es admin, actualizar su rol
    if (existingAdmin.role !== Role.ADMIN) {
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: Role.ADMIN },
      });
      console.log(`✅ Updated user role to ADMIN\n`);
    }
  } else {
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: Role.ADMIN,
      },
    });

    console.log('✅ Admin user created successfully!\n');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);
  }

  // Generar JWT para el admin
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const jwtService = new JwtService({
    secret: jwtSecret,
    signOptions: { expiresIn: '1d' },
  });

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (admin) {
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = jwtService.sign(payload);

    console.log('🔑 JWT Token generated:\n');
    console.log(`${token}\n`);
    console.log('📋 Copy this token to use in your requests:');
    console.log(`   Authorization: Bearer ${token}\n`);
    console.log('🧪 Test the token with:');
    console.log(`   curl -H "Authorization: Bearer ${token}" http://localhost:3000/auth/profile\n`);
    console.log(`✨ Login credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}\n`);
  }

  // Crear ExerciseTypes
  const exerciseTypes = [
    { name: 'Yoga', description: 'Conecta cuerpo y mente mediante posturas y respiración.' },
    { name: 'Pilates', description: 'Fortalece el núcleo y mejora la flexibilidad.' },
    { name: 'Meditación', description: 'Encuentra paz interior y reduce el estrés.' },
    { name: 'CrossFit', description: 'Entrenamiento funcional de alta intensidad.' },
  ];

  console.log('🏋️  Seeding ExerciseTypes...');

  const createdTypes = [];

  // Necesitamos un userId para crear los tipos (el admin que acabamos de crear/buscar)
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (adminUser) {
    for (const type of exerciseTypes) {
      const existing = await prisma.exerciseType.findFirst({ where: { name: type.name } });
      if (!existing) {
        const newType = await prisma.exerciseType.create({
          data: {
            ...type,
            createdBy: adminUser.id,
          },
        });
        createdTypes.push(newType);
        console.log(`   Created: ${newType.name}`);
      } else {
        createdTypes.push(existing);
        console.log(`   Exists: ${existing.name}`);
      }
    }

    // Crear Eventos (Futuros y Pasados)
    console.log('\n📅 Seeding Events...');

    if (createdTypes.length > 0) {
      const today = new Date();

      // Evento 1: Mañana (Yoga)
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const event1Data = {
        name: 'Yoga al Amanecer',
        description: 'Empieza tu día con energía positiva.',
        exerciseTypeId: createdTypes.find(t => t.name === 'Yoga')?.id,
        startDate: tomorrow,
        endDate: tomorrow, // Mismo día
        time: '10:00',
        capacity: 20,
        createdBy: adminUser.id,
      };

      // Evento 2: Pasado mañana (Pilates)
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(18, 0, 0, 0);

      const event2Data = {
        name: 'Pilates Core',
        description: 'Clase intensiva de abdomen.',
        exerciseTypeId: createdTypes.find(t => t.name === 'Pilates')?.id,
        startDate: dayAfter,
        endDate: dayAfter,
        time: '18:00',
        capacity: 15,
        createdBy: adminUser.id,
      };

      // Crear eventos si no existen (búsqueda simple por nombre para no duplicar en seeds repetidos)
      for (const evtData of [event1Data, event2Data]) {
        if (evtData.exerciseTypeId) {
          // Verificar si existe un evento similar (mismo nombre y fecha)
          const existingEvt = await prisma.event.findFirst({
            where: {
              name: evtData.name,
              // Simplificación: solo chequeamos nombre para el seed
            }
          });

          if (!existingEvt) {
            // Crear evento
            const event = await prisma.event.create({
              data: {
                name: evtData.name,
                description: evtData.description,
                exerciseTypeId: evtData.exerciseTypeId,
                startDate: evtData.startDate,
                endDate: evtData.endDate,
                time: evtData.time,
                capacity: evtData.capacity,
                createdBy: evtData.createdBy, // Fix: use createdBy from evtData (which is now correct)
              }
            });

            // Generar instancia única para este evento (lógica simplificada del servicio)
            await prisma.eventInstance.create({
              data: {
                eventId: event.id,
                dateTime: evtData.startDate,
                capacity: evtData.capacity,
                isActive: true
              }
            });

            console.log(`   Created Event: ${event.name}`);
          } else {
            console.log(`   Event Exists: ${evtData.name}`);
          }
        }
      }
    }
  }

  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

