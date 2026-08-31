import React, { useState, useEffect } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../services/portfolio';
import { ChartCard } from '../components/ui/ChartCard';
import { SignalBadge } from '../components/ui/SignalBadge';
import { Plus, Search, Trash2, ArrowUpRight, ArrowDownRight, X, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const Watchlist = () => {
  const [watchlists, setWatchlists] = useState([{ id: 1, name: 'Main Watchlist', stocks: [] }]);
  const [activeList, setActiveList] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const generateSparkline = (isPositive) => {
    const data = [];
    let val = 50;
    for (let i = 0; i < 20; i++) {
      val += (Math.random() - (isPositive ? 0.35 : 0.65)) * 4;
      data.push({ value: val });
    }
    return data;
  };

  const loadData = async () => {
    try {
      const stocks = await getWatchlist();
      setWatchlists([
        { id: 1, name: 'Main Watchlist', stocks: stocks.map(s => ({ ...s, sparkline: generateSparkline(s.changePercent >= 0) })) },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    setLoading(true);
    try {
      await addToWatchlist(newTicker, newName);
      setNewTicker('');
      setNewName('');
      setShowAddModal(false);
      await loadData();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleDelete = async (ticker) => {
    setLoading(true);
    try {
      await removeFromWatchlist(ticker);
      await loadData();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const currentList = watchlists.find(w => w.id === activeList);

  if (loading && watchlists[0].stocks.length === 0) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading watchlist…</span>
        <SkeletonTable rows={6} cols={7} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Watchlist</h1>
          <p className="text-[13px] text-[#595959] mt-1">Track companies you're monitoring with real-time signals.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Company
        </button>
      </div>

      <div className="flex gap-6">
        {}
        <div className="w-48 shrink-0 space-y-1">
          {watchlists.map(w => (
            <button
              key={w.id}
              onClick={() => setActiveList(w.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${activeList === w.id ? 'bg-[#050505] text-white' : 'text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505]'
                }`}
            >
              {w.name}
              <span className="ml-2 font-mono text-[10px] opacity-60">{w.stocks.length}</span>
            </button>
          ))}
        </div>

        {}
        <div className="flex-1 rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-[#F0F0F0]">
            <div className="relative flex-1 max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
              <input placeholder="Search..." aria-label="Search watchlist" className="pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E5E5] rounded-lg outline-none w-full focus:border-[#050505]" />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
                {['Ticker', 'Company', 'Price', 'Change', '7D Chart', 'Signal', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentList?.stocks.map(stock => {
                const isPositive = stock.changePercent >= 0;
                return (
                  <tr
                    key={stock.ticker}
                    onClick={() => navigate(`/dashboard/companies/${stock.ticker}`)}
                    className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4 font-bold text-[13px] text-[#050505]">{stock.ticker}</td>
                    <td className="px-4 py-4 text-[13px] text-[#595959]">{stock.name}</td>
                    <td className="px-4 py-4 font-semibold text-[13px] text-[#050505]">${stock.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <div className={`flex items-center gap-1 text-[13px] font-semibold ${isPositive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ChartCard data={stock.sparkline} color={isPositive ? '#137333' : '#C5221F'} height={36} />
                    </td>
                    <td className="px-4 py-4"><SignalBadge type={stock.signal} /></td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(stock.ticker)}
                        aria-label={`Remove ${stock.ticker} from watchlist`}
                        className="p-1.5 text-[#8C8C8C] hover:text-red-500 hover:bg-[#FEF2F2] rounded-md transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {currentList?.stocks.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Bookmark}
                      title="Your watchlist is empty"
                      description="Add companies you want to track and see live prices, signals, and 7-day trends here."
                      actionLabel="Add Company"
                      onAction={() => setShowAddModal(true)}
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#000000]/20 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="add-watchlist-title" onClick={e => e.stopPropagation()} className="w-[420px] rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="add-watchlist-title" className="font-bold text-[16px] text-[#050505]">Add to Watchlist</h3>
              <button onClick={() => setShowAddModal(false)} aria-label="Close dialog" className="text-[#8C8C8C] hover:text-[#050505] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] rounded">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#ADADAD]">Ticker Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. TSLA"
                  value={newTicker}
                  onChange={e => setNewTicker(e.target.value)}
                  className="h-10 px-3.5 rounded-lg border border-[#E5E5E5] bg-white text-[13px] text-[#050505] outline-none focus:border-[#050505] w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#ADADAD]">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tesla Inc."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="h-10 px-3.5 rounded-lg border border-[#E5E5E5] bg-white text-[13px] text-[#050505] outline-none focus:border-[#050505] w-full"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#E5E5E5] text-[12px] font-semibold rounded-lg text-[#595959] hover:bg-[#F5F5F5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#050505] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1A1A1A] cursor-pointer"
                >
                  Add Ticker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
