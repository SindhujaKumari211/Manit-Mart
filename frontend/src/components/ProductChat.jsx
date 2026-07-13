import { useCallback, useEffect, useState } from "react";
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/45 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Product chat">
      <div className="w-full max-w-2xl h-[min(680px,calc(100vh-2rem))] bg-surface rounded-2xl shadow-2xl overflow-hidden flex">
        {isSeller && (
          <aside className="w-40 sm:w-52 border-r border-border overflow-y-auto shrink-0">
            <div className="p-3 text-xs font-bold text-muted uppercase">Conversations</div>
            {conversations.length === 0 ? <p className="px-3 text-sm text-muted">No buyer messages yet.</p> : conversations.map((chat) => (
              <button key={chat.buyer._id} onClick={() => setBuyerId(chat.buyer._id)} className={`w-full text-left px-3 py-3 border-t border-border text-sm ${buyerId === chat.buyer._id ? "bg-brand-50" : "hover:bg-secondary-50"}`}>
                <p className="font-semibold text-text-primary truncate">{chat.buyer.name}</p><p className="text-xs text-muted truncate">{chat.lastMessage}</p>
              </button>
            ))}
          </aside>
        )}
        <section className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center justify-between border-b border-border p-4">
            <div><h2 className="font-bold text-text-primary">Chat about {product.name}</h2><p className="text-xs text-muted">{isSeller ? "Reply to a buyer" : `Message ${product.seller?.name || "seller"}`}</p></div>
            <button onClick={onClose} className="p-2 rounded-lg text-muted hover:bg-secondary-100" aria-label="Close chat">✕</button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary-50">
            {loading ? <p className="text-sm text-muted">Loading messages…</p> : !buyerId && isSeller ? <p className="text-sm text-muted">Choose a conversation to reply.</p> : messages.length === 0 ? <p className="text-sm text-muted">Start the conversation about this product.</p> : messages.map((message) => (
              <div key={message._id} className={`flex ${message.sender?._id === localStorage.getItem("userId") ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.sender?._id === localStorage.getItem("userId") ? "bg-brand-700 text-white" : "bg-white border border-border text-text-primary"}`}>
                  <p>{message.content}</p><p className="mt-1 text-[10px] opacity-70">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} disabled={isSeller && !buyerId} placeholder={isSeller && !buyerId ? "Choose a buyer first" : "Write a message…"} className="flex-1 min-w-0 rounded-xl border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-secondary-50" />
            <button disabled={sending || !text.trim() || (isSeller && !buyerId)} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Send</button>
          </form>
        </section>
      </div>
    </div>
  );
}
