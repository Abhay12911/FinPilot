import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SIGNAL = '#D8A85C';

const navItems = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources' },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-0 right-0 z-50 px-6 sm:px-10 lg:px-16 w-full"
    >
      <motion.nav
        animate={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.75)',
          borderColor: scrolled ? 'rgba(229, 229, 229, 0.9)' : 'rgba(229, 229, 229, 0.4)',
          boxShadow: scrolled
            ? '0 12px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.01)'
            : '0 4px 20px -8px rgba(0, 0, 0, 0.01)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mx-auto flex h-14 max-w-[1200px] items-center justify-between rounded-full border px-6 backdrop-blur-md transition-all duration-300"
      >
        
        <a href="#" className="flex items-center gap-2 group shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ '--tw-ring-color': `${SIGNAL}88` }}>
          <motion.div
            whileHover={{ scale: 0.95, rotate: -3 }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19L20 5M20 5H10M20 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-sm tracking-tight text-black">FinPilot.Ai</span>
          </div>
        </a>

        
        <div className="hidden md:flex items-center gap-1 relative">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
              className="relative px-3 py-1.5 text-xs font-medium text-[#525252] transition-colors hover:text-[#050505] outline-none focus-visible:text-[#050505]"
            >
              {hovered === item.label && (
                <motion.span
                  layoutId="nav-hover-pill-main"
                  className="absolute inset-0 rounded-full bg-[#FAFAFA] border"
                  style={{ borderColor: `${SIGNAL}40` }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          ))}
        </div>

        
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-medium text-[#525252] transition-colors hover:text-[#050505] outline-none focus-visible:text-[#050505]"
          >
            Sign in
          </Link>
          <motion.div
            whileHover={{ y: -0.5, boxShadow: `0 4px 14px ${SIGNAL}33` }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#050505] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#1A1A1A] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ '--tw-ring-color': `${SIGNAL}88` }}
            >
              Get started
            </Link>
          </motion.div>
        </div>

        
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#525252] hover:bg-[#F5F5F5] md:hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ '--tw-ring-color': `${SIGNAL}88` }}
          aria-label="Toggle Menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileMenuOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </motion.nav>

      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white/95 backdrop-blur-md shadow-xl md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[#525252] hover:bg-[#FAFAFA] hover:text-[#050505]"
                >
                  {item.label}
                </motion.a>
              ))}
              <hr className="my-2 border-[#E5E5E5]" />
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-[#525252]" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex w-full items-center justify-center rounded-full bg-[#050505] py-2 text-sm font-medium text-white"
              >
                Get started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;