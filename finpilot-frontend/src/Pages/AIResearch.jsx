import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Circle, Loader2, ChevronDown, ChevronRight, Download, Copy, Share2 } from 'lucide-react';
import { runDeepResearch, addResearchReport } from '../services/research';

const RESEARCH_STEPS = [
  { id: 'company', label: 'Company information' },
  { id: 'financials', label: 'Financial statements' },
  { id: 'filings', label: 'SEC filings' },
  { id: 'market', label: 'Market data' },
  { id: 'news', label: 'News intelligence' },
  { id: 'risk', label: 'Risk analysis' },
  { id: 'report', label: 'Final report' },
];

const AGENTS = [
  { id: 'coordinator', name: 'Coordinator', role: 'Orchestrating research workflow' },
  { id: 'financial', name: 'Financial Agent', role: 'Analyzing financial statements & metrics' },
  { id: 'news', name: 'News Agent', role: 'Clustering recent news & sentiment' },
  { id: 'risk', name: 'Risk Agent', role: 'Evaluating company & market risks' },
];

const MOCK_REPORT = {
  executiveSummary: 'NVIDIA Corporation has established dominant market leadership in AI accelerator hardware through its CUDA ecosystem and Hopper GPU architecture. Revenue grew 122% YoY to $44.1B in FY2025, driven by insatiable demand from hyperscalers and enterprise AI deployments.',
  financialAnalysis: 'Data Center segment revenues reached $30.8B, representing 70% of total revenue. Gross margins expanded to 76.0%, reflecting strong pricing power. Operating income surged to $23.7B with 54% operating margins.',
  growthDrivers: ['Generative AI infrastructure buildout', 'Enterprise AI adoption acceleration', 'Sovereign AI government initiatives', 'Automotive & robotics AI expansion'],
  risks: ['Export control restrictions on China sales', 'Custom silicon competition from hyperscalers', 'Cyclical semiconductor demand patterns', 'Valuation premium compression risk'],
  conclusion: 'NVIDIA remains a strong long-term compounder, though near-term risk/reward depends on sustainability of AI capex spending by hyperscalers. Monitor export control developments closely.',
};

