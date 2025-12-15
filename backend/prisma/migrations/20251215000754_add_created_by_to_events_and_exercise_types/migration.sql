/*
  Warnings:

  - Added the required column `createdBy` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `exercise_types` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add column as nullable first
ALTER TABLE "events" ADD COLUMN     "createdBy" TEXT;
ALTER TABLE "exercise_types" ADD COLUMN     "createdBy" TEXT;

-- Step 2: Get the first admin user ID (or first user if no admin exists)
-- Update existing events with the admin user ID
UPDATE "events" 
SET "createdBy" = COALESCE(
  (SELECT id FROM "users" WHERE role = 'ADMIN' LIMIT 1),
  (SELECT id FROM "users" LIMIT 1)
)
WHERE "createdBy" IS NULL;

-- Step 3: Update existing exercise_types with the admin user ID
UPDATE "exercise_types" 
SET "createdBy" = COALESCE(
  (SELECT id FROM "users" WHERE role = 'ADMIN' LIMIT 1),
  (SELECT id FROM "users" LIMIT 1)
)
WHERE "createdBy" IS NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE "events" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "exercise_types" ALTER COLUMN "createdBy" SET NOT NULL;
