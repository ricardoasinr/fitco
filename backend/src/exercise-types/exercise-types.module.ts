import { Module } from '@nestjs/common';
import { ExerciseTypesService } from './exercise-types.service';
import { ExerciseTypesController } from './exercise-types.controller';
import { ExerciseTypesRepository } from './exercise-types.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExerciseTypesController],
  providers: [ExerciseTypesService, ExerciseTypesRepository],
  exports: [ExerciseTypesService],
})
export class ExerciseTypesModule {}

