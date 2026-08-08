import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Layers, FileText, Database, ShieldCheck, Mail, Sliders } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const fragmented = [
  { icon: FileText, label: 'SEC Filings (PDF)' },
  { icon: Database, label: 'Excel Models' },
  { icon: Layers, label: 'Broker Research Feeds' },
  { icon: Mail, label: 'Email Threads & Notes' },
];

const pipelineSteps = [
  { title: '01 / CONNECT DATA', desc: 'Syncing files, filings, and transcript streams' },
  { title: '02 / MULTI-AGENT SWARMS', desc: 'Active financial and risk model evaluations' },
  { title: '03 / CITED ANSWERS', desc: 'Citations mapped back to raw document lines' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

export const ProblemSection = () => {
  return (
    <section className="py-24 md:py-32 lg:py-36 bg-[#FAFAFA] border-t border-[#E5E5E5]/40" id="solutions">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">

        <SectionHeader
          badge="Problem & Solution"
          heading="Consolidate fragmented datasets"
          emphasis="into one reasoning pipeline."
          subtext="FinPilot unifies research, filing datasets, risk metrics, and multi-agent synthesis inside a single workspace."
        />

        <div className="h-16" />

        
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center border border-[#E5E5E5] rounded-3xl bg-white p-6 sm:p-10 shadow-2xs relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-zinc-50/50 via-transparent to-transparent pointer-events-none" />

          
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="lg:col-span-4 space-y-4 relative z-10">
            <div>
              <span className="font-mono text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider">Traditional Workspace</span>
              <h3 className="text-lg font-semibold tracking-tight text-[#050505] mt-1">Siloed &amp; Disconnected</h3>
              <p className="text-xs text-[#737373] mt-1 leading-relaxed">Analysts waste hours tracking formulas and cross-referencing tabs.</p>
            </div>

            <motion.div variants={stagger} className="space-y-2 mt-4">
              {fragmented.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    transition={{ duration: 0.4 }}
                    whileHover={{ x: 2, borderColor: '#D4D4D4' }}
                    className="flex items-center justify-between rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] p-3 text-xs text-[#525252]"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="text-[#888]" />
                      <span className="font-mono text-[10px]">{item.label}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#A3A3A3] uppercase">
                      <span className="h-1 w-1 rounded-full bg-[#D4D4D4]" />
                      Siloed
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="hidden lg:col-span-4 lg:flex flex-col items-center justify-center relative h-64 overflow-visible px-2"
          >
            <span className="font-mono text-[8px] uppercase tracking-wider text-[#A3A3A3] mb-4">Pipeline sync</span>

            <div className="w-full relative flex items-center justify-center">
              
              <div className="absolute left-0 h-2 w-2 rounded-full bg-[#D4D4D4]" />

              
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 220 20" fill="none">
                <path d="M 6 10 L 190 10" stroke="#E5E5E5" strokeWidth="1.5" strokeDasharray="4 4" />
                {[0, 0.35, 0.7].map((delay, i) => (
                  <motion.g
                    key={i}
                    animate={{ x: [6, 190], opacity: [0, 1, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay, ease: 'linear' }}
                  >
                    <circle cy="10" r="2.5" fill="#050505" />
                  </motion.g>
                ))}
              </svg>

              
              <div className="absolute right-0 flex items-center justify-center">
                <span className="absolute h-8 w-8 rounded-full bg-black/10 animate-ping" />
                <div className="relative h-7 w-7 rounded-full border border-black bg-white flex items-center justify-center shadow-2xs">
                  <ArrowRight size={11} className="text-black" />
                </div>
              </div>
            </div>

            <span className="mt-4 font-mono text-[8px] uppercase tracking-wider text-[#525252]">Zero-drift merge</span>
          </motion.div>

          
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2 }}
            className="lg:col-span-4 rounded-2xl border border-black bg-black p-6 text-white relative z-10 shadow-sm"
          >
            <div>
              <span className="font-mono text-[9px] font-bold text-[#A3A3A3] uppercase tracking-wider">Unified Architecture</span>
              <h3 className="text-lg font-semibold tracking-tight text-white mt-1">One Reasoning Workspace</h3>
              <p className="text-xs text-[#A3A3A3] mt-1 leading-relaxed">Direct fact links to original filing lines with zero drift.</p>
            </div>

            
            <motion.div variants={stagger} className="mt-5 space-y-3.5 border-t border-[#252525] pt-5">
              {pipelineSteps.map((step, i) => (
                <motion.div key={i} variants={fadeUp} transition={{ duration: 0.4 }} className="flex items-start gap-2.5">
                  <CheckCircle2 size={13} className="text-white mt-0.5 shrink-0" />
                  <div>
                    <span className="font-mono text-[9px] font-bold text-white block tracking-wider">{step.title}</span>
                    <span className="text-[10px] text-[#A3A3A3] mt-0.5 block">{step.desc}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;