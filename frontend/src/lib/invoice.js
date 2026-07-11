// Generates a print-ready invoice from real order data and opens it in a new
// window so the user can print or "Save as PDF". No backend/PDF lib required.

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function downloadInvoice(order) {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return false;

  const product = order.product || {};
  const seller = order.seller || {};
  const buyer = order.buyer || {};
  const date = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const payment = order.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery";

  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
<title>Invoice ${esc(order._id?.slice(-8))}</title>
<style>
  *{box-sizing:border-box} body{font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;margin:0;padding:40px;max-width:720px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1c3a5e;padding-bottom:16px}
  .brand{font-size:24px;font-weight:800;color:#1c3a5e} .brand span{color:#f59e0b}
  .muted{color:#6b7280;font-size:13px} h2{font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin:24px 0 8px}
  .grid{display:flex;gap:40px;flex-wrap:wrap} .grid>div{flex:1;min-width:200px}
  table{width:100%;border-collapse:collapse;margin-top:8px} th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:14px}
  th{background:#f6f8fc;font-size:12px;text-transform:uppercase;color:#6b7280}
  .total{display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#1c3a5e;margin-top:16px;border-top:2px solid #1c3a5e;padding-top:12px}
  .foot{margin-top:32px;text-align:center;color:#9ca3af;font-size:12px}
  @media print{body{padding:20px}}
</style></head><body onload="window.focus()">
  <div class="top">
    <div><div class="brand">Manit<span>Mart</span></div><div class="muted">Campus Marketplace · MANIT Bhopal</div></div>
    <div style="text-align:right"><div style="font-weight:700">INVOICE</div><div class="muted">#${esc(order._id?.slice(-8))}</div><div class="muted">${esc(date)}</div></div>
  </div>

  <div class="grid">
    <div><h2>Buyer</h2><div>${esc(buyer.name || "—")}</div><div class="muted">${esc(buyer.email || "")}</div><div class="muted">${esc(order.phone || "")}</div></div>
    <div><h2>Seller</h2><div>${esc(seller.name || "—")}</div><div class="muted">${esc(seller.email || "")}</div></div>
  </div>

  <h2>Delivery Address</h2>
  <div>${esc(order.deliveryAddress || "—")}</div>

  <h2>Order Items</h2>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${esc(product.name || "Product")}${product.category ? `<div class="muted">${esc(product.category)}</div>` : ""}</td>
        <td>${esc(order.quantity ?? 1)}</td>
        <td>${inr(product.price)}</td>
        <td style="text-align:right">${inr(order.totalPrice)}</td>
      </tr>
    </tbody>
  </table>

  <div class="total"><span>Total (${esc(payment)})</span><span>${inr(order.totalPrice)}</span></div>

  <div class="foot">Status: ${esc(order.status)} · This is a system-generated invoice for a peer-to-peer campus sale.</div>
  <script>setTimeout(function(){window.print();},250);</script>
</body></html>`);
  win.document.close();
  return true;
}
