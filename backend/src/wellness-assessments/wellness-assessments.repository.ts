import { Injectable } from '@nestjs/common';
import { WellnessAssessment, WellnessType, WellnessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  IWellnessAssessmentsRepository,
  WellnessAssessmentWithRegistration,
  CreateWellnessAssessmentData,
  UpdateWellnessAssessmentData,
} from './interfaces/wellness-assessments.repository.interface';

/**
 * WellnessAssessmentsRepository - Implementa el patrón Repository
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Abstrae el acceso a datos de evaluaciones de bienestar
 * - Encapsula la lógica de persistencia con Prisma
 */
@Injectable()
export class WellnessAssessmentsRepository implements IWellnessAssessmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    registration: {
      select: {
        id: true,
        userId: true,
        eventId: true,
        qrCode: true,
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            time: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
  };

  async create(data: CreateWellnessAssessmentData): Promise<WellnessAssessment> {
    return this.prisma.wellnessAssessment.create({
      data: {
        registrationId: data.registrationId,
        type: data.type,
        status: WellnessStatus.PENDING,
      },
    });
  }

  async findById(id: string): Promise<WellnessAssessmentWithRegistration | null> {
    return this.prisma.wellnessAssessment.findUnique({
      where: { id },
      include: this.includeRelations,
    });
  }

  async findByRegistrationId(registrationId: string): Promise<WellnessAssessment[]> {
    return this.prisma.wellnessAssessment.findMany({
      where: { registrationId },
      orderBy: { type: 'asc' },
    });
  }

  async findByRegistrationAndType(
    registrationId: string,
    type: WellnessType,
  ): Promise<WellnessAssessmentWithRegistration | null> {
    return this.prisma.wellnessAssessment.findUnique({
      where: {
        registrationId_type: {
          registrationId,
          type,
        },
      },
      include: this.includeRelations,
    });
  }

  async findPendingByUserId(userId: string): Promise<WellnessAssessmentWithRegistration[]> {
    return this.prisma.wellnessAssessment.findMany({
      where: {
        status: WellnessStatus.PENDING,
        registration: {
          userId,
        },
      },
      include: this.includeRelations,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    id: string,
    data: UpdateWellnessAssessmentData,
  ): Promise<WellnessAssessment> {
    return this.prisma.wellnessAssessment.update({
      where: { id },
      data,
    });
  }
}

