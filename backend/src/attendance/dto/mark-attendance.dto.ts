import { IsOptional, IsEmail, IsString, IsUUID } from 'class-validator';

/**
 * MarkAttendanceDto - DTO para marcar asistencia
 * 
 * Se puede marcar asistencia por:
 * - QR Code: qrCode
 * - Email del usuario + eventId: email + eventId
 */
export class MarkAttendanceDto {
  @IsOptional()
  @IsString({ message: 'QR code must be a string' })
  qrCode?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Event ID must be a valid UUID' })
  eventId?: string;
}


