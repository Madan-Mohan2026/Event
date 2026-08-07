import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EventService } from '../services/eventService';

export const RegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      window.location.href = EventService.getRegistrationUrl(id);
    }
  }, [id]);

  return (
    <div className="min-h-screen pt-32 pb-24 bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-[#7E22CE] rounded-full animate-spin"></div>
      <p className="text-slate-600 text-sm font-semibold">Redirecting to event registration portal...</p>
    </div>
  );
};
