import React from 'react';
import { AppointmentStatus } from '../types/clinical';

interface StatusIndicatorProps {
  status: AppointmentStatus;
  showIcon?: boolean;
}

export const getStatusConfig = (status: AppointmentStatus) => {
  switch (status) {
    case 'scheduled':
      return {
        label: 'Scheduled',
        textColor: 'text-neutral-600',
        dotColor: 'bg-neutral-400',
        badgeBg: 'bg-neutral-50 border-neutral-200',
      };
    case 'confirmed':
      return {
        label: 'Confirmed',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-600',
        badgeBg: 'bg-blue-50 border-blue-200',
      };
    case 'checked_in':
      return {
        label: 'Checked In',
        textColor: 'text-amber-800',
        dotColor: 'bg-amber-600',
        badgeBg: 'bg-amber-50 border-amber-200',
      };
    case 'in_consultation':
      return {
        label: 'In Consultation',
        textColor: 'text-emerald-800',
        dotColor: 'bg-emerald-600',
        badgeBg: 'bg-emerald-50 border-emerald-200',
      };
    case 'completed':
      return {
        label: 'Completed',
        textColor: 'text-neutral-600',
        dotColor: 'bg-neutral-500',
        badgeBg: 'bg-neutral-50 border-neutral-200',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        textColor: 'text-rose-700',
        dotColor: 'bg-rose-500',
        badgeBg: 'bg-rose-50 border-rose-200',
      };
    case 'no_show':
      return {
        label: 'No Show',
        textColor: 'text-rose-900',
        dotColor: 'bg-rose-700',
        badgeBg: 'bg-rose-50 border-rose-300',
      };
    default:
      return {
        label: status,
        textColor: 'text-neutral-600',
        dotColor: 'bg-neutral-400',
        badgeBg: 'bg-neutral-50 border-neutral-200',
      };
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const cfg = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const getVisitTypeLabel = (type: string): string => {
  switch (type) {
    case 'new_patient':
      return 'New Patient Intake';
    case 'follow_up':
      return 'Clinical Follow-up';
    case 'urgent_care':
      return 'Urgent Triage';
    case 'routine_checkup':
      return 'Routine Exam';
    case 'lab_review':
      return 'Diagnostic / Lab Review';
    case 'telehealth':
      return 'Telehealth Video';
    case 'procedure':
      return 'Minor Procedure';
    default:
      return type;
  }
};
