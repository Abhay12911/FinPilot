const DEFAULT_WATCHLIST = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', price: 182.45, changePercent: 3.42, signal: 'Bullish' },
  { ticker: 'AAPL', name: 'Apple Inc.', price: 231.40, changePercent: -0.42, signal: 'Neutral' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', price: 511.20, changePercent: 1.24, signal: 'Positive' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', price: 228.31, changePercent: 2.10, signal: 'Positive' }
];

const DEFAULT_HOLDINGS = [
  { id: 1, ticker: 'AAPL', name: 'Apple Inc.', shares: 10, avgCost: 150.00, currentPrice: 231.40, value: 2314.00, pnl: 814.00, pnlPercent: 54.27 },
  { id: 2, ticker: 'NVDA', name: 'NVIDIA Corporation', shares: 50, avgCost: 80.00, currentPrice: 182.45, value: 9122.50, pnl: 5122.50, pnlPercent: 128.06 },
  { id: 3, ticker: 'MSFT', name: 'Microsoft Corporation', shares: 5, avgCost: 380.00, currentPrice: 511.20, value: 2556.00, pnl: 656.00, pnlPercent: 34.53 },
  { id: 4, ticker: 'AMZN', name: 'Amazon.com, Inc.', shares: 15, avgCost: 160.00, currentPrice: 228.31, value: 3424.65, pnl: 1024.65, pnlPercent: 42.69 }
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

export const getPortfolioSummary = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const watchlist = getStoredData('finpilot_watchlist', DEFAULT_WATCHLIST);
  const holdings = getStoredData('finpilot_holdings', DEFAULT_HOLDINGS);
  const reports = getStoredData('finpilot_reports', []);

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);

  return {
    portfolioValue: Math.round(totalValue) || 128450,
    todaysChange: 2840,
    todaysChangePercent: 2.26,
    ytdReturn: 8.42,
    watchlistActive: watchlist.length,
    watchlistTotal: watchlist.length,
    aiReportsThisWeek: reports.filter(r => new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length || 2,
    aiReportsTotal: reports.length || 6,
    riskScore: 'Medium',
    beta: 1.24,
  };
};

export const getPortfolioPerformance = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  const data = [];
  let baseValue = 118000;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    baseValue = baseValue + (Math.random() - 0.4) * 1500;
    
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(baseValue)
    });
  }
  
  return data;
};

export const getWatchlist = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getStoredData('finpilot_watchlist', DEFAULT_WATCHLIST);
};

export const addToWatchlist = async (ticker, name) => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const watchlist = getStoredData('finpilot_watchlist', DEFAULT_WATCHLIST);
  const formattedTicker = ticker.toUpperCase().trim();
  
  if (watchlist.some(w => w.ticker === formattedTicker)) {
    return watchlist;
  }
  
  const newItem = {
    ticker: formattedTicker,
    name: name || formattedTicker,
    price: 100 + Math.random() * 400,
    changePercent: (Math.random() * 10) - 5,
    signal: Math.random() > 0.6 ? 'Bullish' : (Math.random() > 0.4 ? 'Positive' : 'Neutral')
  };
  
  const updated = [...watchlist, newItem];
  setStoredData('finpilot_watchlist', updated);
  return updated;
};

export const removeFromWatchlist = async (ticker) => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const watchlist = getStoredData('finpilot_watchlist', DEFAULT_WATCHLIST);
  const updated = watchlist.filter(w => w.ticker !== ticker);
  setStoredData('finpilot_watchlist', updated);
  return updated;
};

export const getHoldings = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getStoredData('finpilot_holdings', DEFAULT_HOLDINGS);
};
