import React, { useState, useMemo } from 'react';
import { Appointment, Patient, Practitioner, AppointmentStatus } from '../types/clinical';
import {
  formatDateLong,
  formatDateShort,
  formatTime12h,
  getWeekDays,
  getMonthDays,
  parseDate,
  formatDateISO,
  timeToMinutes,
  addMinutesToTime,
} from '../utils/timeHelpers';
import { StatusIndicator, getVisitTypeLabel } from './StatusIndicator';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Search,
  Download,
  Plus,
  Clock,
  User,
  MapPin,
  Stethoscope,
  Repeat,
} from 'lucide-react';

interface ScheduleViewProps {
  appointments: Appointment[];
  patients: Patient[];
  practitioners: Practitioner[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
  onOpenBookModal: (date?: string, time?: string, doctorId?: string) => void;
  onExportCSV: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  patients,
  practitioners,
  selectedDate,
  onSelectDate,
  onSelectAppointment,
  onOpenBookModal,
  onExportCSV,
}) => {
  const [subView, setSubView] = useState<'day' | 'week' | 'month' | 'agenda'>('day');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const doctorMap = useMemo(() => new Map(practitioners.map((d) => [d.id, d])), [practitioners]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    practitioners.forEach((d) => set.add(d.department));
    return Array.from(set);
  }, [practitioners]);

  // Date navigation helpers
  const handlePrev = () => {
    const current = parseDate(selectedDate);
    if (subView === 'day' || subView === 'agenda') {
      current.setDate(current.getDate() - 1);
    } else if (subView === 'week') {
      current.setDate(current.getDate() - 7);
    } else if (subView === 'month') {
      current.setMonth(current.getMonth() - 1);
    }
    onSelectDate(formatDateISO(current));
  };

  const handleNext = () => {
    const current = parseDate(selectedDate);
    if (subView === 'day' || subView === 'agenda') {
      current.setDate(current.getDate() + 1);
    } else if (subView === 'week') {
      current.setDate(current.getDate() + 7);
    } else if (subView === 'month') {
      current.setMonth(current.getMonth() + 1);
    }
    onSelectDate(formatDateISO(current));
  };

  const handleToday = () => {
    onSelectDate('2026-10-14');
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedDoctorId !== 'all' && apt.practitionerId !== selectedDoctorId) return false;
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;

      if (selectedDepartment !== 'all') {
        const doc = doctorMap.get(apt.practitionerId);
        if (doc?.department !== selectedDepartment) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pat = patientMap.get(apt.patientId);
        const doc = doctorMap.get(apt.practitionerId);
        const patName = pat ? `${pat.firstName} ${pat.lastName}`.toLowerCase() : '';
        const mrn = pat?.mrn.toLowerCase() || '';
        const docName = doc?.name.toLowerCase() || '';
        const complaint = (apt.chiefComplaint || '').toLowerCase();

        if (
          !patName.includes(q) &&
          !mrn.includes(q) &&
          !docName.includes(q) &&
          !complaint.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [appointments, selectedDoctorId, selectedStatus, selectedDepartment, searchQuery, patientMap, doctorMap]);

  // Day view appointments
  const dayAppointments = useMemo(() => {
    return filteredAppointments.filter((a) => a.date === selectedDate);
  }, [filteredAppointments, selectedDate]);

  // Week view dates
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Month days
  const currentParsedDate = parseDate(selectedDate);
  const monthDays = useMemo(
    () => getMonthDays(currentParsedDate.getFullYear(), currentParsedDate.getMonth()),
    [currentParsedDate]
  );

  // Hour slots for day schedule (8am to 5pm)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  // Active doctors list to show as columns in Day View
  const displayDoctors = useMemo(() => {
    if (selectedDoctorId !== 'all') {
      return practitioners.filter((d) => d.id === selectedDoctorId);
    }
    return practitioners;
  }, [practitioners, selectedDoctorId]);

  return (
    <div className="space-y-4">
      {/* Top Workspace Toolbar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: View Modes & Date Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-view switcher */}
            <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
              {(['day', 'week', 'month', 'agenda'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setSubView(view)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    subView === view
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pl-2">
              <span className="text-sm font-bold text-neutral-900">
                {formatDateLong(selectedDate)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                className="text-xs border border-neutral-200 rounded px-2 py-1 text-neutral-700 font-mono tabular-nums bg-neutral-50"
              />
            </div>
          </div>

          {/* Right: Quick Actions & CSV Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => onOpenBookModal(selectedDate)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Booking</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, MRN, complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-neutral-200 rounded-lg bg-neutral-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
              />
            </div>

            {/* Doctor filter */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 font-medium"
            >
              <option value="all">All Practitioners ({practitioners.length})</option>
              {practitioners.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>

            {/* Department filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white text-neutral-700 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* Quick Metrics Unboxed */}
          <div className="flex items-center gap-3 text-neutral-600 font-medium">
            <span>
              Today: <strong className="font-mono tabular-nums text-neutral-900">{dayAppointments.length}</strong> visits
            </span>
            <span>·</span>
            <span>
              Checked In: <strong className="font-mono tabular-nums text-amber-800">
                {dayAppointments.filter((a) => a.status === 'checked_in').length}
              </strong>
            </span>
            <span>·</span>
            <span>
              Completed: <strong className="font-mono tabular-nums text-emerald-800">
                {dayAppointments.filter((a) => a.status === 'completed').length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main View Render */}
      {subView === 'day' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          {/* Header Row: Doctor Columns */}
          <div className="grid border-b border-neutral-200 bg-neutral-50/70" style={{ gridTemplateColumns: `80px repeat(${displayDoctors.length}, minmax(220px, 1fr))` }}>
            <div className="p-3 text-xs font-semibold text-neutral-500 border-r border-neutral-200 text-center">
              Time
            </div>
            {displayDoctors.map((doc) => (
              <div key={doc.id} className="p-3 border-r border-neutral-200 last:border-r-0">
                <div className="flex items-center gap-2">
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-neutral-900 truncate">{doc.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{doc.department} · {doc.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Hourly Timeline Grid */}
          <div className="divide-y divide-neutral-100">
            {hours.map((hour) => {
              const hourStr = String(hour).padStart(2, '0') + ':00';
              const displayHour = formatTime12h(hourStr);

              return (
                <div
                  key={hour}
                  className="grid min-h-[90px]"
                  style={{ gridTemplateColumns: `80px repeat(${displayDoctors.length}, minmax(220px, 1fr))` }}
                >
                  {/* Time label */}
                  <div className="p-2 border-r border-neutral-200 bg-neutral-50/30 text-[11px] font-mono tabular-nums text-neutral-500 text-center">
                    {displayHour}
                  </div>

                  {/* Doctor slot cells */}
                  {displayDoctors.map((doc) => {
                    // Find appointments matching this doctor, selected date, and within this hour block
                    const slotAppointments = dayAppointments.filter((apt) => {
                      if (apt.practitionerId !== doc.id) return false;
                      const aptMins = timeToMinutes(apt.time);
                      const hourStartMins = hour * 60;
                      const hourEndMins = (hour + 1) * 60;
                      return aptMins >= hourStartMins && aptMins < hourEndMins;
                    });

                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          if (slotAppointments.length === 0) {
                            onOpenBookModal(selectedDate, hourStr, doc.id);
                          }
                        }}
                        className={`p-1.5 border-r border-neutral-100 last:border-r-0 relative group transition-colors ${
                          slotAppointments.length === 0 ? 'hover:bg-blue-50/20 cursor-pointer' : ''
                        }`}
                      >
                        {slotAppointments.length === 0 ? (
                          <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[11px] font-medium text-blue-700 flex items-center gap-1 bg-white px-2 py-1 rounded border border-blue-200 shadow-xs">
                              <Plus className="w-3 h-3" /> Book {displayHour}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {slotAppointments.map((apt) => {
                              const pat = patientMap.get(apt.patientId);
                              return (
                                <div
                                  key={apt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAppointment(apt);
                                  }}
                                  className="p-2.5 rounded-lg border border-neutral-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-neutral-900 truncate">
                                      {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                                    </span>
                                    <span className="text-[11px] font-mono tabular-nums text-neutral-500 whitespace-nowrap">
                                      {formatTime12h(apt.time)}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-neutral-600 line-clamp-1">
                                    {apt.chiefComplaint}
                                  </p>

                                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      <StatusIndicator status={apt.status} />
                                      {apt.isRecurring && (
                                        <span title={`Recurring (${apt.recurrence?.frequency || 'series'})`} className="text-blue-800">
                                          <Repeat className="w-2.5 h-2.5" />
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-neutral-400 font-mono tabular-nums">
                                      {apt.durationMinutes}m
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {subView === 'week' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/70">
            {weekDays.map((dateStr) => {
              const isToday = dateStr === '2026-10-14';
              const isSelected = dateStr === selectedDate;
              const count = appointments.filter((a) => a.date === dateStr).length;

              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`p-3 text-center border-r border-neutral-200 last:border-r-0 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-neutral-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-neutral-500 uppercase">
                    {parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                    isToday ? 'text-blue-900' : 'text-neutral-900'
                  }`}>
                    {parseDate(dateStr).getDate()}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {count} {count === 1 ? 'visit' : 'visits'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Week columns content */}
          <div className="grid grid-cols-7 min-h-[420px] divide-x divide-neutral-200">
            {weekDays.map((dateStr) => {
              const dayApts = filteredAppointments
                .filter((a) => a.date === dateStr)
                .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

              return (
                <div key={dateStr} className="p-2 space-y-2 bg-neutral-50/20">
                  {dayApts.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4">
                      <button
                        onClick={() => onOpenBookModal(dateStr, '09:00')}
                        className="text-[11px] text-neutral-400 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        + Book
                      </button>
                    </div>
                  ) : (
                    dayApts.map((apt) => {
                      const pat = patientMap.get(apt.patientId);
                      const doc = doctorMap.get(apt.practitionerId);
                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className="p-2 rounded-lg border border-neutral-200 bg-white hover:border-blue-400 transition-all cursor-pointer space-y-1 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono tabular-nums font-semibold text-neutral-900 flex items-center gap-1">
                              {formatTime12h(apt.time)}
                              {apt.isRecurring && (
                                <Repeat className="w-2.5 h-2.5 text-blue-800" />
                              )}
                            </span>
                            <StatusIndicator status={apt.status} />
                          </div>
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                          </p>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {doc?.name}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {subView === 'month' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-600 text-center py-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-200">
            {monthDays.map(({ dateStr, isCurrentMonth }) => {
              const dayApts = appointments.filter((a) => a.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === '2026-10-14';

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    onSelectDate(dateStr);
                    setSubView('day');
                  }}
                  className={`min-h-[100px] p-2 transition-colors cursor-pointer ${
                    !isCurrentMonth ? 'bg-neutral-50/40 text-neutral-400' : 'bg-white'
                  } ${isSelected ? 'ring-2 ring-blue-700 ring-inset' : 'hover:bg-neutral-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono tabular-nums ${
                      isToday ? 'font-bold text-blue-900 bg-blue-50 px-1 rounded' : 'text-neutral-700'
                    }`}>
                      {parseDate(dateStr).getDate()}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] text-neutral-500 font-mono tabular-nums">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {dayApts.slice(0, 2).map((apt) => {
                      const pat = patientMap.get(apt.patientId);
                      return (
                        <div
                          key={apt.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 truncate"
                        >
                          {formatTime12h(apt.time)} {pat?.lastName}
                        </div>
                      );
                    })}
                    {dayApts.length > 2 && (
                      <div className="text-[10px] text-neutral-500 font-medium pl-1">
                        +{dayApts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda / List View */}
      {subView === 'agenda' && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-900">
              Appointments for {formatDateLong(selectedDate)}
            </h3>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              {dayAppointments.length} Total Encounters
            </span>
          </div>

          {dayAppointments.length === 0 ? (
            <div className="p-12 text-center text-neutral-500">
              <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700">No appointments scheduled for this date</p>
              <p className="text-xs text-neutral-500 mt-1">
                Click "+ New Booking" or switch dates to view records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-semibold">
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Patient & MRN</th>
                    <th className="py-2.5 px-4">Practitioner</th>
                    <th className="py-2.5 px-4">Type & Suite</th>
                    <th className="py-2.5 px-4">Chief Complaint</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {dayAppointments
                    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
                    .map((apt) => {
                      const pat = patientMap.get(apt.patientId);
                      const doc = doctorMap.get(apt.practitionerId);

                      return (
                        <tr
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className="hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-mono tabular-nums font-semibold text-neutral-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{formatTime12h(apt.time)} ({apt.durationMinutes}m)</span>
                              {apt.isRecurring && (
                                <span title={`Recurring: ${apt.recurrence?.frequency || 'series'}`} className="text-blue-800">
                                  <Repeat className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <p className="font-bold text-neutral-900">
                              {pat ? `${pat.firstName} ${pat.lastName}` : 'Unknown Patient'}
                            </p>
                            <p className="text-[11px] font-mono tabular-nums text-neutral-500">
                              {pat?.mrn} · {pat?.phone}
                            </p>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-medium text-neutral-900">{doc?.name}</p>
                            <p className="text-[11px] text-neutral-500">{doc?.department}</p>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="text-neutral-800">{getVisitTypeLabel(apt.visitType)}</p>
                            <p className="text-[11px] text-neutral-500">{apt.room}</p>
                          </td>

                          <td className="py-3 px-4 max-w-xs truncate text-neutral-700">
                            {apt.chiefComplaint}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusIndicator status={apt.status} />
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAppointment(apt);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              Open Chart →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
