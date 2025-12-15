import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsDateString,
  Matches,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceType } from '@prisma/client';

/**
 * Patrón de recurrencia para eventos
 * - WEEKLY: weekdays contiene los días de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * - INTERVAL: intervalDays contiene el número de días entre instancias
 */
export class RecurrencePatternDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weekdays?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalDays?: number;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in format HH:MM (24-hour format)',
  })
  time: string;

  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;

  @IsEnum(RecurrenceType)
  @IsOptional()
  recurrenceType?: RecurrenceType = RecurrenceType.SINGLE;

  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrencePattern?: RecurrencePatternDto;

  @IsUUID('4', { message: 'exerciseTypeId must be a valid UUID' })
  @IsNotEmpty()
  exerciseTypeId: string;
}
