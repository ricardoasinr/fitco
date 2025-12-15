import { Injectable } from '@nestjs/common';
import { EventInstance } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  IEventInstancesRepository,
  EventInstanceWithEvent,
} from './interfaces/event-instances.repository.interface';

/**
 * EventInstancesRepository - Implementa el patrón Repository para instancias de eventos
 *
 * Responsabilidades:
 * - Abstrae el acceso a datos de event_instances
 * - Encapsula la lógica de persistencia con Prisma
 */
@Injectable()
export class EventInstancesRepository implements IEventInstancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    event: {
      select: {
        id: true,
        name: true,
        description: true,
        time: true,
        capacity: true,
        isActive: true,
        exerciseType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    _count: {
      select: {
        registrations: true,
      },
    },
  };

  async create(data: {
    eventId: string;
    dateTime: Date;
    capacity: number;
  }): Promise<EventInstance> {
    return this.prisma.eventInstance.create({
      data: {
        eventId: data.eventId,
        dateTime: data.dateTime,
        capacity: data.capacity,
      },
    });
  }

  async createMany(
    data: { eventId: string; dateTime: Date; capacity: number }[],
  ): Promise<number> {
    const result = await this.prisma.eventInstance.createMany({
      data: data.map((d) => ({
        eventId: d.eventId,
        dateTime: d.dateTime,
        capacity: d.capacity,
      })),
    });
    return result.count;
  }

  async findById(id: string): Promise<EventInstanceWithEvent | null> {
    return this.prisma.eventInstance.findUnique({
      where: { id },
      include: this.includeRelations,
    });
  }

  async findByEventId(eventId: string): Promise<EventInstanceWithEvent[]> {
    return this.prisma.eventInstance.findMany({
      where: { eventId },
      include: this.includeRelations,
      orderBy: { dateTime: 'asc' },
    });
  }

  async findAvailableByEventId(eventId: string): Promise<EventInstanceWithEvent[]> {
    const now = new Date();
    return this.prisma.eventInstance.findMany({
      where: {
        eventId,
        isActive: true,
        dateTime: { gte: now },
      },
      include: this.includeRelations,
      orderBy: { dateTime: 'asc' },
    });
  }

  async update(id: string, data: Partial<EventInstance>): Promise<EventInstance> {
    return this.prisma.eventInstance.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<EventInstance> {
    return this.prisma.eventInstance.delete({
      where: { id },
    });
  }

  async deleteByEventId(eventId: string): Promise<number> {
    const result = await this.prisma.eventInstance.deleteMany({
      where: { eventId },
    });
    return result.count;
  }

  async countRegistrations(instanceId: string): Promise<number> {
    return this.prisma.registration.count({
      where: { eventInstanceId: instanceId },
    });
  }
}

