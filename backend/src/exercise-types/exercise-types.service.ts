import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ExerciseType } from '@prisma/client';
import { ExerciseTypesRepository } from './exercise-types.repository';
import { CreateExerciseTypeDto } from './dto/create-exercise-type.dto';
import { UpdateExerciseTypeDto } from './dto/update-exercise-type.dto';

/**
 * ExerciseTypesService - Lógica de negocio para gestión de tipos de ejercicio
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Lógica de negocio de tipos de ejercicio
 * - Validaciones de negocio
 * - Coordinación entre repository y otras capas
 * 
 * No maneja:
 * - Persistencia directa (delegado al Repository)
 * - Validación de DTOs (delegado a ValidationPipe)
 */
@Injectable()
export class ExerciseTypesService {
  constructor(
    private readonly exerciseTypesRepository: ExerciseTypesRepository,
  ) {}

  async create(createExerciseTypeDto: CreateExerciseTypeDto, userId: string): Promise<ExerciseType> {
    // Validar nombre no vacío
    if (!createExerciseTypeDto.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Verificar si el tipo de ejercicio ya existe
    const existingType = await this.exerciseTypesRepository.findByName(
      createExerciseTypeDto.name,
    );

    if (existingType) {
      throw new ConflictException('Exercise type with this name already exists');
    }

    return this.exerciseTypesRepository.create(createExerciseTypeDto, userId);
  }

  async findAll(): Promise<ExerciseType[]> {
    return this.exerciseTypesRepository.findAll();
  }

  async findAllActive(): Promise<ExerciseType[]> {
    return this.exerciseTypesRepository.findAllActive();
  }

  async findById(id: string): Promise<ExerciseType> {
    const exerciseType = await this.exerciseTypesRepository.findById(id);

    if (!exerciseType) {
      throw new NotFoundException(`Exercise type with id ${id} not found`);
    }

    return exerciseType;
  }

  async update(
    id: string,
    updateExerciseTypeDto: UpdateExerciseTypeDto,
  ): Promise<ExerciseType> {
    const exerciseType = await this.exerciseTypesRepository.findById(id);

    if (!exerciseType) {
      throw new NotFoundException(`Exercise type with id ${id} not found`);
    }

    // Si se actualiza el nombre, validar que no esté vacío y no exista otro con ese nombre
    if (updateExerciseTypeDto.name !== undefined) {
      if (!updateExerciseTypeDto.name.trim()) {
        throw new BadRequestException('Name cannot be empty');
      }

      const existingType = await this.exerciseTypesRepository.findByName(
        updateExerciseTypeDto.name,
      );

      if (existingType && existingType.id !== id) {
        throw new ConflictException('Exercise type with this name already exists');
      }
    }

    return this.exerciseTypesRepository.update(id, updateExerciseTypeDto);
  }

  async delete(id: string): Promise<void> {
    const exerciseType = await this.exerciseTypesRepository.findById(id);

    if (!exerciseType) {
      throw new NotFoundException(`Exercise type with id ${id} not found`);
    }

    await this.exerciseTypesRepository.delete(id);
  }
}

