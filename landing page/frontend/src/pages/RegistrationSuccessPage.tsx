import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RegistrationResult } from '../types/event';
import { EventService } from '../services/eventService';
import { DigitalTicketPass } from '../components/registration/DigitalTicketPass';
import { CheckCircle2, Home, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegistrationSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistration = async () => {
      if (!id) return;
      setLoading(true);
      const res = await EventService.getRegistrationById(id);
      setRegistration(res);
      setLoading(false);
    };

    fetchRegistration();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-[#7E22CE] rounded-full animate-spin"></div>
        <p className="text-slate-600 text-sm font-semibold">Retrieving registration details...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="bg-white p-10 rounded-2xl text-center max-w-md space-y-4 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Registration Record Not Found</h2>
          <button
            onClick={() => navigate('/events')}
            className="px-5 py-2.5 rounded-xl bg-[#7E22CE] text-white font-semibold text-xs hover:bg-[#6B21A8]"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 max-w-xl mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Registration Confirmed!
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Your registration for <strong className="text-[#7E22CE]">{registration.eventTitle}</strong> is successful. Save or present your digital pass at venue kiosks.
          </p>
        </motion.div>

        {/* Pass */}
        <DigitalTicketPass registration={registration} />

        {/* Footer buttons */}
        <div className="pt-4 flex items-center justify-center gap-4 text-xs font-bold print:hidden">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#7E22CE] shadow-sm flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <button
            onClick={() => navigate('/events')}
            className="px-5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[#7E22CE] hover:bg-[#7E22CE] hover:text-white transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Explore More Events</span>
          </button>
        </div>

      </div>
    </div>
  );
};
