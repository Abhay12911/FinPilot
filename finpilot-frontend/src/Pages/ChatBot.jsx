import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, FileText, Search, Copy, RefreshCw, Plus, ChevronDown, X } from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    content: `Hello! I'm **FinPilot AI**, your premium financial research assistant.\n\nI can help you:\n- **Analyze** company financials, earnings, and SEC filings\n- **Compare** businesses across key metrics\n- **Uncover** portfolio risks and opportunities\n- **Summarize** lengthy documents in seconds\n\nWhat would you like to explore today?`,
    citations: [],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_PROMPTS = [
  { label: '📊 Analyze NVDA financials', text: 'Analyze NVIDIA\'s latest financial performance and growth drivers' },
  { label: '⚡ Compare AAPL vs MSFT', text: 'Compare Apple and Microsoft across revenue, margins, and valuation' },
  { label: '📄 Summarize 10-K filing', text: 'Summarize the key risks from Apple\'s latest 10-K filing' },
  { label: '🔍 Portfolio risk analysis', text: 'Analyze the key risks in my current portfolio holdings' },
];

const CHAT_HISTORY = [
  { id: 1, title: 'NVIDIA Revenue Analysis', date: 'Today', active: true },
  { id: 2, title: 'AAPL vs MSFT Comparison', date: 'Today', active: false },
  { id: 3, title: 'Portfolio Risk Assessment', date: 'Yesterday', active: false },
  { id: 4, title: 'Tesla 10-K Summary', date: 'Yesterday', active: false },
  { id: 5, title: 'Fed Rate Impact Analysis', date: 'Aug 25', active: false },
];

const MOCK_RESPONSES = [
  `Based on the latest earnings reports and market data, **NVIDIA's revenue increased 427% year-over-year** primarily due to massive demand for Hopper architecture GPUs (H100) from hyperscalers training generative AI models.\n\n**Key Drivers:**\n- Data Center revenue: $47.5B (up 427% YoY)\n- Gaming segment: $2.9B (modest recovery)\n- AI inference & training workloads driving demand\n\n**Forward Outlook:** Management guided for continued strong growth as AI infrastructure buildout accelerates globally. The Blackwell architecture (B100/B200) is expected to further expand their addressable market.`,
  `Here's a comprehensive comparison of **Apple vs Microsoft** across key financial metrics:\n\n| Metric | Apple (AAPL) | Microsoft (MSFT) |\n|--------|------|------|\n| Revenue | $383B | $245B |\n| Gross Margin | 44.1% | 70.1% |\n| Operating Income | $115B | $109B |\n| P/E Ratio | 31x | 38x |\n| Dividend Yield | 0.5% | 0.7% |\n\n**Verdict:** Microsoft commands higher margins due to its software/cloud-heavy model. Apple benefits from its sticky ecosystem and strong free cash flow generation at $100B+ annually.`,
];

let responseIdx = 0;

function formatMessage(text) {
  
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  if (text.includes('|')) {
    const lines = text.split('\n');
    const tableLines = [];
    const nonTableLines = [];
    let inTable = false;
    for (const line of lines) {
      if (line.trim().startsWith('|')) {
        inTable = true;
        tableLines.push(line);
      } else {
        if (inTable) {
          nonTableLines.push('<div class="overflow-x-auto my-3"><table class="w-full text-[12px] border-collapse">' +
            tableLines.map((r, i) => {
              if (r.includes('---')) return '';
              const cells = r.split('|').filter(c => c.trim() !== '');
              const tag = i === 0 ? 'th' : 'td';
              return `<tr>${cells.map(c => `<${tag} class="px-3 py-2 text-left border border-[#F0F0F0] ${i === 0 ? 'bg-[#FAFAFA] font-mono text-[10px] text-[#8C8C8C] uppercase tracking-wider' : 'text-[#050505]'}">${c.trim()}</${tag}>`).join('')}</tr>`;
            }).join('') +
            '</table></div>');
          tableLines.length = 0;
          inTable = false;
        }
        nonTableLines.push(line);
      }
    }
    text = nonTableLines.join('\n');
  }
  
  const paragraphs = text.split('\n').map(line => {
    if (line.startsWith('- ')) return `<li class="ml-4 list-disc text-[#050505]">${line.slice(2)}</li>`;
    if (line.trim() === '') return '<br/>';
    return `<span>${line}</span>`;
  });
  return paragraphs.join('\n');
}

