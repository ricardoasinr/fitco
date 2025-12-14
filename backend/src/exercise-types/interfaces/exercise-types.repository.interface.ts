import { ExerciseType } from '@prisma/client';
import { CreateExerciseTypeDto } from '../dto/create-exercise-type.dto';

export interface IExerciseTypesRepository {
  create(data: CreateExerciseTypeDto): Promise<ExerciseType>;
  findById(id: string): Promise<ExerciseType | null>;
  findByName(name: string): Promise<ExerciseType | null>;
  findAll(): Promise<ExerciseType[]>;
  findAllActive(): Promise<ExerciseType[]>;
  update(id: string, data: Partial<ExerciseType>): Promise<ExerciseType>;
  delete(id: string): Promise<ExerciseType>;
}

