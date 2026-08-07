import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EventStatus } from '../types/event';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusBadgeStyle(status: EventStatus) {
  switch (status) {
    case 'upcoming':
      return {
        label: 'Upcoming',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400 animate-pulse'
      };
    case 'ongoing':
      return {
        label: 'Live Now',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400 animate-ping'
      };
    case 'completed':
      return {
        label: 'Concluded',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-500'
      };
    default:
      return {
        label: status,
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        dot: 'bg-indigo-400'
      };
  }
}
