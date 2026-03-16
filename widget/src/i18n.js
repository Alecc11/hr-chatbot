'use strict';

let _lang = 'en';

function setLang(lang) {
  _lang = lang || 'en';
}

function getLang() {
  return _lang;
}

/**
 * Resolve a bilingual content object { en: '...', es: '...' }
 * to a string in the current language, falling back to English.
 */
function t(obj) {
  if (!obj) return '';
  return obj[_lang] || obj.en || '';
}

module.exports = { setLang, getLang, t };
