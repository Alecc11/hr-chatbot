# PROJECT_STATE.md — HR Chatbot Reference

Last updated: 2026-03-15
All 8 phases complete. 58/58 integration tests passing.

---

## Build Phases (all committed to GitHub `main`)

| Commit | Phase | Description |
|---|---|---|
| `13e3695` | 1 | Project scaffold, dependencies, config |
| `da0ae58` | 2 | Express app and full security middleware stack |
| `d7224e9` | 3 | timeGate utility and API routes finalized |
| `a18ea32` | 4 | Full bilingual EN/ES bot-logic.json state machine |
| `f17a37f` | 5 | WebSocket server with atomic claim mutex |
| `7fe88f8` | 6 | HR Agent Dashboard |
| `74f4da7` | 7 | Public chatbot widget (vanilla JS, shadow DOM, 25 KB bundle) |
| `e29e8ca` | 8 | Integration & QA test suite — 58/58 passing |

---

## File Structure

```
hr-chatbot/
├── server/
│   ├── index.js                  # HTTP server entry point; attaches WS upgrade handler
│   ├── app.js                    # Express app: middleware stack + route mounting
│   ├── config/
│   │   └── env.js                # Loads .env, validates required vars, exports config object
│   ├── data/
│   │   └── bot-logic.json        # 36-node bilingual EN/ES state machine (v1.0.0)
│   ├── middleware/
│   │   ├── auth.js               # JWT cookie verification middleware (for protected routes)
│   │   ├── cors.js               # Origin allowlist CORS middleware
│   │   ├── rateLimiter.js        # express-rate-limit: 50 req / 15 min on /api/*
│   │   └── sanitize.js           # express-validator rule chains: intakeRules, loginRules
│   ├── routes/
│   │   ├── auth.js               # POST /api/auth/login, POST /api/auth/logout
│   │   ├── bot.js                # GET /api/bot/logic, GET /api/bot/time-gate
│   │   └── intake.js             # POST /api/intake/submit
│   ├── utils/
│   │   ├── bcryptHelper.js       # comparePassword(plain, hash) → Promise<boolean>
│   │   ├── jwtHelper.js          # signToken(payload), verifyToken(token)
│   │   └── timeGate.js           # isOpen() → bool; nextOpenTime() → string (Pacific Time)
│   └── ws/
│       ├── wsServer.js           # HTTP upgrade handler; authenticates and routes to handlers
│       ├── sessionManager.js     # pendingQueue, activeSessions, repConnections, claimSession()
│       ├── roomManager.js        # createRoom(), getRoom(), destroyRoom()
│       └── handlers/
│           ├── visitorHandler.js # Manages visitor WS lifecycle; buffers pre-claim messages
│           └── repHandler.js     # Manages rep WS lifecycle; handles claim/message/close_chat
├── widget/
│   └── src/
│       ├── main.js               # Widget entry point; mounts shadow DOM, initialises modules
│       ├── bot.js                # State machine runner; fetches bot-logic.json, steps nodes
│       ├── ui.js                 # Renders chat bubbles, buttons, intake form into shadow root
│       ├── liveChat.js           # Manages visitor WebSocket connection after intake submit
│       ├── i18n.js               # Language strings (EN/ES) for UI chrome
│       └── styles.js             # CSS-in-JS string injected into shadow root
├── public/
│   └── widget.bundle.js          # Minified esbuild output (~25 KB); served at /widget.bundle.js
├── dashboard/
│   ├── index.html                # HR rep dashboard SPA shell
│   ├── dashboard.css             # Dashboard styles
│   └── dashboard.js             # Dashboard logic: login form, WS connection, queue/chat UI
├── test/
│   └── integration.js            # 58-assertion integration test runner (no framework, node only)
├── .env                          # Local secrets (gitignored)
├── .env.example                  # Template for all required environment variables
├── .gitignore
├── package.json
├── render.yaml                   # Render.com deployment config
├── README.md
└── PROJECT_STATE.md              # This file
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | — | `development` or `production` |
| `PORT` | Yes | `3000` | HTTP server port |
| `JWT_SECRET` | Yes | — | 256-bit random hex for JWT signing |
| `JWT_EXPIRY` | Yes | — | JWT lifetime e.g. `8h` |
| `HR_USER_1_NAME` | Yes | — | Username for rep 1 |
| `HR_USER_1_HASH` | Yes | — | bcrypt hash (cost 12) of rep 1's password |
| `HR_USER_2_NAME` | Yes | — | Username for rep 2 |
| `HR_USER_2_HASH` | Yes | — | bcrypt hash for rep 2 |
| `HR_USER_3_NAME` | Yes | — | Username for rep 3 |
| `HR_USER_3_HASH` | Yes | — | bcrypt hash for rep 3 |
| `HR_USER_4_NAME` | Yes | — | Username for rep 4 |
| `HR_USER_4_HASH` | Yes | — | bcrypt hash for rep 4 |
| `ALLOWED_ORIGIN_1` | No | `https://www.letterride.com` | CORS allowlist entry 1 |
| `ALLOWED_ORIGIN_2` | No | `http://localhost:3000` | CORS allowlist entry 2 |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) | Rate limit window in ms |
| `RATE_LIMIT_MAX` | No | `50` | Max requests per window per IP |
| `SESSION_TOKEN_TTL_MS` | No | `600000` (10 min) | Intake token expiry if no WS connects |
| `SKIP_TIME_GATE` | No | — | Set to `true` to bypass business-hours check |

