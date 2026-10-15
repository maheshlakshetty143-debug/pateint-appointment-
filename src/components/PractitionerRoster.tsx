import React from 'react';
import { Practitioner, Appointment } from '../types/clinical';
import { Mail, Phone, MapPin, Clock, Calendar, CheckCircle, Stethoscope } from 'lucide-react';

interface PractitionerRosterProps {
  practitioners: Practitioner[];
  appointments: Appointment[];
  selectedDate: string;
  onSelectDoctorSchedule: (doctorId: string) => void;
  onBookWithDoctor: (doctorId: string) => void;
}

export const PractitionerRoster: React.FC<PractitionerRosterProps> = ({
  practitioners,
  appointments,
  selectedDate,
  onSelectDoctorSchedule,
  onBookWithDoctor,
}) => {
  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Attending Medical Staff & Specialists
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Board-certified physicians, clinical hours, assigned suites, and active daily patient loads.
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-mono tabular-nums">
          {practitioners.length} Active Practitioners
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {practitioners.map((doc) => {
          const docAppointmentsToday = appointments.filter(
            (a) => a.practitionerId === doc.id && a.date === selectedDate
          );
          const completedCount = docAppointmentsToday.filter((a) => a.status === 'completed').length;
          const pendingCount = docAppointmentsToday.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    className="w-20 h-20 rounded-xl object-cover border border-neutral-200 shrink-0 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {doc.department}
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 mt-1 truncate">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-neutral-500 truncate">{doc.title} · {doc.specialty}</p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{doc.room}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        ${doc.consultationFee} / consult
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5 text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      Clinic Hours: <strong className="font-mono tabular-nums text-neutral-900">{doc.workingHours.start} – {doc.workingHours.end}</strong> (Mon–Fri)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate">{doc.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{doc.phone}</span>
                  </div>
                </div>

                {/* Caseload stats */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                  <span className="text-neutral-500">Caseload Today:</span>
                  <div className="flex items-center gap-2 font-mono tabular-nums text-neutral-900 font-semibold">
                    <span>{docAppointmentsToday.length} Visits</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-emerald-700">{completedCount} Concluded</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-amber-800">{pendingCount} Active</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-3.5 bg-neutral-50/70 border-t border-neutral-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectDoctorSchedule(doc.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                >
                  View Schedule Matrix →
                </button>
                <button
                  onClick={() => onBookWithDoctor(doc.id)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Schedule With Specialist
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
