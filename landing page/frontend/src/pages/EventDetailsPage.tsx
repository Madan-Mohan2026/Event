import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EventItem, EventStatus } from '../types/event';
import { EventService } from '../services/eventService';
import { 
  Calendar, Clock, ArrowLeft, CheckCircle2, 
  Share2, Sparkles, Edit3, XCircle, Award 
} from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      const data = await EventService.getEventById(id);
      setEvent(data);
      setLoading(false);
    };

    fetchEvent();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'SmartEvents',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRTIHBadge = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          label: 'Registration Open',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        };
      case 'ongoing':
        return {
          label: 'Ongoing',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600" />
        };
      case 'completed':
        return {
          label: 'Registration Closed',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />
        };
      default:
        return {
          label: 'Event Announcement',
          className: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-[#7E22CE] rounded-full animate-spin"></div>
        <p className="text-slate-600 text-sm font-semibold">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-2xl text-center max-w-md space-y-4 border border-slate-200 shadow-sm">
          <Sparkles className="w-10 h-10 text-[#7E22CE] mx-auto opacity-50" />
          <h2 className="text-2xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-slate-600 text-sm">
            The requested event details could not be located.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-[#7E22CE] text-white font-semibold text-xs hover:bg-[#6B21A8]"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const badge = getRTIHBadge(event.status);

  return (
    <div className="pt-24 pb-24 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#7E22CE] shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </button>
        </div>

        {/* RTIH Detail Header Grid */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Event Graphic Poster Image */}
          <div className="lg:col-span-6 space-y-4">
            <div className="w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-slate-900/80 text-white backdrop-blur-md">
                  {event.category}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Registration CTA Buttons */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Status Pill */}
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badge.className}`}>
                {badge.icon}
                <span>{badge.label}</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {event.fullDescription}
            </p>

            {/* Two Side-by-Side Date Cards (RTIH Format) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7E22CE] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Event Date / Open Date
                </span>
                <p className="text-slate-900 font-extrabold text-base">
                  {event.formattedDate}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#7E22CE] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Event Timing / Location
                </span>
                <p className="text-slate-900 font-extrabold text-base truncate">
                  {event.time}
                </p>
              </div>
            </div>

            {/* Action Buttons Row (Register Now + Share this Event) */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              
              {/* Register Now Button */}
              {event.status === 'completed' ? (
                <div className="w-full sm:flex-1 py-3.5 rounded-xl bg-slate-100 text-center text-slate-500 font-bold text-sm">
                  Registration Closed
                </div>
              ) : (
                <button
                  onClick={() => {
                    const regUrl = EventService.getRegistrationUrl(event.id);
                    window.location.href = regUrl;
                  }}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-extrabold text-base text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Register Now</span>
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-bold text-sm text-[#7E22CE] bg-white border border-purple-200 hover:bg-purple-50 flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Link Copied!' : 'Share this Event'}</span>
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
