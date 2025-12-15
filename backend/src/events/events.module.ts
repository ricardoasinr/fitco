import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ExerciseTypesModule } from '../exercise-types/exercise-types.module';
import { EventInstancesModule } from '../event-instances/event-instances.module';

@Module({
  imports: [
    PrismaModule,
    ExerciseTypesModule,
    forwardRef(() => EventInstancesModule),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
