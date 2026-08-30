import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] font-sans text-[#050505] overflow-hidden selection:bg-[#050505] selection:text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
