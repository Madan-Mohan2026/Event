import React, { useState } from 'react';
import type { FAQ } from '../../types/event';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQAccordionProps {
  faqs: FAQ[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs }) => {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (!faqs || faqs.length === 0) {
    return <p className="text-slate-400 text-sm">No FAQs listed for this event.</p>;
  }

  return (
    <div className="space-y-4 my-4">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition-colors"
          >
            <button
              onClick={() => toggle(faq.id)}
              className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
            >
              <span className="font-bold text-white text-base sm:text-lg flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>{faq.question}</span>
              </span>
              <div
                className={`w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300 shrink-0 ${
                  isOpen ? 'rotate-180 bg-indigo-600/20 text-indigo-400 border-indigo-500/40' : ''
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="px-6 pb-6 pt-1 text-slate-300 text-sm leading-relaxed border-t border-slate-800/60 mt-1">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
