import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate } from 'framer-motion';

export const CountUp = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
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

export const MetricCard = ({ title, value, prefix, suffix, subtext, subtextRight, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, borderColor: '#050505' }}
      className="rounded-xl border border-[#E5E5E5] bg-white p-4 sm:p-5 transition-colors min-w-0 shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-mono text-[10px] text-[#8C8C8C] tracking-wider uppercase truncate">{title}</p>
        {subtextRight && (
          <span className="font-mono text-[10px] bg-[#F5F5F5] text-[#050505] px-1.5 py-0.5 rounded font-semibold">
            {subtextRight}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-[#050505] tracking-tight truncate mb-1">
        {typeof value === 'number' ? (
          <CountUp value={value} prefix={prefix} suffix={suffix} />
        ) : (
          <>{prefix}{value}{suffix}</>
        )}
      </p>
      {subtext && (
        <p className="text-[11px] text-[#8C8C8C] truncate">{subtext}</p>
      )}
    </motion.div>
  );
};

export default MetricCard;
