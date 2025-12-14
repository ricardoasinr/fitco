import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationsRepository } from './registrations.repository';
import { EventsModule } from '../events/events.module';

/**
 * RegistrationsModule - Módulo de inscripciones a eventos
 * 
 * Dependencias:
 * - EventsModule: Para validar eventos y capacidad
 * - PrismaModule: Para acceso a base de datos (global)
 */
@Module({
  imports: [EventsModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, RegistrationsRepository],
  exports: [RegistrationsService, RegistrationsRepository],
})
export class RegistrationsModule {}

