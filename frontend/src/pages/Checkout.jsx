import { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PageSpinner } from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Label, TextArea, Input, FieldError } from "../components/ui/Field";

const STEPS = [
  { key: "address", label: "Address" },
  { key: "review", label: "Review" },
  { key: "confirmation", label: "Done" },
];

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// Peer-to-peer marketplace: each listing is a single physical item, so an
// item's "stock" is simply whether it is still available (not sold).
const isAvailable = (item) => item?.product && !item.product.isSold;

const Stepper = ({ current }) => {
  const activeIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-8" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const state = i < activeIndex ? "done" : i === activeIndex ? "active" : "todo";
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition ${
                  state === "done"
                    ? "bg-green-600 text-white"
                    : state === "active"
                    ? "bg-brand-900 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={`text-sm font-semibold ${
                  state === "todo" ? "text-slate-400" : "text-slate-800"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`w-6 sm:w-10 h-0.5 ${i < activeIndex ? "bg-green-600" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { items, loading, refetch } = useCart();

  const [step, setStep] = useState("address");
  const [form, setForm] = useState({ deliveryAddress: "", phone: "" });
  const [paymentMethod] = useState("cod"); // Online payment intentionally disabled for now
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState({ placed: [], failed: [] });

  // Prefill delivery details from the user's saved profile (best-effort).
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data } = await API.get("/auth/profile");
        if (ignore) return;
        setForm((prev) => ({
          deliveryAddress: prev.deliveryAddress || data?.address || "",
          phone: prev.phone || data?.phone || "",
        }));
      } catch {
        /* non-blocking: user can still type their details */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const availableItems = useMemo(() => items.filter(isAvailable), [items]);
  const total = useMemo(
    () => availableItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [availableItems]
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (loading) return <PageSpinner label="Loading checkout…" />;
  // Nothing left to buy — but don't bounce away once the order is confirmed.
  if (step !== "confirmation" && availableItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const validateAddress = () => {
    const next = {};
    if (!form.deliveryAddress.trim()) next.deliveryAddress = "Delivery address is required";
    const phone = form.phone.replace(/\s+/g, "");
    if (!phone) next.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone)) next.phone = "Enter a valid 10-digit phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToReview = () => {
    if (validateAddress()) setStep("review");
  };

  const placeOrder = async () => {
    setPlacing(true);
    // Order each listing individually — items can belong to different sellers.
    // allSettled (not all) so one already-sold item can't sink the whole batch.
    const outcomes = await Promise.allSettled(
      availableItems.map((item) =>
        API.post("/orders", {
          productId: item.product._id,
          quantity: item.quantity,
          deliveryAddress: form.deliveryAddress.trim(),
          phone: form.phone.replace(/\s+/g, ""),
          paymentMethod,
        })
      )
    );

    const placed = [];
    const failed = [];
    outcomes.forEach((outcome, i) => {
      const item = availableItems[i];
      if (outcome.status === "fulfilled") {
        placed.push(item);
      } else {
        failed.push({
          item,
          reason:
            outcome.reason?.response?.data?.message ||
            "Could not be ordered — it may have just been sold.",
        });
      }
    });

    // Re-sync the cart with the server (successful orders are removed server-side).
    await refetch();
    setResult({ placed, failed });
    setPlacing(false);
    setStep("confirmation");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-brand-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {step !== "confirmation" && (
          <button
            onClick={() => (step === "review" ? setStep("address") : navigate("/cart"))}
            className="flex items-center gap-2 text-slate-600 hover:text-brand-900 font-medium transition mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {step === "review" ? "Back to address" : "Back to cart"}
          </button>
        )}

        <h1 className="text-3xl font-bold text-slate-800 text-center mb-6">Checkout</h1>
        <Stepper current={step} />

        {/* ---------- STEP 1: ADDRESS ---------- */}
        {step === "address" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-5">Delivery details</h2>
            <div className="space-y-5">
              <div>
                <Label htmlFor="deliveryAddress">Delivery Address</Label>
                <TextArea
                  name="deliveryAddress"
                  rows="3"
                  placeholder="Hostel / room number, block, landmark…"
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  error={errors.deliveryAddress}
                />
                <FieldError>{errors.deliveryAddress}</FieldError>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                <FieldError>{errors.phone}</FieldError>
              </div>

              <div>
                <Label>Payment Method</Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer border-brand-600 bg-brand-50">
                    <input type="radio" name="payment" checked readOnly className="w-5 h-5 text-brand-600" />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">Cash on Delivery</span>
                      <p className="text-xs text-slate-500">Pay when you receive the product</p>
                    </div>
                    <Badge variant="available-muted">Available</Badge>
                  </label>
                  <label className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl opacity-60 cursor-not-allowed">
                    <input type="radio" name="payment" disabled className="w-5 h-5" />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">Online Payment (UPI / Card)</span>
                      <p className="text-xs text-slate-500">Coming soon</p>
                    </div>
                    <Badge variant="sold-muted">Soon</Badge>
                  </label>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full mt-6" onClick={goToReview}>
              Continue to review
            </Button>
          </div>
        )}

        {/* ---------- STEP 2: REVIEW ---------- */}
        {step === "review" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Order items ({availableItems.length})
              </h2>
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{item.product.category}</p>
                    </div>
                    <p className="font-bold text-brand-900 whitespace-nowrap">{inr(item.product.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800">Delivering to</h2>
                <button onClick={() => setStep("address")} className="text-sm font-semibold text-brand-700 hover:underline">
                  Edit
                </button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{form.deliveryAddress}</p>
              <p className="text-sm text-slate-600 mt-1">Phone: {form.phone}</p>
              <p className="text-sm text-slate-600 mt-1">Payment: Cash on Delivery</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({availableItems.length} item{availableItems.length !== 1 ? "s" : ""})</span>
                  <span className="font-semibold text-slate-800">{inr(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Delivery</span>
                  <span className="font-semibold text-green-600">Free · campus pickup</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-lg font-bold text-slate-800">Total payable</span>
                  <span className="text-2xl font-bold text-brand-900">{inr(total)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-4 text-center">
                Each item is ordered separately from its seller.
              </p>
              <Button size="lg" className="w-full" loading={placing} onClick={placeOrder}>
                {placing ? "Placing order…" : `Place order · ${inr(total)}`}
              </Button>
            </div>
          </div>
        )}

        {/* ---------- STEP 3: CONFIRMATION ---------- */}
        {step === "confirmation" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 text-center">
            {result.placed.length > 0 ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Order placed!</h2>
                <p className="text-slate-500 mt-2">
                  {result.placed.length} item{result.placed.length > 1 ? "s" : ""} ordered · Cash on Delivery
                </p>
                <p className="text-slate-600 mt-1">
                  Total: <span className="font-bold text-brand-900">
                    {inr(result.placed.reduce((s, i) => s + i.product.price * i.quantity, 0))}
                  </span>
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Order not completed</h2>
                <p className="text-slate-500 mt-2">None of your items could be ordered.</p>
              </>
            )}

            {result.failed.length > 0 && (
              <div className="mt-6 text-left bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  {result.failed.length} item{result.failed.length > 1 ? "s" : ""} could not be ordered:
                </p>
                <ul className="space-y-1">
                  {result.failed.map(({ item, reason }) => (
                    <li key={item._id} className="text-sm text-amber-700">
                      • <span className="font-medium">{item.product.name}</span> — {reason}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-amber-600 mt-2">These are still in your cart.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                to="/orders"
                className="flex-1 py-3 text-center bg-gradient-to-r from-brand-900 to-brand-700 text-white font-semibold rounded-xl hover:from-brand-800 hover:to-brand-600 shadow-soft transition"
              >
                View my orders
              </Link>
              <Link
                to="/"
                className="flex-1 py-3 text-center border-2 border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
