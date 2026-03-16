'use strict';

let _logic   = null;
let _baseUrl = '';

/**
 * Fetch bot-logic.json from the server and cache it.
 * @param {string} baseUrl  Origin of the API server (e.g. https://hr-chatbot.onrender.com)
 */
async function load(baseUrl) {
  _baseUrl = baseUrl;
  const res = await fetch(`${baseUrl}/api/bot/logic`);
  if (!res.ok) throw new Error('Failed to load bot logic');
  _logic = await res.json();
  return _logic;
}

/** Retrieve a node by ID. Returns null if not found. */
function getNode(id) {
  if (!_logic || !id) return null;
  return _logic.nodes[id] || null;
}

/** Return the initial node object. */
function getInitialNode() {
  if (!_logic) return null;
  return getNode(_logic.initialNode);
}

/**
 * Check whether live agent support is currently open.
 * @returns {Promise<{ open: boolean, nextOpen: string|null }>}
 */
async function checkTimeGate() {
  const res = await fetch(`${_baseUrl}/api/bot/time-gate`);
  if (!res.ok) return { open: false, nextOpen: null };
  return res.json();
}

module.exports = { load, getNode, getInitialNode, checkTimeGate };
