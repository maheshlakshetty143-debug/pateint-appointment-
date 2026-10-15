import React, { useState, useEffect, useMemo } from 'react';
import {
  Appointment,
  Patient,
  Practitioner,
  AppointmentStatus,
  Vitals,
  ReminderLog,
  ReminderSettings,
} from './types/clinical';
import {
  getStoredAppointments,
  saveStoredAppointments,
  getStoredPatients,
  saveStoredPatients,
  getStoredPractitioners,
  saveStoredPractitioners,
  resetClinicalData,
  exportAppointmentsToCSV,
} from './utils/clinicalStorage';
import {
  getStoredReminderSettings,
  saveStoredReminderSettings,
  getStoredReminderLogs,
  saveStoredReminderLogs,
  runAutomated24hReminderCheck,
  DEFAULT_REMINDER_SETTINGS,
} from './utils/reminderEngine';
import { isEligibleFor24hReminder } from './utils/timeHelpers';
import { TopNav } from './components/TopNav';
import { ScheduleView } from './components/ScheduleView';
import { LivePatientQueue } from './components/LivePatientQueue';
import { PatientDirectory } from './components/PatientDirectory';
import { PractitionerRoster } from './components/PractitionerRoster';
import { PracticeAnalytics } from './components/PracticeAnalytics';
import { AppointmentModal } from './components/AppointmentModal';
import { AppointmentDetailModal } from './components/AppointmentDetailModal';
import { ReminderCenterModal } from './components/ReminderCenterModal';
import { RotateCcw, Check, Calendar, Activity, ShieldCheck, Bell } from 'lucide-react';

