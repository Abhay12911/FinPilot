import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Search, PieChart, Activity, Shield, Users, FileText, Sparkles, Cpu } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const SIGNAL = '#050505';
const SIGNAL_TEXT = '#3A3A3A';
const SIGNAL_ON_DARK = '#D4D4D4';
const SIGNAL_BG = '#F2F2F2';
const SIGNAL_BORDER = '#DCDCDC';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const BentoFeatures = () => {
  const canvasRef = useRef(null);
  const inView = useInView(canvasRef, { once: true, margin: '-60px' });

  const [pipelineStep, setPipelineStep] = useState(0);
  const pipelineSteps = [
    { label: 'Searching filings...' },
    { label: 'Analyzing earnings transcripts...' },
    { label: 'Checking market signals...' },
    { label: 'Comparing portfolio exposure...' },
    { label: 'READY' },
  ];

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => setPipelineStep((p) => (p + 1) % pipelineSteps.length), 2500);
    return () => clearInterval(interval);
  }, [inView]);

  const [citationHovered, setCitationHovered] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveAgentIndex((p) => (p + 1) % 4), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={canvasRef} className="py-24 md:py-32 lg:py-36 bg-[#FFFFFF] border-t border-[#E5E5E5]/40" id="product">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">

        <SectionHeader
          badge="Capabilities"
          heading="Everything an analyst needs,"
          emphasis="nothing to switch tabs for."
          subtext="Six core systems, one workspace, zero context-switching."
        />

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="mt-14 grid grid-cols-1 md:grid-cols-12 gap-px bg-[#E5E5E5] border border-[#E5E5E5] rounded-3xl overflow-hidden shadow-2xs"
        >

          
          <motion.div variants={fadeUp} whileHover={{ backgroundColor: '#FCFCFC' }} className="md:col-span-7 bg-white p-5 sm:p-7 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><Search size={12} className="text-[#050505]" /></div>
                <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">AI Financial Workspace</span>
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold tracking-tight text-[#050505] leading-snug">
                "Why did semiconductor margins shift this quarter?"
              </h3>
            </div>

            <div className="mt-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-4 font-mono text-[10px] space-y-3">
              <div className="flex justify-between items-center text-[#737373] border-b border-[#EAEAEA] pb-1.5">
                <span>ANALYSIS PIPELINE</span>
                <span className="text-[8px] bg-[#EAEAEA] px-1.5 py-0.5 rounded text-black font-bold">ACTIVE</span>
              </div>
              <div className="space-y-1.5">
                {pipelineSteps.slice(0, 4).map((step, idx) => {
                  const isCurrent = pipelineStep === idx;
                  const isPast = pipelineStep > idx;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[10px]">
                      <span className={isCurrent ? 'text-black font-semibold' : isPast ? 'text-[#888]' : 'text-[#CCCCCC]'}>{idx + 1}. {step.label}</span>
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: SIGNAL }} />}
                      {isPast && <span className="font-bold" style={{ color: SIGNAL_TEXT }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                {pipelineStep === 4 && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-[#050505] font-sans text-xs leading-relaxed relative">
                    <div className="absolute right-2 top-2"><Sparkles size={11} style={{ color: SIGNAL_TEXT }} /></div>
                    <span className="font-semibold block mb-0.5 font-mono text-[8px] uppercase tracking-wider" style={{ color: SIGNAL_TEXT }}>REASONING RESULT</span>
                    Margin pressure is primarily associated with higher packaging costs and supplier adjustments reported by foundry partners.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex gap-3 text-[9px] text-[#A3A3A3] font-mono">
              <span>● Form 10-K</span><span>● Earnings Call Transcripts</span><span>● Supplier Feeds</span>
            </div>
          </motion.div>

          
          <motion.div variants={fadeUp} whileHover={{ backgroundColor: '#FCFCFC' }} className="md:col-span-5 bg-white p-5 sm:p-7 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><PieChart size={12} className="text-[#050505]" /></div>
                <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">Portfolio Intelligence</span>
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-semibold tracking-tight text-[#050505]">Consolidated NAV</h3>
            </div>

            <div className="space-y-4 my-4">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-[20px] font-bold text-[#050505]">$12,480,920</span>
                <span
                  className="font-semibold text-[9px] px-1.5 py-0.5 rounded border font-mono"
                  style={{ color: SIGNAL_TEXT, backgroundColor: SIGNAL_BG, borderColor: SIGNAL_BORDER }}
                >
                  +$84,210 TODAY
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Technology', weight: 45, bg: 'bg-black' },
                  { label: 'Energy & Industrials', weight: 28, bg: 'bg-[#525252]' },
                  { label: 'Consumer Discretionary', weight: 26, bg: 'bg-[#A3A3A3]' },
                ].map((sec) => (
                  <div key={sec.label} className="text-[10px]">
                    <div className="flex justify-between font-mono mb-0.5"><span className="text-[#525252]">{sec.label}</span><span className="font-semibold text-black">{sec.weight}%</span></div>
                    <div className="w-full bg-[#F3F4F6] h-1 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${sec.weight}%` }} viewport={{ once: true }} className={`${sec.bg} h-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="font-mono text-[9px] text-[#A3A3A3] text-center border-t border-[#F0F0F0] pt-3">Risk Sharpe Ratio: 2.84</div>
          </motion.div>

          
          <motion.div variants={fadeUp} whileHover={{ backgroundColor: '#FCFCFC' }} className="md:col-span-4 bg-white p-5 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><Activity size={12} className="text-[#050505]" /></div>
              <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">Market Signals</span>
            </div>
            <div className="h-20 w-full relative my-3">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <motion.path d="M 0 32 Q 25 28, 50 15 T 100 2" fill="none" stroke="#050505" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#F0F0F0" strokeWidth="0.75" strokeDasharray="2 2" />
              </svg>
            </div>
            <div className="flex justify-between items-center border-t border-[#F0F0F0] pt-3 font-mono text-[10px]">
              <span className="text-[#525252]">Volatility Spike</span>
              <span className="font-bold px-1.5 py-0.5 rounded border" style={{ color: SIGNAL_TEXT, backgroundColor: SIGNAL_BG, borderColor: SIGNAL_BORDER }}>
                +14.2%
              </span>
            </div>
          </motion.div>

          
          <motion.div variants={fadeUp} whileHover={{ backgroundColor: '#FCFCFC' }} className="md:col-span-4 bg-white p-5 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><Shield size={12} className="text-[#050505]" /></div>
              <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">Citations</span>
            </div>
            <div
              className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3.5 space-y-2 text-[10px] cursor-pointer hover:border-[#CCCCCC] transition-colors"
              onMouseEnter={() => setCitationHovered(true)}
              onMouseLeave={() => setCitationHovered(false)}
            >
              <div className="text-[#525252] leading-relaxed">
                "Semiconductor exposure increased{' '}
                <span
                  className="px-1.5 py-0.5 rounded font-bold transition-colors"
                  style={
                    citationHovered
                      ? { backgroundColor: '#050505', color: '#FFFFFF' }
                      : { backgroundColor: SIGNAL_BG, color: SIGNAL_TEXT }
                  }
                >
                  14.2%
                </span>
                ."
              </div>
              <div className="border-t border-[#EDEDED] pt-2 flex justify-between items-center text-[9px] font-mono">
                <span className={citationHovered ? 'text-[#050505] font-bold' : 'text-[#737373]'}>NVIDIA Form 10-K, Page 48</span>
                <span className="font-bold" style={{ color: SIGNAL_TEXT }}>Verified ✓</span>
              </div>
            </div>
            <div className="text-[9px] text-[#A3A3A3] text-center font-mono">Hover claim to map source evidence</div>
          </motion.div>

          
          <motion.div variants={fadeUp} whileHover={{ backgroundColor: '#FCFCFC' }} className="md:col-span-4 bg-white p-5 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><Users size={12} className="text-[#050505]" /></div>
              <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">Multi-Agent Swarm</span>
            </div>
            <div className="space-y-1.5 my-2.5 font-mono text-[10px]">
              {[
                { name: 'Financial Agent', latency: '98 ms' },
                { name: 'Risk Agent', latency: '32 ms' },
                { name: 'Market Agent', latency: '71 ms' },
                { name: 'News Agent', latency: '110 ms' },
              ].map((agent, i) => {
                const isActive = activeAgentIndex === i;
                return (
                  <motion.div key={i} animate={{ backgroundColor: isActive ? '#050505' : '#FFFFFF', color: isActive ? '#FFFFFF' : '#525252', borderColor: isActive ? '#000000' : '#E5E5E5' }} transition={{ duration: 0.35 }} className="flex items-center justify-between rounded px-2 py-1.5 border">
                    <span className="font-semibold flex items-center gap-1.5"><Cpu size={10} />{agent.name}</span>
                    <span className="text-[8.5px] font-bold" style={{ color: isActive ? SIGNAL_ON_DARK : '#8A8A8A' }}>{agent.latency}</span>
                  </motion.div>
                );
              })}
            </div>
            <div className="text-[9px] text-[#A3A3A3] text-center font-mono">Swarm executing quantitative scans</div>
          </motion.div>

          
          <motion.div variants={fadeUp} className="md:col-span-12 bg-white p-5 sm:p-7 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center"><FileText size={12} className="text-[#050505]" /></div>
              <span className="font-mono text-[9px] font-bold text-[#737373] uppercase tracking-wider">Unified Document Intelligence</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5 font-mono text-[10px]">
              {[
                { step: '01 / CONNECT', doc: 'SEC_AMZN_10K.pdf' },
                { step: '02 / PARSE', doc: 'Transcript_Q3_Call.txt' },
                { step: '03 / CONTEXT', doc: 'Supplier_Exposure.csv' },
                { step: '04 / READY', doc: 'Research_Thesis.docx' },
              ].map((node, i) => (
                <motion.div key={i} variants={fadeUp} whileHover={{ y: -2, borderColor: '#CCCCCC' }} className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-[#8A8A8A] block">{node.step}</span>
                    <span className="text-[#050505] font-semibold block mt-1 truncate">{node.doc}</span>
                  </div>
                  <span
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider self-start mt-2 border"
                    style={{ color: SIGNAL_TEXT, backgroundColor: SIGNAL_BG, borderColor: SIGNAL_BORDER }}
                  >
                    ACTIVE
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default BentoFeatures;