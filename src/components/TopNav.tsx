import React from 'react';
import { Bell } from 'lucide-react';

interface TopNavProps {
  currentTab: 'schedule' | 'queue' | 'patients' | 'analytics' | 'doctors';
  onSelectTab: (tab: 'schedule' | 'queue' | 'patients' | 'analytics' | 'doctors') => void;
  onOpenBookModal: () => void;
  onOpenReminderCenter: () => void;
  activeWaitingCount: number;
  pendingRemindersCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenBookModal,
  onOpenReminderCenter,
  activeWaitingCount,
  pendingRemindersCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('schedule')}
              className="text-left group cursor-pointer focus-visible:outline-none"
            >
              <span className="text-xl font-bold tracking-tight text-neutral-900 group-hover:text-blue-900 transition-colors whitespace-nowrap">
                PulseCare Health
              </span>
            </button>
          </div>

          {/* Zone 2: Clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => onSelectTab('schedule')}
              className={`whitespace-nowrap transition-all py-1 cursor-pointer border-b-2 font-medium tracking-tight ${
                currentTab === 'schedule'
                  ? 'border-blue-800 text-blue-950 font-semibold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              Calendar Schedule
            </button>

            <button
              onClick={() => onSelectTab('queue')}
              className={`whitespace-nowrap transition-all py-1 cursor-pointer border-b-2 flex items-center gap-1.5 font-medium tracking-tight ${
                currentTab === 'queue'
                  ? 'border-blue-800 text-blue-950 font-semibold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              <span>Live Triage Queue</span>
              {activeWaitingCount > 0 && (
                <span className="text-xs font-mono tabular-nums text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {activeWaitingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('patients')}
              className={`whitespace-nowrap transition-all py-1 cursor-pointer border-b-2 font-medium tracking-tight ${
                currentTab === 'patients'
                  ? 'border-blue-800 text-blue-950 font-semibold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              Patient Profiles
            </button>

            <button
              onClick={() => onSelectTab('analytics')}
              className={`whitespace-nowrap transition-all py-1 cursor-pointer border-b-2 font-medium tracking-tight ${
                currentTab === 'analytics'
                  ? 'border-blue-800 text-blue-950 font-semibold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              Practice Analytics
            </button>

            <button
              onClick={() => onSelectTab('doctors')}
              className={`whitespace-nowrap transition-all py-1 cursor-pointer border-b-2 font-medium tracking-tight ${
                currentTab === 'doctors'
                  ? 'border-blue-800 text-blue-950 font-semibold'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              Specialist Roster
            </button>
          </nav>

          {/* Zone 3: 1 primary action + Automated Reminders trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenReminderCenter}
              title="24h Automated Reminders Center"
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-blue-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-blue-800" />
              <span className="hidden sm:inline">24h Reminders</span>
              {pendingRemindersCount > 0 && (
                <span className="font-mono tabular-nums bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded text-[11px] font-bold">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenBookModal}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 active:bg-blue-950 transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              + Book Appointment
            </button>
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-between border-t border-neutral-100 py-2 overflow-x-auto text-xs">
          <button
            onClick={() => onSelectTab('schedule')}
            className={`px-3 py-1.5 whitespace-nowrap font-medium ${
              currentTab === 'schedule' ? 'text-blue-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => onSelectTab('queue')}
            className={`px-3 py-1.5 whitespace-nowrap font-medium ${
              currentTab === 'queue' ? 'text-blue-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            Queue ({activeWaitingCount})
          </button>
          <button
            onClick={() => onSelectTab('patients')}
            className={`px-3 py-1.5 whitespace-nowrap font-medium ${
              currentTab === 'patients' ? 'text-blue-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            Profiles
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3 py-1.5 whitespace-nowrap font-medium ${
              currentTab === 'analytics' ? 'text-blue-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('doctors')}
            className={`px-3 py-1.5 whitespace-nowrap font-medium ${
              currentTab === 'doctors' ? 'text-blue-900 font-semibold' : 'text-neutral-600'
            }`}
          >
            Specialists
          </button>
        </div>
      </div>
    </header>
  );
};
