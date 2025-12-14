import { Module } from '@nestjs/common';
import { WellnessAssessmentsController } from './wellness-assessments.controller';
import { WellnessAssessmentsService } from './wellness-assessments.service';
import { WellnessAssessmentsRepository } from './wellness-assessments.repository';
import { RegistrationsModule } from '../registrations/registrations.module';

/**
 * WellnessAssessmentsModule - Módulo de evaluaciones de bienestar
 * 
 * Dependencias:
 * - RegistrationsModule: Para validar inscripciones
 * - PrismaModule: Para acceso a base de datos (global)
 */
@Module({
  imports: [RegistrationsModule],
  controllers: [WellnessAssessmentsController],
  providers: [WellnessAssessmentsService, WellnessAssessmentsRepository],
  exports: [WellnessAssessmentsService, WellnessAssessmentsRepository],
})
export class WellnessAssessmentsModule {}

