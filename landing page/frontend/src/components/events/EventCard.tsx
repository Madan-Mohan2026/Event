import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, CheckCircle2, Clock, XCircle, Award } from 'lucide-react';
import type { EventItem, EventStatus } from '../../types/event';
import { getEventStatus, getRegistrationStatus } from '../../utils/eventStatus';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: EventItem;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  const currentEventStatus = getEventStatus(event);
  const currentRegStatus = getRegistrationStatus(event);

  const getEventBadgeConfig = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          label: 'UPCOMING',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />
        };
      case 'ongoing':
        return {
          label: 'ONGOING',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'completed':
        return {
          label: 'COMPLETED',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <XCircle className="w-3.5 h-3.5 text-slate-600" />
        };
      default:
        return {
          label: 'UPCOMING',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />
        };
    }
  };

  const badge = getEventBadgeConfig(currentEventStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="rtih-card group cursor-pointer flex flex-col justify-between p-5 space-y-4"
    >
      {/* Top Banner Image with Badges */}
      <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-900 border border-slate-100 flex items-center justify-center">
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="p-4 text-center">
            <span className="text-lg font-extrabold text-purple-200/70 tracking-wider uppercase">{event.category || 'EVENT'}</span>
          </div>
        )}

        {/* Status Pill Badges Floating on Top Right */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm backdrop-blur-md ${badge.className}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
          {currentRegStatus.code === 'not_open' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-amber-500/90 text-white border-amber-400 shadow-sm backdrop-blur-md">
              Not Yet Open
            </span>
          )}
          {currentRegStatus.code === 'open' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-500/90 text-white border-emerald-400 shadow-sm backdrop-blur-md flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-white" />
              <span>Reg. Open</span>
            </span>
          )}
          {currentRegStatus.code === 'closed' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-rose-500/90 text-white border-rose-400 shadow-sm backdrop-blur-md">
              Reg. Closed
            </span>
          )}
        </div>

        {/* Category Pill Floating on Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/75 text-white backdrop-blur-md shadow-sm">
            {event.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#7E22CE] transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>

          {/* Summary */}
          <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {event.summary || event.shortDescription || ''}
          </p>
        </div>

        {/* Metadata Row: Date & Venue */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7E22CE] shrink-0" />
            <span>{event.formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        {/* Full-width "Know More ->" Action Button (RTIH Style) */}
        <div className="pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all group-hover:shadow-lg group-hover:shadow-purple-600/30"
          >
            <span>Know More</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
