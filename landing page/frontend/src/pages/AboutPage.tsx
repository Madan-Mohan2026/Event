import React from 'react';
import { AboutSection } from '../components/home/AboutSection';
import { ShieldCheck, QrCode, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-28 pb-24 bg-[#0B0F19] min-h-screen">
      
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30">
            About Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Powering Next-Generation <span className="text-gradient-cyan">Global Events</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            SmartReg provides the digital infrastructure for conferences, AI summits, startup expos, and government forums worldwide. We connect event organizers with attendees through intelligent, contactless registration workflows.
          </p>
        </div>

        {/* Mission Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Global Reach</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Scale registrations effortlessly across international markets with real-time capacity management and instant digital pass delivery.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Sub-Second QR Entry</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Eliminate venue queue bottlenecks with high-throughput QR kiosk scanning and automated delegate badge verification.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Enterprise Privacy</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              End-to-end security compliance, encrypted data handling, and zero unauthorized data sharing for all global summits.
            </p>
          </div>
        </div>

        {/* Embedded Feature Cards */}
        <AboutSection />

        {/* Call to Action Banner */}
        <div className="glass-panel p-10 sm:p-14 rounded-3xl border-2 border-indigo-500/30 text-center space-y-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to Explore Upcoming Events?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto">
            Discover leading technology summits, startup pitch sessions, and executive masterclasses hosted on SmartReg.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-xl shadow-indigo-600/30 transition-all"
          >
            <span>Browse All Events</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
