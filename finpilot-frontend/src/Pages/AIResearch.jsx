import React, { useState } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { runAIResearch } from '../services/finpilotApi';

export default function AIResearch() {
  const [symbol, setSymbol] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runResearch = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const result = await runAIResearch(question.trim(), symbol.trim() || undefined);
      setAnswer(result.answer);
    } catch (requestError) {
      setError(requestError.message || 'Research request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1000px] mx-auto space-y-6">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">AI Research</h1>
        <p className="text-[13px] text-[#595959] mt-1">Ask a focused financial research question grounded in market data.</p>
      </header>

      <form onSubmit={runResearch} className="rounded-xl border border-[#E5E5E5] bg-white p-5 md:p-6 shadow-sm space-y-4">
        <label className="block">
          <span className="text-[11px] font-semibold text-[#595959] uppercase tracking-wider">Ticker (optional)</span>
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="For example, AAPL"
            className="mt-1.5 w-full px-4 py-3 rounded-lg border border-[#E5E5E5] text-[14px] outline-none focus:border-[#050505]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-[#595959] uppercase tracking-wider">Research question</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What would you like to understand about this company or the market?"
            rows={5}
            required
            className="mt-1.5 w-full px-4 py-3 rounded-lg border border-[#E5E5E5] text-[14px] outline-none focus:border-[#050505] resize-y"
          />
        </label>
        {error && <p role="alert" className="text-[13px] text-[#C5221F]">{error}</p>}
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#050505] text-white text-[13px] font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Researching…' : 'Run AI Research'}
        </button>
      </form>

      {answer && (
        <section aria-live="polite" className="rounded-xl border border-[#E5E5E5] bg-white p-5 md:p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-[#050505] mb-4"><Sparkles size={16} /> Research response</h2>
          <p className="text-[14px] leading-7 text-[#262626] whitespace-pre-wrap">{answer}</p>
        </section>
      )}
    </div>
  );
}
