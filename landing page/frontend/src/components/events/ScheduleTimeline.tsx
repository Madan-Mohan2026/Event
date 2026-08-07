import React from 'react';
import type { ScheduleItem } from '../../types/event';
import { Clock, MapPin, User } from 'lucide-react';

interface ScheduleTimelineProps {
  schedule: ScheduleItem[];
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({ schedule }) => {
  if (!schedule || schedule.length === 0) {
    return <p className="text-slate-400 text-sm">Schedule details will be updated shortly.</p>;
  }

  return (
    <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-8 my-4">
      {schedule.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Timeline Dot Node */}
          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-[#0B0F19] border-2 border-indigo-400 group-hover:bg-indigo-500 group-hover:scale-125 transition-all duration-300"></div>

          <div className="glass-card p-5 sm:p-6 rounded-2xl border border-slate-800/80 group-hover:border-indigo-500/40 space-y-2">
            
            {/* Time & Room header */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                <Clock className="w-3.5 h-3.5" />
                <span>{item.time}</span>
              </div>

              {item.room && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{item.room}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors pt-1">
              {item.title}
            </h4>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed">
              {item.description}
            </p>

            {/* Speaker info if available */}
            {item.speakerName && (
              <div className="pt-2 flex items-center gap-2 text-xs font-medium text-indigo-400">
                <User className="w-3.5 h-3.5" />
                <span>Speaker: {item.speakerName}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
