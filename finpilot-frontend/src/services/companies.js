const COMPANY_DATA = {
  NVDA: {
    name: 'NVIDIA Corporation',
    ticker: 'NVDA',
    price: 182.45,
    change: 5.42,
    changePercent: 3.42,
    marketCap: '$2.24T',
    sector: 'Technology',
    industry: 'Semiconductors',
    about:
      'NVIDIA Corporation is a leading technology company specializing in graphics processing units (GPUs) and system-on-chip units. Originally known for gaming GPUs, NVIDIA has transformed into the dominant provider of AI computing infrastructure. The company\'s Hopper and upcoming Blackwell architectures underpin the global AI buildout, with hyperscalers spending billions on H100 and H200 GPUs for training large language models.',
    metrics: {
      peRatio: '72.4x',
      forwardPe: '45.2x',
      priceToSales: '36.1x',
      dividendYield: '0.04%',
      beta: '1.68',
      '52W High': '$195.95',
      '52W Low': '$39.23',
    },
    financials: {
      revenue: '$113.3B TTM',
      revenueGrowth: '+265% YoY',
      grossMargin: '76.0%',
      operatingMargin: '61.6%',
      netIncome: '$29.7B',
      freeCashFlow: '$27.1B',
    },
    aiSummary:
      'NVIDIA maintains a dominant moat in AI accelerators through its CUDA ecosystem, robust software stack, and supply-constrained H100 GPUs. Data Center revenue is expected to grow from $47.5B in FY24 to an estimated $90B+ in FY25. Key risks include: (1) Export restriction tightening to China, reducing TAM; (2) Emerging competition from AMD MI300X and custom silicon (Google TPUs, AWS Trainium); (3) Valuation at 45x forward earnings demands sustained execution. Bull case: Blackwell architecture ramp in H2 2025 drives another leg of revenue acceleration.',
  },
  AAPL: {
    name: 'Apple Inc.',
    ticker: 'AAPL',
    price: 231.40,
    change: -0.97,
    changePercent: -0.42,
    marketCap: '$3.53T',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    about:
      'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company also sells various related services including the App Store, Apple Music, iCloud, and Apple Pay. Founded in 1976, Apple is the world\'s most valuable company with an unrivaled consumer ecosystem spanning hardware and services.',
    metrics: {
      peRatio: '31.2x',
      forwardPe: '29.5x',
      priceToSales: '9.2x',
      dividendYield: '0.45%',
      beta: '1.28',
      '52W High': '$237.23',
      '52W Low': '$164.08',
    },
    financials: {
      revenue: '$383.3B TTM',
      revenueGrowth: '+2.4% YoY',
      grossMargin: '44.1%',
      operatingMargin: '30.1%',
      netIncome: '$96.9B',
      freeCashFlow: '$105.0B',
    },
    aiSummary:
      'Apple\'s premium positioning and $105B+ annual free cash flow generation provide a compelling floor to the investment thesis. Services revenue, now $100B+ annually, is the high-margin growth engine. Apple Intelligence (AI integration) could drive the next iPhone super-cycle in 2025-26. Key risks: China revenue (~18% of total) exposure to geopolitical headwinds; App Store regulatory scrutiny in EU and US; slowing hardware upgrade cycles.',
  },
  MSFT: {
    name: 'Microsoft Corporation',
    ticker: 'MSFT',
    price: 511.20,
    change: 6.32,
    changePercent: 1.24,
    marketCap: '$3.80T',
    sector: 'Technology',
    industry: 'Software & Cloud',
    about:
      'Microsoft Corporation develops and supports software, services, devices, and solutions worldwide. Its cloud platform Azure is the second-largest cloud provider globally. Microsoft has deeply integrated OpenAI\'s GPT technology into its product suite through Copilot, making it a primary beneficiary of enterprise AI adoption.',
    metrics: {
      peRatio: '38.1x',
      forwardPe: '32.8x',
      priceToSales: '15.5x',
      dividendYield: '0.68%',
      beta: '0.90',
      '52W High': '$523.92',
      '52W Low': '$385.58',
    },
    financials: {
      revenue: '$245.1B TTM',
      revenueGrowth: '+16.0% YoY',
      grossMargin: '70.1%',
      operatingMargin: '44.5%',
      netIncome: '$88.1B',
      freeCashFlow: '$74.1B',
    },
    aiSummary:
      'Microsoft is the premier AI infrastructure play outside of NVIDIA. Azure AI services growing at 50%+ embedded in enterprise contracts, with GitHub Copilot at 1.3M+ paying users. Office 365 Copilot at $30/seat represents a significant revenue expansion opportunity across 400M commercial seats. Key risks: Azure growth deceleration below expectations; OpenAI dependency; Activision integration complexity.',
  },
};

