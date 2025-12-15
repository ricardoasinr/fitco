import { WellnessAssessment, WellnessType, WellnessStatus } from '@prisma/client';

export interface WellnessAssessmentWithRegistration extends WellnessAssessment {
  registration: {
    id: string;
    userId: string;
    eventId: string;
    eventInstanceId: string;
    qrCode: string;
    event: {
      id: string;
      name: string;
      startDate: Date;
      time: string;
    };
    eventInstance: {
      id: string;
      dateTime: Date;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateWellnessAssessmentData {
  registrationId: string;
  type: WellnessType;
}

export interface UpdateWellnessAssessmentData {
  sleepQuality?: number;
  stressLevel?: number;
  mood?: number;
  status?: WellnessStatus;
}

export interface WellnessImpact {
  sleepQualityChange: number | null;
  stressLevelChange: number | null;
  moodChange: number | null;
  overallImpact: number | null;
}

export interface IWellnessAssessmentsRepository {
  create(data: CreateWellnessAssessmentData): Promise<WellnessAssessment>;
  findById(id: string): Promise<WellnessAssessmentWithRegistration | null>;
  findByRegistrationId(registrationId: string): Promise<WellnessAssessment[]>;
  findByRegistrationAndType(
    registrationId: string,
    type: WellnessType,
  ): Promise<WellnessAssessmentWithRegistration | null>;
  findPendingByUserId(userId: string): Promise<WellnessAssessmentWithRegistration[]>;
  findCompletedByUserId(userId: string): Promise<WellnessAssessmentWithRegistration[]>;
  update(id: string, data: UpdateWellnessAssessmentData): Promise<WellnessAssessment>;
}
