import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsDateString,
  Matches,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceType } from '@prisma/client';
import { RecurrencePatternDto, RecurrenceScheduleDto } from './create-event.dto';

/**
 * UpdateEventDto - DTO para actualizar eventos
 * 
 * Permite editar todos los campos del evento, incluyendo recurrencia y horarios.
 * Al cambiar recurrencia/horarios, las instancias futuras sin registros se regenerarán.
 */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in format HH:MM (24-hour format)',
  })
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrencePattern?: RecurrencePatternDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurrenceScheduleDto)
  schedules?: RecurrenceScheduleDto[];

  @IsOptional()
  @IsUUID('4', { message: 'exerciseTypeId must be a valid UUID' })
  exerciseTypeId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  regenerateInstances?: boolean; // Flag para indicar si se deben regenerar las instancias
}
