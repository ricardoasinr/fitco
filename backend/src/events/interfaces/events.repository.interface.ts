import { Event, RecurrenceType } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';

export type EventWithRelations = Event & {
  exerciseType: {
    id: string;
    name: string;
    isActive: boolean;
  };
  _count?: {
    registrations: number;
    instances: number;
  };
  instances?: {
    id: string;
    dateTime: Date;
    capacity: number;
    isActive: boolean;
    _count?: {
      registrations: number;
    };
  }[];
};

// Alias for backward compatibility
export type EventWithExerciseType = EventWithRelations;

export interface IEventsRepository {
  create(data: CreateEventDto, userId: string): Promise<EventWithRelations>;
  findById(id: string): Promise<EventWithRelations | null>;
  findAll(): Promise<EventWithRelations[]>;
  findAllActive(): Promise<EventWithRelations[]>;
  findAllNotDeleted(): Promise<EventWithRelations[]>;
  findActiveAndNotDeleted(): Promise<EventWithRelations[]>;
  findByIdForUser(id: string, userId?: string): Promise<EventWithRelations | null>;
  update(id: string, data: Partial<Event>): Promise<EventWithRelations>;
  softDelete(id: string): Promise<Event>;
  delete(id: string): Promise<Event>;
}
