import { IsOptional, IsEmail, IsString, IsUUID } from 'class-validator';

/**
 * MarkAttendanceDto - DTO para marcar asistencia
 * 
 * Se puede marcar asistencia por:
 * - Registration ID: registrationId (más preciso, recomendado)
 * - QR Code: qrCode
 * - Email del usuario + eventId: email + eventId (fallback)
 */
export class MarkAttendanceDto {
  @IsOptional()
  @IsUUID('4', { message: 'Registration ID must be a valid UUID' })
  registrationId?: string;

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


