import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard/market-overview': 'Market Dashboard',
  '/dashboard/chat': 'AI Chat',
  '/dashboard/ai-research': 'AI Research',
};

export default function Topbar({ onMenuClick = () => {} }) {
  const { user } = useAuth();
  const location = useLocation();
  const name = user?.name?.split(' ')[0] || 'User';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#F0F0F0] bg-white px-4 md:px-6">
      <button onClick={onMenuClick} aria-label="Open navigation menu" className="rounded-lg p-2 text-[#595959] hover:bg-[#F5F5F5] md:hidden">
        <Menu size={19} />
      </button>
      <h2 className="hidden text-xs font-semibold tracking-wider text-[#050505] sm:block">{PAGE_TITLES[location.pathname] || 'FinPilot'}</h2>
      <span className="sm:hidden" />
      <span className="text-sm font-medium text-[#404040]">{name}</span>
    </header>
  );
}
