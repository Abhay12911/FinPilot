import { useState, useEffect, useCallback, useRef } from 'react';
import 'react-candlesticks/style.css';
import { Chart as CandlestickChartLibrary, Panel, Candlesticks } from 'react-candlesticks';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Globe, Search, RefreshCw, Activity, DollarSign, BarChart2, ShieldAlert
} from 'lucide-react';
import {
  getMarketStatus, getMarketIndices, getMarketMovers, getSectorPerformance,
  getMarketHistory, searchMarket, getForex, getCommodities, getMarketStrength
} from '../services/marketService';
import { SkeletonBlock, SkeletonChart, SkeletonTable } from '../components/ui/Skeleton';

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y'];

const SYMBOL_KEY_MAP = {
  'NIFTY 50': 'NIFTY50',
  'SENSEX': 'SENSEX',
  'BANK NIFTY': 'BANKNIFTY',
  'S&P 500': 'SPX',
  'NASDAQ 100': 'COMP',
  'Dow Jones': 'DJI',
  'Gold': 'GOLD',
  'Crude Oil': 'CRUDE'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    let dateStr = '';
    try {
      const d = new Date(label);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch { dateStr = label; }
    const formatted = typeof val === 'number'
      ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : val;
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[10px] font-mono text-[#8C8C8C] uppercase tracking-wider mb-0.5">{dateStr}</p>
        <p className="text-[14px] font-bold text-[#1A73E8]">{formatted}</p>
      </div>
    );
  }
  return null;
};

