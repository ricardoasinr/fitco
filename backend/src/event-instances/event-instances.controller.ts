import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { EventInstancesService } from './event-instances.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';

/**
 * EventInstancesController - Endpoints para instancias de eventos
 *
 * Endpoints:
 * - GET /event-instances/event/:eventId - Listar instancias de un evento (público)
 * - GET /event-instances/event/:eventId/available - Instancias disponibles (público)
 * - GET /event-instances/:id - Obtener instancia por ID (público)
 * - GET /event-instances/:id/availability - Obtener disponibilidad (público)
 * - PATCH /event-instances/:id/deactivate - Desactivar instancia (admin)
 */
@Controller('event-instances')
export class EventInstancesController {
  constructor(private readonly eventInstancesService: EventInstancesService) {}

  @Public()
  @Get('event/:eventId')
  findByEventId(@Param('eventId') eventId: string) {
    return this.eventInstancesService.findByEventId(eventId);
  }

  @Public()
  @Get('event/:eventId/available')
  findAvailableByEventId(@Param('eventId') eventId: string) {
    return this.eventInstancesService.findAvailableByEventId(eventId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventInstancesService.findById(id);
  }

  @Public()
  @Get(':id/availability')
  getAvailability(@Param('id') id: string) {
    return this.eventInstancesService.getAvailability(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  deactivate(@Param('id') id: string) {
    return this.eventInstancesService.deactivateInstance(id);
  }
}

