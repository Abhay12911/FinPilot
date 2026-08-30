import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/dashboard/market-overview': 'Market Overview',
  '/dashboard/market-signals': 'Market Signals',
  '/dashboard/companies': 'Companies',
  '/dashboard/research': 'Research',
  '/dashboard/chat': 'Ask FinPilot AI',
  '/dashboard/compare': 'Compare',
  '/dashboard/ai-research': 'AI Research',
  '/dashboard/reports': 'My Reports',
  '/dashboard/personal-analyzer': 'Personal Analyzer',
  '/dashboard/portfolio': 'Portfolio',
  '/dashboard/watchlist': 'Watchlist',
  '/dashboard/market-news': 'Market News',
  '/dashboard/documents': 'Documents',
  '/dashboard/brokers': 'Broker Connect',
};

const SEARCH_RESULTS = [
  { type: 'Company', items: [{ label: 'AAPL — Apple Inc.', path: '/dashboard/companies/AAPL' }, { label: 'NVDA — NVIDIA Corporation', path: '/dashboard/companies/NVDA' }, { label: 'MSFT — Microsoft Corporation', path: '/dashboard/companies/MSFT' }] },
  { type: 'Documents', items: [{ label: 'Apple 10-K 2026', path: '/dashboard/documents' }, { label: 'NVIDIA Q2 Earnings', path: '/dashboard/documents' }] },
  { type: 'Reports', items: [{ label: 'NVIDIA Deep Research Report', path: '/dashboard/reports' }, { label: 'Apple Risk Analysis', path: '/dashboard/reports' }] },
];

export const Topbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const pathParts = location.pathname.split('/companies/');
  const basePath = pathParts.length > 1 ? '/dashboard/companies' : location.pathname;
  const tickerPart = pathParts.length > 1 ? pathParts[1] : null;
  const currentLabel = ROUTE_LABELS[basePath] || (tickerPart ? `${tickerPart} Workspace` : 'Dashboard');

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setShowResults(true);
      }
      if (e.key === 'Escape') {
        setShowResults(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (path) => {
    navigate(path);
    setShowResults(false);
    setQuery('');
  };

  const getInitials = (name) => {
    if (!name) return 'FP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <header className="h-[64px] px-6 flex items-center justify-between bg-white border-b border-[#F0F0F0] shrink-0 relative z-50">
      
      {}
      <div className="flex items-center gap-2 text-[12px] font-semibold tracking-wider text-[#8C8C8C]">
        <span>FINPILOT</span>
        <span className="text-[#D9D9D9]">›</span>
        <span className="text-[#050505]">{currentLabel.toUpperCase()}</span>
      </div>

      {}
      <div className="flex-1 max-w-lg px-6 relative" ref={searchRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
          <input 
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Search companies, filings, news..."
            className="w-full h-9 pl-10 pr-14 rounded-lg bg-[#F5F5F5] border border-transparent text-[13px] text-[#050505] placeholder-[#ADADAD] outline-none focus:bg-white focus:border-[#E5E5E5] focus:ring-2 focus:ring-[#F0F0F0] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#ADADAD] bg-white border border-[#E5E5E5] px-1.5 py-0.5 rounded shadow-sm">⌘K</kbd>
        </div>

        {}
        {showResults && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#E5E5E5] rounded-xl shadow-xl overflow-hidden z-50">
            {SEARCH_RESULTS.map(group => (
              <div key={group.type}>
                <div className="px-4 py-2 bg-[#FAFAFA] border-b border-[#F0F0F0]">
                  <span className="font-mono text-[10px] text-[#ADADAD] uppercase tracking-widest">{group.type}</span>
                </div>
                {group.items.filter(i => !query || i.label.toLowerCase().includes(query.toLowerCase())).map(item => (
                  <button
                    key={item.label}
                    onMouseDown={() => handleSelect(item.path)}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-[#050505] hover:bg-[#F5F5F5] transition-colors flex items-center gap-3"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <div className="flex items-center gap-4">
        <button className="text-[13px] font-medium text-[#595959] hover:text-[#050505] transition-colors">Help</button>
        
        <button className="relative text-[#595959] hover:text-[#050505] transition-colors p-1">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#C5221F] border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-[#F0F0F0]">
          <div className="h-7 w-7 rounded-full bg-[#050505] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">{getInitials(user?.name)}</span>
          </div>
          <span className="text-[13px] font-semibold text-[#050505]">{user?.name?.split(' ')[0] || 'Alex'}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
