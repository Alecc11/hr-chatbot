# HR Chatbot — Live Agent Support System

A production-ready HR chatbot and live agent escalation platform for LetterRide. Employees interact with a self-service bilingual (EN/ES) chatbot widget embedded on any web page. When automated answers are insufficient, they are routed to a live HR representative through a real-time WebSocket channel. HR reps manage all incoming sessions from a dedicated dashboard.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Employee Browser                HR Rep Browser                 │
│                                                                 │
│  ┌──────────────────┐            ┌──────────────────────────┐   │
│  │  Widget           │            │  HR Dashboard             │   │
│  │  (Shadow DOM,     │            │  /dashboard/              │   │
│  │  25 KB bundle)    │            │  JWT-gated via cookie     │   │
│  └────────┬─────────┘            └────────────┬─────────────┘   │
│           │ WS ?role=visitor                   │ WS ?role=rep    │
└───────────┼───────────────────────────────────┼─────────────────┘
            │                                   │
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Node.js / Express Server                                       │
│                                                                 │
│  HTTP Routes          WebSocket Server (ws, noServer mode)      │
│  ───────────          ────────────────────────────────────      │
│  GET  /health         Upgrade handler on raw HTTP server        │
│  GET  /api/bot/logic  visitorHandler ◄──── sessionManager       │
│  GET  /api/bot/time-gate              repHandler ◄──── roomMgr  │
│  POST /api/auth/login                                           │
│  POST /api/intake/submit                                        │
│  GET  /widget.bundle.js  (static)                               │
│  GET  /dashboard/*       (static)                               │
│                                                                 │
│  Middleware Stack (in order)                                     │
│  ────────────────────────────────────────────────────────────   │
│  Helmet → CORS → /health → Rate Limiter → Body Parser           │
│  → Cookie Parser → Routes → 404 → Error Handler                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Design

### Helmet (HTTP Security Headers)
Every response carries a strict security header set enforced by `helmet`:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | `default-src 'self'` + explicit script/connect allowlists |
| `X-DNS-Prefetch-Control` | `off` |

### CORS
A custom `cors` middleware enforces an explicit origin allowlist (`ALLOWED_ORIGIN_1`, `ALLOWED_ORIGIN_2`). Requests from any unlisted origin receive `403 Forbidden` with a JSON error body. In production, requests with no `Origin` header are also rejected. The `/health` endpoint sits above the CORS middleware so Render's health-check pings are never blocked.

### Rate Limiting
`express-rate-limit` is mounted exclusively on `/api/*` routes. The default window is **50 requests per 15 minutes per IP**, configurable via environment variables. Exceeded requests receive `429 Too Many Requests` with a JSON body. Standard `RateLimit-*` response headers are included.

### Authentication
HR reps authenticate via `POST /api/auth/login`. Credentials are validated with `express-validator` before any bcrypt work is performed. Passwords are compared with `bcrypt` (cost factor 12) against pre-hashed values stored only in environment variables — no database, no plaintext. On success a JWT is signed and delivered as an **HttpOnly, SameSite=Strict** cookie with an 8-hour TTL.

### Input Sanitization
All user-facing POST endpoints run `express-validator` rule chains before any business logic executes:
- **Intake form:** firstName/lastName must be alpha-only, ≤ 50 chars; employeeId must be alphanumeric, ≤ 20 chars.
- **Login form:** username ≤ 50 chars, password ≤ 128 chars.

### WebSocket Authentication
WebSocket upgrade requests are authenticated at the HTTP upgrade event — before any WS frame is exchanged:
- **Visitor connections** must present a valid `sessionToken` UUID issued by `POST /api/intake/submit`. Already-claimed or already-connected tokens are rejected with `401`.
- **Rep connections** must present a valid JWT in the `token` HttpOnly cookie. Missing or invalid tokens receive `401`.

---

## Atomic Claim Mutex

The most critical design decision in the system is the **lock-free atomic claim** in `sessionManager.js`. When multiple HR reps simultaneously click to claim the same visitor session, exactly one must win.

```
Node.js event loop (single-threaded)
────────────────────────────────────────────────────────────
Rep 1 WS message arrives → claimSession('token-xyz', 'rep1')
  Step 1: session exists? YES
  Step 2: session.locked? NO          ← both reps read false
  Step 3: session.locked = true  ← rep1 sets it first (synchronous)
  → returns { success: true }

Rep 2 WS message arrives → claimSession('token-xyz', 'rep2')
  Step 1: session exists? YES
  Step 2: session.locked? YES         ← rep2 now reads true
  → returns { success: false, reason: 'already_claimed' }
```

This works without a mutex primitive because Node.js executes JavaScript on a single thread. Steps 2 and 3 are synchronous with no `await` between them, so no two call frames can interleave at that point. The first handler to reach step 2 atomically sets the flag before any other handler can observe it.

The claiming rep receives a private `claim_ack`. All other reps receive `claim_denied`. The visitor's card is removed from all rep dashboards simultaneously via a broadcast `queue_update`.

---

## Time Gate

Live agent availability is enforced by `server/utils/timeGate.js` using `luxon` for timezone-aware time handling:

- **Hours:** Monday–Friday, 8:00 AM – 3:59 PM **Pacific Time** (PST/PDT auto-adjusted)
- **Enforced at three layers:** widget UI, HTTP intake endpoint, and WebSocket upgrade handler
- **Development bypass:** set `SKIP_TIME_GATE=true` in `.env`

---

## Bilingual Bot State Machine

The chatbot is driven by a 36-node JSON state machine (`server/data/bot-logic.json`) served to the widget at initialization. Node types:

| Type | Description |
|---|---|
| `message` | Displays text, auto-advances |
| `choice` | Presents clickable options |
| `gate` | Calls `/api/bot/time-gate`; branches on `open`/`closed` |
| `intake` | Renders the live agent intake form |
| `end` | Terminal node |

Both English and Spanish trees are encoded in the same graph. The initial node (`lang_select`) presents a language choice; all downstream nodes are language-specific.

---

## Widget

The public-facing chatbot is a **vanilla JS widget** (`widget/src/`) bundled with `esbuild` into a single 25 KB file (`public/widget.bundle.js`). It uses the **Shadow DOM** to fully isolate its styles from the host page. It can be embedded on any website with a single `<script>` tag.

```html
<script src="https://your-domain.com/widget.bundle.js"></script>
```

---

## Deployment (Render)

The project includes a `render.yaml` for one-command deployment to Render.com.

```
Build:  npm install && npm run build:widget
Start:  node server/index.js
Health: GET /health
```

Secrets are managed via the Render Dashboard environment tab (never committed). See `.env.example` for the full list of required variables.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Build the widget bundle
npm run build:widget

# 4. Start the server (with file watching)
npm run dev

# 5. Run the integration test suite (server must be running)
node test/integration.js
```

---

## Test Suite

`test/integration.js` is a dependency-free integration test runner (no test framework) that exercises the live server on `localhost:3000`. It covers 12 sections and 58 assertions:

| Section | What is tested |
|---|---|
| 1 | Server health |
| 2 | All five Helmet security headers |
| 3 | CORS allowlist enforcement |
| 4 | Login: success, bad password, unknown user, missing fields, cookie flags |
| 5 | Intake form: empty body, non-alpha name, spaces in ID, length limits, valid submission |
| 6 | Bot logic endpoint: version, node count, initial node; time-gate response shape |
| 7 | Full WebSocket E2E: queue, claim, two-way messaging, rep closes chat |
| 8 | WS security: invalid token rejected, rep without cookie rejected |
| 9 | Atomic claim race: unit-level mutex test + live WS dual-claim race |
| 10 | Rate limiter: 429 after quota exceeded, JSON error body, response headers |
| 11 | Widget bundle served with correct MIME type |
| 12 | Dashboard static files served |

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| HTTP framework | Express 5 |
| WebSockets | `ws` (RFC 6455, `noServer` mode) |
| Security headers | `helmet` |
| CORS | `cors` |
| Rate limiting | `express-rate-limit` |
| Input validation | `express-validator` |
| Auth tokens | `jsonwebtoken` |
| Password hashing | `bcrypt` (cost 12) |
| Timezone handling | `luxon` |
| Widget bundler | `esbuild` |
| Deployment target | Render.com |
