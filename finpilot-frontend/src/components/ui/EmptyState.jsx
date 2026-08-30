import React from 'react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center text-center ${
      compact ? 'py-10 px-6' : 'py-16 px-8'
    }`}
  >
    {Icon && (
      <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] border border-[#EDEDED] flex items-center justify-center mb-4">
        <Icon size={20} className="text-[#ADADAD]" strokeWidth={1.75} />
      </div>
    )}
    <p className="font-semibold text-[14px] text-[#050505]">{title}</p>
    {description && (
      <p className="text-[12.5px] text-[#8C8C8C] mt-1.5 max-w-[320px] leading-relaxed">
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] text-white text-[12.5px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
