import React from 'react';
import { X, HelpCircle, Book, MessageSquare, ExternalLink, FileText, Zap } from 'lucide-react';

const HELP_SECTIONS = [
  {
    icon: Zap,
    title: 'Quick Start',
    items: [
      { label: 'Getting started with FinPilot', href: '#' },
      { label: 'How to add your first holding', href: '#' },
      { label: 'Setting up your watchlist', href: '#' },
    ]
  },
  {
    icon: Book,
    title: 'Research & AI',
    items: [
      { label: 'How to run a deep research report', href: '#' },
      { label: 'Understanding AI signals and confidence', href: '#' },
      { label: 'Citing sources and audit trails', href: '#' },
    ]
  },
  {
    icon: FileText,
    title: 'Portfolio',
    items: [
      { label: 'Importing holdings from a broker', href: '#' },
      { label: 'Understanding P&L calculations', href: '#' },
      { label: 'Personal Analyzer explained', href: '#' },
    ]
  },
];

export const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl border border-[#E5E5E5] w-full max-w-lg flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-[#050505]" />
            <h2 className="font-bold text-[15px] text-[#050505]">Help & Support</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8C8C8C] hover:text-[#050505] transition-colors cursor-pointer p-1 rounded hover:bg-[#F5F5F5]"
          >
            <X size={16} />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {HELP_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-[#8C8C8C]" />
                  <h3 className="font-mono text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider">
                    {section.title}
                  </h3>
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-transparent hover:border-[#E5E5E5] hover:bg-[#FAFAFA] transition-all group"
                    >
                      <span className="text-[13px] font-medium text-[#050505]">{item.label}</span>
                      <ExternalLink size={12} className="text-[#ADADAD] group-hover:text-[#595959] transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {}
        <div className="px-5 py-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#050505]">Still need help?</p>
            <p className="text-[11px] text-[#8C8C8C]">Contact our team or start a live chat.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#050505] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1A1A1A] transition-colors cursor-pointer">
            <MessageSquare size={13} />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
