import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateExerciseTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