export const ChatBot = () => {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeChat, setActiveChat] = useState(1);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: MOCK_RESPONSES[responseIdx % MOCK_RESPONSES.length],
        citations: [
          { title: 'NVDA Q4 2026 Earnings Release', type: 'SEC Filing' },
          { title: 'Data Center Market Analysis', type: 'Market Data' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      responseIdx++;
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1600);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const groupedHistory = [
    { label: 'Today', chats: CHAT_HISTORY.filter(c => c.date === 'Today') },
    { label: 'Yesterday', chats: CHAT_HISTORY.filter(c => c.date === 'Yesterday') },
    { label: 'Earlier', chats: CHAT_HISTORY.filter(c => c.date === 'Aug 25') },
  ].filter(g => g.chats.length > 0);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#FAFAFA] overflow-hidden">

      {}
      <aside className="hidden md:flex w-[220px] shrink-0 border-r border-[#E5E5E5] bg-white flex-col">
        <div className="p-3 border-b border-[#F0F0F0]">
          <button
            onClick={() => { setMessages(INITIAL_MESSAGES); setActiveChat(null); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#050505] text-white text-[12px] font-semibold hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
          >
            <Plus size={13} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {groupedHistory.map(group => (
            <div key={group.label}>
              <h3 className="font-mono text-[9px] text-[#8C8C8C] tracking-widest uppercase mb-1.5 px-2">{group.label}</h3>
              <div className="space-y-0.5">
                {group.chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat.id)}
                    aria-current={activeChat === chat.id ? 'true' : undefined}
                    className={`w-full text-left px-2.5 py-2 text-[12px] rounded-lg truncate transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505] ${
                      activeChat === chat.id
                        ? 'bg-[#F5F5F5] text-[#050505] font-medium'
                        : 'text-[#595959] hover:bg-[#F5F5F5] hover:text-[#050505]'
                    }`}
                  >
                    {chat.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-36">

            {}
            {messages.length === 1 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.text)}
                    className="text-left p-3.5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#D0D0D0] hover:bg-[#FAFAFA] transition-colors text-[12px] text-[#595959] shadow-sm"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 stagger-item ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                {}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === 'user' ? 'bg-[#E5E5E5]' : 'bg-[#050505]'
                }`}>
                  {msg.role === 'user'
                    ? <User size={14} className="text-[#595959]" />
                    : <Sparkles size={13} className="text-white fill-white" />
                  }
                </div>

                {}
                <div className={`flex flex-col gap-2 max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-[13.5px] leading-[1.65] shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#050505] text-white rounded-tr-none'
                      : 'bg-white border border-[#E5E5E5] text-[#050505] rounded-tl-none'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div
                        className="prose-custom"
                        dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cit, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E5E5E5] bg-white text-[11px] text-[#595959] cursor-pointer hover:border-[#D0D0D0]"
                        >
                          <FileText size={11} />
                          {cit.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {}
                  {msg.role === 'assistant' && msg.id !== 1 && (
                    <div className="flex items-center gap-2 text-[#ADADAD]">
                      <button aria-label="Copy response" className="hover:text-[#595959] transition-colors p-1 rounded-md hover:bg-[#F5F5F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]" title="Copy">
                        <Copy size={13} />
                      </button>
                      <button aria-label="Regenerate response" className="hover:text-[#595959] transition-colors p-1 rounded-md hover:bg-[#F5F5F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]" title="Regenerate">
                        <RefreshCw size={13} />
                      </button>
                      <span className="text-[10px] text-[#D0D0D0]">{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {}
            {isTyping && (
              <div className="flex gap-3" aria-live="polite">
                <span className="sr-only">FinPilot AI is typing a response</span>
                <div className="w-8 h-8 rounded-full bg-[#050505] flex items-center justify-center shrink-0">
                  <Sparkles size={13} className="text-white fill-white" />
                </div>
                <div className="bg-white border border-[#E5E5E5] rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5 shadow-sm">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-[#8C8C8C] rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about companies, markets, or your portfolio... (Enter to send)"
                aria-label="Message FinPilot AI"
                rows={1}
                className="w-full bg-white border border-[#E5E5E5] rounded-xl pl-5 pr-14 py-3.5 text-[13.5px] text-[#050505] shadow-sm outline-none focus:border-[#C8C8C8] focus:ring-4 focus:ring-[#F0F0F0] transition-all resize-none leading-relaxed placeholder-[#ADADAD]"
                style={{ minHeight: '52px', maxHeight: '160px' }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="absolute right-3 bottom-3 p-2 bg-[#050505] text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#1A1A1A] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#050505]"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="text-center mt-2 text-[10px] text-[#ADADAD]">
              FinPilot AI may make mistakes. Always verify important financial information independently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
