import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EventItem } from '../types/event';
import { EventService } from '../services/eventService';
import { Calendar, Clock, ArrowLeft, Edit3, Sparkles } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl text-center max-w-md space-y-4 border border-slate-200 shadow-sm">
          <Sparkles className="w-10 h-10 text-[#7E22CE] mx-auto opacity-50" />
          <h2 className="text-2xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            The requested event details could not be located or may have been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-[#7E22CE] text-white font-bold text-xs hover:bg-[#6B21A8] transition-colors"
          >
            Back to All Events
          </button>
        </div>
      </div>
    );
  }

  const registrationStartDisplay = event.registrationStartDate || 'TBA';
  const registrationEndDisplay = event.registrationEndDate || 'TBA';

  return (
    <div className="pt-24 sm:pt-28 pb-24 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* Back Link */}
        <div>
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#7E22CE] shadow-sm transition-all hover:border-purple-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </button>
        </div>

        {/* 1. EVENT BANNER IMAGE */}
        <div className="w-full h-64 sm:h-96 lg:h-[450px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md relative">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          {event.category && (
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-slate-900/80 text-white backdrop-blur-md shadow-sm">
                {event.category}
              </span>
            </div>
          )}
        </div>

        {/* 2. EVENT TITLE */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>

        {/* 3. EVENT DATE + REGISTRATION DATES SECTION */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">

          {/* LEFT SIDE: EVENT DATE */}
          <div className="space-y-2 p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center gap-2 text-[#7E22CE]">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">EVENT DATE</span>
            </div>
            <p className="text-slate-900 font-extrabold text-lg sm:text-xl">
              {event.formattedDate}
            </p>
            {event.venue && (
              <p className="text-slate-500 text-xs font-semibold">
                Venue: {event.venue}
              </p>
            )}
          </div>

          {/* RIGHT SIDE: REGISTRATION DATES */}
          <div className="space-y-2 p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center gap-2 text-[#7E22CE]">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">REGISTRATION PERIOD</span>
            </div>
            <div className="space-y-1 text-slate-900 font-bold text-sm sm:text-base">
              <p className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">Start:</span>
                <span className="font-extrabold text-slate-900">{registrationStartDisplay}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold text-xs uppercase">End:</span>
                <span className="font-extrabold text-slate-900">{registrationEndDisplay}</span>
              </p>
            </div>
          </div>

        </div>

        {/* 4. REGISTER NOW BUTTON */}
        <div>
          {event.status === 'completed' ? (
            <div className="w-full py-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-slate-500 font-bold text-base">
              Registration Closed
            </div>
          ) : (
            <button
              onClick={() => {
                const regUrl = EventService.getRegistrationUrl(event.id);
                window.location.href = regUrl;
              }}
              className="w-full py-4 sm:py-4.5 px-8 rounded-2xl font-extrabold text-lg sm:text-xl text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-lg shadow-purple-600/25 flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Edit3 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>REGISTER NOW</span>
            </button>
          )}
        </div>

        {/* 5. DESCRIPTION */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            About This Event
          </h2>
          <p className="text-slate-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
            {event.fullDescription || event.shortDescription}
          </p>
        </div>

      </div>
    </div>
  );
};
