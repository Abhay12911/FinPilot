import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMockup } from './DashboardMockup';
import bgImage from '../assets/bg.png';

export const Hero = () => {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-[#FAFAFA] flex flex-col"
    >
      {/* Background image — sits behind everything, faded so it reads as
          atmosphere rather than a competing visual */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <img
          src={bgImage}
          alt=""
          className="h-full w-full object-cover"
        />
        {/* Soft fade at the very bottom so it blends smoothly into the next section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAFAFA]" />
      </div>

      {/* Hero Content Container - Centered Alignment */}
      <div className="relative z-10 mx-auto w-full max-w-[1360px] px-6 sm:px-10 lg:px-16 pt-24 lg:pt-32 pb-12 flex flex-col items-center">

        {/* Content Group (Centered) */}
        <div className="flex flex-col items-center text-center max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-white px-3 py-1 shadow-2xs"
          >
            <span className="h-1 w-1 rounded-full bg-[#050505] animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#525252]">
              FinPilot AI Workspace
            </span>
          </motion.div>

          {/* Headline - Product Sans */}
          <h1 className="mt-5 text-center text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-semibold tracking-tight text-[#050505] leading-[1.1] text-balance">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="block sm:whitespace-nowrap"
            >
              Synthesize financial data.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="block text-[#737373]"
            >
              Accelerate decisions.
            </motion.span>
          </h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-5 max-w-[620px] text-xs sm:text-sm lg:text-base leading-relaxed text-[#525252] text-balance"
          >
            Unify SEC filings, transcripts, and custom models in an audited workspace. Powered by multi-agent reasoning, built for investment research.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-6 flex flex-row items-center justify-center gap-3 w-full"
          >
            <motion.div whileHover={{ y: -0.5 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/signup"
                className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#050505] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1A1A1A]"
              >
                Get started free
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.a
              href="#demo"
              whileHover={{ y: -0.5 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#DCDCDC] bg-white px-5 text-xs sm:text-sm font-semibold text-[#525252] shadow-2xs transition-colors hover:bg-[#F5F5F5] hover:text-black"
            >
              <Play size={9} fill="currentColor" />
              Book a demo
            </motion.a>
          </motion.div>
        </div>

        {/* Dashboard Mockup — only the top of it shows here; it's a teaser, not the full view */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-12 lg:mt-14 relative max-h-[340px] sm:max-h-[400px] lg:max-h-[460px] overflow-hidden rounded-t-[20px] md:rounded-t-[24px]"
        >
          <div className="rounded-t-[20px] md:rounded-t-[24px] border-t border-x border-[#DCDCDC] bg-[#F2F2F2] p-1.5 pb-0 shadow-[0_15px_40px_rgba(0,0,0,0.04)]">
            <div className="overflow-hidden rounded-t-[14px] md:rounded-t-[18px] border-t border-x border-[#E4E4E4] bg-white">
              <DashboardMockup />
            </div>
          </div>

          {/* Fade-out so the cropped dashboard blends into the page instead of cutting off abruptly */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FAFAFA] to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;