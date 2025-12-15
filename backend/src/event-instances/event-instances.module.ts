import { Module } from '@nestjs/common';
import { EventInstancesService } from './event-instances.service';
import { EventInstancesController } from './event-instances.controller';
import { EventInstancesRepository } from './event-instances.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventInstancesController],
  providers: [EventInstancesService, EventInstancesRepository],
  exports: [EventInstancesService, EventInstancesRepository],
})
export class EventInstancesModule {}

