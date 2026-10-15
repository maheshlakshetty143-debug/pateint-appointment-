import { Appointment, Patient, Practitioner, ReminderLog, ReminderSettings } from '../types/clinical';
import { formatDateShort, formatTime12h, isEligibleFor24hReminder } from './timeHelpers';

const REMINDER_SETTINGS_KEY = 'pulsecare_reminder_settings_v1';
const REMINDER_LOGS_KEY = 'pulsecare_reminder_logs_v1';

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  autoDispatch24h: true,
  enableEmail: true,
  enableSMS: true,
  hoursInAdvance: 24,
  smsTemplate: 'Reminder: You have an appointment with {doctor_name} on {date} at {time} in {suite}. Reply C to confirm or call 555-349-8800 to reschedule.',
  emailTemplate: 'Dear {patient_name},\n\nThis is a reminder that you have a scheduled appointment with {doctor_name} ({department}) on {date} at {time}.\n\nLocation: {suite}, PulseCare Health\nChief Complaint: {chief_complaint}\n\nPlease arrive 10 minutes prior for check-in.\n\nWarm regards,\nPulseCare Clinical Care Team',
};

export function getStoredReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(DEFAULT_REMINDER_SETTINGS));
      return DEFAULT_REMINDER_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
}

export function saveStoredReminderSettings(settings: ReminderSettings): void {
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save reminder settings', e);
  }
}

export function getStoredReminderLogs(): ReminderLog[] {
  try {
    const raw = localStorage.getItem(REMINDER_LOGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredReminderLogs(logs: ReminderLog[]): void {
  try {
    localStorage.setItem(REMINDER_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save reminder logs', e);
  }
}

export function generateReminderMessage(
  template: string,
  patient: Patient,
  doctor: Practitioner,
  appointment: Appointment
): string {
  return template
    .replace(/{patient_name}/g, `${patient.firstName} ${patient.lastName}`)
    .replace(/{doctor_name}/g, doctor.name)
    .replace(/{department}/g, doctor.department)
    .replace(/{date}/g, formatDateShort(appointment.date))
    .replace(/{time}/g, formatTime12h(appointment.time))
    .replace(/{suite}/g, appointment.room || doctor.room)
    .replace(/{chief_complaint}/g, appointment.chiefComplaint || 'Clinical consultation');
}

export function runAutomated24hReminderCheck(
  appointments: Appointment[],
  patients: Patient[],
  practitioners: Practitioner[],
  settings: ReminderSettings,
  currentLogs: ReminderLog[],
  referenceDateStr: string = '2026-10-14'
): { updatedAppointments: Appointment[]; newLogs: ReminderLog[]; dispatchedCount: number } {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(practitioners.map((d) => [d.id, d]));

  const updatedAppointments = [...appointments];
  const newLogs: ReminderLog[] = [];
  let dispatchedCount = 0;

  for (let i = 0; i < updatedAppointments.length; i++) {
    const apt = updatedAppointments[i];
    // Only target scheduled or confirmed appointments
    if (apt.status !== 'scheduled' && apt.status !== 'confirmed') continue;

    // Check if 24 hours out
    const eligibility = isEligibleFor24hReminder(apt.date, apt.time, referenceDateStr);
    if (!eligibility.eligible) continue;

    const pat = patientMap.get(apt.patientId);
    const doc = doctorMap.get(apt.practitionerId);
    if (!pat || !doc) continue;

    const nowISO = new Date().toISOString();
    let sentSMS = apt.reminderSent?.sms || false;
    let sentEmail = apt.reminderSent?.email || false;
    let didSend = false;

    // Send SMS if enabled and not already sent
    if (settings.enableSMS && !sentSMS && pat.phone) {
      const smsText = generateReminderMessage(settings.smsTemplate, pat, doc, apt);
      newLogs.push({
        id: `rem-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appointmentId: apt.id,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        channel: 'sms',
        destination: pat.phone,
        scheduledFor: apt.date,
        dispatchedAt: nowISO,
        status: 'delivered',
        messagePreview: smsText,
      });
      sentSMS = true;
      didSend = true;
    }

    // Send Email if enabled and not already sent
    if (settings.enableEmail && !sentEmail && pat.email) {
      const emailText = generateReminderMessage(settings.emailTemplate, pat, doc, apt);
      newLogs.push({
        id: `rem-email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        appointmentId: apt.id,
        patientId: pat.id,
        patientName: `${pat.firstName} ${pat.lastName}`,
        channel: 'email',
        destination: pat.email,
        scheduledFor: apt.date,
        dispatchedAt: nowISO,
        status: 'delivered',
        messagePreview: emailText,
      });
      sentEmail = true;
      didSend = true;
    }

    if (didSend) {
      dispatchedCount++;
      updatedAppointments[i] = {
        ...apt,
        reminderSent: {
          sms: sentSMS,
          email: sentEmail,
          timestamp: nowISO,
        },
      };
    }
  }

  const allLogs = [...newLogs, ...currentLogs];
  saveStoredReminderLogs(allLogs);

  return {
    updatedAppointments,
    newLogs,
    dispatchedCount,
  };
}
