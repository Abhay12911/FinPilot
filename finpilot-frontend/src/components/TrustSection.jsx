import React from 'react';
import { motion } from 'framer-motion';

const logos = ['NORTHSTAR', 'MERCURY CAPITAL', 'ARC VENTURES', 'SUMMIT PARTNERS', 'VERTEX LABS', 'HALSTEAD & CO', 'PIONEER FUND'];

export const TrustSection = () => {
  const doubled = [...logos, ...logos];

  return (
    <section className="py-14 md:py-20 border-y border-[#E5E5E5]/40 bg-[#FFFFFF] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16 text-center mb-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs uppercase tracking-widest text-[#737373]"
        >
          Built for teams that make decisions where the numbers matter
        </motion.p>
      </div>

      
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />

        <motion.div
          className="flex gap-16 md:gap-20 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {doubled.map((name, i) => (
            <span
              key={i}
              className="font-mono font-bold text-lg md:text-xl tracking-tighter text-[#050505] opacity-35 hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};