export const MarketOverview = () => {

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingForex, setLoadingForex] = useState(true);
  const [loadingCommodities, setLoadingCommodities] = useState(true);

  const [errors, setErrors] = useState({});

  const [status, setStatus] = useState(null);
  const [indices, setIndices] = useState({ india: [], usa: [], global_markets: [] });
  const [moversMarket, setMoversMarket] = useState('india');
  const [movers, setMovers] = useState({ gainers: [], losers: [], active: [] });
  
  const [sectorsMarket, setSectorsMarket] = useState('india');
  const [sectors, setSectors] = useState([]);
  const [marketStrength, setMarketStrength] = useState({ market: [], sectors: [], coverage: { stocks: 0, with_history: 0 } });
  const [selectedStrengthSector, setSelectedStrengthSector] = useState(null);
  const [loadingStrength, setLoadingStrength] = useState(true);
  const [strengthError, setStrengthError] = useState(null);
  
  const [forex, setForex] = useState([]);
  const [commodities, setCommodities] = useState([]);

  const [chartIndex, setChartIndex] = useState('NIFTY 50');
  const [chartType, setChartType] = useState('line');
  const [chartTimeframe, setChartTimeframe] = useState('1M');
  const [historyData, setHistoryData] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStatusData = useCallback(async (force = false) => {
    try {
      setLoadingStatus(true);
      const data = await getMarketStatus(force);
      setStatus(data);
      setErrors(prev => ({ ...prev, status: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, status: e.message }));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchIndicesData = useCallback(async (force = false) => {
    try {
      setLoadingIndices(true);
      const data = await getMarketIndices(force);
      setIndices(data);
      setErrors(prev => ({ ...prev, indices: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, indices: e.message }));
    } finally {
      setLoadingIndices(false);
    }
  }, []);

  const fetchMoversData = useCallback(async (market, force = false) => {
    try {
      setLoadingMovers(true);
      const data = await getMarketMovers(market, force);
      setMovers(data);
      setErrors(prev => ({ ...prev, movers: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, movers: e.message }));
    } finally {
      setLoadingMovers(false);
    }
  }, []);

  const fetchSectorsData = useCallback(async (market, force = false) => {
    try {
      setLoadingSectors(true);
      const data = await getSectorPerformance(market, force);
      setSectors(data);
      setErrors(prev => ({ ...prev, sectors: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, sectors: e.message }));
    } finally {
      setLoadingSectors(false);
    }
  }, []);

  const fetchStrengthData = useCallback(async () => {
    try {
      setLoadingStrength(true);
      setMarketStrength(await getMarketStrength());
      setStrengthError(null);
    } catch (e) {
      setStrengthError(e.message);
    } finally {
      setLoadingStrength(false);
    }
  }, []);

  const fetchHistoryData = useCallback(async (symbolName, timeframe, force = false) => {
    try {
      setLoadingHistory(true);
      const symbol = SYMBOL_KEY_MAP[symbolName] || indices.india.find((index) => index.name === symbolName)?.symbol || symbolName;

      let outputsize = 30;
      if (timeframe === '1D') outputsize = 24;
      else if (timeframe === '1W') outputsize = 7;
      else if (timeframe === '1M') outputsize = 30;
      else if (timeframe === '3M') outputsize = 90;
      else if (timeframe === '1Y') outputsize = 250;
      
      const interval = timeframe === '1D' ? '1h' : '1day';
      const data = await getMarketHistory(symbol, interval, outputsize, force);
      setHistoryData(data);
      setErrors(prev => ({ ...prev, history: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, history: e.message }));
    } finally {
      setLoadingHistory(false);
    }
  }, [indices.india]);

  const fetchForexData = useCallback(async () => {
    try {
      setLoadingForex(true);
      const data = await getForex();
      setForex(data);
      setErrors(prev => ({ ...prev, forex: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, forex: e.message }));
    } finally {
      setLoadingForex(false);
    }
  }, []);

  const fetchCommoditiesData = useCallback(async () => {
    try {
      setLoadingCommodities(true);
      const data = await getCommodities();
      setCommodities(data);
      setErrors(prev => ({ ...prev, commodities: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, commodities: e.message }));
    } finally {
      setLoadingCommodities(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusData(true);
    fetchIndicesData();
    fetchForexData();
    fetchCommoditiesData();
    fetchStrengthData();
  }, [fetchStatusData, fetchIndicesData, fetchForexData, fetchCommoditiesData, fetchStrengthData]);

  useEffect(() => {
    fetchMoversData(moversMarket);
  }, [moversMarket, fetchMoversData]);

  useEffect(() => {
    fetchSectorsData(sectorsMarket);
  }, [sectorsMarket, fetchSectorsData]);

  useEffect(() => {
    fetchHistoryData(chartIndex, chartTimeframe);
  }, [chartIndex, chartTimeframe, fetchHistoryData]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMarket(searchQuery);
        setSearchResults({
          equities: (results.equities || []).filter((item) => /NSE|BSE/i.test(item.exchange || '') || /\.(NS|BO)$/i.test(item.symbol || '')),
          indices: (results.indices || []).filter((item) => /NIFTY|SENSEX/i.test(`${item.symbol} ${item.name}`)),
          forex: (results.forex || []).filter((item) => /INR/i.test(item.symbol || item.name || '')),
          commodities: []
        });
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRefresh = useCallback(async (force = true) => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([
      fetchStatusData(force),
      fetchIndicesData(force),
      fetchMoversData(moversMarket, force),
      fetchSectorsData(sectorsMarket, force),
      fetchHistoryData(chartIndex, chartTimeframe, force),
      fetchForexData(),
      fetchCommoditiesData(),
      fetchStrengthData()
    ]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [chartIndex, chartTimeframe, fetchCommoditiesData, fetchForexData, fetchHistoryData, fetchIndicesData, fetchMoversData, fetchSectorsData, fetchStatusData, fetchStrengthData, moversMarket, refreshing, sectorsMarket]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleRefresh(true);
      }
    }, 30 * 60 * 1000);

    return () => window.clearInterval(refreshTimer);
  }, [handleRefresh]);

  const allIndices = [...indices.india].sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent));
  const candlestickData = historyData
    .filter((point) => [point.open, point.high, point.low, point.close].every(Number.isFinite))
    .map((point) => ({
      time: new Date(point.timestamp).toISOString(),
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume || 0
    }));

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 page-enter">
      
      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Market Overview</h1>
          <p className="text-[13px] text-[#595959] mt-1">Live view of Indian markets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {}
          <div className="relative" ref={searchRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              type="text"
              placeholder="Search assets, indices, forex..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[12.5px] outline-none focus:border-[#050505] w-64 focus-ring"
            />
            {searching && (
              <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8C8C8C]" />
            )}
            
            {}
            {searchResults && (
              <div className="absolute right-0 left-0 mt-1.5 bg-white border border-[#E5E5E5] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2 space-y-2">
                {Object.keys(searchResults).every(k => searchResults[k].length === 0) ? (
                  <p className="text-[11.5px] text-[#8C8C8C] p-3 text-center">No symbols found.</p>
                ) : (
                  Object.entries(searchResults).map(([category, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1">
                        <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider px-2 py-0.5 bg-[#FAFAFA] rounded-md">
                          {category}
                        </p>
                        {items.map((item) => (
                          <div
                            key={item.symbol}
                            onClick={() => {
                              setSearchQuery('');
                              setSearchResults(null);
                              const matchedIndex = Object.keys(SYMBOL_KEY_MAP).find(k => SYMBOL_KEY_MAP[k] === item.symbol);
                              if (matchedIndex) {
                                setChartIndex(matchedIndex);
                              } else if (item.type === 'equity') {
                                setChartIndex(item.symbol);
                              }
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-[12px] font-bold text-[#050505]">{item.symbol}</p>
                              <p className="text-[10px] text-[#8C8C8C] truncate max-w-[180px]">{item.name}</p>
                            </div>
                            <span className="text-[9px] font-mono bg-[#FAFAFA] border border-[#EDEDEE] px-1.5 py-0.5 rounded text-[#595959]">
                              {item.exchange}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#595959] border border-[#E5E5E5] bg-white rounded-lg hover:bg-[#F5F5F5] hover:border-[#C8C8C8] transition-colors focus-ring"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {}
      <div className="flex flex-wrap items-center gap-5 py-3 border-y border-[#F0F0F0] text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8C8C8C] font-semibold uppercase font-mono text-[10px]">Market Status:</span>
        </div>
        
        {loadingStatus ? (
          <SkeletonBlock className="h-4 w-32" />
        ) : errors.status ? (
          <span className="text-[#C5221F] text-[11px] flex items-center gap-1">
            <ShieldAlert size={12} /> Status Check Error
          </span>
        ) : (
          <>
            {}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#595959]">India ({status?.india?.exchange})</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                status?.india?.status === 'open' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#F1F3F4] text-[#5F6368]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.india?.status === 'open' ? 'bg-[#137333] animate-pulse' : 'bg-[#5F6368]'}`} />
                {status?.india?.status === 'open' ? 'Market Open' : 'Market Closed'}
              </span>
            </div>

            {}
            <span className="text-[#ADADAD] text-[11px] ml-auto">
              Updates every 30 minutes · {lastUpdated.toLocaleTimeString()}
            </span>
          </>
        )}
      </div>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <Activity size={15} className="text-[#050505]" /> Market Snapshot
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Indian indices, biggest moves first</p>
          </div>

          {loadingIndices ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {}
              <div>
                <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider mb-2">India</p>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {allIndices.map((idx) => {
                    const isPos = idx.change >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        onClick={() => setChartIndex(idx.name)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                      >
                        <span className="text-[12px] font-bold text-[#595959]">{idx.name}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[12.5px] font-bold text-[#050505]">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${isPos ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'}`}>
                            {isPos ? '+' : ''}{idx.change_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4 xl:col-span-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#F5F5F5]">
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-bold text-[#050505]">Market Performance</span>
              <span className="text-[11px] font-mono text-[#8C8C8C] uppercase tracking-wide px-2 py-0.5 bg-[#FAFAFA] border border-[#EDEDEE] rounded">
                {chartIndex}
              </span>
            </div>

            {}
            <div className="flex flex-wrap items-center gap-2">
              {}
              <select
                value={chartIndex}
                onChange={(e) => setChartIndex(e.target.value)}
                className="bg-white border border-[#E5E5E5] text-[11.5px] py-1.5 px-3 rounded-lg outline-none cursor-pointer focus-ring"
              >
                {!Object.prototype.hasOwnProperty.call(SYMBOL_KEY_MAP, chartIndex) && (
                  <option value={chartIndex}>{chartIndex}</option>
                )}
                <optgroup label="India">
                  {indices.india.map((index) => (
                    <option key={index.symbol} value={index.name}>{index.name}</option>
                  ))}
                </optgroup>
              </select>

              <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]" role="group" aria-label="Chart style">
                {['line', 'candles'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setChartType(type)}
                    aria-pressed={chartType === type}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                      chartType === type ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C] hover:text-[#595959]'
                    }`}
                  >
                    {type === 'line' ? 'Line' : 'Candles'}
                  </button>
                ))}
              </div>

              {}
              <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
                {TIME_FILTERS.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                      chartTimeframe === tf
                        ? 'bg-white text-[#050505] shadow-xs'
                        : 'text-[#8C8C8C] hover:text-[#595959]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {}
          {loadingHistory ? (
            <SkeletonChart height={260} />
          ) : errors.history ? (
            <div className="h-[260px] flex items-center justify-center text-center p-6 bg-[#FFF8F7] border border-[#FDECEA] rounded-xl text-[12px] text-[#C5221F]">
              <div>
                <ShieldAlert className="mx-auto mb-2 text-[#C5221F]" size={20} />
                <p>Could not load index history. Please verify connection or API limits.</p>
              </div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-[12px] text-[#8C8C8C]">
              <p>No chart data available for the selected symbol and timeframe.</p>
            </div>
          ) : (
            <div className="h-[260px] w-full mt-2">
              {chartType === 'candles' ? (
                candlestickData.length ? (
                  <CandlestickChartLibrary
                    key={`${chartIndex}-${chartTimeframe}`}
                    data={candlestickData}
                    granularity={chartTimeframe === '1D' ? 'h1' : 'd1'}
                    width="auto"
                    height="auto"
                    theme="light"
                    initialScrollToLatest
                    className="h-full w-full"
                  >
                    <Panel id="price">
                      <Candlesticks />
                    </Panel>
                  </CandlestickChartLibrary>
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-[#8C8C8C]">OHLC candle data is unavailable for this selection.</div>
                )
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#050505" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#050505" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 9, fill: '#ADADAD', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      try {
                        const d = new Date(v);
                        if (isNaN(d.getTime())) return '';
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } catch { return ''; }
                    }}
                    interval="preserveStartEnd"
                    dy={6}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 9, fill: '#ADADAD', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
                      return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
                    }}
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#1A73E8"
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                    activeDot={{ r: 4, fill: '#1A73E8', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {}
      <section className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start" aria-label="Market and sector strength">
        <div className="xl:col-span-2 bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-[#F5F5F5] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#050505]">Market Strength</h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">All NSE EQ-series stocks above their 21-day SMA</p>
            </div>
            {marketStrength.coverage?.stocks > 0 && <span className="text-[10px] text-[#8C8C8C] text-right">{marketStrength.coverage.with_history}/{marketStrength.coverage.stocks} NSE EQ stocks eligible</span>}
          </div>
          {loadingStrength ? <SkeletonChart /> : strengthError ? (
            <p className="text-center py-12 text-[12px] text-[#C5221F]">Market strength could not be loaded.</p>
          ) : marketStrength.market.length ? (
            <>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketStrength.market} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs><linearGradient id="breadthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1A73E8" stopOpacity={0.22} /><stop offset="95%" stopColor="#1A73E8" stopOpacity={0.02} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} tick={{ fontSize: 10, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 10, fill: '#8C8C8C' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value, _name, item) => [`${value}% (${item.payload.above}/${item.payload.eligible} stocks)`, 'Above 21-day SMA']} labelFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
                    <Area type="monotone" dataKey="percentage" stroke="#1A73E8" strokeWidth={2} fill="url(#breadthFill)" connectNulls={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="border-t border-[#F0F0F0] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-[#050505]">Day-wise strength</p>
                  <p className="text-[10px] text-[#8C8C8C]">{new Date(`${marketStrength.market.at(-1)?.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} to {new Date(`${marketStrength.market[0]?.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · 11 calendar days</p>
                </div>
                <div className="max-h-[225px] overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-white text-[#8C8C8C] border-b border-[#F0F0F0]">
                      <tr><th className="py-2">Date</th><th className="py-2 text-right">Stocks above 21-day SMA</th><th className="py-2 text-right">Coverage</th></tr>
                    </thead>
                    <tbody>
                      {[...marketStrength.market].reverse().map((day, index) => (
                        <tr key={day.date} className="border-b border-[#F5F5F5] last:border-0">
                          <td className="py-2 text-[#595959]">{index === 0 ? 'Latest · ' : ''}{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td className="py-2 text-right font-bold text-[#050505]">{day.percentage == null ? '—' : `${day.percentage.toFixed(2)}%`}</td>
                          <td className="py-2 text-right text-[#8C8C8C]">{day.is_trading_day ? `${day.above}/${day.eligible} stocks` : day.market_status === 'closed' ? 'Market closed' : 'Data pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[10px] text-[#8C8C8C]">Percentages use NSE EQ-series stocks with 21 daily closes. Weekend rows are marked market closed; weekday rows without a published NSE file are marked data pending.</p>
            </>
          ) : <div className="text-center py-12 text-[12px] text-[#8C8C8C]">NSE daily EQ-series price data is currently unavailable.</div>}
        </div>

        <div className="xl:col-span-3 bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#F5F5F5] pb-3">
            <h3 className="text-[16px] font-bold text-[#050505]">Top 10 Sector Strength</h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">All tracked large, mid, small and micro-cap sectors · ranked by stocks above 50-day, then 21-day SMA</p>
            {marketStrength.sector_coverage && <p className="text-[10px] text-[#8C8C8C] mt-1">{marketStrength.sector_coverage.stocks_with_data}/{marketStrength.sector_coverage.classified_universe} classified constituents with current NSE data</p>}
          </div>
          {loadingStrength ? <SkeletonTable rows={5} cols={5} /> : strengthError ? (
            <p className="text-center py-12 text-[12px] text-[#C5221F]">Sector strength could not be loaded.</p>
          ) : marketStrength.sectors.length ? (
            <div>
              <table className="w-full text-left text-[11px]">
                <thead className="sticky top-0 bg-white text-[#8C8C8C] border-b border-[#F0F0F0]"><tr><th className="py-2 pr-2"># Sector</th><th className="py-2 text-right">Above 50 SMA</th><th className="py-2 text-right">Above 21 SMA</th><th className="py-2 text-right">Volume spikes</th><th className="py-2 text-right">Avg. volume</th></tr></thead>
                <tbody>{marketStrength.sectors.map((sector) => <tr key={sector.sector} onClick={() => setSelectedStrengthSector(sector)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedStrengthSector(sector); }} tabIndex={0} role="button" aria-label={`View top stocks in ${sector.sector}`} className="border-b border-[#F5F5F5] last:border-0 cursor-pointer hover:bg-[#F8FAFD] focus:bg-[#F8FAFD]">
                  <td className="py-2.5 pr-2 font-semibold text-[#050505]">{sector.rank}. {sector.sector}<span className="block text-[9px] font-normal text-[#8C8C8C]">{sector.stocks} stocks · view top 20</span></td>
                  <td className="py-2.5 text-right text-[#595959]">{sector.above_50}/{sector.eligible_50}{sector.above_50_percent != null ? ` · ${sector.above_50_percent}%` : ''}</td>
                  <td className="py-2.5 text-right text-[#595959]">{sector.above_21}/{sector.eligible_21}{sector.above_21_percent != null ? ` · ${sector.above_21_percent}%` : ''}</td>
                  <td className="py-2.5 text-right text-[#595959]">{sector.volume_spike_stocks}</td>
                  <td className="py-2.5 text-right text-[#595959]">{sector.average_volume_ratio == null ? '—' : `${sector.average_volume_ratio}×`}</td>
                </tr>)}</tbody>
              </table>
            </div>
          ) : <div className="text-center py-12 text-[12px] text-[#8C8C8C]">No sector classifications or price history are available yet.</div>}
          <p className="text-[10px] text-[#8C8C8C]">Breadth and volume are recalculated from the latest NSE daily data. Sector classifications cover NSE Indices large, mid, small and micro-cap constituents; SMA counts show eligible stocks as the denominator.</p>
        </div>
      </section>

      {selectedStrengthSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStrengthSector(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="sector-stocks-title" className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEE] p-5">
              <div>
                <h3 id="sector-stocks-title" className="text-base font-bold text-[#050505]">{selectedStrengthSector.sector} · Top stocks</h3>
                <p className="mt-1 text-xs text-[#777777]">Ranked by volume spike versus the prior 10 sessions, then absolute 10-session price move. Showing up to 20 stocks.</p>
              </div>
              <button type="button" onClick={() => setSelectedStrengthSector(null)} className="rounded-md px-2 py-1 text-xl text-[#777777] hover:bg-[#F3F3F3]" aria-label="Close sector stocks">×</button>
            </div>
            <div className="max-h-[65vh] overflow-auto">
              {selectedStrengthSector.top_stocks?.length ? (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white text-[#777777]"><tr className="border-b border-[#EEEEEE]"><th className="px-5 py-3"># / Stock</th><th className="px-3 py-3 text-right">Last price</th><th className="px-3 py-3 text-right">Volume</th><th className="px-3 py-3 text-right">Volume spike</th><th className="px-5 py-3 text-right">10-session move</th></tr></thead>
                  <tbody>{selectedStrengthSector.top_stocks.map((stock, index) => <tr key={stock.symbol} className="border-b border-[#F5F5F5] last:border-0"><td className="px-5 py-3"><span className="font-bold text-[#222222]">{index + 1}. {stock.symbol}</span><span className="block max-w-[340px] truncate text-[10px] text-[#888888]">{stock.name}</span></td><td className="px-3 py-3 text-right">₹{Number(stock.close).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td><td className="px-3 py-3 text-right">{Number(stock.volume).toLocaleString('en-IN')}</td><td className="px-3 py-3 text-right font-semibold">{stock.volume_spike_ratio == null ? '—' : `${stock.volume_spike_ratio}×`}</td><td className={`px-5 py-3 text-right font-semibold ${(stock.price_change_10d_percent || 0) >= 0 ? 'text-[#188038]' : 'text-[#C5221F]'}`}>{stock.price_change_10d_percent == null ? '—' : `${stock.price_change_10d_percent > 0 ? '+' : ''}${stock.price_change_10d_percent}%`}</td></tr>)}</tbody>
                </table>
              ) : <p className="p-8 text-center text-sm text-[#777777]">Not enough price and volume history to rank stocks in this sector.</p>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#050505]">Market Movers</h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">Top price movers</p>
            </div>
            
            {}
            <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
              <button
                onClick={() => setMoversMarket('india')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  moversMarket === 'india' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                India
              </button>
            </div>
          </div>

          {loadingMovers ? (
            <SkeletonTable rows={4} cols={5} />
          ) : errors.movers ? (
            <div className="text-center py-8 text-[12px] text-[#C5221F] bg-[#FFF8F7] rounded-xl border border-[#FDECEA]">
              <ShieldAlert className="mx-auto mb-2" size={20} />
              <p>Top movers could not be loaded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {}
              <div>
                <p className="text-[9px] font-mono font-bold text-[#137333] uppercase tracking-wider bg-[#E6F4EA] px-2 py-0.5 rounded w-fit mb-2">
                  Top Gainers
                </p>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                      <th className="py-2 font-semibold">Symbol</th>
                      <th className="py-2 font-semibold">Price</th>
                      <th className="py-2 font-semibold text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movers.gainers.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] last:border-0"
                      >
                        <td className="py-2.5 font-bold text-[#050505] flex items-center gap-1.5">
                          {stock.symbol}
                        </td>
                        <td className="py-2.5 text-[#595959]">₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-[#137333] font-bold text-right">+{stock.change_percent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <p className="text-[9px] font-mono font-bold text-[#C5221F] uppercase tracking-wider bg-[#FCE8E6] px-2 py-0.5 rounded w-fit mb-2">
                  Top Losers
                </p>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                      <th className="py-2 font-semibold">Symbol</th>
                      <th className="py-2 font-semibold">Price</th>
                      <th className="py-2 font-semibold text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movers.losers.map((stock) => (
                      <tr
                        key={stock.symbol}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] last:border-0"
                      >
                        <td className="py-2.5 font-bold text-[#050505] flex items-center gap-1.5">
                          {stock.symbol}
                        </td>
                        <td className="py-2.5 text-[#595959]">₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2.5 text-[#C5221F] font-bold text-right">{stock.change_percent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
                <BarChart2 size={16} /> Sector Performance
              </h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">NSE sector indices</p>
            </div>
            
            {}
            <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
              <button
                onClick={() => setSectorsMarket('india')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  sectorsMarket === 'india' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                India
              </button>
            </div>
          </div>

          {loadingSectors ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-5 w-full" />
                </div>
              ))}
            </div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-16 text-[12px] text-[#8C8C8C]">
              <ShieldAlert className="mx-auto mb-2" size={18} />
              <p>Sector performance is currently unavailable for this market.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {sectors.map((sec) => {
                const pct = sec.change_percent;  
                const isPos = pct >= 0;
                
                const barWidth = Math.min(Math.abs(pct) * 20, 100);
                return (
                  <div key={sec.sector} className="space-y-1">
                    <div className="flex justify-between text-[11.5px] font-semibold text-[#595959]">
                      <span>{sec.sector}</span>
                      <span className={isPos ? 'text-[#137333]' : 'text-[#C5221F]'}>
                        {isPos ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>
                    {}
                    <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isPos ? 'bg-[#34A853]' : 'bg-[#EA4335]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <DollarSign size={15} /> Foreign Exchange (Forex)
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Global exchange rates</p>
          </div>

          {loadingForex ? (
            <SkeletonTable rows={4} cols={4} />
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                  <th className="py-2 font-semibold">Pair</th>
                  <th className="py-2 font-semibold">Rate</th>
                  <th className="py-2 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {forex.map((fx) => {
                  const isPos = fx.change >= 0;
                  return (
                    <tr
                      key={fx.pair}
                      onClick={() => {
                        setChartIndex(fx.pair);
                      }}
                      className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                    >
                      <td className="py-2.5 font-bold text-[#050505]">{fx.pair}</td>
                      <td className="py-2.5 text-[#595959]">{fx.rate.toFixed(4)}</td>
                      <td className={`py-2.5 font-bold text-right ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPos ? '+' : ''}{fx.change_percent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <Globe size={15} /> Commodities
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Spot prices for main physical assets</p>
          </div>

          {loadingCommodities ? (
            <SkeletonTable rows={3} cols={4} />
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Price</th>
                  <th className="py-2 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((item) => {
                  const isPos = item.change >= 0;
                  return (
                    <tr
                      key={item.name}
                      onClick={() => {
                        setChartIndex(item.name);
                      }}
                      className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                    >
                      <td className="py-2.5 font-bold text-[#050505]">{item.name}</td>
                      <td className="py-2.5 text-[#595959]">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`py-2.5 font-bold text-right ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPos ? '+' : ''}{item.change_percent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default MarketOverview;
