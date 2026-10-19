// Encodage d'une partie dans l'URL : #/partie/<code>

import { MAX_MODULES, MAX_PLAYERS } from './config.js';

const toBase64Url = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

export function encodeGame(state) {
  return toBase64Url(
    JSON.stringify({
      p: state.players,
      m: state.moduleCount,
      u: state.uniqueAspects ? 1 : 0,
      v: state.values,
    }),
  );
}

/** Retourne { players, moduleCount, uniqueAspects, values } ou null si le code est invalide. */
export function decodeGame(code, content) {
  try {
    const data = JSON.parse(fromBase64Url(code));
    const players = Number(data.p);
    const moduleCount = Number(data.m);
    if (!(players >= 1 && players <= MAX_PLAYERS && moduleCount >= 1 && moduleCount <= MAX_MODULES)) {
      return null;
    }
    const known = (cat, id) => content[cat].some((item) => item.id === id);
    const categoryOf = (key) =>
      key === 'scenario' ? 'scenarios'
      : key === 'mode' ? 'modes'
      : key.startsWith('module-') ? 'modules'
      : key.startsWith('hero-') ? 'heroes'
      : key.startsWith('aspect-') ? 'aspects'
      : null;

    const values = {};
    for (const [key, id] of Object.entries(data.v ?? {})) {
      const cat = categoryOf(key);
      if (cat && typeof id === 'string' && known(cat, id)) values[key] = id;
    }
    return { players, moduleCount, uniqueAspects: data.u !== 0, values };
  } catch {
    return null;
  }
}

export function shareUrl(state) {
  const url = new URL(window.location.href);
  url.hash = `#/partie/${encodeGame(state)}`;
  return url.toString();
}
