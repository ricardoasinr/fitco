import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WellnessAssessmentsService } from './wellness-assessments.service';
import { CompleteWellnessDto } from './dto/complete-wellness.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

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
 * WellnessAssessmentsController - Endpoints para evaluaciones de bienestar
 * 
 * Endpoints:
 * - GET /wellness/pending - Obtener mis evaluaciones pendientes (USER)
 * - GET /wellness/completed - Obtener mis evaluaciones completadas (USER)
 * - GET /wellness/:id - Obtener evaluación por ID
 * - POST /wellness/:id/complete - Completar evaluación (USER)
 * - GET /wellness/registration/:registrationId - Evaluaciones de una inscripción
 * - GET /wellness/registration/:registrationId/impact - Calcular impacto wellness
 */
@Controller('wellness')
@UseGuards(RolesGuard)
export class WellnessAssessmentsController {
  constructor(private readonly wellnessService: WellnessAssessmentsService) {}

  @Get('pending')
  @Roles(Role.USER, Role.ADMIN)
  async findPending(@CurrentUser() user: RequestUser) {
    return this.wellnessService.findPendingByUser(user.id);
  }

  @Get('completed')
  @Roles(Role.USER, Role.ADMIN)
  async findCompleted(@CurrentUser() user: RequestUser) {
    return this.wellnessService.findCompletedByUser(user.id);
  }

  @Get('registration/:registrationId')
  @Roles(Role.USER, Role.ADMIN)
  async findByRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.wellnessService.getAssessmentsByRegistration(registrationId, user.id);
  }

  @Get('registration/:registrationId/impact')
  @Roles(Role.USER, Role.ADMIN)
  async getImpact(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.wellnessService.getImpactByRegistration(registrationId, user.id);
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.wellnessService.findById(id);
  }

  @Post(':id/complete')
  @Roles(Role.USER, Role.ADMIN)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
    @Body() completeDto: CompleteWellnessDto,
  ) {
    return this.wellnessService.completeAssessment(id, user.id, completeDto);
  }
}

