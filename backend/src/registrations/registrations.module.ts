import { Module, forwardRef } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationsRepository } from './registrations.repository';
import { EventsModule } from '../events/events.module';
import { EventInstancesModule } from '../event-instances/event-instances.module';

/**
 * RegistrationsModule - Módulo de inscripciones a eventos
 *
 * Dependencias:
 * - EventsModule: Para validar eventos
 * - EventInstancesModule: Para validar instancias y capacidad
 * - PrismaModule: Para acceso a base de datos (global)
 */
@Module({
  imports: [forwardRef(() => EventsModule), forwardRef(() => EventInstancesModule)],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, RegistrationsRepository],
  exports: [RegistrationsService, RegistrationsRepository],
})
export class RegistrationsModule {}
