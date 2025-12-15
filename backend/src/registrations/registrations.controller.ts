import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';

/**
 * User object from JWT strategy validation
 */
interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * RegistrationsController - Endpoints para inscripciones a eventos
 *
 * Endpoints:
 * - POST /registrations - Inscribirse a un evento (USER)
 * - GET /registrations/my - Mis inscripciones (USER)
 * - GET /registrations/:id - Obtener inscripción por ID
 * - GET /registrations/qr/:qrCode - Obtener inscripción por QR (ADMIN)
 * - GET /registrations/event/:eventId - Inscripciones de un evento (ADMIN)
 * - GET /registrations/event/:eventId/availability - Disponibilidad de un evento (público)
 * - GET /registrations/instance/:instanceId - Inscripciones de una instancia (ADMIN)
 * - GET /registrations/instance/:instanceId/availability - Disponibilidad de instancia (público)
 * - DELETE /registrations/:id - Cancelar inscripción (USER)
 */
@Controller('registrations')
@UseGuards(RolesGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @Roles(Role.USER)
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ) {
    return this.registrationsService.create(user.id, createRegistrationDto);
  }

  @Get('my')
  @Roles(Role.USER, Role.ADMIN)
  async findMyRegistrations(@CurrentUser() user: RequestUser) {
    return this.registrationsService.findMyRegistrations(user.id);
  }

  @Get('event/:eventId')
  @Roles(Role.ADMIN)
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationsService.findByEventId(eventId);
  }

  @Public()
  @Get('event/:eventId/availability')
  async getEventAvailability(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationsService.getEventAvailability(eventId);
  }

  @Get('instance/:instanceId')
  @Roles(Role.ADMIN)
  async findByInstanceId(@Param('instanceId', ParseUUIDPipe) instanceId: string) {
    return this.registrationsService.findByEventInstanceId(instanceId);
  }

  @Public()
  @Get('instance/:instanceId/availability')
  async getInstanceAvailability(
    @Param('instanceId', ParseUUIDPipe) instanceId: string,
  ) {
    return this.registrationsService.getInstanceAvailability(instanceId);
  }

  @Get('qr/:qrCode')
  @Roles(Role.ADMIN)
  async findByQrCode(@Param('qrCode') qrCode: string) {
    return this.registrationsService.findByQrCode(qrCode);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.findById(id);
  }

  @Delete(':id')
  @Roles(Role.USER, Role.ADMIN)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.registrationsService.cancelRegistration(id, user.id);
    return { message: 'Registration cancelled successfully' };
  }
}
