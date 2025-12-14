import { Registration, WellnessAssessment, Attendance, Event, User } from '@prisma/client';

export interface RegistrationWithRelations extends Registration {
  event: {
    id: string;
    name: string;
    description: string;
    date: Date;
    time: string;
    capacity: number;
    isActive: boolean;
    exerciseType: {
      id: string;
      name: string;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  attendance: Attendance | null;
  wellnessAssessments: WellnessAssessment[];
}

export interface CreateRegistrationData {
  userId: string;
  eventId: string;
}

export interface IRegistrationsRepository {
  create(data: CreateRegistrationData): Promise<RegistrationWithRelations>;
  findById(id: string): Promise<RegistrationWithRelations | null>;
  findByQrCode(qrCode: string): Promise<RegistrationWithRelations | null>;
  findByUserAndEvent(userId: string, eventId: string): Promise<RegistrationWithRelations | null>;
  findByUserId(userId: string): Promise<RegistrationWithRelations[]>;
  findByEventId(eventId: string): Promise<RegistrationWithRelations[]>;
  countByEventId(eventId: string): Promise<number>;
  delete(id: string): Promise<Registration>;
}

