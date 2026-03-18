/* exported as a string — injected into the widget's shadow DOM */
module.exports = `
/* ── Tokens ──────────────────────────────────────────────────────────── */
:host {
  --hw-navy:        #1a3a5c;
  --hw-navy-dark:   #122840;
  --hw-navy-light:  #254d75;
  --hw-accent:      #1976d2;
  --hw-bg:          #f0f2f5;
  --hw-surface:     #ffffff;
  --hw-border:      #dde1e7;
  --hw-text:        #1a1a2e;
  --hw-text-sec:    #5a6474;
  --hw-text-muted:  #8c95a1;
  --hw-text-inv:    #ffffff;
  --hw-radius:      12px;
  --hw-radius-sm:   6px;
  --hw-shadow:      0 8px 32px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.10);
  --hw-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
[hidden] { display: none !important; }

/* ── FAB (floating action button) ────────────────────────────────────── */
.hw-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: var(--hw-navy);
  color: var(--hw-text-inv);
  border: none;
  border-radius: 28px;
  padding: 14px 22px;
  font-family: var(--hw-font);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .02em;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(26,58,92,.45);
  transition: background .15s, transform .12s, box-shadow .15s;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  user-select: none;
}
.hw-fab:hover  { background: var(--hw-navy-light); box-shadow: 0 6px 20px rgba(26,58,92,.55); }
.hw-fab:active { transform: scale(.97); }
.hw-fab.open   { background: var(--hw-navy-dark); }

.hw-fab-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #66bb6a;
  flex-shrink: 0;
  animation: dotPulse 2.5s ease-in-out infinite;
}
.hw-fab-dot.offline { background: #ef5350; animation: none; }

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .6; transform: scale(.85); }
}

/* ── Window ───────────────────────────────────────────────────────────── */
.hw-window {
  position: fixed;
  bottom: 88px;
  right: 24px;
  width: 364px;
  height: 540px;
  max-height: calc(100vh - 108px);
  background: var(--hw-surface);
  border-radius: var(--hw-radius);
  box-shadow: var(--hw-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  animation: windowOpen .22s cubic-bezier(.34,1.56,.64,1);
  border: 1px solid rgba(0,0,0,.08);
}

@keyframes windowOpen {
  from { opacity: 0; transform: translateY(16px) scale(.97); }
  to   { opacity: 1; transform: none; }
}

/* ── Header ───────────────────────────────────────────────────────────── */
.hw-header {
  background: linear-gradient(135deg, var(--hw-navy-dark) 0%, var(--hw-navy) 100%);
  padding: 16px 16px 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
}

.hw-header-brand { display: flex; align-items: center; gap: 10px; }

.hw-header-logo {
  width: 32px; height: 32px;
  background: rgba(255,255,255,.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--hw-font);
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  letter-spacing: .04em;
  flex-shrink: 0;
}

.hw-header-text {}
.hw-header-title {
  font-family: var(--hw-font);
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  letter-spacing: -.01em;
}
.hw-header-sub {
  font-family: var(--hw-font);
  font-size: 11px;
  color: rgba(255,255,255,.6);
  margin-top: 1px;
}

.hw-close {
  background: rgba(255,255,255,.1);
  border: none;
  color: rgba(255,255,255,.7);
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, color .15s;
  flex-shrink: 0;
  font-family: var(--hw-font);
}
.hw-close:hover { background: rgba(255,255,255,.2); color: #fff; }

/* ── Messages area ────────────────────────────────────────────────────── */
.hw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--hw-bg);
}

.hw-messages::-webkit-scrollbar { width: 4px; }
.hw-messages::-webkit-scrollbar-thumb { background: var(--hw-border); border-radius: 2px; }

/* ── Bot message (left-aligned) ───────────────────────────────────────── */
.hw-msg {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: msgIn .18s ease-out;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}

.hw-msg-bubble {
  background: var(--hw-surface);
  border: 1px solid var(--hw-border);
  border-radius: 4px 12px 12px 12px;
  padding: 11px 14px;
  font-family: var(--hw-font);
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--hw-text);
  max-width: 88%;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  white-space: pre-wrap;
  word-break: break-word;
}

.hw-msg-bubble.system {
  background: transparent;
  border: none;
  color: var(--hw-text-muted);
  font-size: 12px;
  text-align: center;
  box-shadow: none;
  align-self: center;
  padding: 4px 8px;
  max-width: 100%;
}

/* Visitor's own choice (right-aligned) */
.hw-choice-echo {
  align-self: flex-end;
  background: var(--hw-navy);
  color: var(--hw-text-inv);
  border-radius: 12px 4px 12px 12px;
  padding: 8px 14px;
  font-family: var(--hw-font);
  font-size: 13px;
  max-width: 75%;
  animation: msgIn .15s ease-out;
  word-break: break-word;
}

/* ── Option buttons ───────────────────────────────────────────────────── */
.hw-options {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding-left: 2px;
}

.hw-opt-btn {
  background: var(--hw-surface);
  border: 1.5px solid var(--hw-navy);
  color: var(--hw-navy);
  border-radius: 20px;
  padding: 7px 15px;
  font-family: var(--hw-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
  white-space: nowrap;
}
.hw-opt-btn:hover  { background: var(--hw-navy); color: var(--hw-text-inv); }
.hw-opt-btn:active { transform: scale(.97); }
.hw-opt-btn:disabled {
  opacity: .45;
  cursor: default;
  border-color: var(--hw-border);
  color: var(--hw-text-muted);
  background: transparent;
}
.hw-opt-btn.selected {
  background: var(--hw-navy);
  color: var(--hw-text-inv);
  border-color: var(--hw-navy);
  opacity: .6;
}

/* ── Intake form ──────────────────────────────────────────────────────── */
.hw-form { display: flex; flex-direction: column; gap: 10px; }

.hw-field label {
  display: block;
  font-family: var(--hw-font);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--hw-text-sec);
  margin-bottom: 4px;
}

.hw-field input {
  width: 100%;
  padding: 9px 11px;
  border: 1.5px solid var(--hw-border);
  border-radius: var(--hw-radius-sm);
  font-family: var(--hw-font);
  font-size: 13.5px;
  color: var(--hw-text);
  background: var(--hw-surface);
  outline: none;
  transition: border-color .15s;
}
.hw-field input:focus { border-color: var(--hw-accent); }

.hw-form-error {
  font-family: var(--hw-font);
  font-size: 12px;
  color: #c62828;
  padding: 6px 10px;
  background: #fff5f5;
  border: 1px solid #ffcdd2;
  border-radius: var(--hw-radius-sm);
}

.hw-submit-btn {
  background: var(--hw-navy);
  color: var(--hw-text-inv);
  border: none;
  border-radius: var(--hw-radius-sm);
  padding: 11px 16px;
  font-family: var(--hw-font);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  margin-top: 4px;
}
.hw-submit-btn:hover:not(:disabled) { background: var(--hw-navy-light); }
.hw-submit-btn:disabled { opacity: .55; cursor: not-allowed; }

/* ── Typing indicator ─────────────────────────────────────────────────── */
.hw-typing {
  display: flex;
  gap: 5px;
  padding: 10px 14px;
  background: var(--hw-surface);
  border: 1px solid var(--hw-border);
  border-radius: 4px 12px 12px 12px;
  width: fit-content;
  animation: msgIn .18s ease-out;
}
.hw-typing span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--hw-text-muted);
  animation: typingDot .9s ease-in-out infinite;
}
.hw-typing span:nth-child(2) { animation-delay: .15s; }
.hw-typing span:nth-child(3) { animation-delay: .30s; }

@keyframes typingDot {
  0%, 80%, 100% { transform: translateY(0);    opacity: .4; }
  40%            { transform: translateY(-5px); opacity: 1;  }
}

/* ── Live chat ─────────────────────────────────────────────────────────── */
.hw-live-msg-row {
  display: flex;
  flex-direction: column;
  animation: msgIn .18s ease-out;
}
.hw-live-msg-row.from-rep     { align-items: flex-start; }
.hw-live-msg-row.from-visitor { align-items: flex-end; }

.hw-live-label {
  font-family: var(--hw-font);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--hw-text-muted);
  margin-bottom: 3px;
  padding: 0 4px;
}

.hw-live-bubble {
  padding: 9px 13px;
  border-radius: 12px;
  font-family: var(--hw-font);
  font-size: 13.5px;
  line-height: 1.55;
  max-width: 85%;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0,0,0,.07);
}
.from-rep     .hw-live-bubble { background: var(--hw-surface); border: 1px solid var(--hw-border); color: var(--hw-text); border-radius: 4px 12px 12px 12px; }
.from-visitor .hw-live-bubble { background: var(--hw-navy); color: #fff; border-radius: 12px 4px 12px 12px; }

/* ── Live input bar ────────────────────────────────────────────────────── */
.hw-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  background: var(--hw-surface);
  border-top: 1px solid var(--hw-border);
  flex-shrink: 0;
  align-items: flex-end;
}

.hw-live-input {
  flex: 1;
  border: 1.5px solid var(--hw-border);
  border-radius: var(--hw-radius-sm);
  padding: 8px 11px;
  font-family: var(--hw-font);
  font-size: 13.5px;
  resize: none;
  outline: none;
  max-height: 96px;
  overflow-y: auto;
  transition: border-color .15s;
  line-height: 1.45;
  color: var(--hw-text);
}
.hw-live-input:focus { border-color: var(--hw-accent); }

.hw-send-btn {
  background: var(--hw-navy);
  color: #fff;
  border: none;
  border-radius: var(--hw-radius-sm);
  padding: 9px 16px;
  font-family: var(--hw-font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s;
  white-space: nowrap;
  flex-shrink: 0;
}
.hw-send-btn:hover  { background: var(--hw-navy-light); }
.hw-send-btn:active { transform: scale(.97); }

/* ── Powered-by footer ────────────────────────────────────────────────── */
.hw-footer {
  text-align: center;
  padding: 6px 0 8px;
  font-family: var(--hw-font);
  font-size: 10px;
  color: var(--hw-text-muted);
  background: var(--hw-surface);
  border-top: 1px solid var(--hw-border);
  flex-shrink: 0;
  letter-spacing: .02em;
}

/* ── Spinner ──────────────────────────────────────────────────────────── */
.hw-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--hw-border);
  border-top-color: var(--hw-navy);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Mobile ───────────────────────────────────────────────────────────── */
@media (max-width: 420px) {
  .hw-window {
    right: 0; left: 0; bottom: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  .hw-fab { bottom: 16px; right: 16px; }
}
`;
