-- Drop the old unique constraint
ALTER TABLE "registrations" DROP CONSTRAINT IF EXISTS "registrations_userId_eventId_key";

-- Add new unique constraint on userId and eventInstanceId
-- This allows users to register for multiple instances of the same event
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_userId_eventInstanceId_key" UNIQUE ("userId", "eventInstanceId");

