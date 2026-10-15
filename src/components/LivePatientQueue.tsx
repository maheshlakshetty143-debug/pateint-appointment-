import React, { useMemo } from 'react';
import { Appointment, Patient, Practitioner, AppointmentStatus } from '../types/clinical';
import {
  formatTime12h,
  computeWaitTimeMinutes,
  formatDateLong,
} from '../utils/timeHelpers';
import { StatusIndicator, getVisitTypeLabel } from './StatusIndicator';
import {
  Clock,
  UserCheck,
  Stethoscope,
  DoorOpen,
  ArrowRight,
  Activity,
  AlertCircle,
  Phone,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface LivePatientQueueProps {
  appointments: Appointment[];
  patients: Patient[];
  practitioners: Practitioner[];
  selectedDate: string;
  onSelectAppointment: (appointment: Appointment) => void;
  onUpdateStatus: (appointmentId: string, newStatus: AppointmentStatus, additionalData?: Partial<Appointment>) => void;
  onOpenBookModal: (date?: string) => void;
}

export const LivePatientQueue: React.FC<LivePatientQueueProps> = ({
  appointments,
  patients,
  practitioners,
  selectedDate,
  onSelectAppointment,
  onUpdateStatus,
  onOpenBookModal,
}) => {
  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const doctorMap = useMemo(() => new Map(practitioners.map((d) => [d.id, d])), [practitioners]);

  // Today's appointments
  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  // Breakdowns
  const inConsultation = useMemo(
    () => todayAppointments.filter((a) => a.status === 'in_consultation'),
    [todayAppointments]
  );

  const waitingRoom = useMemo(
    () => todayAppointments.filter((a) => a.status === 'checked_in'),
    [todayAppointments]
  );

  const upcomingScheduled = useMemo(
    () => todayAppointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed'),
    [todayAppointments]
  );

  const completedToday = useMemo(
    () => todayAppointments.filter((a) => a.status === 'completed'),
    [todayAppointments]
  );

  // Average wait time computation
  const avgWaitMins = useMemo(() => {
    const checkedInList = todayAppointments.filter((a) => a.checkedInAt);
    if (checkedInList.length === 0) return 0;
    const total = checkedInList.reduce(
      (acc, a) => acc + computeWaitTimeMinutes(a.checkedInAt, a.consultationStartedAt),
      0
    );
    return Math.round(total / checkedInList.length);
  }, [todayAppointments]);

  // Suites status
  const suites = useMemo(() => {
    return practitioners.map((doc) => {
      const activeApt = inConsultation.find((a) => a.practitionerId === doc.id);
      const pat = activeApt ? patientMap.get(activeApt.patientId) : null;
      return {
        room: doc.room,
        doctor: doc,
        isOccupied: Boolean(activeApt),
        activeApt,
        patientName: pat ? `${pat.firstName} ${pat.lastName}` : null,
      };
    });
  }, [practitioners, inConsultation, patientMap]);

  return (
    <div className="space-y-6">
      {/* Clinic Operations Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Patients In Waiting Room
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-800">
              {waitingRoom.length}
            </span>
            <span className="text-xs text-neutral-500">Awaiting Triage</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            In Exam Consultation
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-800">
              {inConsultation.length}
            </span>
            <span className="text-xs text-neutral-500">Active Suites</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Average Wait Time
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {avgWaitMins} <span className="text-sm font-sans font-normal text-neutral-500">mins</span>
            </span>
            <span className="text-xs text-neutral-500">Door-to-Exam</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            Completed Today
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-900">
              {completedToday.length}
            </span>
            <span className="text-xs text-neutral-500">of {todayAppointments.length} Booked</span>
          </div>
        </div>
      </div>

      {/* Care Suite Occupancy Status Strip */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <DoorOpen className="w-4 h-4 text-neutral-500" />
            <span>Clinical Suite & Exam Room Status</span>
          </h3>
          <span className="text-xs text-neutral-500">Live Practice Footprint</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {suites.map((s) => (
            <div
              key={s.room}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                s.isOccupied
                  ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                  : 'border-neutral-200 bg-neutral-50/50 text-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>{s.room}</span>
                <span className={`text-[11px] font-medium ${s.isOccupied ? 'text-emerald-800' : 'text-neutral-500'}`}>
                  {s.isOccupied ? 'In Consultation' : 'Available'}
                </span>
              </div>
              <p className="text-neutral-600 mt-1 truncate">{s.doctor.name}</p>
              {s.isOccupied && s.patientName && (
                <p className="text-[11px] text-emerald-800 font-medium truncate mt-0.5">
                  With {s.patientName}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Triage Queues Grid: Waiting Room vs Upcoming Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Room Queue */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-neutral-200 bg-amber-50/40 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>Waiting Room Queue ({waitingRoom.length})</span>
              </h3>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Patients present at front desk ready for rooming
              </p>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {waitingRoom.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <UserCheck className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-700">Waiting room is clear</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Check-in upcoming patients below as they arrive.
                </p>
              </div>
            ) : (
              waitingRoom.map((apt) => {
                const pat = patientMap.get(apt.patientId);
                const doc = doctorMap.get(apt.practitionerId);
                const waitTime = computeWaitTimeMinutes(apt.checkedInAt);

                return (
                  <div
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/20 hover:bg-amber-50/50 transition-colors cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">
                            {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-neutral-500">
                            {pat?.mrn}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5">
                          Appointment: {formatTime12h(apt.time)} · Dr. {doc?.name.replace(/^Dr\.\s*/i, '')} ({apt.room})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono tabular-nums font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {waitTime}m wait
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-700 bg-white p-2 rounded border border-amber-100">
                      <span className="font-medium text-neutral-900">Reason:</span> {apt.chiefComplaint}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-neutral-500">
                        {apt.vitals?.bloodPressure ? (
                          <span className="text-emerald-700 font-medium">Vitals recorded ({apt.vitals.bloodPressure})</span>
                        ) : (
                          <span className="text-neutral-500">Awaiting vitals triage</span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(apt.id, 'in_consultation', {
                            consultationStartedAt: new Date().toISOString(),
                          });
                        }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <span>Call to Room</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Arrivals Queue */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <span>Upcoming Scheduled Today ({upcomingScheduled.length})</span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Patients expected for consultation later today
              </p>
            </div>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {upcomingScheduled.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <CheckCircle2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-700">No further arrivals pending</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  All scheduled patients have been checked in or completed.
                </p>
              </div>
            ) : (
              upcomingScheduled.map((apt) => {
                const pat = patientMap.get(apt.patientId);
                const doc = doctorMap.get(apt.practitionerId);

                return (
                  <div
                    key={apt.id}
                    onClick={() => onSelectAppointment(apt)}
                    className="p-3.5 rounded-lg border border-neutral-200 hover:border-blue-400 transition-colors cursor-pointer space-y-2 bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900">
                            {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-neutral-500">
                            {pat?.mrn}
                          </span>
                          <span>·</span>
                          <StatusIndicator status={apt.status} />
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5">
                          Scheduled: <strong className="font-mono tabular-nums text-neutral-900">{formatTime12h(apt.time)}</strong> · {doc?.name} ({apt.room})
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateStatus(apt.id, 'checked_in', {
                            checkedInAt: new Date().toISOString(),
                          });
                        }}
                        className="px-3 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        Check In
                      </button>
                    </div>

                    <p className="text-xs text-neutral-600 line-clamp-1">
                      {apt.chiefComplaint}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                      <span>{getVisitTypeLabel(apt.visitType)}</span>
                      <span>{pat?.phone}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
