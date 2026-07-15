import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import API from "../services/api";

export default function ProductChat({ product, isSeller, initialBuyerId = null, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [buyerId, setBuyerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!isSeller) return;
    const { data } = await API.get(`/chats/product/${product._id}/conversations`);
    setConversations(data.conversations || []);
    setBuyerId((current) => current || initialBuyerId || data.conversations?.[0]?.buyer?._id || null);
  }, [initialBuyerId, isSeller, product._id]);

  const loadMessages = useCallback(async () => {
    if (isSeller && !buyerId) return;
    setLoading(true);
    try {
      const query = isSeller ? `?buyerId=${encodeURIComponent(buyerId)}` : "";
      const { data } = await API.get(`/chats/product/${product._id}${query}`);
      setMessages(data.messages || []);
    } finally {
      setLoading(false);
    }
  }, [buyerId, isSeller, product._id]);

  useEffect(() => { loadConversations().catch(() => setLoading(false)); }, [loadConversations]);
  useEffect(() => { loadMessages().catch(() => setLoading(false)); }, [loadMessages]);
  useEffect(() => {
    const timer = setInterval(() => loadMessages().catch(() => {}), 7000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  const send = async (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || (isSeller && !buyerId)) return;
    setSending(true);
    try {
      const { data } = await API.post(`/chats/product/${product._id}`, { content, ...(isSeller ? { buyerId } : {}) });
      setMessages((current) => [...current, data]);
      setText("");
      loadConversations().catch(() => {});
    } finally {
      setSending(false);
    }
  };

  const chatContent = (
    <div className="fixed inset-0 z-[100] bg-black/45 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Product chat">
      <div className="w-full max-w-2xl h-[min(680px,calc(100vh-2rem))] bg-surface rounded-2xl shadow-2xl overflow-hidden flex">
        {isSeller && (
          <aside className="w-40 sm:w-52 border-r border-border overflow-y-auto shrink-0">
            <div className="p-3 text-xs font-bold text-muted uppercase">Conversations</div>
            {conversations.length === 0 ? <p className="px-3 text-sm text-muted">No buyer messages yet.</p> : conversations.map((chat) => (
              <button key={chat.buyer._id} onClick={() => setBuyerId(chat.buyer._id)} className={`w-full text-left px-3 py-3 border-t border-border text-sm ${buyerId === chat.buyer._id ? "bg-brand-50" : "hover:bg-secondary-50"}`}>
                <div className="font-semibold text-text-primary truncate">{chat.buyer.name}</div>
                <div className="text-xs text-muted truncate mt-1">({chat.messageCount} msgs)</div>
              </button>
            ))}
          </aside>
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-semibold text-text-primary text-base sm:text-lg">{isSeller ? "Buyer Chat" : `Chat with ${product.seller.name}`}</h2>
              <p className="text-sm text-muted">for {product.name}</p>
            </div>
            <button onClick={onClose} aria-label="Close chat" className="text-muted hover:text-text-primary bg-secondary-100 p-2 rounded-full transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? <div className="text-center text-muted">Loading messages...</div> : messages.length === 0 ? <div className="text-center text-muted mt-4">No messages yet. Send a message to start the conversation!</div> : messages.map((m) => {
              const isMine = (m.sender === localStorage.getItem("userId")) || (m.sender?._id === localStorage.getItem("userId"));
              return (
                <div key={m._id} className={`flex flex-col max-w-[85%] ${isMine ? "self-end items-end ml-auto" : "self-start items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-brand-600 text-white rounded-br-sm" : "bg-secondary-100 text-text-primary rounded-bl-sm"}`}>{m.content}</div>
                  <span className="text-[10px] text-muted mt-1 px-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
          {(!isSeller || buyerId) && (
            <form onSubmit={send} className="p-4 border-t border-border flex items-center gap-2 shrink-0">
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-xl border border-border px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" disabled={sending} />
              <button type="submit" disabled={sending || !text.trim()} className="bg-brand-600 text-white rounded-xl px-5 py-2 text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-50">Send</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
  
  return createPortal(chatContent, document.body);
}
