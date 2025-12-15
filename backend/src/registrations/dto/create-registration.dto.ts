import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * CreateRegistrationDto - DTO para crear inscripción a evento
 *
 * Validaciones:
 * - eventId: UUID válido y requerido
 * - eventInstanceId: UUID válido y requerido (instancia seleccionada)
 * - userId se obtiene del token JWT (no se envía en el body)
 */
export class CreateRegistrationDto {
  @IsNotEmpty({ message: 'Event ID is required' })
  @IsUUID('4', { message: 'Event ID must be a valid UUID' })
  eventId: string;

  @IsNotEmpty({ message: 'Event Instance ID is required' })
  @IsUUID('4', { message: 'Event Instance ID must be a valid UUID' })
  eventInstanceId: string;
}
