import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight, Check } from 'lucide-react';

const LinkedinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const GithubIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const navLinks = ['How it works', 'Product', 'Pricing', 'Solutions', 'Resources'];
const companyLinks = ['Blog', 'About', 'Terms of Service', 'Privacy Policy'];

const socials = [
  { icon: MessageCircle, label: 'Discord' },
  { icon: TwitterIcon, label: 'X' },
  { icon: LinkedinIcon, label: 'LinkedIn' },
  { icon: GithubIcon, label: 'GitHub' },
];

export const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <footer className="bg-[#FAFAFA] pt-16 pb-0 border-t border-[#E5E5E5] overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left panel info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 rounded-3xl bg-[#050505] p-6 sm:p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden text-white shadow-sm"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06)_0%,transparent_55%)]" />
            {/* Soft white glow — the panel that "closes" the site keeps
                the same quiet monochrome treatment as everywhere else. */}
            <div
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full blur-3xl bg-white/[0.14]"
            />

            <div className="relative z-10 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#050505]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19L20 5M20 5H10M20 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-semibold text-base text-white tracking-tight">FinPilot.AI</span>
              
            </div>

            <div className="relative z-10 space-y-5">
              <p className="text-xl leading-snug text-white font-medium">
                Advanced financial research <br />
                <span className="text-[#8A8A8A]">backed by explainable AI.</span>
              </p>

              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-[#737373] mb-2.5">Follow updates</p>
                <div className="flex items-center gap-2">
                  {socials.map(({ icon: Icon, label }) => (
                    <motion.a
                      key={label}
                      href="#"
                      aria-label={label}
                      whileHover={{ y: -1.5, backgroundColor: '#FFFFFF', color: '#050505' }}
                      whileFocus={{ y: -1.5, backgroundColor: '#FFFFFF', color: '#050505' }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252525] bg-[#111111] text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                    >
                      <Icon size={13} />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Links panel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="lg:col-span-8 rounded-3xl bg-[#FAFAFA] border border-[#EDEDED] p-6 sm:p-8 flex flex-col justify-between"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#525252] mb-3">Workspace</h4>
                <ul className="space-y-2 text-xs text-[#050505] font-semibold">
                  {navLinks.map((link) => (
                    <li key={link}>
                      <a href="#" className="relative inline-block hover:text-[#050505] transition-colors group outline-none">
                        {link}
                        <span
                          className="absolute left-0 bottom-0 h-px w-0 bg-[#050505] transition-all duration-300 group-hover:w-full group-focus-visible:w-full"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#525252] mb-3">Enterprise</h4>
                <ul className="space-y-2 text-xs text-[#050505] font-semibold">
                  {companyLinks.map((link) => (
                    <li key={link}>
                      <a href="#" className="relative inline-block hover:text-[#050505] transition-colors group outline-none">
                        {link}
                        <span
                          className="absolute left-0 bottom-0 h-px w-0 bg-[#050505] transition-all duration-300 group-hover:w-full group-focus-visible:w-full"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="font-mono text-[10px] text-[#737373]">© 2026 FinPilot AI, Inc. All rights reserved.</p>

              <div className="w-full sm:w-auto sm:max-w-[300px]">
                <p className="text-[11px] font-semibold text-[#050505] mb-2">Subscribe to operational research reports</p>

                {submitted ? (
                  <div className="flex items-center gap-2 rounded-full border border-[#050505]/10 bg-[#050505]/[0.04] px-3.5 py-2.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#050505] text-white shrink-0">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className="text-xs font-medium text-[#050505]">You're subscribed</span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white p-1 pl-3 shadow-sm focus-within:border-[#050505] transition-colors"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter work email"
                      className="flex-1 bg-transparent text-xs text-[#050505] placeholder:text-[#A3A3A3] outline-none min-w-0"
                    />
                    <motion.button
                      type="submit"
                      whileHover={{ y: -0.5 }}
                      whileTap={{ scale: 0.98 }}
                      className="group inline-flex items-center gap-1 shrink-0 rounded-full bg-[#050505] px-3 py-1.5 text-[10px] font-medium text-white hover:bg-[#1f1f1f] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40 focus-visible:ring-offset-2"
                    >
                      Subscribe
                      <ArrowRight size={10} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </motion.button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Giant wordmark watermark — full letterforms, faded top edge instead of a hard mid-letter crop */}
      <div className="relative h-[110px] sm:h-[140px] mt-10 select-none pointer-events-none">
        <div
          className="absolute inset-x-0 top-0 flex justify-center overflow-hidden"
          style={{
            height: '100%',
            maskImage: 'linear-gradient(to bottom, transparent, black 35%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%)',
          }}
        >
          <span className="text-[13vw] sm:text-[11vw] font-semibold leading-none tracking-tighter text-[#050505] opacity-[0.065] whitespace-nowrap -mt-[2vw]">
            FINPILOT. AI
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;