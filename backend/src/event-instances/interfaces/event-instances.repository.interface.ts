import { EventInstance } from '@prisma/client';

export type EventInstanceWithEvent = EventInstance & {
  event: {
    id: string;
    name: string;
    description: string;
    time: string;
    capacity: number;
    isActive: boolean;
    exerciseType: {
      id: string;
      name: string;
    };
  };
  _count?: {
    registrations: number;
  };
};

export interface IEventInstancesRepository {
  create(data: { eventId: string; dateTime: Date; capacity: number }): Promise<EventInstance>;
  createMany(data: { eventId: string; dateTime: Date; capacity: number }[]): Promise<number>;
  findById(id: string): Promise<EventInstanceWithEvent | null>;
  findByEventId(eventId: string): Promise<EventInstanceWithEvent[]>;
  findAvailableByEventId(eventId: string): Promise<EventInstanceWithEvent[]>;
  update(id: string, data: Partial<EventInstance>): Promise<EventInstance>;
  delete(id: string): Promise<EventInstance>;
  deleteByEventId(eventId: string): Promise<number>;
  countRegistrations(instanceId: string): Promise<number>;
}

