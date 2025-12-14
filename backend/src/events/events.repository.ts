import { Injectable } from '@nestjs/common';
import { Event } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import {
  IEventsRepository,
  EventWithExerciseType,
} from './interfaces/events.repository.interface';

/**
 * EventsRepository - Implementa el patrón Repository
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de eventos
 * - Encapsula la lógica de persistencia con Prisma
 * - Proporciona una interfaz clara para operaciones CRUD
 * 
 * Dependency Inversion Principle:
 * - El servicio depende de la interfaz IEventsRepository, no de esta implementación
 */
@Injectable()
export class EventsRepository implements IEventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEventDto): Promise<EventWithExerciseType> {
    return this.prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        exerciseType: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<EventWithExerciseType | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        exerciseType: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  async findAll(): Promise<EventWithExerciseType[]> {
    return this.prisma.event.findMany({
      include: {
        exerciseType: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async update(
    id: string,
    data: Partial<Event>,
  ): Promise<EventWithExerciseType> {
    const updateData: any = { ...data };
    
    // Convertir fecha si viene como string
    if (data.date && typeof data.date === 'string') {
      updateData.date = new Date(data.date);
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        exerciseType: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<Event> {
    return this.prisma.event.delete({
      where: { id },
    });
  }
}

