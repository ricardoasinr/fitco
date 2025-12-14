import { Event } from '@prisma/client';
import { CreateEventDto } from '../dto/create-event.dto';

export type EventWithExerciseType = Event & {
  exerciseType: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

export interface IEventsRepository {
  create(data: CreateEventDto): Promise<EventWithExerciseType>;
  findById(id: string): Promise<EventWithExerciseType | null>;
  findAll(): Promise<EventWithExerciseType[]>;
  update(id: string, data: Partial<Event>): Promise<EventWithExerciseType>;
  delete(id: string): Promise<Event>;
}

