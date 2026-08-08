import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { SectionHeader } from './shared/SectionHeader';

const people = [
  {
    id: 0,
    name: 'Marcus Vance',
    role: 'Head of Portfolio Strategy',
    company: 'Apex Capital Management',
    metric: '$12B AUM',
    focus: 'Directs equity and credit research prioritization for a $12B active book spanning eight sectors.',
    quote: 'FinPilot transformed how our investment teams conduct research. We spend less time searching facts and more time evaluating positions.',
  },
  {
    id: 1,
    name: 'Elena Cho',
    role: 'Director of Research',
    company: 'Northstar Advisors',
    metric: '45+ Analysts',
    focus: 'Leads a 45-person research desk publishing daily, source-linked coverage notes across the fund.',
    quote: 'The citation mapping layer is essential. Every metric our analysts cite traces back to its source line instantly.',
  },
  {
    id: 2,
    name: 'Daniel Reyes',
    role: 'VP Investment Analytics',
    company: 'Mercury Capital',
    metric: '2x Speedup',
    focus: 'Runs quarterly earnings-review sprints across the fund\u2019s full active equity coverage.',
    quote: 'We cut earnings-season preparation time in half. The multi-agent workspace uncovers details single analysts easily miss.',
  },
];

const AUTOPLAY_MS = 6000;
const LEN = people.length;
const CARD_WIDTH = 320;
const SLIDE_OFFSET = 296; // distance side cards sit from center — tight overlap, not a gap

const initialsOf = (name) => name.split(' ').map((n) => n[0]).join('');

const PersonaCard = ({ person, isActive }) => (
  <div
    className={`rounded-3xl p-6 sm:p-8 h-full min-h-[320px] flex flex-col transition-colors duration-300 ${
      isActive ? 'bg-[#F3F3F3] border border-[#E5E5E5]' : 'bg-[#FAFAFA] border border-[#EFEFEF]'
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center font-serif font-bold shrink-0 ${
          isActive ? 'bg-[#050505] text-white' : 'bg-[#E9E9E9] text-[#A3A3A3]'
        }`}
      >
        {initialsOf(person.name)}
      </div>
      <div className="pt-0.5">
        <p className={`text-lg font-semibold tracking-tight ${isActive ? 'text-[#050505]' : 'text-[#B3B3B3]'}`}>
          {person.name}
        </p>
        <p className={`text-xs mt-1 leading-snug ${isActive ? 'text-[#737373]' : 'text-[#C7C7C7]'}`}>
          {person.role}, {person.company}
        </p>
        <p className={`text-xs mt-0.5 ${isActive ? 'text-[#737373]' : 'text-[#C7C7C7]'}`}>{person.metric}</p>
      </div>
    </div>

    <div className="mt-6 space-y-5">
      <div>
        <p className={`font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isActive ? 'text-[#A3A3A3]' : 'text-[#D4D4D4]'}`}>
          Role focus
        </p>
        <p className={`text-sm leading-relaxed ${isActive ? 'text-[#050505]' : 'text-[#C7C7C7]'}`}>{person.focus}</p>
      </div>
      <div>
        <p className={`font-mono text-[10px] uppercase tracking-wider mb-1.5 ${isActive ? 'text-[#A3A3A3]' : 'text-[#D4D4D4]'}`}>
          In their words
        </p>
        <p className={`text-sm leading-relaxed ${isActive ? 'text-[#050505]' : 'text-[#C7C7C7]'}`}>{person.quote}</p>
      </div>
    </div>
  </div>
);

export const Testimonials = () => {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((i) => setActive(((i % LEN) + LEN) % LEN), []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % LEN), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [active, isPaused]);

  const handleAvatarKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  };

  // relative slot of each card to the active one: -1 (left), 0 (center), 1 (right)
  const relPosition = (index) => {
    const diff = (index - active + LEN) % LEN;
    if (diff === 0) return 0;
    return diff === 1 ? 1 : -1;
  };

  return (
    <section
      className="py-24 md:py-32 lg:py-36 bg-[#FAFAFA] border-t border-[#E5E5E5]/40 text-[#050505]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 lg:px-12">

        <SectionHeader
          badge="Customer Perspectives"
          heading="Trusted by active management leaders"
          liveDot={true}
        />

        <div className="h-14" />


        {/* Stage — cards live at a fixed anchor point and slide via x offset,
            so switching the active client is a real swap, not a cross-fade.
            Height is reserved by an invisible clone of the active card, so
            longer copy can never get clipped by content below. */}
        <div className="relative" style={{ perspective: '1400px' }}>
          <div aria-hidden="true" className="invisible mx-auto" style={{ width: CARD_WIDTH }}>
            <PersonaCard person={people[active]} isActive />
          </div>

          <div className="absolute inset-0">
            {people.map((person) => {
              const rel = relPosition(person.id);
              const isActive = rel === 0;
              return (
                <div
                  key={person.id}
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  style={{ width: CARD_WIDTH }}
                >
                  <motion.div
                    animate={{
                      x: rel * SLIDE_OFFSET,
                      opacity: isActive ? 1 : 0.5,
                      scale: isActive ? 1 : 0.88,
                      rotateY: isActive ? 0 : rel < 0 ? 8 : -8,
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformStyle: 'preserve-3d', zIndex: isActive ? 20 : 10 }}
                    onClick={() => !isActive && goTo(person.id)}
                    className={isActive ? '' : 'hidden sm:block cursor-pointer'}
                  >
                    <PersonaCard person={person} isActive={isActive} />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-10" />

        {/* Avatar selector + autoplay control */}
        <div className="flex items-center justify-center gap-3">
          <div role="tablist" aria-label="Select client" className="flex items-center gap-2.5">
            {people.map((person, index) => {
              const isActive = active === index;
              return (
                <button
                  key={person.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={person.name}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => goTo(index)}
                  onKeyDown={(e) => handleAvatarKeyDown(e, index)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-serif text-xs font-bold transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#050505]/40 ${
                    isActive
                      ? 'bg-[#050505] text-white ring-2 ring-offset-2 ring-[#050505]'
                      : 'bg-[#EFEFEF] text-[#A3A3A3] hover:bg-[#E5E5E5]'
                  }`}
                >
                  {initialsOf(person.name)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume autoplay' : 'Pause autoplay'}
            aria-pressed={isPaused}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[#E5E5E5] text-[#A3A3A3] hover:text-[#050505] hover:border-[#050505] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40 ml-1.5"
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>

        <div className="h-10" />

        {/* Caption */}
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="max-w-[560px] mx-auto text-center text-[15px] leading-relaxed text-[#525252]"
          >
            Having mapped how research teams actually use FinPilot, we spoke directly with the people running the
            process &mdash; here&rsquo;s what{' '}
            <span className="font-semibold text-[#050505] underline decoration-[#050505]/30 underline-offset-4">
              {people[active].name.split(' ')[0]} at {people[active].company.split(' ')[0]}
            </span>{' '}
            told us.
          </motion.p>
        </AnimatePresence>

      </div>
    </section>
  );
};

export default Testimonials;