export default function App() {
  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'schedule' | 'queue' | 'patients' | 'analytics' | 'doctors'>('schedule');

  // Selected date: default to today (2026-10-14)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-14');

  // Core State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Automated Reminder Engine State
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [isReminderCenterOpen, setIsReminderCenterOpen] = useState(false);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [bookingPrefill, setBookingPrefill] = useState<{
    date?: string;
    time?: string;
    doctorId?: string;
  }>({});

  const [detailModalAppointment, setDetailModalAppointment] = useState<Appointment | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    const loadedApts = getStoredAppointments();
    const loadedPatients = getStoredPatients();
    const loadedDocs = getStoredPractitioners();
    const loadedSettings = getStoredReminderSettings();
    const loadedLogs = getStoredReminderLogs();

    setAppointments(loadedApts);
    setPatients(loadedPatients);
    setPractitioners(loadedDocs);
    setReminderSettings(loadedSettings);
    setReminderLogs(loadedLogs);
    setIsLoaded(true);
  }, []);

  // Sync back to storage on update
  const updateAppointments = (newApts: Appointment[]) => {
    setAppointments(newApts);
    saveStoredAppointments(newApts);
  };

  const updatePatients = (newPatients: Patient[]) => {
    setPatients(newPatients);
    saveStoredPatients(newPatients);
  };

  const handleUpdateReminderSettings = (settings: ReminderSettings) => {
    setReminderSettings(settings);
    saveStoredReminderSettings(settings);
    showToast('24h Automated reminder preferences saved');
  };

  // Live waiting count for badge
  const activeWaitingCount = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate && a.status === 'checked_in').length;
  }, [appointments, selectedDate]);

  // Count of pending appointments in the 24-hour window that haven't sent reminders
  const pendingRemindersCount = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status !== 'scheduled' && a.status !== 'confirmed') return false;
      const eligibility = isEligibleFor24hReminder(a.date, a.time, '2026-10-14');
      const hasSent = a.reminderSent?.sms || a.reminderSent?.email;
      return eligibility.eligible && !hasSent;
    }).length;
  }, [appointments]);

  // Open booking modal with prefill
  const handleOpenBookModal = (date?: string, time?: string, doctorId?: string) => {
    setEditingAppointment(null);
    setBookingPrefill({ date, time, doctorId });
    setIsBookModalOpen(true);
  };

  // Save new or edited appointment (with recurring support!)
  const handleSaveAppointment = (
    appointmentData: Partial<Appointment>,
    newPatient?: Patient,
    recurrenceSeries?: Partial<Appointment>[]
  ) => {
    let currentPatients = [...patients];
    if (newPatient) {
      currentPatients = [newPatient, ...currentPatients];
      updatePatients(currentPatients);
      showToast(`Patient record created for ${newPatient.firstName} ${newPatient.lastName}`);
    }

    if (editingAppointment) {
      // Edit existing
      const updatedList = appointments.map((apt) => {
        if (apt.id === editingAppointment.id) {
          return {
            ...apt,
            ...appointmentData,
          } as Appointment;
        }
        return apt;
      });
      updateAppointments(updatedList);
      showToast('Appointment successfully updated');
      if (detailModalAppointment?.id === editingAppointment.id) {
        setDetailModalAppointment({
          ...detailModalAppointment,
          ...appointmentData,
        } as Appointment);
      }
    } else {
      // New appointment (first occurrence)
      const baseApt: Appointment = {
        id: `apt-${Date.now()}`,
        patientId: appointmentData.patientId!,
        practitionerId: appointmentData.practitionerId!,
        date: appointmentData.date!,
        time: appointmentData.time!,
        durationMinutes: appointmentData.durationMinutes || 30,
        status: (appointmentData.status as AppointmentStatus) || 'scheduled',
        visitType: appointmentData.visitType || 'routine_checkup',
        room: appointmentData.room || 'Suite 101',
        chiefComplaint: appointmentData.chiefComplaint || 'Clinical Consultation',
        notes: appointmentData.notes || '',
        isRecurring: appointmentData.isRecurring,
        recurringGroupId: appointmentData.recurringGroupId,
        recurrence: appointmentData.recurrence,
        createdAt: new Date().toISOString(),
      };

      let newAppointmentsToAdd = [baseApt];

      // Add recurring series items if generated
      if (recurrenceSeries && recurrenceSeries.length > 0) {
        const seriesItems: Appointment[] = recurrenceSeries.map((s, idx) => ({
          id: `apt-${Date.now()}-${idx + 1}`,
          patientId: s.patientId!,
          practitionerId: s.practitionerId!,
          date: s.date!,
          time: s.time!,
          durationMinutes: s.durationMinutes || 30,
          status: 'scheduled',
          visitType: s.visitType || 'routine_checkup',
          room: s.room || 'Suite 101',
          chiefComplaint: s.chiefComplaint || 'Clinical Consultation',
          notes: s.notes || '',
          isRecurring: true,
          recurringGroupId: s.recurringGroupId,
          recurrence: s.recurrence,
          createdAt: new Date().toISOString(),
        }));
        newAppointmentsToAdd = [...newAppointmentsToAdd, ...seriesItems];
        showToast(
          `Scheduled series: ${newAppointmentsToAdd.length} recurring appointments created (${appointmentData.recurrence?.frequency})`
        );
      } else {
        showToast('New patient appointment confirmed and scheduled');
      }

      const updatedList = [...newAppointmentsToAdd, ...appointments];
      updateAppointments(updatedList);
    }
  };

  // Update an existing patient profile
  const handleUpdatePatient = (updatedPatient: Patient) => {
    const updatedList = patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p));
    updatePatients(updatedList);
    showToast(`Patient profile and medical history updated for ${updatedPatient.firstName} ${updatedPatient.lastName}`);
  };

  // Update appointment status (checked_in, in_consultation, completed, cancelled, no_show)
  const handleUpdateStatus = (
    appointmentId: string,
    newStatus: AppointmentStatus,
    additionalData?: Partial<Appointment>
  ) => {
    const updatedList = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        const updated = {
          ...apt,
          status: newStatus,
          ...additionalData,
        };
        if (detailModalAppointment?.id === appointmentId) {
          setDetailModalAppointment(updated);
        }
        return updated;
      }
      return apt;
    });

    updateAppointments(updatedList);
    const statusLabels: Record<string, string> = {
      checked_in: 'Patient checked in at front desk',
      in_consultation: 'Patient called to examination suite',
      completed: 'Consultation encounter completed',
      cancelled: 'Appointment cancelled',
      no_show: 'Appointment marked as patient no-show',
      confirmed: 'Appointment marked confirmed',
    };
    showToast(statusLabels[newStatus] || `Status updated to ${newStatus}`);
  };

  // Save clinical encounter notes & vitals
  const handleSaveClinicalNotes = (
    appointmentId: string,
    notes: string,
    vitals: Vitals,
    diagnosis?: string,
    prescriptionSummary?: string,
    followUpDays?: number
  ) => {
    const updatedList = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        const updated = {
          ...apt,
          notes,
          vitals,
          diagnosis,
          prescriptionSummary,
          followUpRecommendedDays: followUpDays,
        };
        if (detailModalAppointment?.id === appointmentId) {
          setDetailModalAppointment(updated);
        }
        return updated;
      }
      return apt;
    });

    updateAppointments(updatedList);
    showToast('Clinical charting and vitals saved to patient record');
  };

  // Manual or direct reminder trigger
  const handleSendReminder = (appointmentId: string, channel: 'sms' | 'email') => {
    const targetApt = appointments.find((a) => a.id === appointmentId);
    const targetPat = patients.find((p) => p.id === targetApt?.patientId);
    const targetDoc = practitioners.find((d) => d.id === targetApt?.practitionerId);

    const nowISO = new Date().toISOString();
    const updatedList = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        const updated = {
          ...apt,
          reminderSent: {
            sms: channel === 'sms' ? true : (apt.reminderSent?.sms || false),
            email: channel === 'email' ? true : (apt.reminderSent?.email || false),
            timestamp: nowISO,
          },
        };
        if (detailModalAppointment?.id === appointmentId) {
          setDetailModalAppointment(updated);
        }
        return updated;
      }
      return apt;
    });

    // Create a new audit log entry
    if (targetApt && targetPat && targetDoc) {
      const destination = channel === 'sms' ? targetPat.phone : targetPat.email;
      const newLog: ReminderLog = {
        id: `rem-direct-${Date.now()}`,
        appointmentId,
        patientId: targetPat.id,
        patientName: `${targetPat.firstName} ${targetPat.lastName}`,
        channel,
        destination,
        scheduledFor: targetApt.date,
        dispatchedAt: nowISO,
        status: 'delivered',
        messagePreview: `Reminder for visit with ${targetDoc.name} on ${targetApt.date} at ${targetApt.time}.`,
      };
      const allLogs = [newLog, ...reminderLogs];
      setReminderLogs(allLogs);
      saveStoredReminderLogs(allLogs);
    }

    updateAppointments(updatedList);
    showToast(`${channel.toUpperCase()} reminder delivered to ${channel === 'sms' ? targetPat?.phone : targetPat?.email}`);
  };

  // Run the automated 24-hour reminder check across all appointments
  const handleRunAutomatedCheck = () => {
    const result = runAutomated24hReminderCheck(
      appointments,
      patients,
      practitioners,
      reminderSettings,
      reminderLogs,
      '2026-10-14'
    );

    updateAppointments(result.updatedAppointments);
    setReminderLogs([...result.newLogs, ...reminderLogs]);

    if (result.dispatchedCount > 0) {
      showToast(`Automated check: Dispatched 24h reminders to ${result.dispatchedCount} upcoming patients`);
    } else {
      showToast('Automated check: All 24h appointments are currently up to date');
    }
  };

  // Reset demo data
  const handleResetData = () => {
    if (confirm('Reset schedule and patients to initial clinic demo data?')) {
      const reset = resetClinicalData();
      setAppointments(reset.appointments);
      setPatients(reset.patients);
      setPractitioners(reset.practitioners);
      setSelectedDate('2026-10-14');
      showToast('Clinic scheduling database reset to sample demonstration state');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    exportAppointmentsToCSV(appointments, patients, practitioners);
    showToast('Appointments roster exported as CSV');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-sm font-medium text-neutral-600 animate-pulse">
          Loading PulseCare Clinic Management Engine...
        </div>
      </div>
    );
  }

  // Find active appointment details
  const activeDetailPatient = patients.find((p) => p.id === detailModalAppointment?.patientId);
  const activeDetailDoctor = practitioners.find((d) => d.id === detailModalAppointment?.practitionerId);

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans antialiased">
      {/* Top Bar adhering to Top Bar Contract */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenBookModal={() => handleOpenBookModal(selectedDate)}
        onOpenReminderCenter={() => setIsReminderCenterOpen(true)}
        activeWaitingCount={activeWaitingCount}
        pendingRemindersCount={pendingRemindersCount}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sub-header Context Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              {currentTab === 'schedule' && 'Clinical Schedule & Recurring Matrix'}
              {currentTab === 'queue' && 'Live Patient Triage & Waiting Room Tracker'}
              {currentTab === 'patients' && 'Patient Profiles & Medical History System'}
              {currentTab === 'analytics' && 'Practice Operations Analytics & Patient Throughput'}
              {currentTab === 'doctors' && 'Practitioner Rosters & Care Suites'}
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Comprehensive patient health records, 24h automated reminder dispatch, and recurring appointment scheduling.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsReminderCenterOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Automated 24h Reminders</span>
            </button>

            <button
              onClick={handleResetData}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              title="Reset sample clinic appointments and demo patients"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {currentTab === 'schedule' && (
          <ScheduleView
            appointments={appointments}
            patients={patients}
            practitioners={practitioners}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSelectAppointment={(apt) => setDetailModalAppointment(apt)}
            onOpenBookModal={(date, time, doctorId) => handleOpenBookModal(date, time, doctorId)}
            onExportCSV={handleExportCSV}
          />
        )}

        {currentTab === 'queue' && (
          <LivePatientQueue
            appointments={appointments}
            patients={patients}
            practitioners={practitioners}
            selectedDate={selectedDate}
            onSelectAppointment={(apt) => setDetailModalAppointment(apt)}
            onUpdateStatus={handleUpdateStatus}
            onOpenBookModal={() => handleOpenBookModal(selectedDate)}
          />
        )}

        {currentTab === 'patients' && (
          <PatientDirectory
            patients={patients}
            appointments={appointments}
            practitioners={practitioners}
            onOpenBookModal={() => handleOpenBookModal()}
            onSelectAppointment={(apt) => setDetailModalAppointment(apt)}
            onAddPatient={(newPat) => {
              const updated = [newPat, ...patients];
              updatePatients(updated);
              showToast(`Patient profile registered for ${newPat.firstName} ${newPat.lastName}`);
            }}
            onUpdatePatient={handleUpdatePatient}
          />
        )}

        {currentTab === 'analytics' && (
          <PracticeAnalytics
            appointments={appointments}
            patients={patients}
            practitioners={practitioners}
            selectedDate={selectedDate}
          />
        )}

        {currentTab === 'doctors' && (
          <PractitionerRoster
            practitioners={practitioners}
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDoctorSchedule={(docId) => {
              setCurrentTab('schedule');
            }}
            onBookWithDoctor={(docId) => {
              handleOpenBookModal(selectedDate, undefined, docId);
            }}
          />
        )}
      </main>

      {/* Booking & Recurring Modal */}
      <AppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSave={handleSaveAppointment}
        initialAppointment={editingAppointment}
        initialDate={bookingPrefill.date || selectedDate}
        initialTime={bookingPrefill.time || '09:00'}
        initialDoctorId={bookingPrefill.doctorId}
        patients={patients}
        practitioners={practitioners}
        allAppointments={appointments}
      />

      {/* Appointment Detail & Clinical Encounter Modal */}
      <AppointmentDetailModal
        isOpen={Boolean(detailModalAppointment)}
        onClose={() => setDetailModalAppointment(null)}
        appointment={detailModalAppointment}
        patient={activeDetailPatient}
        practitioner={activeDetailDoctor}
        onUpdateStatus={handleUpdateStatus}
        onEditAppointment={(apt) => {
          setEditingAppointment(apt);
          setIsBookModalOpen(true);
        }}
        onSaveClinicalNotes={handleSaveClinicalNotes}
        onSendReminder={handleSendReminder}
      />

      {/* Automated 24h Reminder Center Modal */}
      <ReminderCenterModal
        isOpen={isReminderCenterOpen}
        onClose={() => setIsReminderCenterOpen(false)}
        settings={reminderSettings}
        onUpdateSettings={handleUpdateReminderSettings}
        logs={reminderLogs}
        appointments={appointments}
        patients={patients}
        practitioners={practitioners}
        onRunAutomatedCheck={handleRunAutomatedCheck}
        onSendManualReminder={handleSendReminder}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <span>PulseCare Clinical Practice Information System</span>
          <div className="flex items-center gap-4">
            <span>Automated 24h SMS/Email Notifications Active</span>
            <span>·</span>
            <span>Recurring Clinical Scheduling</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
