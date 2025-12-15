import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventInstancesRepository } from './event-instances.repository';
import { EventInstanceWithEvent } from './interfaces/event-instances.repository.interface';

/**
 * EventInstancesService - Lógica de negocio para instancias de eventos
 *
 * Responsabilidades:
 * - Calcular disponibilidad de cupos
 * - Validar reglas de negocio
 * - Generar instancias basadas en patrón de recurrencia
 */
@Injectable()
export class EventInstancesService {
  constructor(
    private readonly eventInstancesRepository: EventInstancesRepository,
  ) {}

  async findById(id: string): Promise<EventInstanceWithEvent> {
    const instance = await this.eventInstancesRepository.findById(id);
    if (!instance) {
      throw new NotFoundException(`Event instance with id ${id} not found`);
    }
    return instance;
  }

  async findByEventId(eventId: string): Promise<EventInstanceWithEvent[]> {
    return this.eventInstancesRepository.findByEventId(eventId);
  }

  async findAvailableByEventId(eventId: string): Promise<EventInstanceWithEvent[]> {
    return this.eventInstancesRepository.findAvailableByEventId(eventId);
  }

  async getAvailability(instanceId: string): Promise<{
    capacity: number;
    registered: number;
    available: number;
  }> {
    const instance = await this.findById(instanceId);
    const registered = await this.eventInstancesRepository.countRegistrations(instanceId);

    return {
      capacity: instance.capacity,
      registered,
      available: Math.max(0, instance.capacity - registered),
    };
  }

  async hasAvailableCapacity(instanceId: string): Promise<boolean> {
    const { available } = await this.getAvailability(instanceId);
    return available > 0;
  }

  /**
   * Genera instancias de evento basadas en el patrón de recurrencia
   */
  generateInstanceDates(
    startDate: Date,
    endDate: Date,
    time: string,
    recurrenceType: 'SINGLE' | 'WEEKLY' | 'INTERVAL',
    recurrencePattern: { weekdays?: number[]; intervalDays?: number } | null,
  ): Date[] {
    const dates: Date[] = [];
    const [hours, minutes] = time.split(':').map(Number);

    if (recurrenceType === 'SINGLE') {
      const dateTime = new Date(startDate);
      dateTime.setHours(hours, minutes, 0, 0);
      dates.push(dateTime);
      return dates;
    }

    const currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    while (currentDate <= endDate) {
      if (recurrenceType === 'WEEKLY' && recurrencePattern?.weekdays) {
        // getDay() returns 0 for Sunday, 1 for Monday, etc.
        const dayOfWeek = currentDate.getDay();
        if (recurrencePattern.weekdays.includes(dayOfWeek)) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (recurrenceType === 'INTERVAL' && recurrencePattern?.intervalDays) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + recurrencePattern.intervalDays);
      } else {
        // Fallback: daily
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return dates;
  }

  /**
   * Crea múltiples instancias para un evento
   */
  async createInstancesForEvent(
    eventId: string,
    dates: Date[],
    capacity: number,
  ): Promise<number> {
    const instancesData = dates.map((dateTime) => ({
      eventId,
      dateTime,
      capacity,
    }));

    return this.eventInstancesRepository.createMany(instancesData);
  }

  async deactivateInstance(instanceId: string): Promise<void> {
    const instance = await this.findById(instanceId);
    await this.eventInstancesRepository.update(instanceId, { isActive: false });
  }
}

