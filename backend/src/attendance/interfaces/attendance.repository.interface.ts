import { Attendance } from '@prisma/client';

export interface AttendanceWithRegistration extends Attendance {
  registration: {
    id: string;
    userId: string;
    eventId: string;
    eventInstanceId: string;
    qrCode: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
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
    wellnessAssessments: Array<{
      id: string;
      type: string;
      status: string;
      sleepQuality: number | null;
      stressLevel: number | null;
      mood: number | null;
    }>;
  };
}

export interface IAttendanceRepository {
  findByRegistrationId(registrationId: string): Promise<AttendanceWithRegistration | null>;
  findByQrCode(qrCode: string): Promise<AttendanceWithRegistration | null>;
  findByUserEmail(email: string, eventId: string): Promise<AttendanceWithRegistration | null>;
  markAttended(id: string, adminId: string): Promise<AttendanceWithRegistration>;
  findByEventId(eventId: string): Promise<AttendanceWithRegistration[]>;
}
