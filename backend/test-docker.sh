#!/bin/bash

# Script to run tests in Docker environment
# This script sets up the test database and runs all tests

set -e

echo "🧪 Setting up test environment in Docker..."

# Check if test database container is running
if ! docker ps | grep -q fitco_postgres_test; then
  echo "📦 Starting test database container..."
  docker-compose up -d postgres_test
  
  echo "⏳ Waiting for test database to be ready..."
  sleep 5
fi

# Set test database URL
export DATABASE_URL="postgresql://fitco:fitco123@localhost:5433/fitco_test_db"
export TEST_DATABASE_URL="$DATABASE_URL"
export JWT_SECRET="test-jwt-secret-key"
export JWT_EXPIRES_IN="1d"
export NODE_ENV="test"

# Run Prisma migrations on test database
echo "🔄 Running Prisma migrations on test database..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Run tests
echo "🚀 Running tests..."
echo ""

echo "📝 Running unit tests..."
npm run test

echo ""
echo "🔗 Running integration tests..."
npm run test:integration

echo ""
echo "🌐 Running e2e tests..."
npm run test:e2e

echo ""
echo "✅ All tests completed!"

