import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsRepository } from './registrations.repository';
import { EventsRepository } from '../events/events.repository';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RegistrationWithRelations } from './interfaces/registrations.repository.interface';

/**
 * RegistrationsService - Lógica de negocio para inscripciones a eventos
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Validar reglas de negocio para inscripciones
 * - Verificar disponibilidad de cupos
 * - Verificar que el usuario no esté ya inscrito
 * - Verificar que el evento esté activo y no haya pasado
 */
@Injectable()
export class RegistrationsService {
  constructor(
    private readonly registrationsRepository: RegistrationsRepository,
    private readonly eventsRepository: EventsRepository,
  ) {}

  async create(
    userId: string,
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationWithRelations> {
    const { eventId } = createRegistrationDto;

    // Validar que el evento exista
    const event = await this.eventsRepository.findById(eventId);
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }

    // Validar que el evento esté activo
    if (!event.isActive) {
      throw new BadRequestException('Event is not active');
    }

    // Validar que el evento no haya pasado
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      throw new BadRequestException('Cannot register for past events');
    }

    // Validar que el usuario no esté ya inscrito
    const existingRegistration = await this.registrationsRepository.findByUserAndEvent(
      userId,
      eventId,
    );
    if (existingRegistration) {
      throw new ConflictException('You are already registered for this event');
    }

    // Validar capacidad disponible
    const currentRegistrations = await this.registrationsRepository.countByEventId(eventId);
    if (currentRegistrations >= event.capacity) {
      throw new BadRequestException('Event has reached maximum capacity');
    }

    return this.registrationsRepository.create({ userId, eventId });
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
      throw new BadRequestException('Cannot cancel registration after attendance has been marked');
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
    return {
      capacity: event.capacity,
      registered,
      available: Math.max(0, event.capacity - registered),
    };
  }
}

