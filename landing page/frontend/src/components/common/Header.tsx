import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import rtihLogo from '../../assets/rtih-logo.png';
import apLogo from '../../assets/ap-innovation-logo.png';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 bg-white ${
        isScrolled
          ? 'shadow-md border-b border-slate-200 py-2.5'
          : 'border-b border-slate-200 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Left Logo: Official RTIH Image */}
          <div className="flex items-center cursor-default">
            <img
              src={rtihLogo}
              alt="RTIH - Ratan Tata Innovation Hub Logo"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>

          {/* Right Section: Login button + AP Innovation Society Logo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 cursor-default text-sm font-semibold text-slate-700 hover:text-[#5B21B6] transition-colors">
              <span>Login</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>

            {/* Right Logo: Official Andhra Pradesh Innovation Society Image */}
            <div className="flex items-center cursor-default">
              <img
                src={apLogo}
                alt="Andhra Pradesh Innovation Society Logo"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
