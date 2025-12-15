-- AlterTable: Add deletedAt column to events
ALTER TABLE "events" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Change onDelete behavior for event_instances
ALTER TABLE "event_instances" DROP CONSTRAINT "event_instances_eventId_fkey";
ALTER TABLE "event_instances" ADD CONSTRAINT "event_instances_eventId_fkey" 
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Change onDelete behavior for registrations (event relation)
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_eventId_fkey";
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventId_fkey" 
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Change onDelete behavior for registrations (eventInstance relation)
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_eventInstanceId_fkey";
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_eventInstanceId_fkey" 
  FOREIGN KEY ("eventInstanceId") REFERENCES "event_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

