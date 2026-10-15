import React, { useState } from 'react';
import { Appointment, Patient, Practitioner, AppointmentStatus, Vitals } from '../types/clinical';
import {
  formatDateLong,
  formatDateShort,
  formatTime12h,
  computeWaitTimeMinutes,
  addMinutesToTime,
} from '../utils/timeHelpers';
import { StatusIndicator, getVisitTypeLabel } from './StatusIndicator';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  Send,
  AlertTriangle,
  Activity,
  FileText,
  CheckCircle2,
  CalendarClock,
  MapPin,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  patient?: Patient;
  practitioner?: Practitioner;
  onUpdateStatus: (appointmentId: string, newStatus: AppointmentStatus, additionalData?: Partial<Appointment>) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onSaveClinicalNotes: (
    appointmentId: string,
    notes: string,
    vitals: Vitals,
    diagnosis?: string,
    prescriptionSummary?: string,
    followUpDays?: number
  ) => void;
  onSendReminder: (appointmentId: string, channel: 'sms' | 'email') => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  patient,
  practitioner,
  onUpdateStatus,
  onEditAppointment,
  onSaveClinicalNotes,
  onSendReminder,
}) => {
  if (!isOpen || !appointment) return null;

  // Local state for clinical tracking
  const [activeTab, setActiveTab] = useState<'overview' | 'clinical' | 'communication'>('overview');

  // Clinical encounter state
  const [notes, setNotes] = useState(appointment.notes || '');
  const [bp, setBp] = useState(appointment.vitals?.bloodPressure || '');
  const [hr, setHr] = useState(appointment.vitals?.heartRate ? String(appointment.vitals.heartRate) : '');
  const [temp, setTemp] = useState(appointment.vitals?.temperatureF ? String(appointment.vitals.temperatureF) : '');
  const [o2, setO2] = useState(appointment.vitals?.oxygenSaturation ? String(appointment.vitals.oxygenSaturation) : '');
  const [weight, setWeight] = useState(appointment.vitals?.weightLbs ? String(appointment.vitals.weightLbs) : '');
  const [diagnosis, setDiagnosis] = useState(appointment.diagnosis || '');
  const [rx, setRx] = useState(appointment.prescriptionSummary || '');
  const [followUpDays, setFollowUpDays] = useState<number>(appointment.followUpRecommendedDays || 30);
  const [isSavedMessage, setIsSavedMessage] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const waitMins = computeWaitTimeMinutes(appointment.checkedInAt, appointment.consultationStartedAt);

  const handleSaveNotes = () => {
    const vitalsObj: Vitals = {
      bloodPressure: bp || undefined,
      heartRate: hr ? Number(hr) : undefined,
      temperatureF: temp ? Number(temp) : undefined,
      oxygenSaturation: o2 ? Number(o2) : undefined,
      weightLbs: weight ? Number(weight) : undefined,
    };

    onSaveClinicalNotes(
      appointment.id,
      notes,
      vitalsObj,
      diagnosis || undefined,
      rx || undefined,
      followUpDays
    );

    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 2500);
  };

  const triggerReminder = (channel: 'sms' | 'email') => {
    onSendReminder(appointment.id, channel);
    setReminderToast(`Automated ${channel.toUpperCase()} reminder dispatched to ${channel === 'sms' ? patient?.phone : patient?.email}`);
    setTimeout(() => setReminderToast(null), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tabular-nums text-neutral-500">{appointment.id}</span>
              <span className="text-neutral-300">·</span>
              <StatusIndicator status={appointment.status} />
              <span className="text-neutral-300">·</span>
              <span className="text-xs text-neutral-600">{getVisitTypeLabel(appointment.visitType)}</span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-1">
              {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Appointment'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditAppointment(appointment)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Reschedule
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-6 border-b border-neutral-200 bg-white gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-700 text-blue-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Appointment Overview
          </button>
          <button
            onClick={() => setActiveTab('clinical')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'clinical'
                ? 'border-blue-700 text-blue-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Clinical Charting & Vitals
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'communication'
                ? 'border-blue-700 text-blue-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Reminders & Notifications
          </button>
        </div>

        {/* Toast alert */}
        {reminderToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between">
            <span>{reminderToast}</span>
            <button onClick={() => setReminderToast(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Lifecycle Stage Controls */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="text-xs font-semibold text-neutral-800 mb-2.5">
                  Appointment Workflow Progression
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {appointment.status === 'scheduled' && (
                    <button
                      onClick={() => onUpdateStatus(appointment.id, 'confirmed')}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Mark Confirmed
                    </button>
                  )}

                  {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() =>
                        onUpdateStatus(appointment.id, 'checked_in', {
                          checkedInAt: new Date().toISOString(),
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Check-In Patient
                    </button>
                  )}

                  {appointment.status === 'checked_in' && (
                    <button
                      onClick={() =>
                        onUpdateStatus(appointment.id, 'in_consultation', {
                          consultationStartedAt: new Date().toISOString(),
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Call to Exam Room
                    </button>
                  )}

                  {appointment.status === 'in_consultation' && (
                    <button
                      onClick={() =>
                        onUpdateStatus(appointment.id, 'completed', {
                          completedAt: new Date().toISOString(),
                        })
                      }
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Complete Consultation
                    </button>
                  )}

                  {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(appointment.id, 'no_show')}
                        className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-rose-700 hover:bg-rose-50 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Mark No-Show
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Cancel this appointment?')) {
                            onUpdateStatus(appointment.id, 'cancelled');
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    </>
                  )}

                  {appointment.status === 'completed' && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Encounter completed successfully. Notes logged in chart.</span>
                    </div>
                  )}
                </div>

                {/* Real-time Wait & Duration tracker */}
                {appointment.status === 'checked_in' && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 text-xs text-amber-800 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Patient checked in at {new Date(appointment.checkedInAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      Current waiting room duration: <strong className="font-mono tabular-nums">{waitMins} min</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Patient & Practitioner 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Patient Summary */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900">Patient Details</span>
                    <span className="text-xs font-mono tabular-nums text-neutral-500">{patient?.mrn}</span>
                  </div>

                  {patient ? (
                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <p className="text-sm font-semibold text-neutral-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                      <p className="text-neutral-500">DOB: {patient.dateOfBirth} ({patient.gender})</p>
                      <p className="text-neutral-500">Insurance: {patient.insuranceProvider} · #{patient.policyNumber}</p>
                      {patient.allergies.length > 0 && patient.allergies[0] !== 'None Reported' && (
                        <div className="pt-1 text-rose-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Allergies: {patient.allergies.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">Patient information unavailable.</p>
                  )}
                </div>

                {/* Doctor & Schedule Details */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                  <span className="text-xs font-semibold text-neutral-900">Practitioner & Location</span>

                  {practitioner ? (
                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={practitioner.avatarUrl}
                          alt={practitioner.name}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{practitioner.name}</p>
                          <p className="text-neutral-500">{practitioner.specialty} · {practitioner.department}</p>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{appointment.room || practitioner.room}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formatDateLong(appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-mono tabular-nums">
                            {formatTime12h(appointment.time)} – {formatTime12h(addMinutesToTime(appointment.time, appointment.durationMinutes))} ({appointment.durationMinutes} min)
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">Practitioner details unavailable.</p>
                  )}
                </div>
              </div>

              {/* Chief Complaint & Reason */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                <span className="text-xs font-semibold text-neutral-900">Chief Complaint & Visit Reason</span>
                <p className="text-sm text-neutral-800 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  {appointment.chiefComplaint || 'Routine medical evaluation'}
                </p>
                {appointment.notes && (
                  <div className="pt-1">
                    <span className="text-xs font-medium text-neutral-500">Instructions:</span>
                    <p className="text-xs text-neutral-600 mt-0.5">{appointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clinical' && (
            <div className="space-y-6">
              {/* Vitals Capture Section */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-700" />
                    <span>Vital Signs & Triage Observations</span>
                  </span>
                  <span className="text-xs text-neutral-500">Recorded during rooming</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-600 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="72"
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="99"
                      value={o2}
                      onChange={(e) => setO2(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 mb-1">Weight (lbs)</label>
                    <input
                      type="number"
                      placeholder="150"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span>Clinical Assessment & Subjective/Objective Notes</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record symptoms, physical examination findings, lab discussion, and clinical plan..."
                  className="w-full text-xs p-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 bg-white"
                />
              </div>

              {/* Diagnosis & Prescriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1">
                    Primary Diagnosis / ICD Summary
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Essential Hypertension (I10) or Knee Sprain"
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-900 mb-1">
                    Prescriptions / Medication Orders
                  </label>
                  <input
                    type="text"
                    value={rx}
                    onChange={(e) => setRx(e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg tid x 7d"
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-700"
                  />
                </div>
              </div>

              {/* Follow-up recommendation */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-neutral-700">
                  <CalendarClock className="w-4 h-4 text-blue-700" />
                  <span>Recommended Patient Follow-up Interval:</span>
                </div>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded text-xs font-medium"
                >
                  <option value={7}>1 Week (Acute follow-up)</option>
                  <option value={14}>2 Weeks (Post-op / lab check)</option>
                  <option value={30}>1 Month (Medication re-evaluation)</option>
                  <option value={90}>3 Months (Quarterly chronic check)</option>
                  <option value={180}>6 Months (Semi-annual)</option>
                  <option value={365}>1 Year (Annual routine)</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {isSavedMessage ? (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Changes saved to medical record
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">Saves directly into patient encounter history.</span>
                )}
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  Save Encounter Chart
                </button>
              </div>
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-6">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Automated Patient Reminders</span>
                  <span className="text-xs text-neutral-500">SMS & Email Delivery</span>
                </div>
                <p className="text-xs text-neutral-600">
                  PulseCare sends automated reminders 24 hours prior to scheduled visits. You can trigger an instant reminder or verify confirmation status.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-600" />
                        <span>SMS Notification</span>
                      </span>
                      <span className="text-xs text-neutral-500">{patient?.phone}</span>
                    </div>
                    <div className="p-2 bg-neutral-50 rounded text-xs text-neutral-600 border border-neutral-100 font-mono text-[11px]">
                      "Reminder: Appt with {practitioner?.name} on {formatDateShort(appointment.date)} at {formatTime12h(appointment.time)} ({appointment.room}). Reply C to confirm."
                    </div>
                    <button
                      onClick={() => triggerReminder('sms')}
                      className="w-full py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Instant SMS</span>
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Email Confirmation</span>
                      </span>
                      <span className="text-xs text-neutral-500 truncate max-w-[140px]">{patient?.email}</span>
                    </div>
                    <div className="p-2 bg-neutral-50 rounded text-xs text-neutral-600 border border-neutral-100 font-mono text-[11px]">
                      "Subject: PulseCare Appointment Confirmation - {formatDateShort(appointment.date)} at {formatTime12h(appointment.time)}."
                    </div>
                    <button
                      onClick={() => triggerReminder('email')}
                      className="w-full py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Email Notice</span>
                    </button>
                  </div>
                </div>

                {appointment.reminderSent && (
                  <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Last reminder dispatched on {new Date(appointment.reminderSent.timestamp).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="text-xs text-neutral-500">
            Created: {new Date(appointment.createdAt).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
