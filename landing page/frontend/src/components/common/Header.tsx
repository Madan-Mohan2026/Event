import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white ${
        isScrolled
          ? 'shadow-md border-b border-slate-200 py-3'
          : 'border-b border-slate-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo - RTIH Format */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#7E22CE] flex items-center justify-center text-white shadow-md shadow-purple-600/20 group-hover:bg-[#6B21A8] transition-colors">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#1E1B4B]">
                Smart<span className="text-[#7E22CE]">Events</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase -mt-1">
                Events & Expos
              </span>
            </div>
          </Link>

          {/* Partner / Organization Logo Badge on Right */}
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                Smart Event Platform
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Official Registration Portal
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7E22CE] font-bold text-sm">
              SE
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
