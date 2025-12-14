import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in format HH:MM (24-hour format)',
  })
  time: string;

  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;

  @IsUUID('4', { message: 'exerciseTypeId must be a valid UUID' })
  @IsNotEmpty()
  exerciseTypeId: string;
}

