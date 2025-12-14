export interface ExerciseType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  exerciseTypeId: string;
  createdAt: string;
  updatedAt: string;
  exerciseType: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export interface CreateExerciseTypeDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateExerciseTypeDto {
  name?: string;
  isActive?: boolean;
}

export interface CreateEventDto {
  name: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  exerciseTypeId: string;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  date?: string;
  time?: string;
  capacity?: number;
  exerciseTypeId?: string;
}

