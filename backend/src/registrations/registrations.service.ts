import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsRepository } from './registrations.repository';
import { EventsRepository } from '../events/events.repository';
import { EventInstancesRepository } from '../event-instances/event-instances.repository';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationWithRelations } from './interfaces/registrations.repository.interface';

/**
 * RegistrationsService - Lógica de negocio para inscripciones a eventos
 *
 * Responsabilidades (Single Responsibility Principle):
 * - Validar reglas de negocio para inscripciones
 * - Verificar disponibilidad de cupos por instancia
 * - Verificar que el usuario no esté ya inscrito en la instancia específica
 * - Verificar que el evento e instancia estén activos y no hayan pasado
 */
@Injectable()
export class RegistrationsService {
  constructor(
    private readonly registrationsRepository: RegistrationsRepository,
    private readonly eventsRepository: EventsRepository,
    private readonly eventInstancesRepository: EventInstancesRepository,
  ) {}

  async create(
    userId: string,
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationWithRelations> {
    const { eventId, eventInstanceId } = createRegistrationDto;

    // Validar que el evento exista
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    // Validar que el evento esté activo
    if (!event.isActive) {
      throw new BadRequestException('Event is not active');
    }

    // Validar que la instancia exista
    const instance = await this.eventInstancesRepository.findById(eventInstanceId);
    if (!instance) {
      throw new NotFoundException(`Event instance with id ${eventInstanceId} not found`);
    }

    // Validar que la instancia pertenece al evento
    if (instance.event.id !== eventId) {
      throw new BadRequestException('Event instance does not belong to the specified event');
    }

    // Validar que la instancia esté activa
    if (!instance.isActive) {
      throw new BadRequestException('Event instance is not active');
    }

    // Validar que la instancia no haya pasado
    const instanceDate = new Date(instance.dateTime);
    const now = new Date();

    if (instanceDate < now) {
      throw new BadRequestException('Cannot register for past event instances');
    }

    // Validar que el usuario no esté ya inscrito en esta instancia específica
    const existingRegistration = await this.registrationsRepository.findByUserAndInstance(
      userId,
      eventInstanceId,
    );
    if (existingRegistration) {
      throw new ConflictException('You are already registered for this event instance');
    }

    // Validar capacidad disponible en la instancia
    const currentRegistrations = await this.registrationsRepository.countByEventInstanceId(
      eventInstanceId,
    );
    if (currentRegistrations >= instance.capacity) {
      throw new BadRequestException('Event instance has reached maximum capacity');
    }

    return this.registrationsRepository.create({ userId, eventId, eventInstanceId });
  }

  async findById(id: string): Promise<RegistrationWithRelations> {
    const registration = await this.registrationsRepository.findById(id);
    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }
    return registration;
  }

  async findByQrCode(qrCode: string): Promise<RegistrationWithRelations> {
    const registration = await this.registrationsRepository.findByQrCode(qrCode);
    if (!registration) {
      throw new NotFoundException(`Registration with QR code not found`);
    }
    return registration;
  }

  async findMyRegistrations(userId: string): Promise<RegistrationWithRelations[]> {
    return this.registrationsRepository.findByUserId(userId);
  }

  async findByEventId(eventId: string): Promise<RegistrationWithRelations[]> {
    return this.registrationsRepository.findByEventId(eventId);
  }

  async findByEventInstanceId(eventInstanceId: string): Promise<RegistrationWithRelations[]> {
    return this.registrationsRepository.findByEventInstanceId(eventInstanceId);
  }

  async cancelRegistration(id: string, userId: string): Promise<void> {
    const registration = await this.registrationsRepository.findById(id);

    if (!registration) {
      throw new NotFoundException(`Registration with id ${id} not found`);
    }

    // Verificar que la inscripción pertenece al usuario
    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own registrations');
    }

    // Verificar que no se haya marcado asistencia
    if (registration.attendance?.attended) {
      throw new BadRequestException(
        'Cannot cancel registration after attendance has been marked',
      );
    }

    await this.registrationsRepository.delete(id);
  }

  async getEventAvailability(eventId: string): Promise<{
    capacity: number;
    registered: number;
    available: number;
  }> {
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    const registered = await this.registrationsRepository.countByEventId(eventId);
    // Total capacity is sum of all instance capacities
    const totalCapacity = event.instances?.reduce((sum, i) => sum + i.capacity, 0) || 0;

    return {
      capacity: totalCapacity,
      registered,
      available: Math.max(0, totalCapacity - registered),
    };
  }

  async getInstanceAvailability(instanceId: string): Promise<{
    capacity: number;
    registered: number;
    available: number;
  }> {
    const instance = await this.eventInstancesRepository.findById(instanceId);
    if (!instance) {
      throw new NotFoundException(`Event instance with id ${instanceId} not found`);
    }

    const registered = await this.registrationsRepository.countByEventInstanceId(instanceId);
    return {
      capacity: instance.capacity,
      registered,
      available: Math.max(0, instance.capacity - registered),
    };
  }
}
