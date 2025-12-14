import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IAttendanceRepository,
  AttendanceWithRegistration,
} from './interfaces/attendance.repository.interface';

/**
 * AttendanceRepository - Implementa el patrón Repository
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de asistencia
 * - Encapsula la lógica de persistencia con Prisma
 */
@Injectable()
export class AttendanceRepository implements IAttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    registration: {
      select: {
        id: true,
        userId: true,
        eventId: true,
        qrCode: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
          },
        },
        wellnessAssessments: {
          select: {
            id: true,
            type: true,
            status: true,
            sleepQuality: true,
            stressLevel: true,
            mood: true,
          },
          orderBy: {
            type: 'asc' as const,
          },
        },
      },
    },
  };

  async findByRegistrationId(
    registrationId: string,
  ): Promise<AttendanceWithRegistration | null> {
    return this.prisma.attendance.findUnique({
      where: { registrationId },
      include: this.includeRelations,
    });
  }

  async findByQrCode(qrCode: string): Promise<AttendanceWithRegistration | null> {
    const registration = await this.prisma.registration.findUnique({
      where: { qrCode },
      select: { id: true },
    });

    if (!registration) {
      return null;
    }

    return this.prisma.attendance.findUnique({
      where: { registrationId: registration.id },
      include: this.includeRelations,
    });
  }

  async findByUserEmail(
    email: string,
    eventId: string,
  ): Promise<AttendanceWithRegistration | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return null;
    }

    const registration = await this.prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId,
        },
      },
      select: { id: true },
    });

    if (!registration) {
      return null;
    }

    return this.prisma.attendance.findUnique({
      where: { registrationId: registration.id },
      include: this.includeRelations,
    });
  }

  async markAttended(
    id: string,
    adminId: string,
  ): Promise<AttendanceWithRegistration> {
    return this.prisma.attendance.update({
      where: { id },
      data: {
        attended: true,
        checkedAt: new Date(),
        checkedBy: adminId,
      },
      include: this.includeRelations,
    });
  }

  async findByEventId(eventId: string): Promise<AttendanceWithRegistration[]> {
    return this.prisma.attendance.findMany({
      where: {
        registration: {
          eventId,
        },
      },
      include: this.includeRelations,
      orderBy: {
        checkedAt: 'desc',
      },
    });
  }
}

