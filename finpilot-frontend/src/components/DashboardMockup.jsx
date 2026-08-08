import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate, AnimatePresence } from 'framer-motion';
import {
  Search, LayoutDashboard, Briefcase, SearchCode, LineChart,
  FileText, Terminal, Bookmark, Settings, Sparkles, Menu, X,
} from 'lucide-react';

// Counts a number up from 0 once it scrolls into view
const CountUp = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, value, decimals]);

  return (
    <span ref={ref}>
      {prefix}
      {Number(display).toLocaleString()}
      {suffix}
    </span>
  );
};

const cardReveal = {
  hidden: { opacity: 0, y: 10 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const NAV_ITEMS = [
  { id: 'Overview', icon: LayoutDashboard },
  { id: 'Portfolio', icon: Briefcase },
  { id: 'Research', icon: SearchCode },
  { id: 'Markets', icon: LineChart },
  { id: 'Documents', icon: FileText },
  { id: 'Reports', icon: Terminal },
  { id: 'Watchlist', icon: Bookmark },
];

const AGENTS = [
  { name: 'Financial Agent' },
  { name: 'Market Agent' },
  { name: 'News Agent' },
  { name: 'Risk Agent' },
];

export const DashboardMockup = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [navOpen, setNavOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const chartRef = useRef(null);
  const chartInView = useInView(chartRef, { once: true, margin: '-60px' });

  return (
    <div className="w-full rounded-2xl md:rounded-3xl border border-[#E5E5E5] bg-[#FFFFFF] p-2 sm:p-3 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E5E5E5] px-3 sm:px-4 py-3 bg-[#FAFAFA] rounded-t-xl md:rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setNavOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-7 w-7 rounded-md border border-[#E5E5E5] bg-white text-[#525252] shrink-0"
            aria-label="Toggle navigation"
          >
            {navOpen ? <X size={14} /> : <Menu size={14} />}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
            <div className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
            <div className="h-3 w-3 rounded-full bg-[#E5E5E5]" />
          </div>
          <span className="font-mono text-[11px] sm:text-xs font-medium text-[#737373] truncate">
            FinPilot <span className="hidden sm:inline">Workspace v2.4 Enterprise</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] px-3 py-1 text-xs text-[#737373] w-72 shrink-0">
          <Search size={14} />
          <span>Search company, ticker, or SEC filing...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5]">⌘K</kbd>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-2 font-mono text-xs text-[#525252]">
            <span className="text-[#050505] font-semibold">$AAPL</span>
            <span className="text-[#050505] font-semibold">$NVDA</span>
            <span className="text-[#050505] font-semibold">$MSFT</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#050505] animate-pulse" />
            <span className="font-mono text-xs font-medium text-[#525252]">AI Operational</span>
          </div>
          <div className="h-6 w-6 rounded-full bg-[#050505] text-white flex items-center justify-center text-[10px] font-bold shrink-0">AX</div>
        </div>
      </div>

      {/* Mobile search (own row, only shows below lg) */}
      <div className="lg:hidden flex items-center gap-2 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 mx-1 mt-2 text-xs text-[#737373]">
        <Search size={14} className="shrink-0" />
        <span className="truncate">Search company, ticker, or SEC filing...</span>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {navOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden mx-1 mt-2 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]"
          >
            <div className="p-2 grid grid-cols-2 gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setNavOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive ? 'bg-[#050505] text-white font-semibold' : 'text-[#525252] bg-white border border-[#E5E5E5]'
                    }`}
                  >
                    <Icon size={14} />
                    {item.id}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tablet/desktop horizontal tab strip (shows between mobile drawer and full sidebar) */}
      <div className="hidden sm:flex md:hidden items-center gap-1 overflow-x-auto px-1 pt-2 pb-1 -mb-1 no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                isActive ? 'bg-[#050505] text-white font-semibold' : 'text-[#525252] hover:text-[#050505] hover:bg-[#F5F5F5]'
              }`}
            >
              <Icon size={13} />
              {item.id}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:min-h-[560px]">
        {/* Sidebar (desktop only) */}
        <div className="hidden md:flex md:col-span-2 border-r border-[#E5E5E5] p-3 flex-col justify-between bg-[#FAFAFA]/50">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3]">Navigation</div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-[#050505] shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-2.5 ${isActive ? 'text-white font-semibold' : 'text-[#525252] hover:text-[#050505]'}`}>
                    <Icon size={15} />
                    {item.id}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-xs text-[#737373]">
              <Settings size={14} />
              <span>Workspace Settings</span>
            </div>
          </div>
        </div>

        {/* Center Panel */}
        <div className="col-span-12 md:col-span-7 p-3 sm:p-4 md:p-6 flex flex-col justify-between gap-4 sm:gap-6">
          <div className="flex items-start justify-between gap-2 pt-1 md:pt-0">
            <div className="min-w-0">
              <p className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[#737373]">Welcome back</p>
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-[#050505] truncate">Good morning, Alex</h3>
            </div>
            <span className="font-mono text-[10px] sm:text-xs text-[#737373] shrink-0 pt-1">Updated 2m ago</span>
          </div>

          {/* Metrics with count-up */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {[
              { label: 'PORTFOLIO VALUE', val: <><CountUp value={4280420} prefix="$" /></>, sub: '+12.4% YTD' },
              { label: "TODAY'S RETURN", val: <><CountUp value={18240} prefix="+$" /></>, sub: '+0.82% vs benchmark' },
              { label: 'RISK SCORE', val: 'Low', sub: 'Beta 0.84' },
              { label: 'AI CONFIDENCE', val: <><CountUp value={94} suffix="%" /></>, sub: '142 citations checked' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                animate="show"
                variants={cardReveal}
                whileHover={{ y: -2, borderColor: '#050505' }}
                className="rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3 sm:p-3.5 transition-colors min-w-0"
              >
                <p className="font-mono text-[9px] sm:text-[10px] text-[#737373] tracking-wide truncate">{stat.label}</p>
                <p className="mt-1 font-mono text-base sm:text-lg font-bold text-[#050505] tracking-tight truncate">{stat.val}</p>
                <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#525252] truncate">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart */}
          <div ref={chartRef} className="rounded-xl border border-[#E5E5E5] bg-[#FFFFFF] p-3 sm:p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-[#050505]">Portfolio vs S&P 500</h4>
                <p className="hidden sm:block text-[11px] text-[#737373]">Consolidated performance across all active holdings</p>
              </div>
              <div className="flex gap-1 font-mono text-[10px] shrink-0">
                <span className="px-2 py-0.5 rounded bg-[#050505] text-white">1D</span>
                <span className="px-2 py-0.5 rounded text-[#737373] hover:bg-[#F5F5F5] cursor-pointer">1M</span>
                <span className="px-2 py-0.5 rounded text-[#737373] hover:bg-[#F5F5F5] cursor-pointer">1Y</span>
              </div>
            </div>

            <div className="my-3 sm:my-4 h-24 sm:h-32 w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="400" y2="20" stroke="#F5F5F5" strokeWidth="1" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#F5F5F5" strokeWidth="1" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#F5F5F5" strokeWidth="1" />

                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={chartInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  d="M 0 70 Q 100 65, 200 45 T 400 30"
                  fill="none"
                  stroke="#A3A3A3"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={chartInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  d="M 0 80 Q 100 70, 180 30 T 400 15"
                  fill="none"
                  stroke="#050505"
                  strokeWidth="2.5"
                />

                <motion.circle
                  initial={{ opacity: 0, scale: 0 }}
                  animate={chartInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.4, duration: 0.3 }}
                  cx="400" cy="15" r="4" fill="#050505"
                />
              </svg>
            </div>

            <div className="flex justify-between font-mono text-[9px] sm:text-[10px] text-[#737373]">
              <span>JAN 2026</span>
              <span>MAR 2026</span>
              <span>MAY 2026</span>
              <span>AUG 2026</span>
            </div>
          </div>
        </div>

        {/* Right Panel — collapsible on mobile/tablet, static on desktop */}
        <div className="md:col-span-3 border-t md:border-t-0 md:border-l border-[#E5E5E5] bg-[#FAFAFA]/50 flex flex-col">
          {/* Mobile/tablet collapsible header */}
          <button
            onClick={() => setAgentsOpen((v) => !v)}
            className="md:hidden flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#050505]" />
              <span className="text-xs font-semibold text-[#050505]">AI Multi-Agent Engine</span>
            </div>
            <span className="font-mono text-[10px] text-[#737373]">{agentsOpen ? 'HIDE' : 'SHOW'}</span>
          </button>

          <div
            className={`overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] grid md:!grid-rows-[1fr] ${
              agentsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="min-h-0 overflow-hidden md:overflow-visible">
              <div className="p-4 pt-0 md:pt-4 space-y-4">
                  <div>
                    <div className="hidden md:flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-[#050505]">AI Multi-Agent Engine</h4>
                      <span className="font-mono text-[10px] text-[#737373]">4 AGENTS</span>
                    </div>

                    <p className="font-mono text-[10px] uppercase text-[#737373] mb-3">Analyzing 142 documents</p>

                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                      {AGENTS.map((agent, i) => (
                        <motion.div
                          key={i}
                          custom={i}
                          initial="hidden"
                          animate="show"
                          variants={cardReveal}
                          className="flex items-center justify-between rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] p-2.5"
                        >
                          <span className="text-xs font-medium text-[#050505] truncate">{agent.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#050505] animate-pulse" />
                            <span className="hidden lg:inline font-mono text-[10px] text-[#525252]">Active</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="rounded-xl border border-[#E5E5E5] bg-[#FFFFFF] p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#050505]">AI Synthesis</span>
                      <Sparkles size={12} className="text-[#050505]" />
                    </div>
                    <p className="text-xs text-[#525252] leading-snug">
                      "Revenue growth remains resilient despite margin compression in semiconductor holdings."
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="font-mono text-[9px] bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#525252]">SEC 10-K</span>
                      <span className="font-mono text-[9px] bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#525252]">Q2 Call</span>
                      <span className="font-mono text-[9px] bg-[#F5F5F5] border border-[#E5E5E5] px-1.5 py-0.5 rounded text-[#525252]">Bloomberg</span>
                    </div>
                  </motion.div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg bg-[#050505] py-2.5 font-mono text-xs font-medium text-white hover:bg-[#181818] transition-colors"
                  >
                    EXPORT ANALYSIS (.PDF)
                  </motion.button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMockup;