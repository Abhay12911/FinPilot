const DEFAULT_REPORTS = [
  {
    id: 'rpt-1',
    company: 'NVIDIA Corporation',
    ticker: 'NVDA',
    type: 'Deep Research',
    date: 'Aug 29, 2026',
    riskLevel: 'Medium',
    summary: "Comprehensive analysis of NVIDIA's AI accelerator dominance, data center growth, and competitive landscape.",
    sources: 42,
    sections: 11
  },
  {
    id: 'rpt-2',
    company: 'Apple Inc.',
    ticker: 'AAPL',
    type: 'Risk Analysis',
    date: 'Aug 27, 2026',
    riskLevel: 'Low',
    summary: "Apple's supply chain resilience, Services segment growth, and emerging AI integration strategy.",
    sources: 28,
    sections: 9
  },
  {
    id: 'rpt-3',
    company: 'Tesla Inc.',
    ticker: 'TSLA',
    type: 'Earnings Analysis',
    date: 'Aug 25, 2026',
    riskLevel: 'High',
    summary: 'Q2 delivery miss analysis, margin compression, and autonomous driving regulatory update.',
    sources: 35,
    sections: 8
  },
  {
    id: 'rpt-4',
    company: 'Microsoft Corporation',
    ticker: 'MSFT',
    type: 'Deep Research',
    date: 'Aug 22, 2026',
    riskLevel: 'Low',
    summary: 'Azure cloud momentum, Copilot monetization timeline, and gaming division performance review.',
    sources: 51,
    sections: 12
  }
];

const DEFAULT_DOCUMENTS = [
  { id: 1, name: 'NVIDIA_10K_FY2025.pdf', company: 'NVIDIA', type: '10-K', date: 'Aug 15, 2026', pages: 184, status: 'indexed', size: '4.2 MB' },
  { id: 2, name: 'AAPL_Q2_Earnings.pdf', company: 'Apple', type: 'Earnings', date: 'Aug 10, 2026', pages: 32, status: 'indexed', size: '1.1 MB' },
  { id: 3, name: 'Market_Research_Q3.docx', company: 'Internal', type: 'Research', date: 'Aug 5, 2026', pages: 48, status: 'indexed', size: '2.8 MB' },
  { id: 4, name: 'TSLA_10K_FY2025.pdf', company: 'Tesla', type: '10-K', date: 'Aug 1, 2026', pages: 156, status: 'processing', size: '3.9 MB' },
  { id: 5, name: 'Portfolio_Holdings.csv', company: 'Internal', type: 'Data', date: 'Jul 29, 2026', pages: 1, status: 'indexed', size: '0.1 MB' }
];

const getStoredData = (key, fallback) => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { return fallback; }
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
};

const setStoredData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getResearchReports = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getStoredData('finpilot_reports', DEFAULT_REPORTS);
};

export const addResearchReport = async (report) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const reports = getStoredData('finpilot_reports', DEFAULT_REPORTS);
  const updated = [report, ...reports];
  setStoredData('finpilot_reports', updated);
  return updated;
};

export const deleteResearchReport = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const reports = getStoredData('finpilot_reports', DEFAULT_REPORTS);
  const updated = reports.filter(r => r.id !== id);
  setStoredData('finpilot_reports', updated);
  return updated;
};

export const runDeepResearch = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    status: 'initiated',
    jobId: `job-${Date.now()}`
  };
};

export const getDocuments = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getStoredData('finpilot_documents', DEFAULT_DOCUMENTS);
};

export const uploadDocument = async (name, size, company = 'Internal', type = 'Upload') => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const documents = getStoredData('finpilot_documents', DEFAULT_DOCUMENTS);
  
  const newDoc = {
    id: Date.now(),
    name,
    company,
    type,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    pages: Math.floor(Math.random() * 50) + 1,
    status: 'processing',
    size
  };
  
  const updated = [newDoc, ...documents];
  setStoredData('finpilot_documents', updated);
  return newDoc;
};

export const updateDocumentStatus = async (id, status) => {
  const documents = getStoredData('finpilot_documents', DEFAULT_DOCUMENTS);
  const updated = documents.map(d => d.id === id ? { ...d, status } : d);
  setStoredData('finpilot_documents', updated);
  return updated;
};

export const deleteDocument = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const documents = getStoredData('finpilot_documents', DEFAULT_DOCUMENTS);
  const updated = documents.filter(d => d.id !== id);
  setStoredData('finpilot_documents', updated);
  return updated;
};
