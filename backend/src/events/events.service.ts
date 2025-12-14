import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Event } from '@prisma/client';
import { EventsRepository } from './events.repository';
import { ExerciseTypesService } from '../exercise-types/exercise-types.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventWithExerciseType } from './interfaces/events.repository.interface';

/**
 * EventsService - Lógica de negocio para gestión de eventos
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Lógica de negocio de eventos
 * - Validaciones de reglas de negocio
 * - Coordinación entre repository y otras capas
 * 
 * No maneja:
 * - Persistencia directa (delegado al Repository)
 * - Validación de DTOs (delegado a ValidationPipe)
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly exerciseTypesService: ExerciseTypesService,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<EventWithExerciseType> {
    // Validar nombre no vacío
    if (!createEventDto.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Validar capacidad > 0
    if (createEventDto.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1');
    }

    // Validar fecha no en el pasado
    const eventDate = new Date(createEventDto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      throw new BadRequestException('Cannot create events in the past');
    }

    // Validar que el ExerciseType exista y esté activo
    const exerciseType = await this.exerciseTypesService.findById(
      createEventDto.exerciseTypeId,
    );

    if (!exerciseType.isActive) {
      throw new BadRequestException('Exercise type is not active');
    }

    return this.eventsRepository.create(createEventDto);
  }

  async findAll(): Promise<EventWithExerciseType[]> {
    return this.eventsRepository.findAll();
  }

  async findById(id: string): Promise<EventWithExerciseType> {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventWithExerciseType> {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // Validar nombre no vacío si se actualiza
    if (updateEventDto.name !== undefined && !updateEventDto.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Validar capacidad > 0 si se actualiza
    if (updateEventDto.capacity !== undefined && updateEventDto.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1');
    }

    // Validar fecha no en el pasado si se actualiza
    if (updateEventDto.date !== undefined) {
      const eventDate = new Date(updateEventDto.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        throw new BadRequestException('Cannot set event date to the past');
      }
    }

    // Validar que el ExerciseType exista y esté activo si se actualiza
    if (updateEventDto.exerciseTypeId !== undefined) {
      const exerciseType = await this.exerciseTypesService.findById(
        updateEventDto.exerciseTypeId,
      );

      if (!exerciseType.isActive) {
        throw new BadRequestException('Exercise type is not active');
      }
    }

    // Convertir date de string a Date si está presente
    const { date, ...rest } = updateEventDto;
    const updateData: Partial<Event> = { ...rest };
    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    return this.eventsRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.eventsRepository.delete(id);
  }
}

