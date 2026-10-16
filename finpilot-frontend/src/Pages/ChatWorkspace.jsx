import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, MessageSquarePlus, Paperclip, Plus, Send, Sparkles, Trash2, Upload, User } from 'lucide-react';
import {
  createChatConversation,
  deleteChatDocument,
  deleteChatConversation,
  getChatConversation,
  listChatConversations,
  listChatDocuments,
  sendChatMessage,
  uploadChatDocument,
} from '../services/finpilotApi';

const STARTER_MESSAGE = {
  role: 'assistant',
  content: 'Hi, I’m FinPilot AI. Ask a market question, or upload and select a document to analyze its contents with source citations.',
  citations: [],
};

function errorMessage(error) {
  return error?.message || 'The request failed. Please try again.';
}

export default function ChatWorkspace() {
  const [messages, setMessages] = useState([STARTER_MESSAGE]);
  const [input, setInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [history, savedDocuments] = await Promise.all([listChatConversations(), listChatDocuments()]);
        if (cancelled) return;
        setConversations(history);
        setDocuments(savedDocuments);
        if (history.length) {
          const latest = await getChatConversation(history[0].id);
          if (cancelled) return;
          setActiveConversationId(latest.id);
          setMessages(latest.messages.length ? latest.messages : [STARTER_MESSAGE]);
          setSelectedDocumentIds(latest.document_ids || []);
        }
      } catch (loadError) {
        if (!cancelled) setError(errorMessage(loadError));
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const openConversation = async (conversationId) => {
    setError('');
    setBooting(true);
    try {
      const conversation = await getChatConversation(conversationId);
      setActiveConversationId(conversation.id);
      setMessages(conversation.messages.length ? conversation.messages : [STARTER_MESSAGE]);
      setSelectedDocumentIds(conversation.document_ids || []);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setBooting(false);
    }
  };

  const startNewChat = async () => {
    setError('');
    try {
      const conversation = await createChatConversation();
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversation.id);
      setMessages([STARTER_MESSAGE]);
      setSelectedDocumentIds([]);
    } catch (createError) {
      setError(errorMessage(createError));
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadChatDocument(file);
      const savedDocuments = await listChatDocuments();
      setDocuments(savedDocuments);
      setSelectedDocumentIds((current) => [...new Set([...current, uploaded.id])]);
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  };

  const toggleDocument = (documentId) => {
    setSelectedDocumentIds((current) => current.includes(documentId)
      ? current.filter((id) => id !== documentId)
      : [...current, documentId]);
  };

  const removeDocument = async (documentId) => {
    setError('');
    try {
      await deleteChatDocument(documentId);
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setSelectedDocumentIds((current) => current.filter((id) => id !== documentId));
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  };

  const removeConversation = async (conversationId, event) => {
    event.stopPropagation();
    setError('');
    try {
      await deleteChatConversation(conversationId);
      const remaining = conversations.filter((item) => item.id !== conversationId);
      setConversations(remaining);
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([STARTER_MESSAGE]);
        setSelectedDocumentIds([]);
        if (remaining.length) await openConversation(remaining[0].id);
      }
    } catch (deleteError) {
      setError(errorMessage(deleteError));
    }
  };

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || loading) return;
    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'user', content: message, citations: [] }]);
    setLoading(true);
    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createChatConversation();
        conversationId = conversation.id;
        setActiveConversationId(conversationId);
        setConversations((current) => [conversation, ...current]);
      }
      const result = await sendChatMessage(conversationId, message, selectedDocumentIds);
      setMessages((current) => [...current, { role: 'assistant', content: result.answer, citations: result.citations || [] }]);
      const history = await listChatConversations();
      setConversations(history);
    } catch (sendError) {
      setError(errorMessage(sendError));
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[520px] bg-[#FAFAFA]">
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.json,.log,text/*" onChange={handleUpload} className="hidden" />
      <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#E5E5E5] bg-white lg:flex">
        <div className="border-b border-[#E5E5E5] p-3">
          <button type="button" onClick={startNewChat} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#050505] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#262626]">
            <MessageSquarePlus size={15} /> New chat
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <h2 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-[#8C8C8C]">Recent chats</h2>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div key={conversation.id} className={`group flex items-center rounded-lg ${activeConversationId === conversation.id ? 'bg-[#F2F2F2]' : 'hover:bg-[#FAFAFA]'}`}>
                <button type="button" onClick={() => openConversation(conversation.id)} className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-xs text-[#404040]" title={conversation.title}>
                  {conversation.title}
                </button>
                <button type="button" onClick={(event) => removeConversation(conversation.id, event)} aria-label="Delete conversation" className="mr-1 rounded p-1 text-[#A3A3A3] opacity-0 hover:bg-white hover:text-red-600 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {!conversations.length && <p className="px-2 py-2 text-xs text-[#8C8C8C]">Your saved conversations will appear here.</p>}
          </div>

          <div className="mb-2 mt-6 flex items-center justify-between px-1">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8C8C8C]">Documents</h2>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-[#404040] hover:bg-[#F5F5F5] disabled:opacity-50">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload
            </button>
          </div>
          <p className="mb-2 px-1 text-[10px] leading-4 text-[#8C8C8C]">Select documents to ground chat answers. PDF and text files up to 10 MB.</p>
          <div className="space-y-1">
            {documents.map((document) => (
              <div key={document.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-2 hover:bg-[#FAFAFA]">
                <input type="checkbox" checked={selectedDocumentIds.includes(document.id)} disabled={document.status !== 'Indexed'} onChange={() => toggleDocument(document.id)} aria-label={`Use ${document.name} in chat`} className="accent-[#050505]" />
                <FileText size={14} className="shrink-0 text-[#8C8C8C]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-[#404040]" title={document.name}>{document.name}</p>
                  <p className={`text-[10px] ${document.status === 'Indexed' ? 'text-[#8C8C8C]' : 'text-amber-700'}`}>{document.status}{document.status === 'Indexed' ? ` · ${document.chunks} chunks` : ''}</p>
                </div>
                <button type="button" onClick={() => removeDocument(document.id)} aria-label={`Delete ${document.name}`} className="rounded p-1 text-[#A3A3A3] opacity-0 hover:text-red-600 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))}
            {!documents.length && <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full rounded-lg border border-dashed border-[#D4D4D4] px-2 py-4 text-center text-[11px] text-[#737373] hover:bg-[#FAFAFA]"><Plus size={14} className="mx-auto mb-1" />Upload a document</button>}
          </div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-white px-4 py-3 md:px-6">
          <div>
            <h1 className="text-sm font-semibold text-[#050505]">AI Chat</h1>
            <p className="text-xs text-[#737373]">Market answers, document analysis, and saved conversations</p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            {!!conversations.length && <select value={activeConversationId || ''} onChange={(event) => openConversation(Number(event.target.value))} aria-label="Open saved chat" className="max-w-32 rounded-lg border border-[#E5E5E5] bg-white px-2 py-2 text-[10px] text-[#404040]">
              {conversations.map((conversation) => <option key={conversation.id} value={conversation.id}>{conversation.title}</option>)}
            </select>}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E5E5] px-2.5 py-2 text-xs font-semibold text-[#404040]"><Paperclip size={14} /> Upload</button>
            <button type="button" onClick={startNewChat} className="rounded-lg border border-[#E5E5E5] p-2 text-[#404040]" aria-label="New chat"><Plus size={16} /></button>
          </div>
        </header>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5E5E5] bg-white px-4 py-2 lg:hidden">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#8C8C8C]">Use document</span>
          {documents.map((document) => <label key={document.id} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#E5E5E5] px-2.5 py-1 text-[10px] text-[#404040]"><input type="checkbox" checked={selectedDocumentIds.includes(document.id)} disabled={document.status !== 'Indexed'} onChange={() => toggleDocument(document.id)} className="accent-[#050505]" />{document.name}</label>)}
          {!documents.length && <span className="text-[10px] text-[#8C8C8C]">Upload to add source documents</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto max-w-3xl space-y-5">
            {booting && <div className="flex items-center gap-2 text-xs text-[#737373]"><Loader2 size={14} className="animate-spin" />Loading your saved chats…</div>}
            {messages.length === 1 && !booting && (
              <div className="mb-5 grid gap-2 sm:grid-cols-2">
                {['Summarize the selected document', 'What are the key risks described?', 'What is Apple’s current price?', 'Explain the main financial trends'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)} className="rounded-lg border border-[#E5E5E5] bg-white p-3 text-left text-xs text-[#595959] hover:border-[#A3A3A3]">{prompt}</button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <article key={message.id || `${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-[#E5E5E5]' : 'bg-[#050505] text-white'}`}>
                  {message.role === 'user' ? <User size={15} /> : <Sparkles size={15} />}
                </span>
                <div className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#050505] text-white' : 'border border-[#E5E5E5] bg-white text-[#262626]'}`}>
                  {message.content}
                  {!!message.citations?.length && <div className="mt-3 border-t border-[#E5E5E5] pt-2 text-[10px] leading-4 text-[#737373]">
                    <span className="font-semibold text-[#404040]">Sources</span>
                    <ul className="mt-1 list-inside list-disc">{message.citations.map((citation, citationIndex) => <li key={`${citation.document_id}-${citation.chunk}-${citationIndex}`}>{citation.url ? <a href={citation.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{citation.label || citation.source || citation.document || 'Source'}{citation.date ? ` · ${citation.date}` : ''}</a> : <>{citation.document || citation.label || citation.type || citation.symbol}{citation.page ? ` · page ${citation.page}` : ''}{citation.chunk != null ? ` · chunk ${citation.chunk + 1}` : ''}{citation.symbol && !citation.document ? ` · ${citation.symbol}` : ''}</>}</li>)}</ul>
                  </div>}
                </div>
              </article>
            ))}
            {loading && <div className="flex items-center gap-2 text-xs text-[#737373]"><Loader2 size={15} className="animate-spin" />FinPilot is researching…</div>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div ref={endRef} />
          </div>
        </div>

        <form onSubmit={submit} className="border-t border-[#E5E5E5] bg-white p-4 md:px-8">
          {selectedDocumentIds.length > 0 && <div className="mx-auto mb-2 flex max-w-3xl items-center gap-1.5 text-[10px] text-[#595959]"><Paperclip size={12} />Using {selectedDocumentIds.length} selected document{selectedDocumentIds.length === 1 ? '' : 's'} as evidence</div>}
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-[#E5E5E5] p-2 focus-within:border-[#A3A3A3]">
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(input); } }} placeholder="Ask about markets or your selected documents…" rows={1} className="max-h-32 min-h-10 flex-1 resize-y px-2 py-2 text-sm outline-none" aria-label="Message FinPilot AI" />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#050505] text-white disabled:opacity-40"><Send size={16} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}
