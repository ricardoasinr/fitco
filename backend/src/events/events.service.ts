import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Event, RecurrenceType } from '@prisma/client';
import { EventsRepository } from './events.repository';
import { ExerciseTypesService } from '../exercise-types/exercise-types.service';
import { EventInstancesService } from '../event-instances/event-instances.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventWithRelations } from './interfaces/events.repository.interface';

/**
 * EventsService - Lógica de negocio para gestión de eventos
 *
 * Responsabilidades (Single Responsibility Principle):
 * - Lógica de negocio de eventos
 * - Validaciones de reglas de negocio
 * - Generación automática de instancias para eventos recurrentes
 * - Coordinación entre repository y otras capas
 */
@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly exerciseTypesService: ExerciseTypesService,
    private readonly eventInstancesService: EventInstancesService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    userId: string,
  ): Promise<EventWithRelations> {
    // Validar nombre no vacío
    if (!createEventDto.name.trim()) {
      throw new BadRequestException('Name cannot be empty');
    }

    // Validar capacidad > 0
    if (createEventDto.capacity < 1) {
      throw new BadRequestException('Capacity must be at least 1');
    }

    // Validar fechas
    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Cannot create events in the past');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Validar patrón de recurrencia
    const recurrenceType = createEventDto.recurrenceType || RecurrenceType.SINGLE;
    if (recurrenceType === RecurrenceType.WEEKLY) {
      if (
        !createEventDto.recurrencePattern?.weekdays ||
        createEventDto.recurrencePattern.weekdays.length === 0
      ) {
        throw new BadRequestException(
          'Weekly recurrence requires at least one weekday',
        );
      }
      // Validar que los días estén entre 0 y 6
      const invalidDays = createEventDto.recurrencePattern.weekdays.filter(
        (d) => d < 0 || d > 6,
      );
      if (invalidDays.length > 0) {
        throw new BadRequestException(
          'Weekdays must be between 0 (Sunday) and 6 (Saturday)',
        );
      }
    }

    if (recurrenceType === RecurrenceType.INTERVAL) {
      if (
        !createEventDto.recurrencePattern?.intervalDays ||
        createEventDto.recurrencePattern.intervalDays < 1
      ) {
        throw new BadRequestException(
          'Interval recurrence requires intervalDays >= 1',
        );
      }
    }

    // Validar que el ExerciseType exista y esté activo
    const exerciseType = await this.exerciseTypesService.findById(
      createEventDto.exerciseTypeId,
    );

    if (!exerciseType.isActive) {
      throw new BadRequestException('Exercise type is not active');
    }

    // Crear el evento
    const event = await this.eventsRepository.create(createEventDto, userId);

    // Generar instancias automáticamente
    const instanceDates = this.eventInstancesService.generateInstanceDates(
      startDate,
      endDate,
      createEventDto.time,
      recurrenceType,
      createEventDto.recurrencePattern || null,
    );

    if (instanceDates.length === 0) {
      throw new BadRequestException(
        'No instances would be generated with the given recurrence pattern',
      );
    }

    await this.eventInstancesService.createInstancesForEvent(
      event.id,
      instanceDates,
      createEventDto.capacity,
    );

    // Retornar evento con instancias
    return this.eventsRepository.findById(event.id) as Promise<EventWithRelations>;
  }

  async findAll(): Promise<EventWithRelations[]> {
    // Para admins: mostrar todos excepto eliminados
    return this.eventsRepository.findAllNotDeleted();
  }

  async findAllActive(): Promise<EventWithRelations[]> {
    // Para usuarios: solo activos y no eliminados
    return this.eventsRepository.findActiveAndNotDeleted();
  }

  async findById(id: string, userId?: string): Promise<EventWithRelations> {
    const event = await this.eventsRepository.findByIdForUser(id, userId);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<EventWithRelations> {
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

    // Validar fechas si se actualizan
    if (updateEventDto.startDate !== undefined) {
      const startDate = new Date(updateEventDto.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        throw new BadRequestException('Cannot set start date to the past');
      }
    }

    if (updateEventDto.endDate !== undefined && updateEventDto.startDate !== undefined) {
      const startDate = new Date(updateEventDto.startDate);
      const endDate = new Date(updateEventDto.endDate);
      if (endDate < startDate) {
        throw new BadRequestException('End date cannot be before start date');
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

    // Preparar datos para actualización
    const updateData: Partial<Event> = {};
    if (updateEventDto.name !== undefined) updateData.name = updateEventDto.name;
    if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
    if (updateEventDto.startDate !== undefined) updateData.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate !== undefined) updateData.endDate = new Date(updateEventDto.endDate);
    if (updateEventDto.time !== undefined) updateData.time = updateEventDto.time;
    if (updateEventDto.capacity !== undefined) updateData.capacity = updateEventDto.capacity;
    if (updateEventDto.exerciseTypeId !== undefined) updateData.exerciseTypeId = updateEventDto.exerciseTypeId;
    if (updateEventDto.isActive !== undefined) updateData.isActive = updateEventDto.isActive;

    return this.eventsRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // Realizar soft delete en lugar de eliminación física
    await this.eventsRepository.softDelete(id);
  }

  async permanentDelete(id: string): Promise<void> {
    const event = await this.eventsRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    // Eliminación física (solo si realmente se necesita)
    await this.eventsRepository.delete(id);
  }
}
