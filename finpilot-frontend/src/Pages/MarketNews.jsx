import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Zap, TrendingUp, Search, Bookmark, Newspaper, RefreshCw, AlertCircle } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { fetchNews, fetchTopics, fetchSentiment } from '../services/news';

const FALLBACK_NEWS = [
  {
    id: 1, title: 'NVIDIA Unveils Next-Gen Blackwell Ultra GPU Architecture',
    url: '#', source: 'Bloomberg', author: 'Alex Kim',
    summary: 'NVIDIA announced its next-generation Blackwell Ultra architecture promising 3x inference throughput over H200.',
    topic: 'Technology', ticker: 'NVDA', overall_sentiment_label: 'Bullish',
    overall_sentiment_score: 0.8, published_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 2, title: 'Federal Reserve Signals Potential Rate Cut at September FOMC Meeting',
    url: '#', source: 'Reuters', author: 'Sarah Chen',
    summary: 'Fed Chair Powell indicated conditions are approaching the threshold where rate cuts may be appropriate.',
    topic: 'Finance', ticker: 'MACRO', overall_sentiment_label: 'Somewhat-Bullish',
    overall_sentiment_score: 0.4, published_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 3, title: 'Apple Faces DOJ Antitrust Scrutiny Over App Store Policies',
    url: '#', source: 'WSJ', author: 'Mike Torres',
    summary: "The Department of Justice expanded its formal investigation into Apple's App Store commission structure.",
    topic: 'Technology', ticker: 'AAPL', overall_sentiment_label: 'Bearish',
    overall_sentiment_score: -0.6, published_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 4, title: 'Amazon AWS Revenue Beats Q2 Estimates, Cloud Growth Re-Accelerates',
    url: '#', source: 'CNBC', author: 'Jennifer Walsh',
    summary: 'AWS posted $26.3B in Q2 revenue (+19% YoY), beating estimates of $25.1B.',
    topic: 'Earnings', ticker: 'AMZN', overall_sentiment_label: 'Bullish',
    overall_sentiment_score: 0.75, published_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
];

const FALLBACK_SENTIMENT = {
  total_articles: 4,
  overall: 'Somewhat-Bullish',
  breakdown: [
    { label: 'Bullish', pct: 50, count: 2, color: '#137333' },
    { label: 'Somewhat-Bullish', pct: 25, count: 1, color: '#34A853' },
    { label: 'Bearish', pct: 25, count: 1, color: '#C5221F' },
  ],
};

function relativeTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SENTIMENT_STYLE = {
  Bullish: 'bg-[#E8F5E9] text-[#137333]',
  'Somewhat-Bullish': 'bg-[#E6F4EA] text-[#34A853]',
  Neutral: 'bg-[#F5F5F5] text-[#8C8C8C]',
  'Somewhat-Bearish': 'bg-[#FEF7E0] text-[#EA8600]',
  Bearish: 'bg-[#FEEBEE] text-[#C5221F]',
};

const SentimentPill = ({ label }) => {
  const cls = SENTIMENT_STYLE[label] || SENTIMENT_STYLE.Neutral;
  const short = label?.replace('Somewhat-', 'S-') ?? 'Neutral';
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {short}
    </span>
  );
};

