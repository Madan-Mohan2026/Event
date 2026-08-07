import React from 'react';
import { UserCheck, ShieldCheck, QrCode, Zap, LayoutDashboard, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLATFORM_FEATURES } from '../../data/dummyEvents';

export const AboutSection: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-6 h-6 text-[#7E22CE]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
      case 'QrCode':
        return <QrCode className="w-6 h-6 text-blue-600" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-6 h-6 text-purple-600" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-rose-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-[#7E22CE]" />;
    }
  };

  const eventTypes = [
    'Conferences & Tech Summits',
    'Startup Meetups & Pitching',
    'Government & Civic Forums',
    'Workshops & Masterclasses',
    'Women Entrepreneurship Expos',
    'Green Energy & CleanTech Expos'
  ];

  return (
    <section id="about-section" className="py-16 sm:py-20 bg-white border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#7E22CE] bg-purple-50 border border-purple-200">
            About SmartEvents
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed for Modern, High-Impact Events
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            SmartEvents is a smart event registration platform built to streamline event lifecycles. From initial ticket registration to contactless venue entry, we power global conferences, summits, workshops, expos, startup meetups, and technology forums.
          </p>
        </div>

        {/* Event Types Pills */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12 max-w-4xl mx-auto">
          {eventTypes.map((type, idx) => (
            <div
              key={idx}
              className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#7E22CE]"></span>
              {type}
            </div>
          ))}
        </div>

        {/* Feature Cards Grid (6 cards matching RTIH design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORM_FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rtih-card p-6 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:bg-[#7E22CE] group-hover:text-white transition-colors duration-200">
                  {getIcon(feature.iconName)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#7E22CE] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-semibold text-[#7E22CE]">
                <span>Enterprise Feature</span>
                <span className="w-2 h-2 rounded-full bg-[#7E22CE]"></span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
