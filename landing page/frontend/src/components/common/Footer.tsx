import React from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import { FacebookIcon, TwitterIcon, LinkedinIcon, InstagramIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1329] text-slate-300 relative overflow-hidden pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* 4-Column Main Footer Section matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">

          {/* Col 1: About RTIH */}
          <div className="space-y-3">
            <h4 className="text-white text-base font-bold">About RTIH</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ratan Tata Innovation Hub — Empowering entrepreneurs through technology and innovation. Building a bridge between government events and innovative solutions.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white text-base font-bold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="/" className="hover:text-purple-400 transition-colors">Home</a></li>
              <li><a href="/events" className="hover:text-purple-400 transition-colors">All Events</a></li>
              <li><a href="https://event-admin-losq.onrender.com/#login" className="hover:text-purple-400 transition-colors">Super Admin Login</a></li>
              <li><a href="https://event-admin-losq.onrender.com/#login" className="hover:text-purple-400 transition-colors">Admin Portal</a></li>
            </ul>
          </div>

          {/* Col 3: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-white text-base font-bold">Contact Info</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
                <span>4th Floor, Mayuri Tech Park, Mangalagiri, Guntur Andhra Pradesh <strong>522503</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>connect@rtih.co.in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-purple-400 shrink-0 mt-1" />
                <span>Monday to Friday <strong>10:30 am – 5:30 pm</strong> (except public holidays)</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Connect */}
          <div className="space-y-3">
            <h4 className="text-white text-base font-bold">Connect</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Stay updated with the latest events and innovation opportunities.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors cursor-default">
                <FacebookIcon className="w-4 h-4" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors cursor-default">
                <TwitterIcon className="w-4 h-4" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors cursor-default">
                <LinkedinIcon className="w-4 h-4" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors cursor-default">
                <InstagramIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar matching Image 2 */}
        <div className="py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ratan Tata Innovation Hub. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
};
