import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WellnessType, WellnessStatus } from '@prisma/client';
import { AttendanceRepository } from './attendance.repository';
import { WellnessAssessmentsRepository } from '../wellness-assessments/wellness-assessments.repository';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { AttendanceWithRegistration } from './interfaces/attendance.repository.interface';

/**
 * AttendanceService - Lógica de negocio para marcado de asistencia
 * 
 * Responsabilidades (Single Responsibility Principle):
 * - Validar que el PRE wellness esté completado antes de marcar asistencia
 * - Buscar inscripción por QR o email
 * - Crear wellness POST al marcar asistencia
 */
@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly wellnessRepository: WellnessAssessmentsRepository,
  ) {}

  async markAttendance(
    adminId: string,
    markAttendanceDto: MarkAttendanceDto,
  ): Promise<AttendanceWithRegistration> {
    const { qrCode, email, eventId } = markAttendanceDto;

    let attendance: AttendanceWithRegistration | null = null;

    // Buscar por QR code
    if (qrCode) {
      attendance = await this.attendanceRepository.findByQrCode(qrCode);
      if (!attendance) {
        throw new NotFoundException('Registration not found with the provided QR code');
      }
    }
    // Buscar por email y eventId
    else if (email && eventId) {
      attendance = await this.attendanceRepository.findByUserEmail(email, eventId);
      if (!attendance) {
        throw new NotFoundException(
          'Registration not found for the provided email and event',
        );
      }
    } else {
      throw new BadRequestException(
        'Must provide either qrCode or both email and eventId',
      );
    }

    // Verificar que no se haya marcado asistencia ya
    if (attendance.attended) {
      throw new BadRequestException('Attendance has already been marked for this registration');
    }

    // Verificar que el PRE wellness esté completado
    const preAssessment = attendance.registration.wellnessAssessments.find(
      (a) => a.type === 'PRE',
    );

    if (!preAssessment || preAssessment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'El usuario no ha completado la evaluación PRE.',
      );
    }

    // Marcar asistencia
    const updatedAttendance = await this.attendanceRepository.markAttended(
      attendance.id,
      adminId,
    );

    // Crear evaluación POST wellness (pendiente)
    await this.wellnessRepository.create({
      registrationId: attendance.registration.id,
      type: WellnessType.POST,
    });

    return updatedAttendance;
  }

  async findByEventId(eventId: string): Promise<AttendanceWithRegistration[]> {
    return this.attendanceRepository.findByEventId(eventId);
  }

  async findByQrCode(qrCode: string): Promise<AttendanceWithRegistration> {
    const attendance = await this.attendanceRepository.findByQrCode(qrCode);
    if (!attendance) {
      throw new NotFoundException('Attendance not found');
    }
    return attendance;
  }

  async getAttendanceStats(eventId: string): Promise<{
    total: number;
    attended: number;
    pending: number;
    preCompleted: number;
    postCompleted: number;
  }> {
    const attendances = await this.attendanceRepository.findByEventId(eventId);

    const total = attendances.length;
    const attended = attendances.filter((a) => a.attended).length;
    const pending = total - attended;

    const preCompleted = attendances.filter((a) =>
      a.registration.wellnessAssessments.some(
        (w) => w.type === 'PRE' && w.status === 'COMPLETED',
      ),
    ).length;

    const postCompleted = attendances.filter((a) =>
      a.registration.wellnessAssessments.some(
        (w) => w.type === 'POST' && w.status === 'COMPLETED',
      ),
    ).length;

    return {
      total,
      attended,
      pending,
      preCompleted,
      postCompleted,
    };
  }
}


