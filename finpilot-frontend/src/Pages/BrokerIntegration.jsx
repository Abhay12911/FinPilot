import React, { useState } from 'react';
import { Shield, Link2, Unlink, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', country: 'India', connected: true, value: '₹1,28,450', cash: '₹5,280', positions: 12 },
  { id: 'ibkr', name: 'Interactive Brokers', country: 'Global', connected: false },
  { id: 'schwab', name: 'Charles Schwab', country: 'USA', connected: false },
  { id: 'fidelity', name: 'Fidelity', country: 'USA', connected: false },
  { id: 'alpaca', name: 'Alpaca Markets', country: 'USA', connected: false },
  { id: 'groww', name: 'Groww', country: 'India', connected: false },
];

export const BrokerIntegration = () => {
  const [brokers, setBrokers] = useState(BROKERS);

  const toggle = (id) => {
    setBrokers(prev => prev.map(b => b.id === id ? { ...b, connected: !b.connected } : b));
  };

  const connected = brokers.filter(b => b.connected);
  const available = brokers.filter(b => !b.connected);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Broker Integration</h1>
        <p className="text-[13px] text-[#595959] mt-1">Securely connect your brokerage accounts to sync portfolio data.</p>
      </div>

      <div className="rounded-xl border border-[#F0E68C] bg-[#FFFDE7] p-4 flex items-center gap-3">
        <Shield size={16} className="text-[#92400E] shrink-0" />
        <p className="text-[13px] text-[#92400E]">
          <strong>Bank-grade security.</strong> FinPilot uses read-only API connections. We never store your credentials or initiate transactions.
        </p>
      </div>

      {}
      {connected.length > 0 && (
        <div>
          <h2 className="font-semibold text-[15px] text-[#050505] mb-3">Connected Brokers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connected.map(broker => (
              <div key={broker.id} className="rounded-xl border border-[#CEEAD6] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center font-bold text-lg text-[#050505]">
                      {broker.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#050505]">{broker.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle size={12} className="text-[#137333]" />
                        <span className="text-[11px] text-[#137333] font-medium">Connected</span>
                        <span className="text-[11px] text-[#8C8C8C]">· {broker.country}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(broker.id)}
                    aria-label={`Disconnect ${broker.name}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[12px] font-medium text-[#595959] hover:bg-[#FEF2F2] hover:text-red-500 hover:border-red-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  >
                    <Unlink size={13} /> Disconnect
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Portfolio Value', value: broker.value },
                    { label: 'Cash', value: broker.cash },
                    { label: 'Positions', value: `${broker.positions} stocks` },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] p-3">
                      <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wide mb-1">{m.label}</p>
                      <p className="font-bold text-[13px] text-[#050505]">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div>
        <h2 className="font-semibold text-[15px] text-[#050505] mb-3">Available Brokers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {available.map(broker => (
            <div key={broker.id} className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#D9D9D9] transition-all duration-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center font-bold text-lg text-[#050505]">
                  {broker.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-[#050505] text-[14px]">{broker.name}</h3>
                  <p className="text-[11px] text-[#8C8C8C]">{broker.country}</p>
                </div>
              </div>
              <button
                onClick={() => toggle(broker.id)}
                aria-label={`Connect ${broker.name}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] text-white text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
              >
                <Link2 size={13} /> Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerIntegration;
