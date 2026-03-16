"use strict";(()=>{var b=(n,e)=>()=>(e||n((e={exports:{}}).exports,e),e.exports);var H=b((be,R)=>{R.exports=`
/* \u2500\u2500 Tokens \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 FAB (floating action button) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Window \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Messages area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Bot message (left-aligned) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Option buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Intake form \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Typing indicator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Live chat \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hw-live-msg-row {
  display: flex;
  flex-direction: column;
  animation: msgIn .18s ease-out;
}
.hw-live-msg-row.from-rep     { align-items: flex-end; }
.hw-live-msg-row.from-visitor { align-items: flex-start; }

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
.from-rep     .hw-live-bubble { background: var(--hw-navy); color: #fff; border-bottom-right-radius: 3px; }
.from-visitor .hw-live-bubble { background: var(--hw-surface); border: 1px solid var(--hw-border); color: var(--hw-text); border-bottom-left-radius: 3px; }

/* \u2500\u2500 Live input bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Powered-by footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Spinner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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

/* \u2500\u2500 Mobile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
`});var y=b((ge,A)=>{"use strict";var m=null,T="";async function J(n){T=n;let e=await fetch(`${n}/api/bot/logic`);if(!e.ok)throw new Error("Failed to load bot logic");return m=await e.json(),m}function q(n){return!m||!n?null:m.nodes[n]||null}function V(){return m?q(m.initialNode):null}async function K(){let n=await fetch(`${T}/api/bot/time-gate`);return n.ok?n.json():{open:!1,nextOpen:null}}A.exports={load:J,getNode:q,getInitialNode:V,checkTimeGate:K}});var C=b((xe,B)=>{"use strict";var k="en";function Q(n){k=n||"en"}function X(){return k}function Z(n){return n&&(n[k]||n.en)||""}B.exports={setLang:Q,getLang:X,t:Z}});var O=b((ve,M)=>{"use strict";function ee(n,e,t){let a=n.startsWith("https")?"wss":"ws",r=n.replace(/^https?/,""),o=`${a}${r}?role=visitor&sessionToken=${encodeURIComponent(e)}`,i=new WebSocket(o);return i.addEventListener("message",d=>{let s;try{s=JSON.parse(d.data)}catch{return}let w=t[s.type];typeof w=="function"&&w(s)}),i.addEventListener("close",()=>typeof t.close=="function"&&t.close()),i.addEventListener("error",()=>typeof t.error=="function"&&t.error()),{send(d){i.readyState===WebSocket.OPEN&&i.send(JSON.stringify({type:"message",text:d}))},close(){i.close()}}}M.exports={connect:ee}});var $=b((ye,W)=>{"use strict";var c=C(),_=y(),te=O(),p=null,u=null,l=null,L="",E=null;function ne(n,e,t,a){p=n,u=e,l=t,L=a}function h(){p.scrollTop=p.scrollHeight}function x(n){let e=document.createElement("div");e.className="hw-msg";let t=document.createElement("div");return t.className="hw-msg-bubble",t.textContent=n,e.appendChild(t),p.appendChild(e),h(),e}function N(n,e){let t=document.createElement("div");t.className="hw-options";for(let a of n){let r=document.createElement("button");r.className="hw-opt-btn",r.textContent=c.t(a.label),r.addEventListener("click",()=>{t.querySelectorAll(".hw-opt-btn").forEach(o=>{o.disabled=!0,o===r&&o.classList.add("selected")}),re(c.t(a.label)),e(a)}),t.appendChild(r)}return p.appendChild(t),h(),t}function re(n){let e=document.createElement("div");e.className="hw-choice-echo",e.textContent=n,p.appendChild(e),h()}function g(n){let e=document.createElement("div");e.className="hw-msg-bubble system",e.textContent=n,p.appendChild(e),h()}function v(n,e){let t=document.createElement("div");t.className="hw-typing",t.innerHTML="<span></span><span></span><span></span>",p.appendChild(t),h(),setTimeout(()=>{t.remove(),e()},n)}function f(n){let e=_.getNode(n);if(!e){g("An error occurred. Please refresh and try again.");return}let t=e.type==="gate"?0:420;v(t,()=>{switch(e.type){case"select":ae(e);break;case"answer":oe(e);break;case"resolution":ie(e);break;case"gate":se(e);break;case"form":de(e);break;case"end":ce(e);break;default:g("Unknown step. Please contact HR directly.")}})}function ae(n){x(c.t(n.content)),N(n.options,e=>{e.setLang&&c.setLang(e.setLang),v(300,()=>f(e.next))})}function oe(n){x(c.t(n.content)),N([{label:{en:"Continue",es:"Continuar"},next:n.next}],t=>{v(300,()=>f(t.next))})}function ie(n){x(c.t(n.content)),N(n.options,e=>{v(300,()=>f(e.next))})}async function se(n){let e=document.createElement("div");e.className="hw-msg-bubble",e.innerHTML='<span class="hw-spinner"></span>Checking availability...';let t=document.createElement("div");t.className="hw-msg",t.appendChild(e),p.appendChild(t),h();try{let{open:a}=await _.checkTimeGate();t.remove(),f(a?n.onOpen:n.onClosed)}catch{t.remove(),f(n.onClosed)}}function de(n){x(c.t(n.content));let e=document.createElement("div");e.className="hw-msg";let t=document.createElement("form");t.className="hw-form",t.noValidate=!0;let a=document.createElement("div");a.className="hw-form-error",a.hidden=!0;for(let o of n.fields){let i=document.createElement("div");i.className="hw-field";let d=document.createElement("label");d.textContent=c.t(o.label),d.htmlFor=`hw-field-${o.name}`;let s=document.createElement("input");s.type="text",s.id=`hw-field-${o.name}`,s.name=o.name,s.autocomplete=o.name==="employeeId"?"off":o.name,s.required=o.required,i.appendChild(d),i.appendChild(s),t.appendChild(i)}t.appendChild(a);let r=document.createElement("button");r.type="submit",r.className="hw-submit-btn",r.textContent=c.getLang()==="es"?"Conectarme con un representante":"Connect Me with an Agent",t.appendChild(r),t.addEventListener("submit",async o=>{o.preventDefault(),a.hidden=!0,r.disabled=!0,r.innerHTML=`<span class="hw-spinner"></span>${c.getLang()==="es"?"Enviando...":"Submitting..."}`;let i={};for(let d of n.fields)i[d.name]=t.elements[d.name].value.trim();try{let d=await fetch(`${L}/api/intake/submit`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"omit",body:JSON.stringify(i)}),s=await d.json();if(!d.ok){let w=s.errors?s.errors.map(G=>G.msg).join(" "):s.error||"Submission failed.";a.textContent=w,a.hidden=!1,r.disabled=!1,r.textContent=c.getLang()==="es"?"Conectarme con un representante":"Connect Me with an Agent";return}t.querySelectorAll("input, button").forEach(w=>w.disabled=!0),e.style.opacity="0.6",f(n.next),le(s.sessionToken,i.firstName)}catch{a.textContent=c.getLang()==="es"?"Error de red. Por favor intente de nuevo.":"Network error. Please try again.",a.hidden=!1,r.disabled=!1,r.textContent=c.getLang()==="es"?"Conectarme con un representante":"Connect Me with an Agent"}}),e.appendChild(t),p.appendChild(e),h(),setTimeout(()=>{let o=t.querySelector("input");o&&o.focus()},100)}function ce(n){x(c.t(n.content))}function le(n,e){l&&(l.className="hw-fab-dot connecting"),E=te.connect(L,n,{queued(t){l&&(l.className="hw-fab-dot")},claimed(t){l&&(l.className="hw-fab-dot");let a=c.getLang()==="es"?"Un representante se ha unido a la conversacion.":"An HR representative has joined the conversation.";g(a),pe(e)},rep_message(t){P("rep",t.text)},rep_disconnected(){I();let t=c.getLang()==="es"?"El representante se ha desconectado. La sesion ha finalizado.":"The representative has disconnected. Your session has ended.";g(t),l&&(l.className="hw-fab-dot offline")},close(){I()},error(){let t=c.getLang()==="es"?"Se perdio la conexion. Por favor recargue la pagina e intente de nuevo.":"Connection lost. Please reload the page and try again.";g(t),l&&(l.className="hw-fab-dot offline")}})}function P(n,e){let t=document.createElement("div");t.className=`hw-live-msg-row from-${n}`;let a=document.createElement("div");a.className="hw-live-label",a.textContent=n==="rep"?"HR Representative":"You";let r=document.createElement("div");r.className="hw-live-bubble",r.textContent=e,t.appendChild(a),t.appendChild(r),p.appendChild(t),h()}function pe(n){if(!u)return;u.hidden=!1;let e=u.querySelector(".hw-live-input"),t=u.querySelector(".hw-send-btn");function a(){let r=e.value.trim();!r||!E||(E.send(r),P("visitor",r),e.value="",e.style.height="auto",e.focus())}t.addEventListener("click",a),e.addEventListener("keydown",r=>{r.key==="Enter"&&!r.shiftKey&&(r.preventDefault(),a())}),e.addEventListener("input",()=>{e.style.height="auto",e.style.height=`${Math.min(e.scrollHeight,96)}px`}),setTimeout(()=>e&&e.focus(),100)}function I(){u&&(u.hidden=!0)}W.exports={init:ne,renderNode:f}});var he=H(),D=y(),U=$(),ke=C();function ue(){try{if(document.currentScript&&document.currentScript.src)return new URL(document.currentScript.src).origin}catch{}let e=Array.from(document.scripts).find(t=>t.src&&t.src.includes("widget.bundle"));if(e)try{return new URL(e.src).origin}catch{}return window.location.origin}var j=ue();function fe(){let n=document.createElement("div");n.id="hr-chat-widget",document.body.appendChild(n);let e=n.attachShadow({mode:"open"}),t=document.createElement("style");t.textContent=he,e.appendChild(t);let a=document.createElement("button");a.className="hw-fab",a.setAttribute("aria-label","Open HR Support Chat"),a.innerHTML=`
    <span class="hw-fab-dot" aria-hidden="true"></span>
    HR Support
  `,e.appendChild(a);let r=document.createElement("div");return r.className="hw-window",r.setAttribute("role","dialog"),r.setAttribute("aria-label","HR Support Chat"),r.hidden=!0,r.innerHTML=`
    <div class="hw-header">
      <div class="hw-header-brand">
        <div class="hw-header-logo" aria-hidden="true">LR</div>
        <div class="hw-header-text">
          <div class="hw-header-title">LetterRide HR</div>
          <div class="hw-header-sub">Support Assistant</div>
        </div>
      </div>
      <button class="hw-close" aria-label="Close chat">&times;</button>
    </div>
    <div class="hw-messages" role="log" aria-live="polite"></div>
    <div class="hw-input-row" hidden>
      <textarea
        class="hw-live-input"
        placeholder="Type a message..."
        rows="1"
        maxlength="2000"
        aria-label="Message input"
      ></textarea>
      <button class="hw-send-btn">Send</button>
    </div>
    <div class="hw-footer">LetterRide HR &mdash; Confidential</div>
  `,e.appendChild(r),{shadow:e,fab:a,win:r,fabDot:a.querySelector(".hw-fab-dot"),msgArea:r.querySelector(".hw-messages"),inputRow:r.querySelector(".hw-input-row"),closeBtn:r.querySelector(".hw-close")}}var z=!1,F=!1;function Y(n){let{fab:e,win:t}=n;t.hidden=!1,e.classList.add("open"),e.setAttribute("aria-expanded","true"),z=!0,F||(F=!0,we(n))}function S(n){let{fab:e,win:t}=n;t.hidden=!0,e.classList.remove("open"),e.setAttribute("aria-expanded","false"),z=!1}async function we(n){let{msgArea:e,inputRow:t,fabDot:a}=n;U.init(e,t,a,j);let r=document.createElement("div");r.className="hw-msg-bubble",r.innerHTML='<span class="hw-spinner"></span>Loading...';let o=document.createElement("div");o.className="hw-msg",o.appendChild(r),e.appendChild(o);try{await D.load(j),o.remove();let i=D.getInitialNode();if(!i)throw new Error("Bot logic missing initial node");U.renderNode(i.id)}catch(i){o.remove();let d=document.createElement("div");d.className="hw-msg-bubble",d.textContent="We are experiencing a technical issue. Please contact HR directly at hr@letterride.com.";let s=document.createElement("div");s.className="hw-msg",s.appendChild(d),e.appendChild(s),console.error("[HRChat] Failed to load bot logic:",i)}}(function(){if(typeof window>"u")return;function e(){let t=fe(),{fab:a,closeBtn:r}=t;a.addEventListener("click",()=>{z?S(t):Y(t)}),r.addEventListener("click",()=>S(t)),window.HRChat={open:()=>Y(t),close:()=>S(t)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()})();})();
