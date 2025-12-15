// Setup file for e2e tests
// This file runs before each e2e test suite

import { execSync } from 'child_process';

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'postgresql://fitco:fitco123@localhost:5433/fitco_test_db';
}

// Set JWT secret for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests';
}

// Set JWT expiration
if (!process.env.JWT_EXPIRES_IN) {
  process.env.JWT_EXPIRES_IN = '1d';
}

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Run Prisma migrations on test database before tests
// This ensures the database schema is up to date
try {
  console.log('🔄 Running Prisma migrations on test database...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
  console.log('✅ Migrations completed');
} catch (error) {
  console.error('⚠️  Failed to run migrations:', error);
  // Continue anyway - migrations might already be applied
}

// Increase timeout for e2e tests
jest.setTimeout(30000);

