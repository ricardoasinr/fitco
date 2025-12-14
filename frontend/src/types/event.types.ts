export interface ExerciseType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  isActive: boolean;
  exerciseTypeId: string;
  createdAt: string;
  updatedAt: string;
  exerciseType: {
    id: string;
    name: string;
    isActive: boolean;
  };
  _count?: {
    registrations: number;
  };
}

export interface CreateExerciseTypeDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateExerciseTypeDto {
  name?: string;
  isActive?: boolean;
}

export interface CreateEventDto {
  name: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  exerciseTypeId: string;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  date?: string;
  time?: string;
  capacity?: number;
  exerciseTypeId?: string;
}

// Registration Types
export type WellnessType = 'PRE' | 'POST';
export type WellnessStatus = 'PENDING' | 'COMPLETED';

export interface WellnessAssessment {
  id: string;
  registrationId: string;
  type: WellnessType;
  sleepQuality: number | null;
  stressLevel: number | null;
  mood: number | null;
  status: WellnessStatus;
  createdAt: string;
  updatedAt: string;
  registration?: {
    id: string;
    userId: string;
    eventId: string;
    event: {
      id: string;
      name: string;
      date: string;
      time: string;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface Attendance {
  id: string;
  registrationId: string;
  attended: boolean;
  checkedAt: string | null;
  checkedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    name: string;
    description: string;
    date: string;
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

export interface EventAvailability {
  capacity: number;
  registered: number;
  available: number;
}

export interface CompleteWellnessDto {
  sleepQuality: number;
  stressLevel: number;
  mood: number;
}

export interface MarkAttendanceDto {
  qrCode?: string;
  email?: string;
  eventId?: string;
}

export interface WellnessImpact {
  sleepQualityChange: number | null;
  stressLevelChange: number | null;
  moodChange: number | null;
  overallImpact: number | null;
}

export interface WellnessImpactResponse {
  preAssessment: WellnessAssessment | null;
  postAssessment: WellnessAssessment | null;
  impact: WellnessImpact;
}

export interface AttendanceStats {
  total: number;
  attended: number;
  pending: number;
  preCompleted: number;
  postCompleted: number;
}

export interface AttendanceWithRegistration extends Attendance {
  registration: {
    id: string;
    userId: string;
    eventId: string;
    qrCode: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
    event: {
      id: string;
      name: string;
      date: string;
      time: string;
    };
    wellnessAssessments: Array<{
      id: string;
      type: WellnessType;
      status: WellnessStatus;
      sleepQuality: number | null;
      stressLevel: number | null;
      mood: number | null;
    }>;
  };
}

