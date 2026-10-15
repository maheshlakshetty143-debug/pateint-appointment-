import React, { useState } from 'react';
import { Appointment, Patient, Practitioner, ReminderLog, ReminderSettings } from '../types/clinical';
import { formatDateShort, formatTime12h, isEligibleFor24hReminder } from '../utils/timeHelpers';
import {
  X,
  Bell,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Play,
  Settings,
  Send,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onUpdateSettings: (settings: ReminderSettings) => void;
  logs: ReminderLog[];
  appointments: Appointment[];
  patients: Patient[];
  practitioners: Practitioner[];
  onRunAutomatedCheck: () => void;
  onSendManualReminder: (appointmentId: string, channel: 'sms' | 'email') => void;
}

export const ReminderCenterModal: React.FC<ReminderCenterModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  logs,
  appointments,
  patients,
  practitioners,
  onRunAutomatedCheck,
  onSendManualReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'logs' | 'settings'>('queue');
  const [localSettings, setLocalSettings] = useState<ReminderSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const doctorMap = new Map(practitioners.map((d) => [d.id, d]));

  // Eligible appointments within the 24-hour window
  const windowAppointments = appointments
    .filter((a) => a.status === 'scheduled' || a.status === 'confirmed')
    .map((apt) => {
      const eligibility = isEligibleFor24hReminder(apt.date, apt.time, '2026-10-14');
      return {
        appointment: apt,
        patient: patientMap.get(apt.patientId),
        doctor: doctorMap.get(apt.practitionerId),
        eligibility,
      };
    })
    .sort((a, b) => a.eligibility.hoursUntil - b.eligibility.hoursUntil);

  const eligibleCount = windowAppointments.filter(
    (w) => w.eligibility.eligible && (!w.appointment.reminderSent?.sms || !w.appointment.reminderSent?.email)
  ).length;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-neutral-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-900" />
              <span>Automated 24h Patient Reminder System</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Multi-channel automated notifications dispatched 24 hours prior to scheduled visits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'queue'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              24-Hour Dispatch Queue ({eligibleCount} Due)
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Delivery Audit Logs ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-700 text-blue-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Reminder Automation Settings
            </button>
          </div>

          <button
            onClick={onRunAutomatedCheck}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Run 24h Automation Now</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-blue-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-800" />
                  <span>
                    <strong>Automated 24h Trigger:</strong> Configured to dispatch SMS & Email 24 hours in advance.
                  </span>
                </div>
                <span className="font-mono tabular-nums text-neutral-600">
                  {eligibleCount} currently eligible
                </span>
              </div>

              <div className="space-y-3">
                {windowAppointments.map(({ appointment: apt, patient: pat, doctor: doc, eligibility }) => {
                  const hasSentSMS = apt.reminderSent?.sms;
                  const hasSentEmail = apt.reminderSent?.email;

                  return (
                    <div
                      key={apt.id}
                      className={`p-3.5 rounded-lg border text-xs transition-colors space-y-2 ${
                        eligibility.eligible
                          ? 'border-blue-200 bg-white'
                          : 'border-neutral-200 bg-neutral-50/50 text-neutral-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-900 text-sm">
                              {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                            </span>
                            <span className="font-mono tabular-nums text-neutral-500">{pat?.mrn}</span>
                            <span>·</span>
                            <span className="font-medium text-blue-900">
                              {formatDateShort(apt.date)} at {formatTime12h(apt.time)}
                            </span>
                          </div>
                          <p className="text-neutral-500 mt-0.5">
                            Dr. {doc?.name.replace(/^Dr\.\s*/i, '')} · {doc?.department} ({apt.room})
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono tabular-nums text-[11px] px-2 py-0.5 rounded font-semibold ${
                              eligibility.eligible
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {eligibility.windowLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                        <div className="flex items-center gap-4 text-neutral-600 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            {pat?.phone} {hasSentSMS ? '(SMS Sent)' : '(Pending)'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            {pat?.email} {hasSentEmail ? '(Email Sent)' : '(Pending)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onSendManualReminder(apt.id, 'sms')}
                            className="px-2.5 py-1 text-[11px] font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{hasSentSMS ? 'Resend SMS' : 'Dispatch SMS'}</span>
                          </button>
                          <button
                            onClick={() => onSendManualReminder(apt.id, 'email')}
                            className="px-2.5 py-1 text-[11px] font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{hasSentEmail ? 'Resend Email' : 'Dispatch Email'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-neutral-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                  <p className="text-xs font-semibold text-neutral-700">No reminder delivery logs yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Click "Run 24h Automation Now" to scan and dispatch notifications.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white rounded-lg border border-neutral-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {log.channel === 'sms' ? (
                            <Phone className="w-3.5 h-3.5 text-blue-700" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-indigo-700" />
                          )}
                          <span className="font-bold text-neutral-900">{log.patientName}</span>
                          <span className="text-neutral-400">({log.destination})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Delivered
                          </span>
                          <span className="text-neutral-400 font-mono tabular-nums text-[11px]">
                            {new Date(log.dispatchedAt || '').toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-600 bg-neutral-50 p-2 rounded border border-neutral-100 font-mono">
                        {log.messagePreview}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="font-bold text-neutral-900 block">General Delivery Rules</span>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-neutral-800">Auto-dispatch 24h Reminders</label>
                    <p className="text-neutral-500 text-[11px]">Automatically check and dispatch notifications in the background</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.autoDispatch24h}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, autoDispatch24h: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                  <div>
                    <label className="font-semibold text-neutral-800">Enable SMS Messaging</label>
                    <p className="text-neutral-500 text-[11px]">Send concise cellular text alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.enableSMS}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, enableSMS: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-800 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                  <div>
                    <label className="font-semibold text-neutral-800">Enable Email Delivery</label>
                    <p className="text-neutral-500 text-[11px]">Send clinical appointment confirmations with location info</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.enableEmail}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, enableEmail: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-neutral-900 block mb-1">
                    SMS Reminder Template
                  </label>
                  <textarea
                    rows={3}
                    value={localSettings.smsTemplate}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, smsTemplate: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 rounded-lg font-mono text-xs"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Available tokens: <code className="bg-neutral-100 px-1">{'{doctor_name}'}</code>, <code className="bg-neutral-100 px-1">{'{date}'}</code>, <code className="bg-neutral-100 px-1">{'{time}'}</code>, <code className="bg-neutral-100 px-1">{'{suite}'}</code>
                  </p>
                </div>

                <div>
                  <label className="font-bold text-neutral-900 block mb-1">
                    Email Reminder Template
                  </label>
                  <textarea
                    rows={5}
                    value={localSettings.emailTemplate}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, emailTemplate: e.target.value })
                    }
                    className="w-full p-2.5 border border-neutral-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                {isSaved && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Settings updated
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg cursor-pointer"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 flex justify-end bg-neutral-50/70">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
