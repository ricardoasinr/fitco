import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
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
 * AttendanceController - Endpoints para gestión de asistencia
 * 
 * Endpoints:
 * - POST /attendance/mark - Marcar asistencia (ADMIN)
 * - GET /attendance/event/:eventId - Obtener asistencias de un evento (ADMIN)
 * - GET /attendance/event/:eventId/stats - Estadísticas de asistencia (ADMIN)
 * - GET /attendance/qr/:qrCode - Buscar por QR code (ADMIN)
 */
@Controller('attendance')
@UseGuards(RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  @Roles(Role.ADMIN)
  async markAttendance(
    @CurrentUser() user: RequestUser,
    @Body() markAttendanceDto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(user.id, markAttendanceDto);
  }

  @Get('event/:eventId')
  @Roles(Role.ADMIN)
  async findByEventId(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.findByEventId(eventId);
  }

  @Get('event/:eventId/stats')
  @Roles(Role.ADMIN)
  async getStats(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.attendanceService.getAttendanceStats(eventId);
  }

  @Get('qr/:qrCode')
  @Roles(Role.ADMIN)
  async findByQrCode(@Param('qrCode') qrCode: string) {
    return this.attendanceService.findByQrCode(qrCode);
  }
}

