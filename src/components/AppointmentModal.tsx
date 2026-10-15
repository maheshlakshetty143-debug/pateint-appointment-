import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Patient, Practitioner, VisitType, RecurrenceFrequency } from '../types/clinical';
import {
  checkSlotConflict,
  formatDateLong,
  formatDateShort,
  formatTime12h,
  timeToMinutes,
  minutesToTime,
  generateRecurringDates,
  parseDate,
} from '../utils/timeHelpers';
import { AlertCircle, Check, X, Clock, Calendar, User, Stethoscope, Repeat } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    appointmentData: Partial<Appointment>,
    newPatient?: Patient,
    recurrenceSeries?: Partial<Appointment>[]
  ) => void;
  initialAppointment?: Appointment | null;
  initialDate?: string;
  initialTime?: string;
  initialDoctorId?: string;
  patients: Patient[];
  practitioners: Practitioner[];
  allAppointments: Appointment[];
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAppointment,
  initialDate,
  initialTime,
  initialDoctorId,
  patients,
  practitioners,
  allAppointments,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isCreatingNewPatient, setIsCreatingNewPatient] = useState<boolean>(false);

  // New patient quick-form state
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newDob, setNewDob] = useState('1990-01-01');
  const [newGender, setNewGender] = useState<'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say'>('Female');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newInsurance, setNewInsurance] = useState('');
  const [newPolicyNum, setNewPolicyNum] = useState('');
  const [newAllergies, setNewAllergies] = useState('');

  // Appointment fields
  const [practitionerId, setPractitionerId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [visitType, setVisitType] = useState<VisitType>('routine_checkup');
  const [room, setRoom] = useState<string>('');
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);

  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialAppointment) {
      setSelectedPatientId(initialAppointment.patientId);
      setPractitionerId(initialAppointment.practitionerId);
      setDate(initialAppointment.date);
      setTime(initialAppointment.time);
      setDurationMinutes(initialAppointment.durationMinutes);
      setVisitType(initialAppointment.visitType);
      setRoom(initialAppointment.room);
      setChiefComplaint(initialAppointment.chiefComplaint || '');
      setNotes(initialAppointment.notes || '');
      setIsCreatingNewPatient(false);
      setIsRecurring(Boolean(initialAppointment.isRecurring));
      if (initialAppointment.recurrence) {
        setRecurrenceFrequency(initialAppointment.recurrence.frequency);
        setRecurrenceCount(initialAppointment.recurrence.count);
      }
    } else {
      setSelectedPatientId(patients[0]?.id || '');
      setPractitionerId(initialDoctorId || practitioners[0]?.id || '');
      setDate(initialDate || '2026-10-14');
      setTime(initialTime || '09:00');
      setDurationMinutes(30);
      setVisitType('routine_checkup');
      
      const doc = practitioners.find((p) => p.id === (initialDoctorId || practitioners[0]?.id));
      setRoom(doc ? doc.room : 'Suite 101');
      setChiefComplaint('');
      setNotes('');
      setIsCreatingNewPatient(false);
      setIsRecurring(false);
      setRecurrenceFrequency('weekly');
      setRecurrenceCount(4);
    }
  }, [isOpen, initialAppointment, initialDate, initialTime, initialDoctorId, patients, practitioners]);

  // Update room when doctor changes
  const handleDoctorChange = (id: string) => {
    setPractitionerId(id);
    const doc = practitioners.find((p) => p.id === id);
    if (doc) {
      setRoom(doc.room);
    }
  };

  // Conflict evaluation
  const conflictCheck = useMemo(() => {
    if (!practitionerId || !date || !time) return { hasConflict: false };
    return checkSlotConflict(
      practitionerId,
      date,
      time,
      durationMinutes,
      allAppointments,
      initialAppointment?.id
    );
  }, [practitionerId, date, time, durationMinutes, allAppointments, initialAppointment]);

  // Preview generated recurring dates
  const previewRecurringDates = useMemo(() => {
    if (!isRecurring || !date) return [];
    return generateRecurringDates(date, recurrenceFrequency, recurrenceCount);
  }, [isRecurring, date, recurrenceFrequency, recurrenceCount]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, patientSearch]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedDoctor = practitioners.find((p) => p.id === practitionerId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let createdPatient: Patient | undefined;
    let finalPatientId = selectedPatientId;

    if (isCreatingNewPatient) {
      if (!newFirstName.trim() || !newLastName.trim() || !newPhone.trim()) {
        alert('Please fill in the required patient name and phone number.');
        return;
      }
      const newId = `pat-${Date.now()}`;
      const mrnGen = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
      createdPatient = {
        id: newId,
        mrn: mrnGen,
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        dateOfBirth: newDob,
        gender: newGender,
        phone: newPhone.trim(),
        email: newEmail.trim() || `${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@example.com`,
        allergies: newAllergies
          ? newAllergies.split(',').map((s) => s.trim()).filter(Boolean)
          : ['None Reported'],
        chronicConditions: [],
        medicalHistoryNotes: 'New patient intake profile created.',
        medicalHistoryEntries: [],
        currentMedications: [],
        surgeries: [],
        insuranceProvider: newInsurance.trim() || 'Self-Pay / Uninsured',
        policyNumber: newPolicyNum.trim() || 'N/A',
        emergencyContact: {
          name: 'Primary Contact',
          phone: newPhone.trim(),
          relation: 'Self',
        },
      };
      finalPatientId = newId;
    }

    if (!finalPatientId) {
      alert('Please select or create a patient.');
      return;
    }

    if (!chiefComplaint.trim()) {
      alert('Please specify a chief complaint or appointment reason.');
      return;
    }

    // Base appointment object
    const appointmentPayload: Partial<Appointment> = {
      patientId: finalPatientId,
      practitionerId,
      date,
      time,
      durationMinutes,
      visitType,
      room,
      chiefComplaint: chiefComplaint.trim(),
      notes: notes.trim(),
      status: initialAppointment ? initialAppointment.status : 'scheduled',
      isRecurring: isRecurring,
    };

    // If recurring and creating new, generate series
    let recurrenceSeries: Partial<Appointment>[] | undefined;
    if (isRecurring && !initialAppointment && previewRecurringDates.length > 0) {
      const groupId = `rec-grp-${Date.now()}`;
      appointmentPayload.recurringGroupId = groupId;
      appointmentPayload.recurrence = {
        frequency: recurrenceFrequency,
        count: recurrenceCount,
        index: 1,
        groupId,
      };

      recurrenceSeries = previewRecurringDates.slice(1).map((rDate, idx) => ({
        ...appointmentPayload,
        date: rDate,
        recurrence: {
          frequency: recurrenceFrequency,
          count: recurrenceCount,
          index: idx + 2,
          groupId,
        },
      }));
    }

    onSave(appointmentPayload, createdPatient, recurrenceSeries);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {initialAppointment ? 'Edit Appointment' : 'Schedule Patient Appointment'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enter clinical details, set recurring options, and verify calendar availability.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-neutral-500" />
                <span>Patient Selection</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewPatient(!isCreatingNewPatient)}
                className="text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
              >
                {isCreatingNewPatient ? '← Select existing patient' : '+ Register new patient'}
              </button>
            </div>

            {!isCreatingNewPatient ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Search patient name, MRN, phone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
                    >
                      {filteredPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} ({p.mrn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedPatient && (
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex flex-wrap items-center gap-y-1 gap-x-3">
                    <span className="font-semibold text-neutral-900">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                    <span className="font-mono tabular-nums text-neutral-500">{selectedPatient.mrn}</span>
                    <span>·</span>
                    <span>DOB: {selectedPatient.dateOfBirth}</span>
                    <span>·</span>
                    <span>{selectedPatient.phone}</span>
                    <span>·</span>
                    <span className="text-neutral-700">Ins: {selectedPatient.insuranceProvider}</span>
                    {selectedPatient.allergies.length > 0 && selectedPatient.allergies[0] !== 'None Reported' && (
                      <span className="text-rose-700 font-medium">
                        Alert: {selectedPatient.allergies.join(', ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Inline new patient form */
              <div className="p-4 bg-blue-50/40 rounded-lg border border-blue-100 space-y-3">
                <p className="text-xs font-semibold text-blue-900">Quick Patient Registration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="e.g. Samuel"
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="e.g. Hayes"
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={newDob}
                      onChange={(e) => setNewDob(e.target.value)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      value={newInsurance}
                      onChange={(e) => setNewInsurance(e.target.value)}
                      placeholder="e.g. Cigna, BCBS"
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">Known Allergies</label>
                    <input
                      type="text"
                      value={newAllergies}
                      onChange={(e) => setNewAllergies(e.target.value)}
                      placeholder="e.g. Penicillin, Aspirin (or None)"
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Practitioner & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-neutral-500" />
                <span>Attending Practitioner</span>
              </label>
              <select
                value={practitionerId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              >
                {practitioners.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.department} ({doc.room})
                  </option>
                ))}
              </select>
              {selectedDoctor && (
                <p className="text-xs text-neutral-500 mt-1">
                  Hours: {selectedDoctor.workingHours.start} – {selectedDoctor.workingHours.end} · {selectedDoctor.specialty}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
                Care Suite / Room
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Suite 302 or Telehealth"
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
              />
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-700 focus:outline-none font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Time</span>
                </label>
                <input
                  type="time"
                  step="900"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-700 focus:outline-none font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-700 focus:outline-none"
                >
                  <option value={15}>15 Minutes (Brief)</option>
                  <option value={30}>30 Minutes (Standard)</option>
                  <option value={45}>45 Minutes (Extended)</option>
                  <option value={60}>60 Minutes (Comprehensive)</option>
                </select>
              </div>
            </div>

            {/* Smart Conflict Detection Display */}
            {conflictCheck.hasConflict ? (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Schedule Conflict Detected:</span>{' '}
                  {selectedDoctor?.name} has an active appointment at {formatTime12h(conflictCheck.conflictingAppointment?.time || '')} ({conflictCheck.conflictingAppointment?.durationMinutes} min).
                  <p className="mt-1 text-amber-800">
                    Consider adjusting the start time or reassigning to another specialist.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Slot available on {formatDateLong(date)} from {formatTime12h(time)} to {formatTime12h(minutesToTime(timeToMinutes(time) + durationMinutes))}</span>
              </div>
            )}
          </div>

          {/* Recurring Appointment Feature */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded cursor-pointer"
                />
                <Repeat className="w-3.5 h-3.5 text-blue-800" />
                <span>Set as Recurring Appointment</span>
              </label>
              {isRecurring && (
                <span className="text-[11px] text-blue-900 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {recurrenceCount} repeat occurrences
                </span>
              )}
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-700 mb-1 font-medium">Recurrence Frequency</label>
                    <select
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded bg-white font-medium"
                    >
                      <option value="daily">Daily (Repeat every day)</option>
                      <option value="weekly">Weekly (Repeat every week on {date ? parseDate(date).toLocaleDateString('en-US', { weekday: 'long' }) : 'same day'})</option>
                      <option value="monthly">Monthly (Repeat same day of month)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-700 mb-1 font-medium">Number of Occurrences</label>
                    <select
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded bg-white font-mono tabular-nums"
                    >
                      <option value={2}>2 Occurrences</option>
                      <option value={4}>4 Occurrences</option>
                      <option value={6}>6 Occurrences</option>
                      <option value={8}>8 Occurrences</option>
                      <option value={12}>12 Occurrences</option>
                    </select>
                  </div>
                </div>

                {/* Live Date Preview */}
                {previewRecurringDates.length > 0 && (
                  <div className="p-3 bg-white rounded border border-neutral-200 text-xs space-y-1.5">
                    <span className="font-semibold text-neutral-900 block text-[11px]">
                      Scheduled Series Dates ({previewRecurringDates.length} total visits at {formatTime12h(time)}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {previewRecurringDates.map((rDate, idx) => (
                        <span
                          key={rDate}
                          className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 font-mono tabular-nums text-[11px]"
                        >
                          #{idx + 1}: {formatDateShort(rDate)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visit Type */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1.5">
              Visit Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'routine_checkup', label: 'Routine Exam' },
                { id: 'follow_up', label: 'Follow-up' },
                { id: 'new_patient', label: 'New Patient' },
                { id: 'urgent_care', label: 'Urgent Care' },
                { id: 'lab_review', label: 'Lab Review' },
                { id: 'telehealth', label: 'Telehealth' },
                { id: 'procedure', label: 'Procedure' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setVisitType(type.id as VisitType)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                    visitType === type.id
                      ? 'border-blue-800 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white text-neutral-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1">
              Chief Complaint / Reason for Visit *
            </label>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Chest tightness on exertion, annual diabetes lab check..."
              className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>

          {/* Clinical Pre-Visit Notes */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1">
              Pre-visit Instructions / Triage Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting required for blood work; bring current medication bottles..."
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            {initialAppointment
              ? 'Save Changes'
              : isRecurring
              ? `Confirm ${recurrenceCount} Recurring Appointments`
              : 'Confirm Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};
