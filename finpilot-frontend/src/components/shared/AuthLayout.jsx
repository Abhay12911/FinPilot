import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

import loginImage from '../../assets/auth-login.png';
import signupImage from '../../assets/auth-signup.png';

const IMAGES = {
  login: loginImage,
  signup: signupImage,
};

const COPY = {
  login: {
    eyebrow: 'Session resumed',
    heading: 'Every number, already reasoned through.',
    body: 'Sign back in to pick up your models, forecasts and open questions exactly where you left them.',
  },
  signup: {
    eyebrow: 'New workspace',
    heading: 'Start reasoning about your money with real rigor.',
    body: 'A few details and your workspace is live — models, scenarios and a clean audit trail from day one.',
  },
};

export default function AuthLayout({ children, title, subtitle, variant }) {
  const location = useLocation();
  const resolved =
    variant ||
    (/signup|register/i.test(location.pathname) ? 'signup' : 'login');
  const copy = COPY[resolved];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] font-sans selection:bg-[#050505] selection:text-white">
      
      <style>{`
        .auth-scroll::-webkit-scrollbar { display: none; }
        .auth-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      
      <div className="relative w-full lg:w-1/2 h-[320px] sm:h-[360px] lg:h-screen lg:sticky lg:top-0 lg:self-start overflow-hidden bg-[#0A0A0A] shrink-0 border-r border-white/5">
        <motion.img
          key={resolved}
          src={IMAGES[resolved]}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 h-full w-full object-cover grayscale"
        />

        
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#0A0A0A]/95 via-[#0A0A0A]/50 to-transparent pointer-events-none" />
        
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0A0A0A]/45 to-transparent pointer-events-none" />

        <Link
          to="/"
          className="absolute top-5 left-5 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full font-semibold text-xs text-white transition-all shadow-sm active:scale-95 hover:bg-white/15 bg-black backdrop-blur-sm border border-white/20"
        >
          <ChevronLeft className="w-3.5 h-3.5 " /> Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="absolute bottom-8 left-8 right-8 sm:bottom-10 sm:left-10 sm:right-10 z-10 flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19L20 5M20 5H10M20 5V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">FinPilot.Ai</span>
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
            {copy.eyebrow}
          </span>

          <h2 className="text-white text-xl sm:text-2xl font-semibold leading-snug tracking-tight max-w-sm">
            {copy.heading}
          </h2>

          <p className="text-[#B8B8B8] text-sm leading-relaxed max-w-sm">
            {copy.body}
          </p>
        </motion.div>
      </div>

      
      <div className="auth-scroll flex-1 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 py-10 sm:py-12 lg:h-screen lg:overflow-y-auto bg-[#FAFAFA]">
        <div className="w-full max-w-[400px] mx-auto">
          {title && (
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-2 text-[#050505] text-center sm:text-left"
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <p className="text-[14px] leading-relaxed text-[#525252] mb-8 text-center sm:text-left">
              {subtitle}
            </p>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({ label, id, error, placeholder, rightLabel, endAdornment, className = '', style, ...rest }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold text-[#525252] block">
          {label}
        </label>
        {rightLabel}
      </div>

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm text-[#050505] placeholder-[#A3A3A3] outline-none transition-all duration-200 focus:border-[#050505] focus:ring-2 focus:ring-[#050505]/20 shadow-xs ${endAdornment ? 'pr-11' : ''} ${className}`}
          style={{
            borderColor: error ? '#050505' : '#E5E5E5',
            ...style,
          }}
          {...rest}
        />
        {endAdornment && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-medium text-[#050505]">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-[#E5E5E5]" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A3A3A3]">
        Or
      </span>
      <div className="flex-1 h-px bg-[#E5E5E5]" />
    </div>
  );
}