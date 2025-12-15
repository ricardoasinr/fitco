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
      // Si hay schedules, cada schedule debe tener weekdays
      if (createEventDto.schedules && createEventDto.schedules.length > 0) {
        for (const schedule of createEventDto.schedules) {
          if (!schedule.weekdays || schedule.weekdays.length === 0) {
            throw new BadRequestException(
              'Weekly recurrence requires at least one weekday per schedule',
            );
          }
          // Validar que los días estén entre 0 y 6
          const invalidDays = schedule.weekdays.filter((d) => d < 0 || d > 6);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              'Weekdays must be between 0 (Sunday) and 6 (Saturday)',
            );
          }
        }
      } else if (
        !createEventDto.recurrencePattern?.weekdays ||
        createEventDto.recurrencePattern.weekdays.length === 0
      ) {
        throw new BadRequestException(
          'Weekly recurrence requires at least one weekday',
        );
      } else {
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
    let allInstanceDates: Date[] = [];

    // Si hay múltiples schedules, generar instancias para cada uno
    if (createEventDto.schedules && createEventDto.schedules.length > 0) {
      for (const schedule of createEventDto.schedules) {
        // Para WEEKLY, usar los weekdays del schedule si existen, sino los del recurrencePattern
        const schedulePattern = recurrenceType === 'WEEKLY' 
          ? { weekdays: schedule.weekdays || createEventDto.recurrencePattern?.weekdays }
          : createEventDto.recurrencePattern || null;

        const instanceDates = this.eventInstancesService.generateInstanceDates(
          startDate,
          endDate,
          schedule.time,
          recurrenceType,
          schedulePattern,
        );
        allInstanceDates = [...allInstanceDates, ...instanceDates];
      }
    } else {
      // Comportamiento legacy: un solo time
      allInstanceDates = this.eventInstancesService.generateInstanceDates(
        startDate,
        endDate,
        createEventDto.time,
        recurrenceType,
        createEventDto.recurrencePattern || null,
      );
    }

    // Ordenar por fecha y eliminar duplicados
    allInstanceDates = [...new Set(allInstanceDates.map(d => d.getTime()))]
      .map(t => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());

    if (allInstanceDates.length === 0) {
      throw new BadRequestException(
        'No instances would be generated with the given recurrence pattern',
      );
    }

    await this.eventInstancesService.createInstancesForEvent(
      event.id,
      allInstanceDates,
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

    // Validar patrón de recurrencia si se actualiza
    const newRecurrenceType = updateEventDto.recurrenceType;
    if (newRecurrenceType === RecurrenceType.WEEKLY) {
      if (updateEventDto.schedules && updateEventDto.schedules.length > 0) {
        for (const schedule of updateEventDto.schedules) {
          if (!schedule.weekdays || schedule.weekdays.length === 0) {
            throw new BadRequestException(
              'Weekly recurrence requires at least one weekday per schedule',
            );
          }
          const invalidDays = schedule.weekdays.filter((d) => d < 0 || d > 6);
          if (invalidDays.length > 0) {
            throw new BadRequestException(
              'Weekdays must be between 0 (Sunday) and 6 (Saturday)',
            );
          }
        }
      } else if (
        !updateEventDto.recurrencePattern?.weekdays ||
        updateEventDto.recurrencePattern.weekdays.length === 0
      ) {
        throw new BadRequestException(
          'Weekly recurrence requires at least one weekday',
        );
      }
    }

    if (newRecurrenceType === RecurrenceType.INTERVAL) {
      if (
        !updateEventDto.recurrencePattern?.intervalDays ||
        updateEventDto.recurrencePattern.intervalDays < 1
      ) {
        throw new BadRequestException(
          'Interval recurrence requires intervalDays >= 1',
        );
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
    const updateData: any = {};
    if (updateEventDto.name !== undefined) updateData.name = updateEventDto.name;
    if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
    if (updateEventDto.startDate !== undefined) updateData.startDate = new Date(updateEventDto.startDate);
    if (updateEventDto.endDate !== undefined) updateData.endDate = new Date(updateEventDto.endDate);
    if (updateEventDto.time !== undefined) updateData.time = updateEventDto.time;
    if (updateEventDto.capacity !== undefined) updateData.capacity = updateEventDto.capacity;
    if (updateEventDto.exerciseTypeId !== undefined) updateData.exerciseTypeId = updateEventDto.exerciseTypeId;
    if (updateEventDto.isActive !== undefined) updateData.isActive = updateEventDto.isActive;
    if (updateEventDto.recurrenceType !== undefined) updateData.recurrenceType = updateEventDto.recurrenceType;
    if (updateEventDto.recurrencePattern !== undefined) {
      updateData.recurrencePattern = updateEventDto.recurrencePattern;
    }

    // Actualizar el evento primero
    const updatedEvent = await this.eventsRepository.update(id, updateData);

    // Regenerar instancias si se solicita y hay cambios de recurrencia
    if (updateEventDto.regenerateInstances) {
      await this.regenerateEventInstances(id, updateEventDto);
    }

    // Retornar evento actualizado con instancias
    return this.eventsRepository.findById(id) as Promise<EventWithRelations>;
  }

  /**
   * Regenera las instancias futuras de un evento basándose en la nueva configuración
   */
  private async regenerateEventInstances(
    eventId: string,
    updateEventDto: UpdateEventDto,
  ): Promise<void> {
    // Obtener el evento actualizado
    const event = await this.eventsRepository.findById(eventId);
    if (!event) return;

    // Eliminar instancias futuras sin registros
    await this.eventInstancesService.deleteFutureInstancesWithoutRegistrations(eventId);

    // Determinar los parámetros de generación
    const startDate = updateEventDto.startDate 
      ? new Date(updateEventDto.startDate) 
      : new Date(event.startDate);
    const endDate = updateEventDto.endDate 
      ? new Date(updateEventDto.endDate) 
      : new Date(event.endDate);
    const time = updateEventDto.time || event.time;
    const recurrenceType = updateEventDto.recurrenceType || event.recurrenceType;
    const recurrencePattern = updateEventDto.recurrencePattern || 
      (event.recurrencePattern as { weekdays?: number[]; intervalDays?: number } | null);
    const capacity = updateEventDto.capacity || event.capacity;

    // Usar la fecha actual como inicio si startDate es pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveStartDate = startDate < today ? today : startDate;

    // Generar nuevas instancias
    let allInstanceDates: Date[] = [];

    if (updateEventDto.schedules && updateEventDto.schedules.length > 0) {
      for (const schedule of updateEventDto.schedules) {
        const schedulePattern = recurrenceType === 'WEEKLY' 
          ? { weekdays: schedule.weekdays || recurrencePattern?.weekdays }
          : recurrencePattern;

        const instanceDates = this.eventInstancesService.generateInstanceDates(
          effectiveStartDate,
          endDate,
          schedule.time,
          recurrenceType,
          schedulePattern,
        );
        allInstanceDates = [...allInstanceDates, ...instanceDates];
      }
    } else {
      allInstanceDates = this.eventInstancesService.generateInstanceDates(
        effectiveStartDate,
        endDate,
        time,
        recurrenceType,
        recurrencePattern,
      );
    }

    // Ordenar y eliminar duplicados internos
    allInstanceDates = [...new Set(allInstanceDates.map(d => d.getTime()))]
      .map(t => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());

    // Obtener instancias que quedaron (las preservadas con registros)
    const preservedInstances = await this.eventInstancesService.getFutureInstances(eventId);
    const preservedDateTimes = new Set(
      preservedInstances.map(i => new Date(i.dateTime).getTime())
    );

    // Filtrar instancias que ya existen (las preservadas con registros)
    const newInstanceDates = allInstanceDates.filter(date => 
      !preservedDateTimes.has(date.getTime())
    );

    // Crear las nuevas instancias
    if (newInstanceDates.length > 0) {
      await this.eventInstancesService.createInstancesForEvent(
        eventId,
        newInstanceDates,
        capacity,
      );
    }
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
