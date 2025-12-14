import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';
import { WellnessAssessmentsModule } from '../wellness-assessments/wellness-assessments.module';

/**
 * AttendanceModule - Módulo de gestión de asistencia
 * 
 * Dependencias:
 * - WellnessAssessmentsModule: Para crear POST wellness al marcar asistencia
 * - PrismaModule: Para acceso a base de datos (global)
 */
@Module({
  imports: [WellnessAssessmentsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository],
  exports: [AttendanceService, AttendanceRepository],
})
export class AttendanceModule {}

