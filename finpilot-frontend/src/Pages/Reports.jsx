import React, { useState, useEffect } from 'react';
import { getResearchReports, deleteResearchReport } from '../services/research';
import { Search, Filter, Download, Trash2, Copy, ArrowRight, TrendingUp, AlertTriangle, Activity, Terminal } from 'lucide-react';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const RiskBadge = ({ level }) => {
  const styles = {
    Low: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
    Medium: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    High: 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]',
  };
  const icons = { Low: TrendingUp, Medium: Activity, High: AlertTriangle };
  const Icon = icons[level] || Activity;
  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${styles[level] || styles.Medium}`}>
      <Icon size={10} /> {level}
    </span>
  );
};

export const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const data = await getResearchReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteResearchReport(id);
      await loadData();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const filtered = reports.filter(r =>
    r.company.toLowerCase().includes(search.toLowerCase()) ||
    r.ticker.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading reports…</span>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-7 w-44" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-3">
              <SkeletonBlock className="h-5 w-32" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">My Reports</h1>
          <p className="text-[13px] text-[#595959] mt-1">{reports.length} research reports generated.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              type="text"
              placeholder="Search reports..."
              aria-label="Search reports"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[13px] text-[#050505] outline-none focus:border-[#050505]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E5E5] text-[13px] font-semibold text-[#050505] hover:bg-[#FAFAFA]">
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(report => (
          <div key={report.id} className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#D9D9D9] transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-[#050505]">{report.ticker}</span>
                  <span className="font-mono text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded text-[#525252]">{report.type}</span>
                  <RiskBadge level={report.riskLevel} />
                </div>
                <p className="text-[13px] text-[#595959]">{report.company}</p>
              </div>
              <span className="font-mono text-[11px] text-[#8C8C8C] shrink-0">{report.date}</span>
            </div>

            <p className="text-[13px] text-[#595959] leading-relaxed line-clamp-2">{report.summary}</p>

            <div className="flex items-center gap-3 pt-2 border-t border-[#F0F0F0]">
              <span className="font-mono text-[11px] text-[#8C8C8C]">{report.sources} sources</span>
              <span className="font-mono text-[11px] text-[#8C8C8C]">•</span>
              <span className="font-mono text-[11px] text-[#8C8C8C]">{report.sections} sections</span>
              <div className="ml-auto flex items-center gap-2">
                <button aria-label={`Copy ${report.company} report`} className="p-1.5 rounded-md text-[#8C8C8C] hover:text-[#050505] hover:bg-[#F5F5F5] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"><Copy size={14} /></button>
                <button aria-label={`Download ${report.company} report`} className="p-1.5 rounded-md text-[#8C8C8C] hover:text-[#050505] hover:bg-[#F5F5F5] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"><Download size={14} /></button>
                <button
                  onClick={() => handleDelete(report.id)}
                  aria-label={`Delete ${report.company} report`}
                  className="p-1.5 rounded-md text-[#8C8C8C] hover:text-red-500 hover:bg-[#FEF2F2] transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                >
                  <Trash2 size={14} />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] text-white text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
                  Open <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-white">
          <EmptyState
            icon={Terminal}
            title={search ? 'No reports match your search' : 'No reports yet'}
            description={search ? 'Try a different company or ticker.' : 'Run a deep AI research to generate your first report.'}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
