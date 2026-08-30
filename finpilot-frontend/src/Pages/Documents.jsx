import React, { useState, useEffect } from 'react';
import { Upload, Search, FileText, Trash2, MessageSquare, CheckCircle, Loader2, Clock } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, updateDocumentStatus } from '../services/research';
import { SkeletonTable } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

const STATUS_CONFIG = {
  indexed: { label: 'Indexed', icon: CheckCircle, color: 'text-[#137333]', bg: 'bg-[#E6F4EA]' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-[#595959]', bg: 'bg-[#F5F5F5]', spin: true },
  uploading: { label: 'Uploading', icon: Clock, color: 'text-[#8C8C8C]', bg: 'bg-[#F5F5F5]' },
};

export const Documents = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getDocuments();
      setDocs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (fileName, fileSize) => {
    try {
      const newDoc = await uploadDocument(fileName, fileSize);
      await loadData();

      setTimeout(async () => {
        await updateDocumentStatus(newDoc.id, 'indexed');
        await loadData();
      }, 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      handleFileUpload(file.name, sizeStr);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      handleFileUpload(file.name, sizeStr);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && docs.length === 0) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading documents…</span>
        <div className="rounded-xl border-2 border-dashed border-[#E5E5E5] bg-white h-40 animate-pulse" />
        <SkeletonTable rows={5} cols={8} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Documents</h1>
          <p className="text-[13px] text-[#595959] mt-1">Upload and manage documents for AI analysis and Q&A.</p>
        </div>
      </div>

      {}
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer ${dragOver ? 'border-[#050505] bg-[#F5F5F5]' : 'border-[#E5E5E5] bg-white hover:border-[#D9D9D9]'
          }`}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt,.csv"
        />
        <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
          <Upload size={22} className="text-[#8C8C8C]" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[#050505]">Drop files here or click to upload</p>
          <p className="text-[13px] text-[#8C8C8C] mt-1">Supports PDF, DOCX, TXT, CSV — up to 50MB each</p>
        </div>
      </label>

      {}
      <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-[#F0F0F0]">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              placeholder="Search documents..."
              aria-label="Search documents"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] border border-[#E5E5E5] rounded-lg outline-none w-full focus:border-[#050505]"
            />
          </div>
          <span className="font-mono text-[11px] text-[#8C8C8C]">{filtered.length} documents</span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAFA] border-b border-[#F0F0F0]">
              {['Document', 'Company', 'Type', 'Date', 'Pages', 'Size', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => {
              const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.indexed;
              const StatusIcon = status.icon;
              return (
                <tr key={doc.id} className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[#8C8C8C] shrink-0" />
                      <span className="text-[13px] font-medium text-[#050505] truncate max-w-[180px]">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-[#595959]">{doc.company}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-[10px] bg-[#F5F5F5] border border-[#E5E5E5] text-[#525252] px-2 py-0.5 rounded">{doc.type}</span>
                  </td>
                  <td className="px-4 py-4 text-[13px] text-[#8C8C8C] font-mono">{doc.date}</td>
                  <td className="px-4 py-4 text-[13px] text-[#8C8C8C]">{doc.pages}</td>
                  <td className="px-4 py-4 text-[13px] text-[#8C8C8C]">{doc.size}</td>
                  <td className="px-4 py-4">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${status.bg}`}>
                      <StatusIcon size={12} className={`${status.color} ${status.spin ? 'animate-spin' : ''}`} />
                      <span className={`text-[11px] font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {doc.status === 'indexed' && (
                        <button className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md text-[#050505] hover:bg-[#F5F5F5] whitespace-nowrap cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
                          <MessageSquare size={12} /> Ask AI
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        aria-label={`Delete ${doc.name}`}
                        className="p-1.5 text-[#8C8C8C] hover:text-red-500 hover:bg-[#FEF2F2] rounded-md cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon={FileText}
                    title={search ? 'No documents match your search' : 'No documents yet'}
                    description={search ? 'Try a different search term.' : 'Drag and drop a file above, or click to upload PDF, DOCX, TXT, or CSV files for AI analysis.'}
                    compact
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Documents;
