import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { ArrowRight, Check, Database, Cpu, FileText, Download, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const steps = [
  {
    id: '01',
    badge: 'INGESTION',
    title: 'Connect your data',
    desc: 'Sync filings, transcripts, custom spreadsheets, and portfolio feeds instantly with sub-second validation.',
    icon: Database,
    preview: (
      <div className="space-y-2.5 p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm font-mono text-[11px] relative overflow-hidden">
        <div className="flex justify-between items-center text-[#888] pb-2.5 border-b border-[#F0F0F0] mb-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            <span className="font-semibold text-[10px] tracking-wider text-[#525252]">LIVE DATA PIPELINE</span>
          </div>
          <span className="text-[#262626] font-bold uppercase tracking-wider text-[8px] bg-[#F0F0F0] px-2 py-0.5 border border-[#D4D4D4] rounded-full flex items-center gap-1">
            <ShieldCheck size={10} /> 3 ACTIVE SOURCES
          </span>
        </div>

        {[
          { name: 'SEC_AMZN_10K.pdf', type: 'Filing', size: '2.4 MB', status: 'Synced', delay: 0.05 },
          { name: 'Transcript_Q3_Call.txt', type: 'Transcript', size: '840 KB', status: 'Synced', delay: 0.1 },
          { name: 'Exposure_Sheet.xlsx', type: 'Spreadsheet', size: '1.1 MB', status: 'Live Sync', delay: 0.15 }
        ].map((f, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: f.delay }}
            whileHover={{ scale: 1.01, backgroundColor: '#F5F5F5' }}
            className="flex justify-between items-center p-3 bg-[#FAFAFA] rounded-xl border border-[#EDEDED] transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-white border border-[#E5E5E5] text-[#525252] group-hover:border-black/20 transition-colors">
                <FileText size={13} />
              </div>
              <div className="truncate">
                <span className="font-semibold text-black block truncate">{f.name}</span>
                <span className="text-[9px] text-[#888]">{f.size}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] text-[#737373] bg-[#EAEAEA] px-2 py-0.5 rounded-md font-medium">{f.type}</span>
              <span className="text-[9px] text-[#262626] font-semibold bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#D4D4D4] flex items-center gap-1">
                <Check size={9} /> {f.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    )
  },
  {
    id: '02',
    badge: 'ORCHESTRATION',
    title: 'Analyze with AI swarms',
    desc: 'Deploy multiple autonomous agents in parallel to calculate factor risk weights and cross-verify findings.',
    icon: Cpu,
    preview: (
      <div className="space-y-2.5 p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm font-mono text-[11px] relative">
        <div className="flex justify-between items-center text-[#888] pb-2.5 border-b border-[#F0F0F0] mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#525252] animate-spin" style={{ animationDuration: '4s' }} />
            <span className="font-semibold text-[10px] tracking-wider text-[#525252]">SWARM CONCURRENCY</span>
          </div>
          <span className="text-[9px] font-semibold text-[#262626] bg-[#F0F0F0] px-2 py-0.5 rounded-full border border-[#D4D4D4]">
            3/3 RUNNING
          </span>
        </div>

        {[
          { agent: 'Research Agent', task: 'Scanning 12 disclosures', progress: 88, delay: 0.05 },
          { agent: 'Risk Agent', task: 'Calculating delta parameters', progress: 64, delay: 0.1 },
          { agent: 'Market Agent', task: 'Verifying supplier exposure', progress: 95, delay: 0.15 }
        ].map((a, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: a.delay }}
            className="p-3 bg-[#FAFAFA] rounded-xl border border-[#EDEDED] space-y-2"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-black block">{a.agent}</span>
                <span className="text-[#888] text-[9px] block">{a.task}</span>
              </div>
              <span className="text-[10px] font-bold text-black">{a.progress}%</span>
            </div>
            <div className="w-full bg-[#EAEAEA] h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-black h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${a.progress}%` }}
                transition={{ duration: 0.8, delay: a.delay + 0.1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    )
  },
  {
    id: '03',
    badge: 'SYNTHESIS',
    title: 'Understand core insights',
    desc: 'Uncover cited synthesis answers linked directly back to official filing source lines with complete lineage.',
    icon: ShieldCheck,
    preview: (
      <div className="space-y-3 p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm font-mono text-[11px]">
        <div className="flex justify-between items-center text-[#888] pb-2.5 border-b border-[#F0F0F0]">
          <span className="font-semibold text-[10px] tracking-wider text-[#525252]">CITATIONS MAP VERIFIED</span>
          <span className="text-[#262626] font-bold uppercase tracking-wider text-[8px] bg-[#F0F0F0] px-2 py-0.5 border border-[#D4D4D4] rounded-full">
            94% CONFIDENCE
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="p-3.5 bg-[#FAFAFA] rounded-xl border border-[#EDEDED] text-xs font-sans leading-relaxed text-[#050505] space-y-3"
        >
          <div className="flex gap-2.5 items-start">
            <span className="shrink-0 w-2 h-2 rounded-full bg-black mt-1.5" />
            <p className="font-medium text-[13px] text-[#050505] leading-snug">
              Semiconductor exposure metrics expanded <span className="bg-[#E5E5E5] text-black px-1 py-0.5 rounded font-mono text-[11px] font-semibold">14.2% YoY</span> during Q2 operations.
            </p>
          </div>

          <motion.div
            whileHover={{ x: 2 }}
            className="border-t border-[#EAEAEA] pt-2.5 flex justify-between items-center font-mono text-[9px] cursor-pointer"
          >
            <span className="text-[#050505] font-semibold bg-[#F0F0F0] px-2 py-1 border border-[#D4D4D4] rounded-md flex items-center gap-1.5">
              <span>NVIDIA Form 10-K, Page 48</span>
              <ChevronRight size={10} className="text-[#525252]" />
            </span>
            <span className="text-[#262626] font-bold flex items-center gap-1">
              <Check size={10} /> Verified
            </span>
          </motion.div>
        </motion.div>
      </div>
    )
  },
  {
    id: '04',
    badge: 'OUTPUT',
    title: 'Decide and export',
    desc: 'Generate clean report memo packages formatting all metrics ready for investment committee presentation.',
    icon: Download,
    preview: (
      <div className="space-y-3 p-5 sm:p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-sm font-mono text-[11px]">
        <div className="flex justify-between items-center text-[#888] pb-2.5 border-b border-[#F0F0F0]">
          <span className="font-semibold text-[10px] tracking-wider text-[#525252]">COMMITTEE REPORT SUITE</span>
          <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full font-bold tracking-wider">
            READY FOR EXPORT
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { title: 'PDF Research Memo', sub: 'Cited Evidence', icon: FileText },
            { title: 'Spreadsheet Data', sub: 'Valuation Model', icon: Database }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: '#050505' }}
              className="p-3 bg-[#FAFAFA] rounded-xl border border-[#EDEDED] transition-all cursor-pointer group"
            >
              <item.icon size={14} className="text-[#737373] group-hover:text-black mb-1.5 transition-colors" />
              <span className="font-semibold text-black block text-[11px] leading-tight">{item.title}</span>
              <span className="text-[#888] text-[9px] block mt-0.5">{item.sub}</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#050505] py-3 text-white font-semibold text-[11px] hover:bg-[#1a1a1a] transition-all shadow-sm"
        >
          <span>Download package</span>
          <ArrowRight size={13} />
        </motion.button>
      </div>
    )
  }
];

export const HowItWorks = () => {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const stepCount = steps.length;
    const threshold = 1 / stepCount;
    const current = Math.min(Math.floor(latest / threshold), stepCount - 1);
    if (current >= 0) {
      setActiveStep((prev) => (current !== prev ? current : prev));
    }
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="bg-[#FAFAFA] border-t border-[#E5E5E5]/40 relative py-24 md:py-32 lg:py-36" id="how-it-works">
      
      <div ref={containerRef} className="relative min-h-0 lg:min-h-[150vh]">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col justify-center max-w-[1140px] mx-auto px-6 sm:px-10 py-8">

          <SectionHeader
            badge="Operational Workflow"
            heading="From raw data to defensible decisions."
            subtext="Four steps take you from scattered filings to a cited, committee-ready thesis."
            liveDot={true}
          />

          <div className="h-10" />

          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            
            <div className="lg:col-span-5 flex gap-4 sm:gap-6">
              
              <div className="relative w-1 bg-[#E5E5E5] shrink-0 rounded-full overflow-hidden hidden sm:block my-1">
                <motion.div
                  className="absolute top-0 left-0 w-full bg-[#050505] rounded-full"
                  style={{ height: progressHeight }}
                />
              </div>

              
              <div className="flex-1 space-y-2">
                {steps.map((step, idx) => {
                  const isActive = activeStep === idx;
                  return (
                    <div key={step.id} className="relative">
                      <button
                        onClick={() => setActiveStep(idx)}
                        className={`relative w-full text-left p-3.5 rounded-2xl transition-all duration-300 group cursor-pointer border ${
                          isActive
                            ? 'bg-[#FAFAFA] border-[#E5E5E5] shadow-xs'
                            : 'bg-transparent border-transparent hover:bg-[#FAFAFA]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono text-[10px] tracking-wider uppercase font-bold transition-colors ${
                              isActive ? 'text-[#050505]' : 'text-[#A3A3A3] group-hover:text-[#737373]'
                            }`}
                          >
                            STEP {step.id} — {step.badge}
                          </span>
                          {isActive && (
                            <motion.span
                              layoutId="active-indicator"
                              className="w-2 h-2 rounded-full bg-black"
                            />
                          )}
                        </div>

                        <h3
                          className={`text-sm sm:text-base font-semibold tracking-tight mt-1 transition-colors ${
                            isActive ? 'text-[#050505]' : 'text-[#888] group-hover:text-[#525252]'
                          }`}
                        >
                          {step.title}
                        </h3>

                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs mt-2 leading-relaxed text-[#525252] font-normal">
                                {step.desc}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            
            <div className="lg:col-span-7 rounded-3xl border border-[#E5E5E5] bg-[#FAFAFA] p-5 sm:p-8 shadow-xs min-h-[360px] flex flex-col justify-center relative overflow-hidden">
              
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-black/5 via-transparent to-transparent pointer-events-none" />

              
              <div className="font-mono text-[9px] text-[#888] mb-4 uppercase tracking-wider relative z-10 flex items-center justify-between bg-white/70 backdrop-blur-md p-2.5 px-4 rounded-xl border border-[#E5E5E5]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  <span>STAGE {steps[activeStep].id} MONITOR</span>
                </div>
                <span className="font-bold text-[#050505]">{steps[activeStep].badge}</span>
              </div>

              
              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {steps[activeStep].preview}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;