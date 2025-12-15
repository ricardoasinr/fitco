import { Registration, WellnessAssessment, Attendance } from '@prisma/client';

export interface RegistrationWithRelations extends Registration {
  event: {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    time: string;
    capacity: number;
    isActive: boolean;
    exerciseType: {
      id: string;
      name: string;
    };
  };
  eventInstance: {
    id: string;
    dateTime: Date;
    capacity: number;
    isActive: boolean;
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
  eventInstanceId: string;
}

export interface IRegistrationsRepository {
  create(data: CreateRegistrationData): Promise<RegistrationWithRelations>;
  findById(id: string): Promise<RegistrationWithRelations | null>;
  findByQrCode(qrCode: string): Promise<RegistrationWithRelations | null>;
  findByUserAndEvent(userId: string, eventId: string): Promise<RegistrationWithRelations | null>;
  findByUserAndInstance(userId: string, eventInstanceId: string): Promise<RegistrationWithRelations | null>;
  findByUserId(userId: string): Promise<RegistrationWithRelations[]>;
  findByEventId(eventId: string): Promise<RegistrationWithRelations[]>;
  findByEventInstanceId(eventInstanceId: string): Promise<RegistrationWithRelations[]>;
  countByEventId(eventId: string): Promise<number>;
  countByEventInstanceId(eventInstanceId: string): Promise<number>;
  delete(id: string): Promise<Registration>;
}
