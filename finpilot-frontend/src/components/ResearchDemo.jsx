import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Terminal, FileText, CheckCircle2, Cpu, ShieldAlert, Layers, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const QUERY = 'How exposed is our active portfolio to semiconductor supply-chain constraints in H2 2026?';

const agents = [
  { label: 'RESEARCH AGENT', icon: Layers, status: '12 SEC Filings Indexed', detail: '100% Parsed' },
  { label: 'MARKET AGENT', icon: Cpu, status: 'Supply Constraints Scanned', detail: 'TSMC & NVDA' },
  { label: 'RISK AGENT', icon: ShieldAlert, status: 'Weighted Beta Exposure', detail: 'Beta Factor 1.42' },
];

const findings = [
  {
    id: 0,
    title: 'Finding 01',
    tag: 'CONCENTRATION RISK',
    evidence: 'Active semiconductor exposure is primarily concentrated in two foundational packaging manufacturers ($NVDA and $TSM).',
    citation: 'Form 10-K, Page 48',
    highlight: 'Form 10-K, F-48 disclosures:',
    quote: '"...foundry equipment allocations continue to concentrate exposure variables in critical photolithography lines."'
  },
  {
    id: 1,
    title: 'Finding 02',
    tag: 'REVENUE BOTTLENECK',
    evidence: 'Production constraints on advanced photolithography machinery pose a potential 3% revenue supply bottleneck in Q4.',
    citation: 'Filing Disclosure Note 8',
    highlight: 'Filing Note 8 schedules:',
    quote: '"...machinery delivery cycles present H2 bottlenecks that cap near-term packaging expansion."'
  }
];

export const ResearchDemo = () => {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [showAgents, setShowAgents] = useState(false);
  const [showFindings, setShowFindings] = useState(false);
  const [activeCitation, setActiveCitation] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.2 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setQueryText(QUERY.slice(0, i));
      if (i >= QUERY.length) {
        clearInterval(t);
        setTimeout(() => {
          setShowAgents(true);
          setTimeout(() => setShowFindings(true), 1000);
        }, 300);
      }
    }, 16);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <section ref={containerRef} className="py-24 md:py-32 bg-white border-t border-[#E5E5E5]/40 text-[#050505]" id="resources">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">

        <SectionHeader
          badge="Deep Research Environment"
          heading="Ask difficult questions."
          emphasis="Get defensible answers."
          subtext="Input deep qualitative queries to test factor allocations across active holdings in real-time."
          liveDot={true}
        />

        <div className="h-14" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 sm:p-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10"
        >
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-4 mb-6 relative z-10 text-xs font-mono text-[#737373]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#252525] border border-[#333]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#252525] border border-[#333]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#252525] border border-[#333]" />
              <span className="ml-2 text-[10px] text-[#525252]">session_id: 0x8F2A...2026</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
              SYSTEM ACTIVE
            </div>
          </div>

          <div className="rounded-2xl border border-[#1F1F1F] bg-[#121212] p-4 sm:p-5 relative z-10 shadow-inner">
            <div className="flex items-start gap-3">
              <span className="font-mono text-[10px] text-[#8A8A8A] bg-[#1A1A1A] border border-[#262626] px-2 py-1 rounded-md uppercase tracking-wider shrink-0 flex items-center gap-1.5 mt-0.5">
                <Terminal size={12} /> PROMPT
              </span>
              <p className="font-mono text-xs sm:text-sm text-[#E5E5E5] leading-relaxed pt-0.5 tracking-tight">
                {queryText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                  className="inline-block w-[2px] h-4 bg-white ml-1 align-middle"
                />
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6 relative z-10 font-mono text-[10px]">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={showAgents ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className={`rounded-xl border p-3.5 ${showAgents ? 'border-[#333] bg-[#121212] shadow-lg shadow-black/40' : 'border-[#171717] bg-[#0D0D0D]'}`}
                >
                  <div className="flex items-center justify-between text-[#8A8A8A] mb-2">
                    <span className="flex items-center gap-1.5 font-bold tracking-wider text-[9px] text-[#A3A3A3]">
                      <Icon size={12} className={showAgents ? 'text-white' : 'text-[#525252]'} />
                      {agent.label}
                    </span>
                    {showAgents ? (
                      <span className="flex items-center gap-1 text-[9px] text-white bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full">
                        <span className="h-1 w-1 rounded-full bg-white animate-ping" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-[#525252]">STANDBY</span>
                    )}
                  </div>
                  <p className="text-white font-medium text-xs tracking-tight">{showAgents ? agent.status : 'Awaiting Input...'}</p>
                  <div className="mt-2 text-[9px] text-[#737373] flex justify-between items-center pt-2 border-t border-[#1F1F1F]">
                    <span>STATUS</span>
                    <span className="text-[#D4D4D4]">{showAgents ? agent.detail : '0%'}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          
          <AnimatePresence>
            {showFindings && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 pt-6 border-t border-[#1F1F1F] relative z-10"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] text-[#8A8A8A] uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={13} className="text-white animate-pulse" />
                    Synthesis Findings & Mapped Claims
                  </div>
                  <span className="text-[10px] font-mono text-[#525252] hidden sm:inline-block">2 Evidence Points Linked</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-7 space-y-3">
                    {findings.map((find) => {
                      const isActive = activeCitation === find.id;
                      return (
                        <motion.div
                          key={find.id}
                          whileHover={{ scale: 1.01 }}
                          onMouseEnter={() => setActiveCitation(find.id)}
                          onClick={() => setActiveCitation(find.id)}
                          className={`p-4 sm:p-5 rounded-2xl border cursor-pointer ${isActive ? 'border-white/40 bg-[#161616] shadow-lg ring-1 ring-white/20' : 'border-[#1F1F1F] bg-[#121212] hover:border-[#333]'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[9px] font-bold text-[#8A8A8A] uppercase tracking-wider">{find.title}</span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${isActive ? 'bg-white/15 text-white border-white/30' : 'bg-[#1A1A1A] text-[#737373] border-[#262626]'}`}>
                              {find.tag}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#E5E5E5] leading-relaxed tracking-tight">{find.evidence}</p>
                          <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-[#1F1F1F]/60">
                            <span className="font-mono text-[9px] text-[#A3A3A3] flex items-center gap-1">
                              Mapping: <code className="text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">{find.citation}</code>
                            </span>
                            <ArrowUpRight size={12} className={isActive ? 'text-white' : 'text-[#525252]'} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="md:col-span-5 rounded-2xl border border-[#1F1F1F] bg-[#121212] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-mono text-[10px] text-[#8A8A8A] uppercase pb-3 border-b border-[#1F1F1F]">
                        <span className="flex items-center gap-1.5"><FileText size={12} /> Fact Inspector</span>
                        <span className="text-[9px] text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded">VERIFIED</span>
                      </div>
                      <div className="mt-4 font-mono text-[11px]">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeCitation}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                          >
                            <div className="text-white font-semibold text-xs border-l-2 border-white pl-2.5">
                              {findings[activeCitation].highlight}
                            </div>
                            <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] text-[#D4D4D4] italic font-sans text-xs leading-relaxed">
                              {findings[activeCitation].quote}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="mt-6 pt-3 border-t border-[#1F1F1F] flex justify-between items-center font-mono text-[9px]">
                      <span className="text-[#737373]">SOURCE TRACE:</span>
                      <span className="text-white font-bold flex items-center gap-1 tracking-wider">
                        <CheckCircle2 size={12} /> AUDIT PASS
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default ResearchDemo;