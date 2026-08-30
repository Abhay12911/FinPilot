import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, LineChart, Activity, Briefcase, BarChart2, Sparkles, 
  Bookmark, Newspaper, FileText, Terminal, Settings, HelpCircle, 
  LogOut, Zap, MessageSquare, Link2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
    ]
  },
  {
    title: 'RESEARCH',
    items: [
      { name: 'Research', path: '/dashboard/research', icon: MessageSquare },
      { name: 'Companies', path: '/dashboard/companies', icon: Briefcase },
      { name: 'Compare', path: '/dashboard/compare', icon: BarChart2 },
      { name: 'AI Research', path: '/dashboard/ai-research', icon: Sparkles },
    ]
  },
  {
    title: 'PORTFOLIO',
    items: [
      { name: 'Portfolio', path: '/dashboard/portfolio', icon: LineChart },
      { name: 'Watchlist', path: '/dashboard/watchlist', icon: Bookmark },
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Market News', path: '/dashboard/market-news', icon: Newspaper },
      { name: 'Documents', path: '/dashboard/documents', icon: FileText },
    ]
  },
  {
    title: 'REPORTS',
    items: [
      { name: 'My Reports', path: '/dashboard/reports', icon: Terminal },
    ]
  }
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'FP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <aside className="w-[240px] h-full flex flex-col bg-white border-r border-[#F0F0F0] shrink-0">
      {}
      <div className="px-5 py-4 flex items-center gap-2.5 border-b border-[#F0F0F0]">
        <div className="h-7 w-7 rounded-lg bg-[#050505] flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-[17px] tracking-tight text-[#050505]">FinPilot AI</span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="px-2 mb-1.5 text-[10px] font-semibold text-[#ADADAD] tracking-widest uppercase">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      isActive 
                        ? 'bg-[#050505] text-white shadow-sm' 
                        : 'text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505]'
                    }`
                  }
                >
                  <item.icon size={15} strokeWidth={2} />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="px-3 py-3 border-t border-[#F0F0F0] space-y-0.5">
        <NavLink
          to="/dashboard/brokers"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
              isActive ? 'bg-[#050505] text-white' : 'text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505]'
            }`
          }
        >
          <Link2 size={15} strokeWidth={2} />
          Broker Connect
        </NavLink>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505] transition-colors">
          <Settings size={15} strokeWidth={2} />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505] transition-colors">
          <HelpCircle size={15} strokeWidth={2} />
          Help & Support
        </button>
        
        {}
        <div className="mt-3 pt-3 border-t border-[#F0F0F0] flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 bg-transparent border-0 outline-none w-full mr-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#050505] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">{getInitials(user?.name)}</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[13px] font-semibold text-[#050505] leading-tight truncate">{user?.name || 'Alex Chen'}</span>
              <span className="text-[10px] text-[#8C8C8C] leading-tight truncate">{user?.role === 'recruiter' ? 'Professional' : 'Retail Investor'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-[#ADADAD] hover:text-[#050505] transition-colors rounded-md hover:bg-[#F5F5F5] shrink-0"
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
