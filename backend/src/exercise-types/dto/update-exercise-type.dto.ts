import { PartialType } from '@nestjs/mapped-types';
import { CreateExerciseTypeDto } from './create-exercise-type.dto';

export class UpdateExerciseTypeDto extends PartialType(CreateExerciseTypeDto) {}

