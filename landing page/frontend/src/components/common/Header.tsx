import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import rtihLogo from '../../assets/rtih-logo.png';
import apLogo from '../../assets/ap-innovation-logo.png';

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.')
);

const adminLoginUrl = (import.meta.env.VITE_REGISTRATION_BASE_URL || (isLocalhost
  ? `${window.location.protocol}//${window.location.hostname}:5173`
  : 'https://event-admin-losq.onrender.com')).replace(/\/$/, '') + '/#login';

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
          <a href="/" className="flex items-center cursor-pointer">
            <img
              src={rtihLogo}
              alt="RTIH - Ratan Tata Innovation Hub Logo"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </a>

          {/* Right Section: Login button + AP Innovation Society Logo */}
          <div className="flex items-center gap-6">
            <a
              href={adminLoginUrl}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5B21B6] border border-purple-200 text-sm font-bold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <span>Login</span>
              <ChevronDown className="w-4 h-4 text-[#5B21B6]" />
            </a>

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
