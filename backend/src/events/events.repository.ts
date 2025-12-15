import { Injectable } from '@nestjs/common';
import { Event, Prisma, RecurrenceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  IEventsRepository,
  EventWithRelations,
} from './interfaces/events.repository.interface';

/**
 * EventsRepository - Implementa el patrón Repository
 *
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de eventos
 * - Encapsula la lógica de persistencia con Prisma
 * - Proporciona una interfaz clara para operaciones CRUD
 */
@Injectable()
export class EventsRepository implements IEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    exerciseType: {
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    },
    _count: {
      select: {
        registrations: true,
        instances: true,
      },
    },
  };

  private readonly includeWithInstances = {
    ...this.includeRelations,
    instances: {
      select: {
        id: true,
        dateTime: true,
        capacity: true,
        isActive: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { dateTime: 'asc' as const },
    },
  };

  async create(data: CreateEventDto, userId: string): Promise<EventWithRelations> {
    // Handle recurrencePattern - convert to Prisma JSON or DbNull
    let recurrencePattern: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput = Prisma.DbNull;
    if (data.recurrencePattern) {
      recurrencePattern = data.recurrencePattern as Prisma.InputJsonValue;
    }

    const event = await this.prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        time: data.time,
        capacity: data.capacity,
        recurrenceType: data.recurrenceType || RecurrenceType.SINGLE,
        recurrencePattern,
        exerciseTypeId: data.exerciseTypeId,
        createdBy: userId,
      },
      include: this.includeWithInstances,
    });

    return event as EventWithRelations;
  }

  async findById(id: string): Promise<EventWithRelations | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: this.includeWithInstances,
    });
    return event as EventWithRelations | null;
  }

  async findAll(): Promise<EventWithRelations[]> {
    const events = await this.prisma.event.findMany({
      include: this.includeWithInstances,
      orderBy: { startDate: 'asc' },
    });
    return events as EventWithRelations[];
  }

  async findAllActive(): Promise<EventWithRelations[]> {
    const events = await this.prisma.event.findMany({
      where: { isActive: true },
      include: this.includeWithInstances,
      orderBy: { startDate: 'asc' },
    });
    return events as EventWithRelations[];
  }

  async update(id: string, data: Partial<Event>): Promise<EventWithRelations> {
    const updateData: any = { ...data };

    // Convertir fechas si vienen como string
    if (data.startDate && typeof data.startDate === 'string') {
      updateData.startDate = new Date(data.startDate);
    }
    if (data.endDate && typeof data.endDate === 'string') {
      updateData.endDate = new Date(data.endDate);
    }

    const event = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: this.includeWithInstances,
    });

    return event as EventWithRelations;
  }

  async delete(id: string): Promise<Event> {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}
