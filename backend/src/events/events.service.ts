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
  ) { }

  async create(
    createEventDto: CreateEventDto,
    userId: string,
  ): Promise<EventWithRelations> {
    // Validar que el ExerciseType exista y esté activo
    const exerciseType = await this.exerciseTypesService.findById(
      createEventDto.exerciseTypeId,
    );

    if (!exerciseType.isActive) {
      throw new BadRequestException('Exercise type is not active');
    }

    // Crear el evento
    const event = await this.eventsRepository.create(createEventDto, userId);

    // Generar instancias automáticamente delegando al servicio de instancias
    const allInstanceDates = this.eventInstancesService.generateDatesForEvent({
      startDate: createEventDto.startDate,
      endDate: createEventDto.endDate,
      time: createEventDto.time,
      recurrenceType: createEventDto.recurrenceType || RecurrenceType.SINGLE,
      recurrencePattern: createEventDto.recurrencePattern,
      schedules: createEventDto.schedules,
    });

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
    const updateData: any = { ...updateEventDto };
    delete updateData.schedules; // No guardar schedules en el evento plano
    delete updateData.regenerateInstances;

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

    // Determinar los parámetros de generación (merge con existentes)
    const config = {
      startDate: updateEventDto.startDate || event.startDate,
      endDate: updateEventDto.endDate || event.endDate,
      time: updateEventDto.time || event.time,
      recurrenceType: (updateEventDto.recurrenceType || event.recurrenceType) as 'SINGLE' | 'WEEKLY' | 'INTERVAL',
      recurrencePattern: updateEventDto.recurrencePattern || event.recurrencePattern,
      schedules: updateEventDto.schedules,
    };

    // Usar la fecha actual como inicio si startDate es pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateObj = new Date(config.startDate);
    const effectiveStartDate = startDateObj < today ? today : startDateObj;

    // Generar nuevas instancias
    const allInstanceDates = this.eventInstancesService.generateDatesForEvent({
      ...config,
      startDate: effectiveStartDate,
    });

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
        updateEventDto.capacity || event.capacity,
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
