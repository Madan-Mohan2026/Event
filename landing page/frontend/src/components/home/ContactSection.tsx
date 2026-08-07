import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { TwitterIcon, LinkedinIcon, YoutubeIcon, GithubIcon } from '../common/SocialIcons';

export const ContactSection: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSubmitted(true);
  };

  return (
    <section id="contact-section" className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#7E22CE] bg-purple-50 border border-purple-200">
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Contact Event Support & Team
          </h2>
          <p className="text-slate-600 text-base">
            Have questions about upcoming summits, ticket registration, or hosting your own event on SmartEvents? Reach out to our 24/7 organizer support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#7E22CE]" />
                <span>Contact Details</span>
              </h3>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7E22CE] shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Global Headquarters</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      450 Innovation Boulevard, Tech Tower Suite 800, Silicon Valley, CA
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7E22CE] shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Email Communications</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      support@smartevents.io &bull; events@smartevents.io
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-[#7E22CE] shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">24/7 Support Desk</h4>
                    <p className="text-slate-600 text-xs mt-0.5">
                      +1 (800) 555-0199 / +1 (415) 890-2100
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Icons */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Connect With Us
                </h4>
                <div className="flex items-center gap-3">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#7E22CE] hover:border-purple-300 transition-colors"
                  >
                    <TwitterIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#7E22CE] hover:border-purple-300 transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#7E22CE] hover:border-purple-300 transition-colors"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#7E22CE] hover:border-purple-300 transition-colors"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              {formSubmitted ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Sent Successfully!</h3>
                  <p className="text-slate-600 text-sm max-w-md mx-auto">
                    Thank you for reaching out. Our support team will reply to <span className="text-slate-900 font-bold">{formData.email}</span> within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="mt-3 px-5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Send an Inquiry</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7E22CE]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alex@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7E22CE]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Event Inquiry / Speaker Request"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7E22CE]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="How can our event team assist you?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#7E22CE] resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#7E22CE] hover:bg-[#6B21A8] shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
