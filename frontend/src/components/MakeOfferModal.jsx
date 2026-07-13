import { useState } from "react";
import API from "../services/api";
import Modal from "./ui/Modal";
import { useToast } from "../context/ToastContext";
import { formatINR } from "../lib/productDisplay";
import { handleImageError, productImage } from "../lib/categoryImages";

// Buyer-facing dialog to submit (or update) an offer on a NEGOTIABLE product.
// On success it returns the created/updated offer via onSubmitted so the caller
// can reflect the new state without a full refetch.
const MakeOfferModal = ({ open, onClose, product, onSubmitted }) => {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const listPrice = Number(product.price) || 0;
  const numAmount = Number(amount);
  const invalid = !numAmount || numAmount < 1;
  const pctOff = listPrice && numAmount ? Math.round(((listPrice - numAmount) / listPrice) * 100) : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (invalid) return;
    setSubmitting(true);
    try {
      const { data } = await API.post("/offers", {
        productId: product._id,
        amount: numAmount,
        message: message.trim(),
      });
      toast.success("Offer sent to the seller");
      onSubmitted?.(data);
      setAmount("");
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't send your offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Make an Offer">
      <form onSubmit={submit} className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <img src={productImage(product)} alt={product.name} onError={(e) => handleImageError(e, product.category)} className="w-16 h-16 rounded-lg object-cover bg-secondary-100" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary line-clamp-1">{product.name}</p>
            <p className="text-sm text-text-secondary">Listed at <span className="font-semibold text-text-primary">{formatINR(listPrice)}</span></p>
          </div>
        </div>

        <label htmlFor="offer-amount" className="block text-sm font-semibold text-text-primary mb-1.5">
          Your offer (₹)
        </label>
        <input
          id="offer-amount"
          type="number"
          min="1"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`e.g. ${Math.max(1, Math.round(listPrice * 0.8))}`}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-brand-500 focus:outline-none"
          required
          autoFocus
        />
        {numAmount > 0 && (
          <p className="mt-1.5 text-xs text-text-secondary">
            {numAmount >= listPrice
              ? "That's at or above the asking price."
              : `${pctOff}% below the asking price.`}
          </p>
        )}

        <label htmlFor="offer-message" className="block text-sm font-semibold text-text-primary mt-4 mb-1.5">
          Message <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="offer-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          placeholder="Add a note for the seller…"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-brand-500 focus:outline-none resize-none"
        />

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-border text-sm font-semibold text-text-secondary hover:bg-secondary-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={invalid || submitting}
            className="flex-1 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold hover:bg-brand-800 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? "Sending…" : "Send Offer"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MakeOfferModal;
