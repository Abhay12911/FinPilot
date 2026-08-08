import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import ctaImage from '../assets/cta-bg.png';

export const FinalCTA = () => {
  return (
    <section className="py-20 md:py-28 bg-[#FFFFFF] border-t border-[#E5E5E5]">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 lg:px-16">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-[#1A1A1A] bg-black p-8 sm:p-14 md:p-16 text-center text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] relative overflow-hidden"
        >
          
          <img
            src={ctaImage}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 grayscale"
          />

          
          <div className="pointer-events-none absolute inset-0 bg-black/55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,rgba(0,0,0,0.75),transparent_75%)]" />

          
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 h-[260px] w-[260px] rounded-full blur-[100px] bg-white/25"
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#D4D4D4]">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
              Ready when you are
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.04em] leading-tight text-balance">
              Make decisions with complete clarity.
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed max-w-lg mx-auto text-balance">
              Bring research, documents, and calculations into one financial reasoning workspace.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full"
            >
              <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Link
                  to="/signup"
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-gray-100"
                >
                  Get started free
                  <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>

              <motion.a
                href="#sales"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-[#252525] bg-[#111111] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#1A1A1A] hover:border-[#333] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Talk to sales
              </motion.a>
            </motion.div>

            <p className="pt-1 font-mono text-[10px] uppercase tracking-wider text-[#737373]">
              No credit card required &middot; Cancel anytime
            </p>
          </div>

        </motion.div>

      </div>
    </section>
  );
};

export default FinalCTA;