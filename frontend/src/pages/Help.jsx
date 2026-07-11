import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Label, Input, TextArea, Select } from "../components/ui/Field";
import { useToast } from "../context/ToastContext";

const FAQS = [
  {
    group: "Delivery",
    items: [
      { q: "How does delivery work on Manit-Mart?", a: "Manit-Mart is a campus marketplace — buyers and sellers arrange an in-person handoff inside MANIT (hostel, department, or a common spot). Use the seller's contact details on your order to coordinate a time and place." },
      { q: "How long does it take to get my item?", a: "That's up to you and the seller. Most campus handoffs happen the same day or next day. Track the order status (Placed → Confirmed → Delivered) from My Orders." },
    ],
  },
  {
    group: "Returns & Exchanges",
    items: [
      { q: "Can I return a used item?", a: "Because most listings are unique second-hand items, returns are handled directly between buyer and seller. If an item isn't as described, raise a ticket below within 2 days of delivery and we'll help mediate." },
      { q: "Is there a return window?", a: "The standard mediation window is 2 days after the order is marked Delivered. After that, sales are considered final." },
    ],
  },
  {
    group: "Refunds",
    items: [
      { q: "How do refunds work for Cash on Delivery?", a: "COD means no money changes hands until you receive the item, so there's usually nothing to refund — simply don't pay for an item you don't accept. For disputes, raise a ticket and we'll coordinate with the seller." },
      { q: "When will I see my refund?", a: "Online payments aren't enabled yet, so all orders are COD. Once online payments launch, refunds will post to the original method within 5–7 business days." },
    ],
  },
  {
    group: "Payments",
    items: [
      { q: "What payment methods are supported?", a: "Cash on Delivery is live today. Online payment (UPI / Card) is coming soon and appears disabled at checkout until then." },
      { q: "Is my payment information safe?", a: "We never store card or UPI details. When online payments launch they'll be handled by a certified payment gateway." },
    ],
  },
  {
    group: "Damaged or Missing Items",
    items: [
      { q: "The item is damaged or not as described — what do I do?", a: "Don't accept it (for COD) and raise a ticket below with your order ID and a short description. We'll follow up with the seller." },
      { q: "I never received my item.", a: "Contact the seller first from My Orders. If you can't reach them, raise a ticket with the order ID and we'll step in." },
    ],
  },
];

const TICKETS_KEY = "mm:tickets";
const readTickets = () => {
  try {
    const arr = JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const TICKET_STATUS = { Open: "pending", "In Progress": "confirmed", Resolved: "delivered" };

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 py-3.5 text-left">
        <span className="text-sm font-semibold text-text-primary">{q}</span>
        <svg className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="pb-4 text-sm text-text-secondary leading-relaxed animate-fade-in">{a}</p>}
    </div>
  );
};

const Help = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState(readTickets);
  const [form, setForm] = useState({ category: "", subject: "", message: "" });

  const submitTicket = (e) => {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    const ticket = {
      id: `T-${Date.now().toString().slice(-6)}`,
      ...form,
      status: "Open",
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    try { localStorage.setItem(TICKETS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setForm({ category: "", subject: "", message: "" });
    toast.success(`Ticket ${ticket.id} raised — our team will get back to you`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-muted mb-3">
          <Link to="/orders" className="hover:text-brand-700">My Orders</Link> <span aria-hidden>/</span> <span className="text-text-secondary">Help Center</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Help Center</h1>
        <p className="text-text-secondary mt-1">Answers to common questions, or raise a ticket and we&apos;ll help.</p>

        {/* support channels */}
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <a href="mailto:support@manitmart.app" className="flex items-center gap-3 bg-card rounded-2xl border border-border shadow-soft p-4 hover:border-brand-200 transition">
            <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <div><p className="text-sm font-semibold text-text-primary">Email support</p><p className="text-xs text-muted">support@manitmart.app</p></div>
          </a>
          <div className="flex items-center gap-3 bg-card rounded-2xl border border-border shadow-soft p-4 opacity-70">
            <span className="w-10 h-10 rounded-xl bg-secondary-100 text-secondary-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 01-4-.83L3 20l1.17-3.5A7.6 7.6 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </span>
            <div><p className="text-sm font-semibold text-text-primary">Live chat</p><p className="text-xs text-muted">Coming soon</p></div>
          </div>
        </div>

        {/* FAQs */}
        <h2 className="text-lg font-bold text-text-primary mt-8 mb-3">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((group) => (
            <div key={group.group} className="bg-card rounded-2xl border border-border shadow-soft px-5 py-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted pt-3">{group.group}</p>
              {group.items.map((it) => <FaqItem key={it.q} {...it} />)}
            </div>
          ))}
        </div>

        {/* Raise a ticket */}
        <h2 className="text-lg font-bold text-text-primary mt-8 mb-3">Raise a support ticket</h2>
        <form onSubmit={submitTicket} className="bg-card rounded-2xl border border-border shadow-soft p-5 space-y-4">
          <div>
            <Label htmlFor="category">Topic</Label>
            <Select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="" disabled>Select a topic</option>
              <option>Delivery</option>
              <option>Return / Exchange</option>
              <option>Refund</option>
              <option>Payment</option>
              <option>Damaged or missing item</option>
              <option>Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input name="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Order #ab12cd34 — item not as described" />
          </div>
          <div>
            <Label htmlFor="message">Details</Label>
            <TextArea name="message" rows="4" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what happened, and include your order ID." />
          </div>
          <Button type="submit" className="w-full">Submit ticket</Button>
        </form>

        {/* Ticket queue */}
        {tickets.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-text-primary mt-8 mb-3">Your tickets</h2>
            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 bg-card rounded-xl border border-border shadow-soft px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{t.subject}</p>
                    <p className="text-xs text-muted">{t.id} · {t.category} · {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <Badge variant={TICKET_STATUS[t.status] || "neutral"}>{t.status}</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">Tickets move through <b>Open → In Progress → Resolved</b> as our team works them. (Demo queue stored on this device.)</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Help;
