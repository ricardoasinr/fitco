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

