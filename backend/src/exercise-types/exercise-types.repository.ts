import { Injectable } from '@nestjs/common';
import { ExerciseType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseTypeDto } from './dto/create-exercise-type.dto';
import { IExerciseTypesRepository } from './interfaces/exercise-types.repository.interface';

/**
 * ExerciseTypesRepository - Implementa el patrón Repository
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de tipos de ejercicio
 * - Encapsula la lógica de persistencia con Prisma
 * - Proporciona una interfaz clara para operaciones CRUD
 * 
 * Dependency Inversion Principle:
 * - El servicio depende de la interfaz IExerciseTypesRepository, no de esta implementación
 */
@Injectable()
export class ExerciseTypesRepository implements IExerciseTypesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExerciseTypeDto, userId: string): Promise<ExerciseType> {
    return this.prisma.exerciseType.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async findById(id: string): Promise<ExerciseType | null> {
    return this.prisma.exerciseType.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<ExerciseType | null> {
    return this.prisma.exerciseType.findUnique({
      where: { name },
    });
  }

  async findAll(): Promise<ExerciseType[]> {
    return this.prisma.exerciseType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAllActive(): Promise<ExerciseType[]> {
    return this.prisma.exerciseType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, data: Partial<ExerciseType>): Promise<ExerciseType> {
    return this.prisma.exerciseType.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<ExerciseType> {
    return this.prisma.exerciseType.delete({
      where: { id },
    });
  }
}

