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

    // Validar que la hora sea válida
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new BadRequestException(`Invalid time format: ${time}. Expected HH:MM format.`);
    }

    if (recurrenceType === 'SINGLE') {
      const dateTime = new Date(startDate);
      // Usar UTC para evitar problemas de zona horaria
      dateTime.setUTCHours(hours, minutes, 0, 0);
      dates.push(dateTime);
      return dates;
    }

    // Para eventos recurrentes, empezar desde startDate y avanzar día por día
    const currentDate = new Date(startDate);
    // Resetear la hora a medianoche UTC antes de establecer la hora específica
    currentDate.setUTCHours(0, 0, 0, 0);
    currentDate.setUTCHours(hours, minutes, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setUTCHours(23, 59, 59, 999);

    while (currentDate <= endDateTime) {
      if (recurrenceType === 'WEEKLY' && recurrencePattern?.weekdays) {
        // getUTCDay() returns 0 for Sunday, 1 for Monday, etc. in UTC
        const dayOfWeek = currentDate.getUTCDay();
        if (recurrencePattern.weekdays.includes(dayOfWeek)) {
          dates.push(new Date(currentDate));
        }
        // Avanzar al siguiente día a la misma hora UTC
        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        nextDate.setUTCHours(hours, minutes, 0, 0);
        currentDate.setTime(nextDate.getTime());
      } else if (recurrenceType === 'INTERVAL' && recurrencePattern?.intervalDays) {
        dates.push(new Date(currentDate));
        // Avanzar según el intervalo en UTC
        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + recurrencePattern.intervalDays);
        nextDate.setUTCHours(hours, minutes, 0, 0);
        currentDate.setTime(nextDate.getTime());
      } else {
        // Fallback: daily
        dates.push(new Date(currentDate));
        // Avanzar al siguiente día a la misma hora UTC
        const nextDate = new Date(currentDate);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        nextDate.setUTCHours(hours, minutes, 0, 0);
        currentDate.setTime(nextDate.getTime());
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

  /**
   * Elimina instancias futuras de un evento que no tengan registros
   * Retorna las instancias que no pudieron ser eliminadas (tienen registros)
   */
  async deleteFutureInstancesWithoutRegistrations(eventId: string): Promise<{
    deleted: number;
    preserved: number;
  }> {
    const now = new Date();
    const instances = await this.eventInstancesRepository.findByEventId(eventId);
    
    let deleted = 0;
    let preserved = 0;

    for (const instance of instances) {
      // Solo considerar instancias futuras
      if (new Date(instance.dateTime) > now) {
        const registrationCount = await this.eventInstancesRepository.countRegistrations(instance.id);
        
        if (registrationCount === 0) {
          await this.eventInstancesRepository.delete(instance.id);
          deleted++;
        } else {
          preserved++;
        }
      }
    }

    return { deleted, preserved };
  }

  /**
   * Elimina TODAS las instancias futuras de un evento (para regeneración completa)
   * Incluye aquellas con registros - usar con precaución
   */
  async deleteAllFutureInstances(eventId: string): Promise<number> {
    const now = new Date();
    const instances = await this.eventInstancesRepository.findByEventId(eventId);
    
    let deleted = 0;

    for (const instance of instances) {
      if (new Date(instance.dateTime) > now) {
        await this.eventInstancesRepository.delete(instance.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Obtiene instancias futuras de un evento
   */
  async getFutureInstances(eventId: string): Promise<EventInstanceWithEvent[]> {
    const now = new Date();
    const instances = await this.eventInstancesRepository.findByEventId(eventId);
    return instances.filter(instance => new Date(instance.dateTime) > now);
  }
}

