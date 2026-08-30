import React, { useState } from 'react';
import { Plus, X, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COMPANIES = {
  AAPL: { name: 'Apple Inc.', revenue: 394.3, revenueGrowth: 2.0, eps: 6.43, grossMargin: 44.5, opMargin: 29.8, netMargin: 25.3, pe: 31.2, ps: 7.9, marketCap: '3.5T', roe: 160.6, debt: 108.0, cash: 60.0, fcf: 99.5 },
  MSFT: { name: 'Microsoft Corp.', revenue: 245.1, revenueGrowth: 16.0, eps: 11.80, grossMargin: 69.8, opMargin: 44.6, netMargin: 36.4, pe: 35.8, ps: 13.2, marketCap: '3.8T', roe: 38.5, debt: 59.0, cash: 75.0, fcf: 71.2 },
  GOOGL: { name: 'Alphabet Inc.', revenue: 307.4, revenueGrowth: 14.0, eps: 7.02, grossMargin: 57.0, opMargin: 28.0, netMargin: 23.7, pe: 23.1, ps: 5.8, marketCap: '2.1T', roe: 29.1, debt: 13.0, cash: 110.0, fcf: 52.1 },
  AMZN: { name: 'Amazon.com Inc.', revenue: 620.1, revenueGrowth: 12.0, eps: 5.26, grossMargin: 47.6, opMargin: 8.2, netMargin: 5.3, pe: 42.8, ps: 3.2, marketCap: '2.4T', roe: 21.0, debt: 67.0, cash: 88.0, fcf: 25.0 },
  NVDA: { name: 'NVIDIA Corp.', revenue: 130.5, revenueGrowth: 122.0, eps: 2.53, grossMargin: 76.0, opMargin: 61.6, netMargin: 55.0, pe: 72.4, ps: 28.4, marketCap: '4.4T', roe: 123.8, debt: 8.5, cash: 26.0, fcf: 60.8 },
};

const METRICS = [
  { key: 'revenue', label: 'Revenue ($B)' },
  { key: 'revenueGrowth', label: 'Revenue Growth (%)' },
  { key: 'eps', label: 'EPS ($)' },
  { key: 'grossMargin', label: 'Gross Margin (%)' },
  { key: 'opMargin', label: 'Operating Margin (%)' },
  { key: 'netMargin', label: 'Net Margin (%)' },
  { key: 'pe', label: 'P/E Ratio' },
  { key: 'ps', label: 'P/S Ratio' },
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'roe', label: 'ROE (%)' },
  { key: 'debt', label: 'Total Debt ($B)' },
  { key: 'cash', label: 'Cash & Equiv. ($B)' },
  { key: 'fcf', label: 'Free Cash Flow ($B)' },
];

const COLORS = ['#050505', '#525252', '#737373', '#A3A3A3', '#D9D9D9'];

export const Compare = () => {
  const [selected, setSelected] = useState(['AAPL', 'MSFT', 'NVDA']);
  const [inputValue, setInputValue] = useState('');

  const addCompany = () => {
    const ticker = inputValue.trim().toUpperCase();
    if (ticker && COMPANIES[ticker] && !selected.includes(ticker) && selected.length < 5) {
      setSelected(prev => [...prev, ticker]);
      setInputValue('');
    }
  };

  const removeCompany = (ticker) => setSelected(prev => prev.filter(t => t !== ticker));

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Compare</h1>
        <p className="text-[13px] text-[#595959] mt-1">Side-by-side comparison of up to 5 companies.</p>
      </div>

      {}
      <div className="flex flex-wrap items-center gap-3">
        {selected.map((ticker, i) => (
          <div key={ticker} className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-[13px] font-semibold transition-transform hover:scale-[1.02]" style={{ borderColor: COLORS[i] }}>
            <span style={{ color: COLORS[i] }}>{ticker}</span>
            <span className="text-[#8C8C8C] font-normal text-[11px]">{COMPANIES[ticker]?.name}</span>
            <button onClick={() => removeCompany(ticker)} aria-label={`Remove ${ticker} from comparison`} className="text-[#8C8C8C] hover:text-red-500 ml-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 rounded-full">
              <X size={13} />
            </button>
          </div>
        ))}
        {selected.length < 5 && (
          <div className="flex items-center gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCompany()}
              placeholder="Add ticker (e.g. GOOGL)"
              aria-label="Add company ticker to comparison"
              className="px-3 py-1.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505] w-44"
            />
            <button onClick={addCompany} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <th className="px-5 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider w-40">Metric</th>
              {selected.map((ticker, i) => (
                <th key={ticker} className="px-5 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="font-bold text-[14px] text-[#050505]">{ticker}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric, idx) => {
              const values = selected.map(t => typeof COMPANIES[t]?.[metric.key] === 'number' ? COMPANIES[t][metric.key] : null);
              const maxVal = Math.max(...values.filter(Boolean));
              return (
                <tr key={metric.key} className={`border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors ${idx % 2 === 0 ? '' : 'bg-[#FAFAFA]/50'}`}>
                  <td className="px-5 py-3 font-mono text-[11px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">{metric.label}</td>
                  {selected.map((ticker, i) => {
                    const val = COMPANIES[ticker]?.[metric.key];
                    const isTop = typeof val === 'number' && val === maxVal;
                    return (
                      <td key={ticker} className="px-5 py-3">
                        <span className={`text-[14px] font-semibold ${isTop && metric.key !== 'debt' && metric.key !== 'pe' ? 'text-[#137333]' : 'text-[#050505]'}`}>
                          {typeof val === 'number' ? val.toLocaleString() : val || '—'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-[#050505] mb-4">Revenue Growth YoY (%)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={selected.map((t, i) => ({ name: t, value: COMPANIES[t]?.revenueGrowth ?? 0, color: COLORS[i] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Revenue Growth']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {selected.map((t, i) => <Cell key={t} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm flex items-center justify-between">
        <p className="text-[13px] text-[#595959]">Want a detailed AI comparison summary of {selected.join(' vs ')}?</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
          <Sparkles size={14} className="fill-white" /> Ask FinPilot to Compare
        </button>
      </div>
    </div>
  );
};

export default Compare;