const DEFAULT_COMPANY = COMPANY_DATA.NVDA;

export const getCompanyDetails = async (ticker) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return COMPANY_DATA[ticker?.toUpperCase()] || { ...DEFAULT_COMPANY, ticker: ticker?.toUpperCase() || 'NVDA' };
};

export const getCompanyNews = async (ticker) => {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const newsMap = {
    NVDA: [
      { id: 1, title: 'NVIDIA Unveils Blackwell Ultra: 3x Performance Over H200', source: 'Bloomberg', time: '2h ago', sentiment: 'Positive', summary: 'NVIDIA announced its next-generation Blackwell Ultra architecture targeting AI training workloads, promising significant inference throughput improvements for hyperscaler customers.' },
      { id: 2, title: 'NVDA Price Target Raised to $220 at Morgan Stanley', source: 'CNBC', time: '5h ago', sentiment: 'Positive', summary: 'Morgan Stanley raised their price target citing accelerating data center demand and faster-than-expected Blackwell ramp in H2 2025.' },
      { id: 3, title: 'US Expands Chip Export Restrictions Impacting NVIDIA China Sales', source: 'Reuters', time: '1d ago', sentiment: 'Negative', summary: 'New Commerce Department rules further restrict advanced semiconductor exports to China, potentially impacting NVIDIA\'s China revenue which represents ~17% of data center sales.' },
      { id: 4, title: 'NVIDIA Partners with Major Sovereign AI Programs in Europe', source: 'FT', time: '2d ago', sentiment: 'Positive', summary: 'France and Germany announced billion-dollar AI infrastructure programs using NVIDIA hardware, diversifying revenue away from China.' },
    ],
    AAPL: [
      { id: 1, title: 'Apple Intelligence Features Roll Out to iPhone 16 Users', source: 'Bloomberg', time: '3h ago', sentiment: 'Positive', summary: 'Apple began enabling its AI-powered Apple Intelligence suite, featuring enhanced Siri, photo editing, and writing tools across supported devices.' },
      { id: 2, title: 'DOJ Broadens Apple Antitrust Investigation to iPhone Ecosystem', source: 'WSJ', time: '6h ago', sentiment: 'Negative', summary: 'The Department of Justice expanded its antitrust probe to examine iPhone ecosystem lock-in practices beyond the initial App Store focus.' },
      { id: 3, title: 'Apple Services Revenue Hits Record $24.2B in Latest Quarter', source: 'CNBC', time: '1d ago', sentiment: 'Positive', summary: 'Services segment—including App Store, Apple Pay, iCloud, and Apple Music—hit an all-time high, reinforcing the high-margin flywheel thesis.' },
    ],
    MSFT: [
      { id: 1, title: 'Microsoft Copilot Reaches 1.3M Enterprise Paying Users', source: 'Bloomberg', time: '1h ago', sentiment: 'Positive', summary: 'Microsoft\'s GitHub Copilot enterprise subscription surpassed 1.3M paid users, ahead of Wall Street estimates, signaling robust AI monetization.' },
      { id: 2, title: 'Azure Cloud Growth Reaccelerates to 33% in Q2', source: 'CNBC', time: '4h ago', sentiment: 'Positive', summary: 'Microsoft\'s Azure cloud platform reported 33% growth—ahead of the 31% analyst consensus—driven by AI workloads and enterprise migrations.' },
      { id: 3, title: 'EU Regulators Question Microsoft-OpenAI Partnership Structure', source: 'Reuters', time: '2d ago', sentiment: 'Negative', summary: 'European competition authorities opened a preliminary inquiry into Microsoft\'s relationship with OpenAI, examining whether it constitutes an unreported merger.' },
    ],
  };

  const key = ticker?.toUpperCase();
  const items = newsMap[key] || newsMap.NVDA.map(n => ({ ...n, title: n.title.replace('NVIDIA', ticker) }));
  return items;
};

export const searchCompanies = async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const db = [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { ticker: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { ticker: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
    { ticker: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
    { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
    { ticker: 'V', name: 'Visa Inc.', sector: 'Financials' },
  ];
  const q = query.toLowerCase();
  return db.filter(c => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
};
