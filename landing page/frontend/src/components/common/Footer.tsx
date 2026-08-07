import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Phone, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { TwitterIcon, LinkedinIcon, YoutubeIcon, GithubIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#0F172A] text-slate-300 relative overflow-hidden">
      
      {/* Top Purple CTA Banner Strip matching RTIH Screenshot */}
      <div className="bg-[#7E22CE] bg-gradient-to-r from-[#6B21A8] via-[#7E22CE] to-[#8B5CF6] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">
              Have an Event or Summit Idea?
            </h3>
            <p className="text-purple-100 text-sm max-w-xl">
              Partner with SmartEvents to launch contactless QR-enabled registration for your upcoming tech summits, startup expos, and masterclasses.
            </p>
          </div>

          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-[#7E22CE] hover:bg-slate-100 shadow-lg flex items-center gap-2 shrink-0 transition-all active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Host an Event</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#7E22CE] flex items-center justify-center text-white shadow-md">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Smart<span className="text-purple-400">Events</span>
              </span>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The next-generation Smart Event Registration Platform empowering organizers to deliver seamless, contactless, QR-enabled summit & conference experiences globally.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors"
              >
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#7E22CE] transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-purple-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-purple-400 transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-purple-400 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Event Categories</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/events?category=AI+%26+Tech" className="hover:text-purple-400 transition-colors">
                  AI & Technology
                </Link>
              </li>
              <li>
                <Link to="/events?category=Startup+%26+Innovation" className="hover:text-purple-400 transition-colors">
                  Startup Innovation
                </Link>
              </li>
              <li>
                <Link to="/events?category=Smart+Cities" className="hover:text-purple-400 transition-colors">
                  Smart Cities Infrastructure
                </Link>
              </li>
              <li>
                <Link to="/events?category=Green+Energy" className="hover:text-purple-400 transition-colors">
                  Green Energy & ESG
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Contact Info</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>450 Innovation Blvd, Silicon Valley, CA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <a href="mailto:support@smartevents.io" className="hover:text-purple-400 transition-colors">
                  support@smartevents.io
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>+1 (800) 555-0199</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SmartEvents Platform. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-slate-400 transition-colors">
              Terms & Conditions
            </a>
            <a href="#cookies" className="hover:text-slate-400 transition-colors">
              Cookie Preferences
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
