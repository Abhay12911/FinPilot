const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getMarketIndices = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/market/indices`);
    if (!res.ok) throw new Error("Failed to fetch indices");
    const data = await res.json();
    return data.map(item => ({
      name: item.name,
      symbol: item.symbol,
      value: item.price,
      change: item.change,
      changePercent: (item.change_pct * 100).toFixed(2), 
      isPositive: item.is_positive
    }));
  } catch (error) {
    console.error("Error in getMarketIndices:", error);
    
    return [
      { name: 'S&P 500', value: 5824.12, change: 42.15, changePercent: '0.73', isPositive: true },
      { name: 'Nasdaq', value: 18452.88, change: 184.2, changePercent: '1.01', isPositive: true },
      { name: 'Dow Jones', value: 42104.55, change: -12.4, changePercent: '-0.03', isPositive: false },
      { name: 'Russell 2000', value: 2245.10, change: 24.5, changePercent: '1.10', isPositive: true },
    ];
  }
};

export const getSectorPerformance = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/market/sectors`);
    if (!res.ok) throw new Error("Failed to fetch sectors");
    const data = await res.json();
    return data.map(item => ({
      sector: item.sector,
      changePercent: item.change_pct
    }));
  } catch (error) {
    console.error("Error in getSectorPerformance:", error);
    
    return [
      { sector: 'Technology', changePercent: 1.8 },
      { sector: 'Consumer Cyclical', changePercent: 1.2 },
      { sector: 'Healthcare', changePercent: 0.5 },
      { sector: 'Financials', changePercent: 0.2 },
      { sector: 'Energy', changePercent: -0.4 },
      { sector: 'Utilities', changePercent: -1.1 },
    ];
  }
};

export const getMarketMovers = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/market/movers`);
    if (!res.ok) throw new Error("Failed to fetch movers");
    const data = await res.json();
    return {
      gainers: data.gainers.map(item => ({
        ticker: item.symbol,
        name: item.symbol,
        change: (item.change_pct * 100).toFixed(2),
        price: item.price
      })),
      losers: data.losers.map(item => ({
        ticker: item.symbol,
        name: item.symbol,
        change: (item.change_pct * 100).toFixed(2),
        price: item.price
      })),
      mostActive: data.most_active.map(item => ({
        ticker: item.symbol,
        name: item.symbol,
        change: (item.change_pct * 100).toFixed(2),
        price: item.price
      }))
    };
  } catch (error) {
    console.error("Error in getMarketMovers:", error);
    
    return {
      gainers: [
        { ticker: 'NVDA', name: 'NVIDIA Corp', change: '4.87', price: 182.45 },
        { ticker: 'META', name: 'Meta Platforms', change: '3.21', price: 609.30 },
        { ticker: 'AMZN', name: 'Amazon.com', change: '2.95', price: 228.31 },
      ],
      losers: [
        { ticker: 'TSLA', name: 'Tesla Inc', change: '-3.24', price: 248.80 },
        { ticker: 'INTC', name: 'Intel Corp', change: '-2.18', price: 22.15 },
      ],
      mostActive: [
        { ticker: 'NVDA', name: 'NVIDIA Corp', change: '4.87', price: 182.45 },
        { ticker: 'AAPL', name: 'Apple Inc', change: '-0.42', price: 231.40 },
      ]
    };
  }
};

export const getMarketSignals = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return [
    {
      id: 'sig-1',
      company: 'NVIDIA Corporation',
      ticker: 'NVDA',
      type: 'Bullish',
      strength: 92,
      timestamp: '10 mins ago',
      explanation: 'Unusual call option volume detected ahead of earnings. Supply chain chatter indicates higher than expected GPU shipments.',
      dataPoints: ['Options Volume: +340%', 'Sentiment: 88/100', 'Price Action: Breakout']
    },
    {
      id: 'sig-2',
      company: 'Apple Inc.',
      ticker: 'AAPL',
      type: 'Bearish',
      strength: 75,
      timestamp: '1 hour ago',
      explanation: 'Negative sentiment clustering around potential iPhone production delays in Asia. Supplier guidance revised downwards.',
      dataPoints: ['News Sentiment: Negative', 'Supplier Stocks: -2.4%']
    },
    {
      id: 'sig-3',
      company: 'Microsoft Corporation',
      ticker: 'MSFT',
      type: 'Momentum',
      strength: 85,
      timestamp: '3 hours ago',
      explanation: 'Strong accumulation phase identified. Cloud growth metrics appearing across multiple alt-data sources.',
      dataPoints: ['RSI: 68', 'MACD Crossover', 'Volume: +120%']
    },
    {
      id: 'sig-4',
      company: 'Tesla Inc.',
      ticker: 'TSLA',
      type: 'Volatility Spike',
      strength: 95,
      timestamp: '4 hours ago',
      explanation: 'Implied volatility expanded rapidly following unconfirmed reports of new regulatory scrutiny.',
      dataPoints: ['IV Rank: 98%', 'News Mentions: +500%']
    }
  ];
};
