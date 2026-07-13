import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProductChat from "../components/ProductChat";

const formatTime = (value) => new Date(value).toLocaleString([], {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const Chats = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await API.get("/chats/conversations");
        setConversations(data.conversations || []);
      } finally {
        setLoading(false);
      }
    };

    load().catch((error) => {
      console.error("Failed to load chat inbox:", error);
      setLoading(false);
    });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Messages</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Your chats</h1>
            <p className="mt-2 text-sm text-slate-600">Open any existing product thread directly from here.</p>
          </div>
          <Link
            to="/"
            className="hidden sm:inline-flex items-center rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition"
          >
            Browse products
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading chats…</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">No chats yet</h2>
            <p className="mt-2 text-sm text-slate-500">Start a conversation on any product page and it will appear here.</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conversation) => {
              const counterparty = conversation.isSeller ? conversation.buyer : conversation.seller;
              const productImage = conversation.product?.image;

              return (
                <button
                  key={`${conversation.product?._id}-${conversation.buyer?._id}`}
                  onClick={() => setActiveConversation(conversation)}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-brand-200 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 shrink-0">
                      {productImage ? (
                        <img src={productImage} alt={conversation.product?.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-slate-900">{conversation.product?.name || "Product chat"}</h2>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                          {conversation.isSeller ? "Buyer thread" : "Seller thread"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {conversation.isSeller ? "Buyer: " : "Seller: "}
                        <span className="font-medium text-slate-700">{counterparty?.name || "Unknown"}</span>
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{conversation.lastMessage}</p>
                      <p className="mt-2 text-xs text-slate-400">Updated {formatTime(conversation.updatedAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeConversation && (
        <ProductChat
          product={activeConversation.product}
          isSeller={activeConversation.isSeller}
          initialBuyerId={activeConversation.buyer?._id}
          onClose={() => setActiveConversation(null)}
        />
      )}
    </div>
  );
};

export default Chats;