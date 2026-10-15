export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type VisitType =
  | 'new_patient'
  | 'follow_up'
  | 'urgent_care'
  | 'routine_checkup'
  | 'lab_review'
  | 'telehealth'
  | 'procedure';

export interface Vitals {
  bloodPressure?: string; // e.g. "120/80"
  heartRate?: number; // bpm
  temperatureF?: number; // deg F e.g. 98.6
  oxygenSaturation?: number; // % e.g. 99
  respiratoryRate?: number; // breaths/min
  weightLbs?: number;
}

export interface MedicalHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'Past Condition' | 'Surgical History' | 'Family History' | 'Medication' | 'Clinical Note' | 'Immunization';
  note: string;
  recordedBy?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. "MRN-88421"
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';
  phone: string;
  email: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  medicalHistoryNotes: string; // General medical history notes
  medicalHistoryEntries: MedicalHistoryEntry[]; // Detailed timeline entries
  currentMedications: string[];
  surgeries: string[];
  insuranceProvider: string;
  policyNumber: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  address?: string;
}

export interface Practitioner {
  id: string;
  name: string;
  title: string; // e.g. "MD, FACC"
  specialty: string;
  department: string;
  room: string;
  avatarUrl: string;
  email: string;
  phone: string;
  bio: string;
  workingHours: {
    start: string; // "08:30"
    end: string; // "17:30"
    days: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
  };
  consultationFee: number;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  count: number; // total occurrences (e.g. 4)
  index: number; // 1-indexed (e.g. 1 of 4)
  groupId: string; // identifier linking all appointments in the series
}

export interface ReminderLog {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  channel: 'email' | 'sms';
  destination: string;
  scheduledFor: string;
  dispatchedAt?: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed';
  messagePreview: string;
}

export interface ReminderSettings {
  autoDispatch24h: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  hoursInAdvance: number; // default 24
  smsTemplate: string;
  emailTemplate: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  practitionerId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour format)
  durationMinutes: number; // 15, 30, 45, 60
  status: AppointmentStatus;
  visitType: VisitType;
  room: string;
  chiefComplaint: string;
  notes?: string;
  vitals?: Vitals;
  diagnosis?: string;
  prescriptionSummary?: string;
  followUpRecommendedDays?: number;
  checkedInAt?: string; // ISO timestamp
  consultationStartedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  reminderSent?: {
    sms: boolean;
    email: boolean;
    timestamp: string;
  };
  // Recurring appointment fields
  isRecurring?: boolean;
  recurringGroupId?: string;
  recurrence?: RecurrenceConfig;
  // Automated reminders
  reminder24hScheduledFor?: string;
  reminderLogs?: ReminderLog[];
  createdAt: string;
}

export type ViewMode = 'day' | 'week' | 'month' | 'queue';
