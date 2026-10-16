import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, MessageSquare, Sparkles, Zap } from 'lucide-react';

const focusAreas = [
  { title: 'AI Chat', description: 'Ask questions about stocks and market movements.', icon: MessageSquare },
  { title: 'AI Research', description: 'Get focused, evidence-backed financial research.', icon: Sparkles },
  { title: 'Live Market Dashboard', description: 'Follow market status, indices, movers, and history.', icon: Activity },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] px-6 py-10 text-[#050505]">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#050505] text-white"><Zap size={16} /></span>
          FinPilot AI
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/login" className="text-[#595959] hover:text-[#050505]">Sign in</Link>
          <Link to="/signup" className="rounded-lg bg-[#050505] px-4 py-2 text-white hover:bg-[#262626]">Get started</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl pb-16 pt-20 md:pt-28">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#737373]">Market intelligence, focused</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">Research markets with clarity.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#595959]">Use AI chat, focused financial research, and a live market dashboard in one workspace.</p>
        <Link to="/signup" className="mt-8 inline-flex rounded-lg bg-[#050505] px-5 py-3 text-sm font-semibold text-white hover:bg-[#262626]">Open FinPilot</Link>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3" aria-label="FinPilot features">
        {focusAreas.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-xl border border-[#E5E5E5] bg-white p-6">
            <Icon size={20} className="text-[#404040]" />
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#595959]">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
