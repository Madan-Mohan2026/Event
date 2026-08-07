import React from 'react';
import type { RegistrationResult } from '../../types/event';
import { Calendar, MapPin, Download, CheckCircle2, User, Building2, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface DigitalTicketPassProps {
  registration: RegistrationResult;
}

export const DigitalTicketPass: React.FC<DigitalTicketPassProps> = ({ registration }) => {
  const handleDownloadPass = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl mx-auto space-y-6"
    >
      {/* Ticket Container */}
      <div
        id="digital-ticket-pass"
        className="bg-white rounded-3xl border-2 border-purple-200 overflow-hidden shadow-xl relative"
      >
        {/* Top Purple Accent Bar */}
        <div className="h-3 bg-gradient-to-r from-[#6B21A8] via-[#7E22CE] to-[#8B5CF6]"></div>

        {/* Ticket Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmed Pass</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
              {registration.eventTitle}
            </h3>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7E22CE] shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Ticket Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* QR Code Block & Reg ID */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-left">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-100 shrink-0">
              <img
                src={registration.qrCodeUrl}
                alt="Ticket QR Pass"
                className="w-32 h-32 object-contain"
              />
            </div>

            <div className="space-y-1.5 flex-1">
              <span className="text-[11px] uppercase font-bold tracking-widest text-slate-500">
                Contactless Entry Badge
              </span>
              <div className="text-2xl font-mono font-black text-[#7E22CE] tracking-wider">
                {registration.registrationId}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Scan this dynamic QR pass at venue kiosks for fast-track entry and badge printing.
              </p>
            </div>
          </div>

          {/* Attendee Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <User className="w-3 h-3 text-[#7E22CE]" /> Delegate Name
              </span>
              <p className="text-slate-900 font-bold text-sm truncate">
                {registration.attendee.fullName}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#7E22CE]" /> Organization
              </span>
              <p className="text-slate-900 font-bold text-sm truncate">
                {registration.attendee.organization}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#7E22CE]" /> Date & Time
              </span>
              <p className="text-slate-900 font-bold text-xs truncate">
                {registration.eventDate}
              </p>
              <p className="text-slate-500 text-[11px]">
                {registration.eventTime}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7E22CE]" /> Venue Location
              </span>
              <p className="text-slate-900 font-bold text-xs truncate">
                {registration.eventVenue}
              </p>
            </div>
          </div>

        </div>

        {/* Ticket Perforated Divider */}
        <div className="relative flex items-center justify-between px-4">
          <div className="w-5 h-10 rounded-r-full bg-[#F8FAFC] -ml-4 border-r border-t border-b border-slate-200"></div>
          <div className="border-b-2 border-dashed border-slate-300 w-full"></div>
          <div className="w-5 h-10 rounded-l-full bg-[#F8FAFC] -mr-4 border-l border-t border-b border-slate-200"></div>
        </div>

        {/* Pass Footer */}
        <div className="p-6 bg-slate-50 text-center text-xs text-slate-500 font-semibold flex items-center justify-between">
          <span>Registered: {new Date(registration.registeredAt).toLocaleDateString()}</span>
          <span className="font-bold text-[#7E22CE]">SmartEvents Pass</span>
        </div>

      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-2 print:hidden">
        <button
          onClick={handleDownloadPass}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-lg shadow-purple-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Save / Print Ticket Pass</span>
        </button>
      </div>
    </motion.div>
  );
};
