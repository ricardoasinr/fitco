import { Injectable } from '@nestjs/common';
import { Registration, WellnessType, WellnessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  IRegistrationsRepository,
  RegistrationWithRelations,
  CreateRegistrationData,
} from './interfaces/registrations.repository.interface';

/**
 * RegistrationsRepository - Implementa el patrón Repository
 *
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de inscripciones
 * - Encapsula la lógica de persistencia con Prisma
 * - Crea automáticamente el registro de asistencia y wellness PRE
 */
@Injectable()
export class RegistrationsRepository implements IRegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    event: {
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
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
    eventInstance: {
      select: {
        id: true,
        dateTime: true,
        capacity: true,
        isActive: true,
      },
    },
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    attendance: true,
    wellnessAssessments: {
      orderBy: {
        type: 'asc' as const,
      },
    },
  };

  async create(data: CreateRegistrationData): Promise<RegistrationWithRelations> {
    // Crear inscripción con attendance y wellness PRE en una transacción
    return this.prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          userId: data.userId,
          eventId: data.eventId,
          eventInstanceId: data.eventInstanceId,
        },
      });

      // Crear registro de asistencia (inicialmente no atendido)
      await tx.attendance.create({
        data: {
          registrationId: registration.id,
          attended: false,
        },
      });

      // Crear evaluación PRE wellness (pendiente)
      await tx.wellnessAssessment.create({
        data: {
          registrationId: registration.id,
          type: WellnessType.PRE,
          status: WellnessStatus.PENDING,
        },
      });

      // Retornar con todas las relaciones
      return tx.registration.findUnique({
        where: { id: registration.id },
        include: this.includeRelations,
      }) as Promise<RegistrationWithRelations>;
    });
  }

  async findById(id: string): Promise<RegistrationWithRelations | null> {
    return this.prisma.registration.findUnique({
      where: { id },
      include: this.includeRelations,
    });
  }

  async findByQrCode(qrCode: string): Promise<RegistrationWithRelations | null> {
    return this.prisma.registration.findUnique({
      where: { qrCode },
      include: this.includeRelations,
    });
  }

  async findByUserAndEvent(
    userId: string,
    eventId: string,
  ): Promise<RegistrationWithRelations | null> {
    return this.prisma.registration.findFirst({
      where: {
        userId,
        eventId,
      },
      include: this.includeRelations,
    });
  }

  async findByUserAndInstance(
    userId: string,
    eventInstanceId: string,
  ): Promise<RegistrationWithRelations | null> {
    return this.prisma.registration.findUnique({
      where: {
        userId_eventInstanceId: {
          userId,
          eventInstanceId,
        },
      },
      include: this.includeRelations,
    });
  }

  async findByUserId(userId: string): Promise<RegistrationWithRelations[]> {
    return this.prisma.registration.findMany({
      where: { userId },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEventId(eventId: string): Promise<RegistrationWithRelations[]> {
    return this.prisma.registration.findMany({
      where: { eventId },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEventInstanceId(
    eventInstanceId: string,
  ): Promise<RegistrationWithRelations[]> {
    return this.prisma.registration.findMany({
      where: { eventInstanceId },
      include: this.includeRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByEventId(eventId: string): Promise<number> {
    return this.prisma.registration.count({
      where: { eventId },
    });
  }

  async countByEventInstanceId(eventInstanceId: string): Promise<number> {
    return this.prisma.registration.count({
      where: { eventInstanceId },
    });
  }

  async delete(id: string): Promise<Registration> {
    return this.prisma.registration.delete({
      where: { id },
    });
  }
}