Generate bcrypt hash:
```bash
node -e "require('bcrypt').hash('YourPassword', 12).then(console.log)"
```

Generate JWT secret:
```bash
openssl rand -hex 32
```

---

## HTTP API Endpoints

### `GET /health`
- **Auth:** None
- **Rate limited:** No (sits above rate limiter)
- **Response:** `200 { status: "ok" }`

---

### `GET /api/bot/logic`
- **Auth:** None
- **Rate limited:** Yes
- **Response:** `200` — Full `bot-logic.json` state machine object
  ```json
  {
    "version": "1.0.0",
    "initialNode": "lang_select",
    "nodes": { ... }   // 36 nodes
  }
  ```

---

### `GET /api/bot/time-gate`
- **Auth:** None
- **Rate limited:** Yes
- **Response:** `200`
  ```json
  { "open": true, "nextOpen": null }
  // or
  { "open": false, "nextOpen": "Monday, March 16 at 8:00 AM Pacific Daylight Time" }
  ```

---

### `POST /api/auth/login`
- **Auth:** None
- **Rate limited:** Yes
- **Body:** `{ "username": string, "password": string }`
- **Validation:** username ≤ 50 chars, password ≤ 128 chars (both required)
- **Responses:**
  - `200` — Sets `token` cookie (HttpOnly, SameSite=Strict, 8h), returns `{ ok: true, username }`
  - `400` — Validation failure: `{ errors: [...] }`
  - `401` — Bad credentials: `{ error: "Invalid credentials." }`

---

### `POST /api/auth/logout`
- **Auth:** None (clears cookie regardless)
- **Rate limited:** Yes
- **Response:** `200 { ok: true }`

---

### `POST /api/intake/submit`
- **Auth:** None (visitor-facing)
- **Rate limited:** Yes
- **Body:** `{ "firstName": string, "lastName": string, "employeeId": string }`
- **Validation:**
  - `firstName` / `lastName`: alpha-only, 1–50 chars
  - `employeeId`: alphanumeric, 1–20 chars
- **Responses:**
  - `200` — `{ sessionToken: "<uuid>" }` — token is valid for 10 min or until WS connects
  - `400` — `{ errors: [...] }`
  - `503` — Outside business hours: `{ error: "Live agent support is not currently available." }`

---

## WebSocket Protocol

**Endpoint:** `ws://host:3000?role=<visitor|rep>[&sessionToken=<uuid>]`

WebSocket upgrade is handled at the raw HTTP server level (Express is not involved). Authentication happens during the upgrade — no WS frames are ever exchanged with an unauthenticated client.

---

### Visitor Connection

**URL:** `ws://host:3000?role=visitor&sessionToken=<uuid>`

The `sessionToken` must be a UUID issued by `POST /api/intake/submit`. The token is single-use: once a visitor socket is attached, the same token cannot open a second connection.

#### Messages Sent TO Visitor

| Type | Payload | When |
|---|---|---|
| `queued` | `{ type, position: number }` | Immediately on connect — position in queue |
| `claimed` | `{ type, repName: string }` | A rep has claimed this session |
| `rep_message` | `{ type, text: string, timestamp: number }` | Rep sends a message |
| `rep_disconnected` | `{ type }` | Rep closed the chat or disconnected |

#### Messages Sent FROM Visitor

| Type | Payload | Description |
|---|---|---|
| `message` | `{ type, text: string }` | Chat message; buffered if unclaimed, forwarded if claimed |

---

### Rep Connection

**URL:** `ws://host:3000?role=rep`

Requires a valid `token` HttpOnly cookie (obtained from `POST /api/auth/login`).

#### Messages Sent TO Rep

