import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EventsModule } from './events/events.module';
import { ExerciseTypesModule } from './exercise-types/exercise-types.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { WellnessAssessmentsModule } from './wellness-assessments/wellness-assessments.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    EventsModule,
    ExerciseTypesModule,
    RegistrationsModule,
    WellnessAssessmentsModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

