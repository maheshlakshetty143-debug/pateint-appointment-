import { Appointment, Patient, Practitioner } from '../types/clinical';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_PATIENTS,
  INITIAL_PRACTITIONERS,
} from '../data/mockClinicalData';

const APPOINTMENTS_KEY = 'pulsecare_appointments_v1';
const PATIENTS_KEY = 'pulsecare_patients_v1';
const PRACTITIONERS_KEY = 'pulsecare_practitioners_v1';

export function getStoredAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_APPOINTMENTS;
  }
}

export function saveStoredAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.error('Failed to save appointments to localStorage', e);
  }
}

export function getStoredPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    if (!raw) {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PATIENTS;
  }
}

export function saveStoredPatients(patients: Patient[]): void {
  try {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  } catch (e) {
    console.error('Failed to save patients to localStorage', e);
  }
}

export function getStoredPractitioners(): Practitioner[] {
  try {
    const raw = localStorage.getItem(PRACTITIONERS_KEY);
    if (!raw) {
      localStorage.setItem(PRACTITIONERS_KEY, JSON.stringify(INITIAL_PRACTITIONERS));
      return INITIAL_PRACTITIONERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRACTITIONERS;
  }
}

export function saveStoredPractitioners(practitioners: Practitioner[]): void {
  try {
    localStorage.setItem(PRACTITIONERS_KEY, JSON.stringify(practitioners));
  } catch (e) {
    console.error('Failed to save practitioners to localStorage', e);
  }
}

export function resetClinicalData(): {
  appointments: Appointment[];
  patients: Patient[];
  practitioners: Practitioner[];
} {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
  localStorage.setItem(PRACTITIONERS_KEY, JSON.stringify(INITIAL_PRACTITIONERS));
  return {
    appointments: INITIAL_APPOINTMENTS,
    patients: INITIAL_PATIENTS,
    practitioners: INITIAL_PRACTITIONERS,
  };
}

export function exportAppointmentsToCSV(
  appointments: Appointment[],
  patients: Patient[],
  practitioners: Practitioner[]
): void {
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(practitioners.map((d) => [d.id, d]));

  const headers = [
    'Appointment ID',
    'Date',
    'Time',
    'Duration (Min)',
    'Status',
    'Patient Name',
    'MRN',
    'Patient Phone',
    'Doctor',
    'Department',
    'Room',
    'Visit Type',
    'Chief Complaint',
  ];

  const rows = appointments.map((apt) => {
    const pat = patientMap.get(apt.patientId);
    const doc = doctorMap.get(apt.practitionerId);
    const patName = pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown';
    const mrn = pat ? pat.mrn : '';
    const phone = pat ? pat.phone : '';
    const docName = doc ? doc.name : 'Unknown';
    const dept = doc ? doc.department : '';

    return [
      apt.id,
      apt.date,
      apt.time,
      apt.durationMinutes,
      apt.status,
      `"${patName}"`,
      mrn,
      `"${phone}"`,
      `"${docName}"`,
      `"${dept}"`,
      `"${apt.room}"`,
      apt.visitType,
      `"${(apt.chiefComplaint || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pulsecare_appointments_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
