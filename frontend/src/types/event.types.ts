export interface ExerciseType {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Tipos de recurrencia
export type RecurrenceType = 'SINGLE' | 'WEEKLY' | 'INTERVAL';

// Patrón de recurrencia
export interface RecurrencePattern {
  weekdays?: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  intervalDays?: number;
}

// Instancia de evento (una fecha/hora específica)
export interface EventInstance {
  id: string;
  eventId: string;
  dateTime: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    name: string;
    description: string;
    time: string;
    capacity: number;
    isActive: boolean;
    exerciseType: {
      id: string;
      name: string;
    };
  };
  _count?: {
    registrations: number;
  };
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  time: string;
  capacity: number;
  recurrenceType: RecurrenceType;
  recurrencePattern: RecurrencePattern | null;
  isActive: boolean;
  exerciseTypeId: string;
  createdAt: string;
  updatedAt: string;
  exerciseType: {
    id: string;
    name: string;
    isActive: boolean;
  };
  instances?: EventInstance[];
  _count?: {
    registrations: number;
    instances: number;
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
  startDate: string;
  endDate: string;
  time: string;
  capacity: number;
  recurrenceType?: RecurrenceType;
  recurrencePattern?: RecurrencePattern;
  exerciseTypeId: string;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
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
      startDate: string;
      time: string;
    };
    eventInstance?: {
      id: string;
      dateTime: string;
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
  eventInstanceId: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
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
    dateTime: string;
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

export interface EventAvailability {
  capacity: number;
  registered: number;
  available: number;
}

export interface InstanceAvailability {
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
      startDate: string;
      time: string;
    };
    eventInstance: {
      id: string;
      dateTime: string;
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

// DTO para crear registro
export interface CreateRegistrationDto {
  eventId: string;
  eventInstanceId: string;
}
