# Manit Mart

A campus marketplace for the MANIT community — students can list, browse, wishlist, cart,
and order second-hand items (books, electronics, furniture, and more) from each other.

## Tech Stack

- **Backend**: Node.js, Express 5, MongoDB (Mongoose), JWT auth, Multer (image uploads)
- **Frontend**: React 19, Vite, React Router 7, Tailwind CSS v4, Axios
- **Mobile**: Expo / React Native (scaffolded, not yet built out)

## Project Structure

```
Manit-Mart/
├── backend/            # Express API (routes, controllers, models, middleware)
│   ├── uploads/         # User-uploaded product/profile images (gitignored)
│   └── server.js        # Entry point
├── frontend/           # React + Vite web app
│   └── src/
│       ├── components/  # Navbar, Footer, SearchBar, ErrorBoundary, shared UI primitives (components/ui/)
│       ├── pages/       # Route-level pages (Home, SearchResults, Cart, Checkout, Orders, Help, …)
│       ├── context/     # Auth, Cart, Wishlist, Orders, Toast contexts
│       ├── lib/         # invoice generation, search constants, analytics helpers
│       └── services/    # Axios API client
├── manit-marketplace-mobile/  # Expo app (scaffolding only)
├── package.json        # Backend dependencies + scripts (run from repo root)
└── .env                # Backend environment variables (see below, gitignored)
```

## Getting Started

### 1. Backend

From the repo root:

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev             # nodemon, auto-restarts on change
# or
npm start                # plain node
```

Required environment variables (`.env` at repo root — see `.env.example`):

| Variable      | Description                                                |
|---------------|--------------------------------------------------------------|
| `PORT`        | Port the API listens on (default `5000`)                     |
| `MONGO_URI`   | MongoDB connection string (Atlas or local)                    |
| `JWT_SECRET`  | Secret used to sign auth tokens — use a long random string     |

The server validates these on startup and exits immediately with a clear error if any
are missing, rather than failing confusingly later.

The API is served at `http://localhost:5000/api`, with uploaded images served statically
at `http://localhost:5000/uploads/...`. A health check is available at `GET /api/health`.

### College database routing

The application uses one Atlas cluster and one Mongoose connection. Each API request is
scoped by the `X-College` header: `manit` maps to `college_notes` and `bhu` maps to `bhu`.
The server switches logical databases using `mongoose.connection.useDb()`; it never opens a
second cluster connection. The web app stores the selected college locally and sends this
header automatically. Unsupported values return `400`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional — defaults to http://localhost:5000/api
npm run dev
```

Opens at `http://localhost:5173` (or the next available port).

### 3. Mobile (Expo)

```bash
cd manit-marketplace-mobile
npm install
npx expo start
```

The mobile app is currently just the default Expo scaffold plus a configured API client
(`src/api/axios.js`, host set via `app.json`'s `expo.extra.apiHost`) — none of the
marketplace screens have been built yet.

## API Overview

All endpoints are prefixed with `/api`. Protected endpoints require an
`Authorization: Bearer <token>` header (token returned from register/login).

| Resource   | Endpoints |
|------------|-----------|
| Auth       | `POST /auth/register`, `POST /auth/login`, `GET/PUT /auth/profile` |
| Products   | `GET /products`, `GET /products/suggestions`, `GET /products/mine`, `POST /products`, `GET/PUT/DELETE /products/:id`, `PUT /products/:id/sold` |
| Upload     | `POST /upload` (multipart `image` field, max 5MB, jpg/png/webp) |
| Cart       | `GET/POST/DELETE /cart`, `PUT/DELETE /cart/:productId` |
| Wishlist   | `GET/POST /wishlist`, `DELETE /wishlist/:productId`, `GET /wishlist/check/:productId` |
| Orders     | `POST /orders`, `GET /orders/my-orders`, `GET /orders/seller-orders`, `GET /orders/:orderId`, `PUT /orders/:orderId/status`, `PUT /orders/:orderId/cancel` |

### Search (`GET /products`)

The product list endpoint doubles as the search engine. Query params:
`q` (keyword across name/description/category/brand/tags/condition/department/hostel),
`category`, `condition`, `minPrice`, `maxPrice`, `minRating`, `includeSold`,
`sort` (`relevance|newest|popularity|rating|price_asc|price_desc`), `facets=true`
(returns per-category counts), plus `page` / `limit`. `GET /products/suggestions?q=`
powers the navbar autocomplete.

## Security Notes

- Passwords are hashed with bcrypt; JWTs expire after 7 days.
- Login and registration are rate-limited to slow brute-force/mass-account attempts.
- All mutating endpoints validate input server-side via `express-validator`.
- Product updates whitelist editable fields — a client can never overwrite `seller`,
  `isSold`, etc. via a crafted request body.
- Never commit `.env` — it's gitignored. Rotate `JWT_SECRET`/`MONGO_URI` if they've ever
  been exposed.

## Key Features

- **Search engine** — multi-field keyword search, filters (category, price, condition,
  rating, availability), sort, facet counts, and debounced navbar autocomplete with
  recent searches.
- **Cart & Checkout** — server-persisted cart with availability ("stock") validation and
  a multi-step flow: Cart → Address → Review → Confirmation. Cash on Delivery is live;
  online payment is scaffolded/disabled.
- **Orders** — status timeline (`Placed → Confirmed → Delivered`, with Cancelled),
  buyer/seller views, cancel-and-return-to-market, printable invoices, search/filter/sort,
  and a Help Center (FAQs + support tickets).
- **Resilience** — layered error boundaries (page + per-section), self-healing cart/wishlist
  endpoints (orphaned items purged), toast notifications, and null-safe rendering so
  deleted products/users never crash the UI.

## Known Limitations / Roadmap

- Listings are unique single items (no stock quantity or size/color variants) and support a
  single image — richer inventory would need `Product` schema changes.
- Online payments, refunds/returns pipeline, product reviews, and the support-ticket queue
  are UI-scaffolded but not yet backend-persisted.
- The mobile app has no screens implemented yet.
- No automated test suite yet.
