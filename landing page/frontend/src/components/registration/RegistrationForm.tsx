import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventItem, RegistrationFormData } from '../../types/event';
import { EventService } from '../../services/eventService';
import { User, Mail, Phone, Building2, Briefcase, MapPin, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegistrationFormProps {
  event: EventItem;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ event }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    mobile: '',
    organization: '',
    designation: '',
    city: '',
    state: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName || !formData.email || !formData.mobile || !formData.organization) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await EventService.registerForEvent(event.id, formData);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Fallback
      }

      navigate(`/register/success/${result.registrationId}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete registration. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Group 1: Personal Details */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase font-bold tracking-wider text-[#7E22CE] flex items-center gap-1.5">
          <User className="w-4 h-4" /> Personal Details
        </h4>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="fullName"
              required
              placeholder="e.g. Eleanor Vance"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="eleanor@company.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                name="mobile"
                required
                placeholder="+1 (555) 019-2834"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Professional Profile */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs uppercase font-bold tracking-wider text-[#7E22CE] flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Professional Profile
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Organization / Company *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="organization"
                required
                placeholder="e.g. Horizon Tech Inc"
                value={formData.organization}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designation / Role
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="designation"
                placeholder="e.g. Senior AI Specialist"
                value={formData.designation}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Location */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h4 className="text-xs uppercase font-bold tracking-wider text-[#7E22CE] flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> Location Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              placeholder="e.g. San Francisco"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              State / Country
            </label>
            <input
              type="text"
              name="state"
              placeholder="e.g. California"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#7E22CE]"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <div className="flex items-start gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Your data is protected under SSL encryption. By submitting, you agree to receive digital entry pass updates and event notifications.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl font-bold text-base text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Digital Pass...</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
