import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WellnessType, WellnessStatus } from '@prisma/client';
import { WellnessAssessmentsRepository } from './wellness-assessments.repository';
import { RegistrationsRepository } from '../registrations/registrations.repository';
import { CompleteWellnessDto } from './dto/complete-wellness.dto';
import {
  WellnessAssessmentWithRegistration,
  WellnessImpact,
} from './interfaces/wellness-assessments.repository.interface';

/**
 * WellnessAssessmentsService - Lógica de negocio para evaluaciones de bienestar
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Validar reglas de negocio para evaluaciones
 * - Calcular impacto wellness comparando PRE y POST
 * - Verificar permisos de usuario
 */
@Injectable()
export class WellnessAssessmentsService {
  constructor(
    private readonly wellnessRepository: WellnessAssessmentsRepository,
    private readonly registrationsRepository: RegistrationsRepository,
  ) {}

  async findPendingByUser(userId: string): Promise<WellnessAssessmentWithRegistration[]> {
    return this.wellnessRepository.findPendingByUserId(userId);
  }

  async findCompletedByUser(userId: string): Promise<WellnessAssessmentWithRegistration[]> {
    return this.wellnessRepository.findCompletedByUserId(userId);
  }

  async findById(id: string): Promise<WellnessAssessmentWithRegistration> {
    const assessment = await this.wellnessRepository.findById(id);
    if (!assessment) {
      throw new NotFoundException(`Wellness assessment with id ${id} not found`);
    }
    return assessment;
  }

  async completeAssessment(
    id: string,
    userId: string,
    completeDto: CompleteWellnessDto,
  ): Promise<WellnessAssessmentWithRegistration> {
    const assessment = await this.wellnessRepository.findById(id);

    if (!assessment) {
      throw new NotFoundException(`Wellness assessment with id ${id} not found`);
    }

    // Verificar que el assessment pertenece al usuario
    if (assessment.registration.userId !== userId) {
      throw new ForbiddenException('You can only complete your own wellness assessments');
    }

    // Verificar que no esté ya completado
    if (assessment.status === WellnessStatus.COMPLETED) {
      throw new BadRequestException('This wellness assessment has already been completed');
    }

    // Validar que se puede completar según el flujo
    if (assessment.type === WellnessType.PRE) {
      // PRE se puede completar en cualquier momento antes del evento
      const registration = await this.registrationsRepository.findById(
        assessment.registrationId,
      );
      if (registration?.attendance?.attended) {
        throw new BadRequestException(
          'Cannot complete PRE assessment after attendance has been marked',
        );
      }
    } else if (assessment.type === WellnessType.POST) {
      // POST solo se puede completar después de marcar asistencia
      const registration = await this.registrationsRepository.findById(
        assessment.registrationId,
      );
      if (!registration?.attendance?.attended) {
        throw new BadRequestException(
          'Cannot complete POST assessment before attendance is marked',
        );
      }
    }

    // Actualizar con los valores
    await this.wellnessRepository.update(id, {
      sleepQuality: completeDto.sleepQuality,
      stressLevel: completeDto.stressLevel,
      mood: completeDto.mood,
      status: WellnessStatus.COMPLETED,
    });

    return this.findById(id);
  }

  async getAssessmentsByRegistration(registrationId: string, userId: string) {
    const registration = await this.registrationsRepository.findById(registrationId);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${registrationId} not found`);
    }

    // Usuarios pueden ver sus propios assessments, admins pueden ver todos
    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only view your own wellness assessments');
    }

    return this.wellnessRepository.findByRegistrationId(registrationId);
  }

  async calculateImpact(registrationId: string): Promise<WellnessImpact> {
    const assessments = await this.wellnessRepository.findByRegistrationId(registrationId);

    const preAssessment = assessments.find(
      (a) => a.type === WellnessType.PRE && a.status === WellnessStatus.COMPLETED,
    );
    const postAssessment = assessments.find(
      (a) => a.type === WellnessType.POST && a.status === WellnessStatus.COMPLETED,
    );

    // Si no hay PRE o POST completados, no se puede calcular impacto
    if (!preAssessment || !postAssessment) {
      return {
        sleepQualityChange: null,
        stressLevelChange: null,
        moodChange: null,
        overallImpact: null,
      };
    }

    const sleepQualityChange =
      (postAssessment.sleepQuality ?? 0) - (preAssessment.sleepQuality ?? 0);
    const stressLevelChange =
      (preAssessment.stressLevel ?? 0) - (postAssessment.stressLevel ?? 0); // Menos estrés es mejor
    const moodChange = (postAssessment.mood ?? 0) - (preAssessment.mood ?? 0);

    // Impacto general: promedio de las mejoras (estrés invertido porque menos es mejor)
    const overallImpact = (sleepQualityChange + stressLevelChange + moodChange) / 3;

    return {
      sleepQualityChange,
      stressLevelChange,
      moodChange,
      overallImpact: Math.round(overallImpact * 100) / 100,
    };
  }

  async getImpactByRegistration(registrationId: string, userId: string): Promise<{
    preAssessment: any;
    postAssessment: any;
    impact: WellnessImpact;
  }> {
    const registration = await this.registrationsRepository.findById(registrationId);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${registrationId} not found`);
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only view your own wellness impact');
    }

    const assessments = await this.wellnessRepository.findByRegistrationId(registrationId);
    const preAssessment = assessments.find((a) => a.type === WellnessType.PRE) || null;
    const postAssessment = assessments.find((a) => a.type === WellnessType.POST) || null;
    const impact = await this.calculateImpact(registrationId);

    return {
      preAssessment,
      postAssessment,
      impact,
    };
  }
}

