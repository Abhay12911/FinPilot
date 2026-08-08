import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp, viewportOnce } from './motion';


export const SectionHeader = ({
  badge,
  heading,
  emphasis,
  subtext,
  dark = false,
  maxWidth = 'max-w-3xl',
  liveDot = false, // only true for sections describing a live/automated system (Hero, HowItWorks, ResearchDemo) — styled identically everywhere it's used
}) => {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={`text-center mx-auto ${maxWidth}`}
    >
      {badge && (
        <span
          className={`font-mono text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1 rounded-full border inline-flex items-center gap-2 ${
            dark
              ? 'text-[#A3A3A3] border-[#252525] bg-[#111111]'
              : 'text-[#737373] border-[#E5E5E5] bg-white'
          }`}
        >
          {liveDot && (
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${dark ? 'bg-white' : 'bg-black'}`}
            />
          )}
          {badge}
        </span>
      )}

      <h2
        className={`mt-5 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-balance ${
          dark ? 'text-white' : 'text-[#050505]'
        }`}
      >
        {heading}
        {emphasis && (
          <>
            {' '}
            <span className={dark ? 'text-[#8A8A8A]' : 'text-[#A3A3A3]'}>{emphasis}</span>
          </>
        )}
      </h2>

      {subtext && (
        <p
          className={`mt-3 text-sm leading-relaxed max-w-lg mx-auto ${
            dark ? 'text-[#A3A3A3]' : 'text-[#525252]'
          }`}
        >
          {subtext}
        </p>
      )}
    </motion.div>
  );
};