export const AIResearch = () => {
  const [stage, setStage] = useState('configure'); 
  const [config, setConfig] = useState({
    company: 'NVIDIA Corporation',
    ticker: 'NVDA',
    objective: 'Comprehensive investment analysis',
    period: '5 Years',
    includeFinancials: true,
    includeNews: true,
    includeRisks: true,
    includePeers: true,
  });
  const [steps, setSteps] = useState(RESEARCH_STEPS.map(s => ({ ...s, status: 'pending' })));
  const [agents, setAgents] = useState(AGENTS.map(a => ({ ...a, status: 'queued', progress: 0 })));
  const [expandedSection, setExpandedSection] = useState('executiveSummary');

  const handleStartResearch = async () => {
    setStage('researching');
    await runDeepResearch(config);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'complete' : idx === i ? 'working' : 'pending'
      })));

      if (i === 1) setAgents(prev => prev.map(a => a.id === 'coordinator' ? { ...a, status: 'working', progress: 100 } : a));
      if (i === 2) setAgents(prev => prev.map(a => a.id === 'financial' ? { ...a, status: 'working', progress: 60 } : a));
      if (i === 3) setAgents(prev => prev.map(a => a.id === 'financial' ? { ...a, status: 'complete', progress: 100 } : { ...a, ...(a.id === 'news' ? { status: 'working', progress: 40 } : {}) }));
      if (i === 4) setAgents(prev => prev.map(a => a.id === 'news' ? { ...a, status: 'complete', progress: 100 } : { ...a, ...(a.id === 'risk' ? { status: 'working', progress: 70 } : {}) }));
      if (i === 5) setAgents(prev => prev.map(a => ({ ...a, status: 'complete', progress: 100 })));
    }

    await new Promise(r => setTimeout(r, 800));
    setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
    setStage('report');

    await addResearchReport({
      id: 'rpt-' + Date.now(),
      company: config.company || 'Generic Corp',
      ticker: (config.ticker || 'GEN').toUpperCase(),
      type: 'Deep Research',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      riskLevel: 'Medium',
      summary: `AI generated deep research report for ${config.company || 'Generic Corp'}.`,
      sources: 30 + Math.floor(Math.random() * 20),
      sections: 11
    });
  };

  const reportSections = [
    { id: 'executiveSummary', label: 'Executive Summary', agent: 'Coordinator', content: MOCK_REPORT.executiveSummary },
    { id: 'financialAnalysis', label: 'Financial Analysis', agent: 'Financial Agent', content: MOCK_REPORT.financialAnalysis },
    {
      id: 'growthDrivers', label: 'Growth Drivers', agent: 'Financial Agent',
      content: MOCK_REPORT.growthDrivers.map(d => `• ${d}`).join('\n')
    },
    {
      id: 'risks', label: 'Risk Analysis', agent: 'Risk Agent',
      content: MOCK_REPORT.risks.map(r => `• ${r}`).join('\n')
    },
    { id: 'conclusion', label: 'Conclusion', agent: 'Coordinator', content: MOCK_REPORT.conclusion },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">

      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">AI Research</h1>
          <p className="text-[13px] text-[#595959] mt-1">Deep multi-agent financial research powered by FinPilot AI.</p>
        </div>
      </div>

      {stage === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-semibold text-[#050505]">Research Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider block mb-1.5">Company</label>
                <input
                  value={config.company}
                  onChange={e => setConfig(c => ({ ...c, company: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider block mb-1.5">Ticker</label>
                <input
                  value={config.ticker}
                  onChange={e => setConfig(c => ({ ...c, ticker: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider block mb-1.5">Research Objective</label>
                <input
                  value={config.objective}
                  onChange={e => setConfig(c => ({ ...c, objective: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505]"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider block mb-1.5">Time Period</label>
                <select
                  value={config.period}
                  onChange={e => setConfig(c => ({ ...c, period: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] text-[13px] text-[#050505] outline-none focus:border-[#050505] bg-white"
                >
                  {['1 Year', '3 Years', '5 Years', '10 Years'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <label className="font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider block mb-3">Include In Report</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'includeFinancials', label: 'Financials & Metrics' },
                  { key: 'includeNews', label: 'News Intelligence' },
                  { key: 'includeRisks', label: 'Risk Analysis' },
                  { key: 'includePeers', label: 'Peer Comparison' },
                ].map(({ key, label }) => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${config[key] ? 'border-[#050505] bg-[#FAFAFA]' : 'border-[#E5E5E5] hover:bg-[#FAFAFA]'}`}>
                    <input
                      type="checkbox"
                      checked={config[key]}
                      onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-[#050505]"
                    />
                    <span className="text-[13px] font-medium text-[#050505]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartResearch}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#050505] text-white text-[14px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
            >
              <Sparkles size={16} className="fill-white" />
              Start Deep Research
            </button>
          </div>

          {}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[#050505] mb-4">Research Agents</h3>
            <div className="space-y-3">
              {AGENTS.map((agent) => (
                <div key={agent.id} className="rounded-lg border border-[#F0F0F0] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[#050505]">{agent.name}</span>
                    <span className="text-[11px] font-mono text-[#8C8C8C]">Standby</span>
                  </div>
                  <p className="text-[11px] text-[#8C8C8C]">{agent.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === 'researching' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm" aria-live="polite" aria-busy="true">
            <span className="sr-only">Researching {config.company}, please wait</span>
            <div className="flex items-center gap-3 mb-6">
              <Loader2 size={18} className="animate-spin text-[#050505]" />
              <h2 className="font-semibold text-[#050505]">Researching {config.company}...</h2>
            </div>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  {step.status === 'complete' && <CheckCircle2 size={18} className="text-[#137333] shrink-0" />}
                  {step.status === 'working' && <Loader2 size={18} className="animate-spin text-[#050505] shrink-0" />}
                  {step.status === 'pending' && <Circle size={18} className="text-[#D9D9D9] shrink-0" />}
                  <span className={`text-[14px] ${step.status === 'complete' ? 'text-[#137333] font-medium' : step.status === 'working' ? 'text-[#050505] font-semibold' : 'text-[#8C8C8C]'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-[#050505] mb-4">Agent Status</h3>
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#050505]">{agent.name}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      agent.status === 'complete' ? 'bg-[#E6F4EA] text-[#137333]'
                      : agent.status === 'working' ? 'bg-[#F5F5F5] text-[#050505]'
                      : 'bg-[#F5F5F5] text-[#8C8C8C]'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  {agent.status !== 'queued' && (
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${agent.status === 'complete' ? 'bg-[#137333]' : 'bg-[#050505]'}`}
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === 'report' && (
        <div className="space-y-6">
          {}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-[#050505]">Deep Research Report: {config.company}</h2>
                <span className="font-mono text-[10px] bg-[#E6F4EA] text-[#137333] px-2 py-0.5 rounded border border-[#CEEAD6]">COMPLETE</span>
              </div>
              <p className="text-[13px] text-[#8C8C8C]">Generated Aug 29, 2026 · {reportSections.length} sections · 42 sources</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E5E5] text-[13px] font-semibold text-[#050505] hover:bg-[#FAFAFA] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
                <Copy size={14} /> Copy
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#E5E5E5] text-[13px] font-semibold text-[#050505] hover:bg-[#FAFAFA] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
                <Share2 size={14} /> Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#050505] text-white text-[13px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]">
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>

          {}
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
            {reportSections.map((section, idx) => (
              <div key={section.id} className={`border-b border-[#F0F0F0] last:border-0`}>
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  aria-expanded={expandedSection === section.id}
                  className="w-full flex items-center justify-between p-6 hover:bg-[#FAFAFA] transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#050505]"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[#8C8C8C] w-6">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="font-semibold text-[#050505]">{section.label}</span>
                    <span className="font-mono text-[10px] bg-[#F5F5F5] text-[#8C8C8C] px-2 py-0.5 rounded border border-[#E5E5E5]">
                      {section.agent}
                    </span>
                  </div>
                  {expandedSection === section.id ? <ChevronDown size={16} className="text-[#8C8C8C]" /> : <ChevronRight size={16} className="text-[#8C8C8C]" />}
                </button>
                {expandedSection === section.id && (
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-[14px] text-[#050505] leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setStage('configure')}
            className="text-[13px] text-[#8C8C8C] hover:text-[#050505] font-medium"
          >
            ← Start New Research
          </button>
        </div>
      )}

    </div>
  );
};

export default AIResearch;
