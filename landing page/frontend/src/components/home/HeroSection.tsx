import React from 'react';
import { ArrowRight } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const scrollToEvents = () => {
    const eventsElement = document.getElementById('events');
    if (eventsElement) {
      eventsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-20 bg-[#7E22CE] bg-gradient-to-r from-[#6B21A8] via-[#7E22CE] to-[#8B5CF6] text-white relative overflow-hidden shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Main Banner Content */}
          <div className="lg:col-span-8 space-y-4">

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              RTIH <span className="text-[#FACC15]">Events</span>
            </h1>

            {/* Subtitle matching screenshot format */}
            <p className="text-base sm:text-xl text-purple-100 font-medium max-w-2xl leading-relaxed">
              Join us in building the future through innovation, technology, and collaboration
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={scrollToEvents}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-[#FACC15] hover:bg-yellow-300 text-purple-950 shadow-md shadow-yellow-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Tagline Block matching reference screenshot */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3 text-right">
              <p className="text-sm sm:text-base font-semibold text-purple-100 leading-relaxed">
                Ratan Tata Innovation Hub a flagship initiative that brings to life the Hon'ble Chief Minister <strong className="text-white font-extrabold">Mr. N. Chandrababu Naidu's</strong> visionary mission of <strong className="text-white font-extrabold">"One Family, One Entrepreneur"</strong>.
              </p>
              <div className="pt-2 flex items-center justify-end gap-2 text-xs font-bold text-yellow-300">
                <span>Instant QR Check-in</span>
                <span>&bull;</span>
                <span>Real-Time Updates</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
