-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('SINGLE', 'WEEKLY', 'INTERVAL');

-- CreateTable: event_instances
CREATE TABLE "event_instances" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_instances_pkey" PRIMARY KEY ("id")
);

-- Add new columns to events table with defaults for existing data
ALTER TABLE "events" ADD COLUMN "startDate" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "endDate" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "events" ADD COLUMN "recurrencePattern" JSONB;

-- Migrate existing date values to startDate and endDate
UPDATE "events" SET "startDate" = "date", "endDate" = "date";

-- Make startDate and endDate NOT NULL after data migration
ALTER TABLE "events" ALTER COLUMN "startDate" SET NOT NULL;
ALTER TABLE "events" ALTER COLUMN "endDate" SET NOT NULL;

-- Drop old date column
ALTER TABLE "events" DROP COLUMN "date";

-- Add eventInstanceId column to registrations (nullable temporarily)
ALTER TABLE "registrations" ADD COLUMN "eventInstanceId" TEXT;

-- Create event instances for existing events and link registrations
-- For each existing event, create one instance with the event's startDate + time
DO $$
DECLARE
    event_record RECORD;
    instance_id TEXT;
    time_parts TEXT[];
    event_datetime TIMESTAMP;
BEGIN
    FOR event_record IN SELECT id, "startDate", time, capacity FROM events LOOP
        -- Generate UUID for the instance
        instance_id := gen_random_uuid()::TEXT;
        
        -- Parse time (format HH:MM) and combine with date
        time_parts := string_to_array(event_record.time, ':');
        event_datetime := event_record."startDate" + 
            (time_parts[1]::INTEGER * INTERVAL '1 hour') + 
            (time_parts[2]::INTEGER * INTERVAL '1 minute');
        
        -- Create the event instance
        INSERT INTO "event_instances" ("id", "eventId", "dateTime", "capacity", "isActive", "createdAt", "updatedAt")
        VALUES (instance_id, event_record.id, event_datetime, event_record.capacity, true, NOW(), NOW());
        
        -- Link all registrations for this event to the new instance
        UPDATE "registrations" SET "eventInstanceId" = instance_id WHERE "eventId" = event_record.id;
    END LOOP;
END $$;

-- Now make eventInstanceId NOT NULL
ALTER TABLE "registrations" ALTER COLUMN "eventInstanceId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "event_instances" ADD CONSTRAINT "event_instances_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventInstanceId_fkey" FOREIGN KEY ("eventInstanceId") REFERENCES "event_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

