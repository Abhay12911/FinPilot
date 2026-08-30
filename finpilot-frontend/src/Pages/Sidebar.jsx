import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LineChart, Activity, Briefcase, BarChart2, Sparkles,
  Bookmark, Newspaper, FileText, Terminal, Settings, HelpCircle,
  LogOut, Zap, Link2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SettingsModal } from '../components/ui/SettingsModal';
import { HelpModal } from '../components/ui/HelpModal';

const NAV_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
      { name: 'Market Overview', path: '/dashboard/market-overview', icon: Activity },
    ]
  },
  {
    title: 'RESEARCH',
    items: [
      { name: 'Research', path: '/dashboard/research', icon: BarChart2 },
      { name: 'Companies', path: '/dashboard/companies', icon: Briefcase },
      { name: 'Compare', path: '/dashboard/compare', icon: LineChart },
      { name: 'AI Research', path: '/dashboard/ai-research', icon: Sparkles },
    ]
  },
  {
    title: 'PORTFOLIO',
    items: [
      { name: 'Portfolio', path: '/dashboard/portfolio', icon: LineChart },
      { name: 'Watchlist', path: '/dashboard/watchlist', icon: Bookmark },
      { name: 'Personal Analyzer', path: '/dashboard/personal-analyzer', icon: Activity },
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

export const Sidebar = ({ open = false, onClose = () => { }, collapsed = false, onToggleCollapse = () => { } }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'FP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const displayName = user?.name
    ? (user.name.includes('@') ? user.name.split('@')[0] : user.name)
    : 'User';

  return (
    <>
      {}
      {open && (
        <div
          className="fixed inset-0 bg-[#050505]/20 z-40 md:hidden backdrop-blur-xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 h-full flex flex-col bg-white border-r border-[#E5E5E5] shrink-0 transform transition-all duration-300 ease-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
        aria-label="Primary navigation"
      >
        {}
        <div className="h-[64px] px-4 flex items-center justify-between border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-[#050505] flex items-center justify-center shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <span className="font-bold text-[15px] tracking-tight text-[#050505] truncate">FinPilot AI</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex items-center justify-center h-6 w-6 rounded-md border border-[#E5E5E5] bg-white text-[#8C8C8C] hover:text-[#050505] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>

            {}
            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="md:hidden p-1.5 text-[#8C8C8C] hover:text-[#050505] hover:bg-[#FAFAFA] rounded-md transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 no-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!collapsed ? (
                <h3 className="px-2 mb-1.5 text-[9px] font-mono font-bold text-[#ADADAD] tracking-widest uppercase">
                  {group.title}
                </h3>
              ) : (
                <div className="h-2" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center rounded-lg text-[13px] font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] ${
                        collapsed ? 'justify-center p-2' : 'px-3 py-2 gap-3'
                      } ${
                        isActive
                          ? 'bg-[#F5F5F5] text-[#050505]'
                          : 'text-[#595959] hover:bg-[#FAFAFA] hover:text-[#050505]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={15}
                          strokeWidth={2}
                          className={`shrink-0 transition-transform duration-150 ${
                            isActive ? 'text-[#050505]' : 'text-[#8C8C8C] group-hover:text-[#050505]'
                          }`}
                        />
                        {!collapsed && <span>{item.name}</span>}

                        {}
                        {collapsed && (
                          <div className="absolute left-[80px] bg-[#050505] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap font-sans">
                            {item.name}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="px-3 py-3 border-t border-[#E5E5E5] space-y-0.5 bg-white">
          <NavLink
            to="/dashboard/brokers"
            onClick={onClose}
            className={({ isActive }) =>
              `group relative flex items-center rounded-lg text-[13px] font-semibold transition-all ${
                collapsed ? 'justify-center p-2' : 'px-3 py-2 gap-3'
              } ${isActive ? 'bg-[#F5F5F5] text-[#050505]' : 'text-[#595959] hover:bg-[#FAFAFA] hover:text-[#050505]'}`
            }
          >
            {({ isActive }) => (
              <>
                <Link2 size={15} strokeWidth={2} className={isActive ? 'text-[#050505]' : 'text-[#8C8C8C] group-hover:text-[#050505]'} />
                {!collapsed && <span>Broker Connect</span>}
                {collapsed && (
                  <div className="absolute left-[80px] bg-[#050505] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                    Broker Connect
                  </div>
                )}
              </>
            )}
          </NavLink>

          <button
            className={`group relative w-full flex items-center rounded-lg text-[13px] font-semibold text-[#595959] hover:bg-[#FAFAFA] hover:text-[#050505] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] ${
              collapsed ? 'justify-center p-2' : 'px-3 py-2 gap-3'
            }`}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={15} strokeWidth={2} className="text-[#8C8C8C] group-hover:text-[#050505]" />
            {!collapsed && <span>Settings</span>}
            {collapsed && (
              <div className="absolute left-[80px] bg-[#050505] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                Settings
              </div>
            )}
          </button>

          <button
            className={`group relative w-full flex items-center rounded-lg text-[13px] font-semibold text-[#595959] hover:bg-[#FAFAFA] hover:text-[#050505] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] ${
              collapsed ? 'justify-center p-2' : 'px-3 py-2 gap-3'
            }`}
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={15} strokeWidth={2} className="text-[#8C8C8C] group-hover:text-[#050505]" />
            {!collapsed && <span>Help & Support</span>}
            {collapsed && (
              <div className="absolute left-[80px] bg-[#050505] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                Help & Support
              </div>
            )}
          </button>

          {}
          <div className={`pt-3 mt-3 border-t border-[#E5E5E5] flex items-center justify-between ${collapsed ? 'px-0 justify-center' : 'px-1'}`}>
            {!collapsed ? (
              <div className="flex items-center gap-2.5 min-w-0 mr-2">
                <div className="h-8 w-8 rounded-full bg-[#050505] flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white">{getInitials(user?.name)}</span>
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[13px] font-bold text-[#050505] leading-tight truncate">{displayName}</span>
                  <span className="text-[9px] text-[#8C8C8C] leading-tight truncate">{user?.role === 'recruiter' ? 'Professional' : 'Retail Investor'}</span>
                </div>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#050505] flex items-center justify-center shrink-0 relative group">
                <span className="text-[11px] font-bold text-white">{getInitials(user?.name)}</span>
                <div className="absolute left-[80px] bg-[#050505] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-md pointer-events-none opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 whitespace-nowrap">
                  {user?.name || 'User Profile'}
                </div>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="p-1.5 text-[#ADADAD] hover:text-[#C5221F] transition-colors rounded-md hover:bg-[#FEF2F2] shrink-0 cursor-pointer"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
      {}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
};

export default Sidebar;
