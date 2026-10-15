import { Appointment } from '../types/clinical';

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateLong(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

export function timeToMinutes(time24: string): number {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(time24: string, minsToAdd: number): string {
  const totalMins = timeToMinutes(time24) + minsToAdd;
  return minutesToTime(totalMins);
}

export function checkSlotConflict(
  practitionerId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  allAppointments: Appointment[],
  excludeAppointmentId?: string
): { hasConflict: boolean; conflictingAppointment?: Appointment } {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMinutes;

  for (const apt of allAppointments) {
    if (apt.id === excludeAppointmentId) continue;
    if (apt.status === 'cancelled') continue;
    if (apt.practitionerId !== practitionerId || apt.date !== date) continue;

    const aptStart = timeToMinutes(apt.time);
    const aptEnd = aptStart + apt.durationMinutes;

    // Overlap condition: start < other.end && end > other.start
    if (startMins < aptEnd && endMins > aptStart) {
      return { hasConflict: true, conflictingAppointment: apt };
    }
  }

  return { hasConflict: false };
}

export function getWeekDays(centerDateStr: string): string[] {
  const center = parseDate(centerDateStr);
  const dayOfWeek = center.getDay(); // 0 is Sunday
  // Start week on Monday (1)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(center);
  monday.setDate(center.getDate() + mondayOffset);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(formatDateISO(d));
  }
  return days;
}

export function getMonthDays(year: number, month: number): { dateStr: string; isCurrentMonth: boolean }[] {
  // month: 0-indexed (0 = Jan, 9 = Oct)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay(); // Sunday = 0
  // Adjust so Monday is 0
  startOffset = startOffset === 0 ? 6 : startOffset - 1;

  const result: { dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    result.push({ dateStr: formatDateISO(d), isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const curr = new Date(year, month, d);
    result.push({ dateStr: formatDateISO(curr), isCurrentMonth: true });
  }

  // Next month leading days to complete full 35 or 42 grid
  const remaining = (7 - (result.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    result.push({ dateStr: formatDateISO(d), isCurrentMonth: false });
  }

  return result;
}

export function computeWaitTimeMinutes(checkedInAt?: string, consultationStartedAt?: string): number {
  if (!checkedInAt) return 0;
  const start = new Date(checkedInAt).getTime();
  const end = consultationStartedAt ? new Date(consultationStartedAt).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  return Math.floor(diffMs / (1000 * 60));
}

export function getInitials(name: string): string {
  if (!name) return 'PT';
  return name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function generateRecurringDates(
  startDateStr: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  count: number
): string[] {
  const dates: string[] = [startDateStr];
  const current = parseDate(startDateStr);

  for (let i = 1; i < count; i++) {
    if (frequency === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (frequency === 'monthly') {
      const day = current.getDate();
      current.setMonth(current.getMonth() + 1);
      // Guard against month overflow (e.g. Jan 31 -> Feb 28)
      if (current.getDate() < day) {
        current.setDate(0);
      }
    }
    dates.push(formatDateISO(new Date(current)));
  }

  return dates;
}

export function isEligibleFor24hReminder(
  dateStr: string,
  timeStr: string,
  referenceDateStr: string = '2026-10-14'
): { eligible: boolean; hoursUntil: number; windowLabel: string } {
  try {
    const aptDateTime = new Date(`${dateStr}T${timeStr || '09:00'}:00`);
    // Reference now: 2026-10-14 at 09:00 AM
    const refDateTime = new Date(`${referenceDateStr}T09:00:00`);
    const diffMs = aptDateTime.getTime() - refDateTime.getTime();
    const hoursUntil = Math.round(diffMs / (1000 * 60 * 60));

    // Eligible if within 24 to 36 hours ahead or tomorrow
    const eligible = hoursUntil >= 0 && hoursUntil <= 36;
    let windowLabel = `${hoursUntil}h away`;
    if (hoursUntil < 0) {
      windowLabel = 'Past appointment';
    } else if (hoursUntil <= 24) {
      windowLabel = `Tomorrow (${hoursUntil}h ahead - Eligible)`;
    } else if (hoursUntil <= 48) {
      windowLabel = `In 2 days (${hoursUntil}h ahead)`;
    }

    return { eligible, hoursUntil, windowLabel };
  } catch {
    return { eligible: false, hoursUntil: 999, windowLabel: 'Unknown' };
  }
}