| Type | Payload | When |
|---|---|---|
| `queue_update` | `{ type, queue: Session[] }` | On connect and whenever queue changes |
| `incoming_chat` | `{ type, sessionToken, name, employeeId, timestamp }` | New visitor enters queue |
| `claimed` | `{ type, sessionToken, claimedBy: string }` | Any rep claims a session (broadcast to all) |
| `claim_ack` | `{ type, sessionToken, roomId, visitorName, employeeId }` | Private — only to the rep who won the claim |
| `claim_denied` | `{ type, sessionToken, reason: string }` | Private — only to losing rep(s) |
| `visitor_message` | `{ type, roomId, text, timestamp }` | Visitor sends a message in an active room |
| `visitor_disconnected` | `{ type, roomId }` | Visitor closed their browser/tab |

#### Messages Sent FROM Rep

| Type | Payload | Description |
|---|---|---|
| `claim` | `{ type, sessionToken: string }` | Attempt to claim a pending visitor session |
| `message` | `{ type, roomId: string, text: string }` | Send a message to the visitor in a room |
| `close_chat` | `{ type, roomId: string }` | End the session; visitor receives `rep_disconnected` |

#### `Session` object (in `queue_update`)
```json
{
  "sessionToken": "<uuid>",
  "name": "Jane Doe",
  "employeeId": "EMP001",
  "timestamp": 1710000000000
}
```

---

## WebSocket Lifecycle (Full Flow)

```
Visitor                  Server                        Rep
───────                  ──────                        ───
POST /api/intake/submit ──►  creates pendingQueue entry
◄── { sessionToken }         (locked=false)

WS connect ?role=visitor ──► validates token, attaches visitorSocket
◄── { type: "queued" }       broadcasts incoming_chat + queue_update ──► All Reps

                                                       ◄── { type: "queue_update" }
                                                       ◄── { type: "incoming_chat" }

                             Rep sends { type: "claim", sessionToken }
                             claimSession() sets locked=true (atomic)
◄── { type: "claimed" }      broadcasts claimed + queue_update ──────► All Reps
                             sends claim_ack ──────────────────────────► Claiming Rep
                             (any other simultaneous claimers get claim_denied)

{ type: "message" } ──────► forwards to rep ──────────────────────────► { type: "visitor_message" }

                                                       { type: "message" } ──►
◄── { type: "rep_message" }  forwards to visitor

                                                       { type: "close_chat" } ──►
◄── { type: "rep_disconnected" }   destroyRoom()
```

---

## Bot-Logic State Machine Node Types

| Type | Fields | Description |
|---|---|---|
| `message` | `text`, `next` | Display text, auto-advance to `next` |
| `choice` | `text`, `choices[]` | Display text + clickable options; each choice has `label` and `next` |
| `gate` | `openNext`, `closedNext` | Calls `GET /api/bot/time-gate`; branches on result |
| `intake` | `next` | Renders the live agent intake form; on submit calls `POST /api/intake/submit` |
| `end` | `text` | Terminal node; displays closing message |

State machine entry point: node `lang_select` (language selector).
Total nodes: **36** (English + Spanish trees).

---

## Static Routes

| Path | Source | Description |
|---|---|---|
| `GET /widget.bundle.js` | `public/widget.bundle.js` | Minified widget (Content-Type: application/javascript) |
| `GET /dashboard/` | `dashboard/index.html` | HR dashboard shell |
| `GET /dashboard/dashboard.css` | `dashboard/dashboard.css` | Dashboard styles |
| `GET /dashboard/dashboard.js` | `dashboard/dashboard.js` | Dashboard logic |

---

## Middleware Execution Order

```
Request
  │
  ▼
Helmet           → attaches all security response headers
  │
  ▼
CORS             → checks Origin, returns 403 or sets CORS headers
  │
  ▼
GET /health      → short-circuits here (not rate-limited)
  │
  ▼
Rate Limiter     → applied only to /api/* — 50 req/15 min/IP
  │
  ▼
express.json()   → parses JSON body (10 KB limit)
  │
  ▼
cookieParser()   → parses Cookie header
  │
  ▼
Static (public/) → serves widget.bundle.js
  │
  ▼
/api/auth        → auth routes
/api/bot         → bot routes
/api/intake      → intake routes
/dashboard       → static dashboard files
  │
  ▼
404 handler      → { error: "Not found." }
  │
  ▼
Error handler    → CORS errors → 403; others → 500
```

---

## Known Constraints

- **In-memory state only.** `pendingQueue`, `activeSessions`, and `repConnections` are JavaScript `Map`/`Set` objects in the server process. A server restart clears all active sessions. This is intentional for the current scope — no database dependency.
- **Single process.** The atomic claim mutex relies on Node.js single-threaded execution. It is not safe across multiple processes/workers without an external lock (e.g., Redis `SETNX`).
- **4 HR reps max.** Rep credentials are stored as environment variable pairs. Adding a 5th rep requires a code change to `env.js`.
- **Rate limiter resets on restart.** The in-memory rate limit store is cleared when the server restarts. For production abuse prevention, a persistent store (Redis) would be needed.
