import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

/**
 * UpdateEventDto - DTO para actualizar eventos
 * 
 * Nota: No se permite cambiar recurrenceType o recurrencePattern después de crear
 * Para modificar la recurrencia, se debe eliminar y crear de nuevo el evento
 */
export class UpdateEventDto extends PartialType(
  OmitType(CreateEventDto, ['recurrenceType', 'recurrencePattern'] as const),
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