export const MarketNews = () => {
  const [articles, setArticles] = useState([]);
  const [sentimentData, setSentimentData] = useState(null);
  const [topics, setTopics] = useState(['All']);
  const [activeTopic, setActiveTopic] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [newsRes, sentimentRes, topicsRes] = await Promise.allSettled([
        fetchNews({ topic: activeTopic !== 'All' ? activeTopic : null }),
        fetchSentiment(),
        fetchTopics(),
      ]);

      if (newsRes.status === 'fulfilled' && newsRes.value.articles?.length > 0) {
        setArticles(newsRes.value.articles);
        setUsingFallback(false);
      } else {
        setArticles(FALLBACK_NEWS);
        setUsingFallback(true);
      }

      if (sentimentRes.status === 'fulfilled' && sentimentRes.value.total_articles > 0) {
        setSentimentData(sentimentRes.value);
      } else {
        setSentimentData(FALLBACK_SENTIMENT);
      }

      if (topicsRes.status === 'fulfilled' && topicsRes.value.length > 0) {
        setTopics(['All', ...topicsRes.value]);
      } else {
        setTopics(['All', 'Technology', 'Finance', 'Earnings', 'Retail & Wholesale']);
      }

    } catch (err) {
      setError(err.message);
      setArticles(FALLBACK_NEWS);
      setSentimentData(FALLBACK_SENTIMENT);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [activeTopic]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = articles.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title?.toLowerCase().includes(q) ||
      n.ticker?.toLowerCase().includes(q) ||
      n.source?.toLowerCase().includes(q)
    );
  });

  const sentiment = sentimentData ?? FALLBACK_SENTIMENT;

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-6">

      {}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Market News</h1>
          <p className="text-[13px] text-[#595959] mt-1">
            AI-curated financial news with sentiment analysis across markets.
            {usingFallback && (
              <span className="ml-2 text-[#EA8600] font-medium">
                (Showing sample data — add your Alpha Vantage API key in <code>.env</code>)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news..."
              aria-label="Search news"
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[12px] outline-none focus:border-[#050505] w-52"
            />
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh news"
            className="p-2 rounded-lg border border-[#E5E5E5] bg-white text-[#595959] hover:text-[#050505] hover:border-[#C8C8C8] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[#FDECEA] bg-[#FFF8F7] text-[12px] text-[#C5221F]">
          <AlertCircle size={13} />
          <span>Could not reach backend: {error}. Showing sample data.</span>
        </div>
      )}

      {}
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveTopic(topic)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
              activeTopic === topic
                ? 'bg-[#050505] text-white'
                : 'bg-white border border-[#E5E5E5] text-[#595959] hover:border-[#C8C8C8] hover:text-[#050505]'
            }`}
          >
            {topic}
            {topic !== 'All' && (
              <span className={`ml-1.5 text-[10px] ${activeTopic === topic ? 'opacity-60' : 'text-[#ADADAD]'}`}>
                {articles.filter((n) => n.topic === topic).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {}
        <div className="lg:col-span-2 space-y-4">

          {}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-[#E5E5E5] p-5 animate-pulse">
                  <div className="h-3 bg-[#F0F0F0] rounded w-1/4 mb-3" />
                  <div className="h-4 bg-[#F0F0F0] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#F0F0F0] rounded w-full mb-1" />
                  <div className="h-3 bg-[#F0F0F0] rounded w-5/6" />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E5E5E5]">
              <EmptyState
                icon={Newspaper}
                title="No news matches your filters"
                description="Try a different topic or clear your search."
                actionLabel={activeTopic !== 'All' || searchQuery ? 'Clear filters' : undefined}
                onAction={() => { setActiveTopic('All'); setSearchQuery(''); }}
              />
            </div>
          )}

          {!loading && filtered.map((news, i) => (
            <a
              key={news.id}
              href={news.url !== '#' ? news.url : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`block bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm hover:border-[#D0D0D0] hover:shadow-md transition-all group ${
                i === 0 ? 'border-l-4 border-l-[#050505]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  {}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {news.ticker && (
                      <span className="font-mono text-[10px] font-bold bg-[#F5F5F5] border border-[#EDEDEE] text-[#595959] px-1.5 py-0.5 rounded">
                        {news.ticker}
                      </span>
                    )}
                    {news.topic && (
                      <span className="font-mono text-[10px] text-[#ADADAD]">{news.topic}</span>
                    )}
                    <SentimentPill label={news.overall_sentiment_label} />
                    {i === 0 && (
                      <span className="text-[10px] font-bold bg-[#050505] text-white px-2 py-0.5 rounded-full">LATEST</span>
                    )}
                  </div>

                  {}
                  <h3 className={`font-semibold text-[#050505] mb-2 leading-snug group-hover:underline ${i === 0 ? 'text-[15px]' : 'text-[13.5px]'}`}>
                    {news.title}
                  </h3>

                  {}
                  {news.summary && (
                    <p className="text-[12.5px] text-[#595959] leading-relaxed mb-3 line-clamp-2">{news.summary}</p>
                  )}

                  {}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {news.source && (
                        <span className="font-mono text-[10px] font-semibold text-[#050505]">{news.source}</span>
                      )}
                      <span className="text-[10px] text-[#D0D0D0]">·</span>
                      <span className="text-[10px] text-[#ADADAD]">{relativeTime(news.published_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={13} className="text-[#8C8C8C]" />
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {}
        <div className="space-y-5">

          {}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={13} className="text-[#137333]" />
              <h3 className="font-semibold text-[#050505] text-[13px]">Market Sentiment</h3>
            </div>
            <p className="text-[11px] text-[#8C8C8C] mb-4">Based on {sentiment.total_articles} articles</p>
            <div className="space-y-3">
              {sentiment.breakdown.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="text-[#595959]">{s.label}</span>
                    <span className="font-bold" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: 0.85 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-[#F0F0F0] p-3 bg-[#F9F9F9] rounded-lg">
              <p className="font-mono text-[9px] text-[#8C8C8C] uppercase tracking-wider mb-1">Overall Signal</p>
              <p className="text-[13px] font-bold text-[#137333]">{sentiment.overall}</p>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">Across {sentiment.total_articles} analysed articles</p>
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-[#050505]" />
              <h3 className="font-semibold text-[#050505] text-[13px]">Mentioned Tickers</h3>
            </div>
            <div className="space-y-2.5">
              {(() => {
                const counts = {};
                articles.forEach((a) => {
                  if (a.ticker) counts[a.ticker] = (counts[a.ticker] || { count: 0, label: a.overall_sentiment_label });
                  if (a.ticker) counts[a.ticker].count++;
                });
                return Object.entries(counts)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 6)
                  .map(([ticker, { count, label }]) => (
                    <div key={ticker} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[10px] font-bold text-[#050505]">
                          {ticker[0]}
                        </div>
                        <span className="text-[12px] font-semibold text-[#050505]">{ticker}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8C8C8C]">{count} articles</span>
                        <SentimentPill label={label} />
                      </div>
                    </div>
                  ));
              })()}
              {articles.filter((a) => a.ticker).length === 0 && (
                <p className="text-[12px] text-[#ADADAD]">No ticker data yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MarketNews;
