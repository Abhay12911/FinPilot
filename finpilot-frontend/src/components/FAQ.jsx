import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const faqs = [
  {
    q: 'What is FinPilot AI?',
    a: 'FinPilot AI is an enterprise financial intelligence platform that unifies SEC filings, transcripts, custom spreadsheets, portfolio risk analytics, and multi-agent reasoning models into a single, clean workspace.',
  },
  {
    q: 'What data formats does FinPilot support?',
    a: 'FinPilot connects to public SEC filings (10-K, 10-Q, 8-K), earnings call transcripts, broker research memos, custom private PDFs, Excel sheets, and live portfolio integrations.',
  },
  {
    q: 'How does FinPilot prevent AI hallucinations?',
    a: 'FinPilot features an audit-ready citation engine. Every single claim, margin delta, or synthesised insight links directly to verified line-items and original source paragraphs.',
  },
  {
    q: 'How is data security handled?',
    a: 'We enforce end-to-end encryption, strict workspace isolation, and SOC2 compliance. Your uploaded models, queries, and portfolio holdings are private and never used to train public LLMs.',
  },
];

export const FAQ = () => {
  const [expanded, setExpanded] = useState(0);

  return (
    <section className="py-20 md:py-28 lg:py-32 bg-[#FAFAFA] border-t border-[#E5E5E5]">
      <div className="max-w-[760px] mx-auto px-6 sm:px-10">

        <SectionHeader
          badge="Resources"
          heading="Frequently Asked Questions"
        />

        <div className="h-12" />

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = expanded === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="rounded-2xl border bg-white overflow-hidden transition-all duration-300"
                style={{
                  borderColor: isOpen ? '#050505' : '#E5E5E5',
                  boxShadow: isOpen ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#050505]/40 rounded-2xl"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-[#050505] pr-4">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <Plus size={16} className={isOpen ? 'text-[#050505]' : 'text-[#737373]'} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-[#F0F0F0]"
                    >
                      <p className="px-5 py-4 bg-[#FAFAFA] text-xs sm:text-sm text-[#525252] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;