import React, { useState } from 'react';
import { X, Shield, Key, Sliders, Bell, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('General');

  if (!isOpen) return null;

  const TABS = [
    { name: 'General', icon: Sliders },
    { name: 'Security', icon: Key },
    { name: 'Notifications', icon: Bell },
    { name: 'Database', icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/40 backdrop-blur-xs" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl border border-[#E5E5E5] w-full max-w-2xl h-[480px] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[#050505]" />
            <h2 className="font-bold text-[15px] text-[#050505]">Workspace Settings</h2>
          </div>
          <button onClick={onClose} className="text-[#8C8C8C] hover:text-[#050505] transition-colors cursor-pointer p-1 rounded hover:bg-[#F5F5F5]">
            <X size={16} />
          </button>
        </div>

        {}
        <div className="flex-1 flex overflow-hidden">
          {}
          <div className="w-[180px] border-r border-[#E5E5E5] bg-[#FAFAFA] p-3 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-left transition-colors cursor-pointer ${
                    isActive ? 'bg-[#050505] text-white' : 'text-[#595959] hover:bg-[#EAEAEA] hover:text-[#050505]'
                  }`}
                >
                  <Icon size={14} />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-[13px]">
            {activeTab === 'General' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-[#050505] mb-1">Profile Workspace</h3>
                  <p className="text-[11px] text-[#8C8C8C]">Manage your workspace details and identities.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#595959] block mb-1">Registered Email</label>
                    <input 
                      type="text" 
                      disabled 
                      value={user?.email || ''} 
                      className="w-full px-3 py-2 border border-[#E5E5E5] bg-[#F5F5F5] rounded-lg text-[#8C8C8C] outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#595959] block mb-1">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name || ''} 
                      className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-[#050505] outline-none focus:border-[#050505]" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#595959] block mb-1">Default Market Data Currency</label>
                    <select className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg text-[#050505] outline-none">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-[#050505] mb-1">Security Configurations</h3>
                  <p className="text-[11px] text-[#8C8C8C]">Update credential details and token parameters.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[#595959] block mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg outline-none focus:border-[#050505]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#595959] block mb-1">New Password</label>
                    <input type="password" placeholder="Min. 8 characters" className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg outline-none focus:border-[#050505]" />
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#050505]">Two-Factor Authentication</p>
                      <p className="text-[11px] text-[#8C8C8C]">Require code authentication on credentials login.</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 accent-[#050505]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-[#050505] mb-1">Alerting Notifications</h3>
                  <p className="text-[11px] text-[#8C8C8C]">Configure signal alerts and automated report emails.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#050505]">Email Signals</p>
                      <p className="text-[11px] text-[#8C8C8C]">Send immediate emails when watchlisted stocks trigger signals.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#050505]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#050505]">Daily Digest Reports</p>
                      <p className="text-[11px] text-[#8C8C8C]">Weekly portfolio beta performance metrics sent to email.</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 accent-[#050505]" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Database' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-[#050505] mb-1">Workspace Storage</h3>
                  <p className="text-[11px] text-[#8C8C8C]">Manage local cache database and credentials persistence.</p>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg">
                    <p className="font-mono text-[10px] text-[#8C8C8C] uppercase mb-1">Active SQLite database</p>
                    <p className="font-bold text-[#050505]">`finpilot.db`</p>
                    <p className="text-[10px] text-[#8C8C8C] mt-0.5">Tables: users, holdings, watchlist_items, reports</p>
                  </div>
                  <button className="px-4 py-2 border border-red-200 text-[#C5221F] bg-[#FFF5F5] rounded-lg text-[12px] font-semibold hover:bg-red-100 transition-colors cursor-pointer">
                    Clear Local Cache
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {}
        <div className="px-5 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA] flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-1.5 border border-[#E5E5E5] bg-white rounded-lg text-[12px] font-semibold text-[#595959] hover:bg-[#FAFAFA] transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#050505] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors cursor-pointer">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
