import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('finpilot_sidebar_collapsed') === 'true';
  });
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('finpilot_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] font-sans text-[#050505] overflow-hidden selection:bg-[#050505] selection:text-white">
      {}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main key={location.pathname} className="flex-1 overflow-y-auto bg-[#FAFAFA] relative page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
