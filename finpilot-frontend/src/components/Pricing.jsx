import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const PLANS = [
  {
    key: 'starter',
    name: 'STARTER',
    price: '$0',
    cadence: '/ forever',
    desc: 'For exploring core capabilities.',
    features: ['5 SEC Filing Searches/mo', 'Basic AI Synthesis Answers', 'Standard Citation Mappings'],
    cta: 'Get started free',
    dark: false,
    featured: false,
  },
  {
    key: 'pro',
    name: 'PRO',
    priceAnnual: '$55',
    priceMonthly: '$69',
    cadence: '/ user / month',
    desc: 'For investment managers and teams.',
    features: [
      'Unlimited SEC & Transcript Searches',
      'Multi-Agent Swarm Analytics',
      'Live Portfolio Risk & Exposure Tracking',
      'Audit-Ready PDF & Excel Exporting',
    ],
    cta: 'Start 14-day free trial',
    dark: false,
    featured: true,
  },
  {
    key: 'enterprise',
    name: 'ENTERPRISE',
    price: 'Custom',
    cadence: '',
    desc: 'For institutional hedge funds.',
    features: [
      'Dedicated Fine-Tuned LLMs',
      'Private VPC Deployments',
      'SLA & SOC2 Guarantees',
      'Unlimited API Key Access',
    ],
    cta: 'Talk to sales',
    dark: true,
    featured: false,
  },
];

const PlanCard = ({ plan, annual, i }) => {
  const price = plan.priceAnnual ? (annual ? plan.priceAnnual : plan.priceMonthly) : plan.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: i * 0.08 }}
      whileHover={{ y: plan.featured ? -6 : -2 }}
      className={`relative rounded-3xl border p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
        plan.dark
          ? 'border-black bg-black text-white shadow-2xs'
          : plan.featured
          ? 'border-black bg-white shadow-lg lg:-translate-y-3'
          : 'border-[#E5E5E5] bg-white shadow-2xs'
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-3.5 left-6 inline-flex items-center gap-1 rounded-full bg-black text-white text-[9px] font-mono font-bold uppercase px-3 py-0.5 tracking-wider border border-[#252525]">
          <Sparkles size={10} /> Popular Plan
        </div>
      )}

      <div>
        <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${plan.dark ? 'text-[#A3A3A3]' : 'text-[#737373]'}`}>
          {plan.name}
        </span>

        <div className="mt-4 flex items-baseline gap-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={price}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`font-mono text-3xl font-bold tracking-tight ${plan.dark ? 'text-white' : 'text-[#050505]'}`}
            >
              {price}
            </motion.span>
          </AnimatePresence>
          <span className={`text-[10px] font-mono ${plan.dark ? 'text-[#A3A3A3]' : 'text-[#737373]'}`}>{plan.cadence}</span>
        </div>

        <p className={`mt-2 text-xs leading-relaxed ${plan.dark ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}>{plan.desc}</p>

        <ul className={`mt-6 space-y-3 font-mono text-[10px] border-t pt-5 ${plan.dark ? 'border-[#222] text-[#E5E5E5]' : 'border-[#F0F0F0] text-[#525252]'}`}>
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check size={11} className={`shrink-0 mt-0.5 ${plan.dark ? 'text-white' : 'text-[#050505]'}`} />
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        className={`mt-8 w-full rounded-full py-2.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
          plan.dark
            ? 'bg-white text-black hover:bg-[#E5E5E5]'
            : plan.featured
            ? 'bg-[#050505] text-white hover:bg-[#1f1f1f]'
            : 'border border-[#E5E5E5] bg-white text-[#050505] hover:bg-[#FAFAFA]'
        }`}
      >
        {plan.cta}
      </button>
    </motion.div>
  );
};

export const Pricing = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-16 sm:py-20 md:py-28 lg:py-32 bg-[#FFFFFF] border-t border-[#E5E5E5]" id="pricing">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-10 lg:px-16">
        <SectionHeader
          badge="Transparent Pricing"
          heading="Scale intelligence as your"
          emphasis="team grows."
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className={`text-xs ${!annual ? 'font-semibold text-[#050505]' : 'text-[#737373]'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            className="relative h-6 w-11 rounded-full bg-[#050505] p-0.5 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle annual billing"
          >
            <motion.div
              animate={{ x: annual ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="h-5 w-5 rounded-full bg-white shadow-2xs"
            />
          </button>
          <span className={`text-xs flex items-center gap-1.5 ${annual ? 'font-semibold text-[#050505]' : 'text-[#737373]'}`}>
            Annual
            <span className="font-mono text-[9px] text-[#050505] font-bold bg-[#F2F2F2] px-1.5 py-0.5 rounded border border-[#DCDCDC]">
              SAVE 20%
            </span>
          </span>
        </div>

        <div className="h-10 sm:h-14 md:h-16" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.key} plan={plan} annual={annual} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;