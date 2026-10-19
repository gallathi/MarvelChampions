// État persistant de l'application (localStorage, plus de cookies).

import { COLLECTABLE, MAX_MODULES, MAX_PLAYERS } from './config.js';

const KEY = 'mc-generator/v2';

export function defaultState() {
  return {
    players: 1,
    moduleCount: 1,
    uniqueAspects: true,
    favorUnplayed: false,
    // On mémorise ce qui est EXCLU : une nouvelle extension est cochée par défaut.
    excluded: Object.fromEntries(COLLECTABLE.map((c) => [c, []])),
    values: {},
    locked: {},
    lastSaved: null, // signature du dernier tirage enregistré dans l'historique
  };
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number.parseInt(n, 10) || min));

function sanitize(raw) {
  const base = defaultState();
  const state = { ...base, ...raw };
  state.players = clamp(state.players, 1, MAX_PLAYERS);
  state.moduleCount = clamp(state.moduleCount, 1, MAX_MODULES);
  state.uniqueAspects = state.uniqueAspects !== false;
  state.favorUnplayed = state.favorUnplayed === true;
  state.excluded = Object.fromEntries(
    COLLECTABLE.map((c) => [c, Array.isArray(raw?.excluded?.[c]) ? raw.excluded[c] : []]),
  );
  state.values = typeof state.values === 'object' && state.values ? state.values : {};
  state.locked = typeof state.locked === 'object' && state.locked ? state.locked : {};
  return state;
}

export function loadState(content) {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return sanitize(JSON.parse(saved));
  } catch {
    // stockage indisponible (navigation privée...) : on repart des valeurs par défaut
  }
  return importV1Cookies(content) ?? defaultState();
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // pas de persistance possible, l'appli reste utilisable
  }
}

/** Reprend la sélection enregistrée par la v1 (cookies "<Nom>=false" et "j=<joueurs>"). */
function importV1Cookies(content) {
  const cookies = {};
  for (const part of document.cookie.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    let name = part.slice(0, i).trim();
    try {
      name = decodeURIComponent(name);
    } catch {
      // nom non encodé, on le garde tel quel
    }
    cookies[name.normalize('NFC')] = part.slice(i + 1).trim();
  }
  if (!Object.keys(cookies).length) return null;

  const state = defaultState();
  let found = false;
  for (const cat of COLLECTABLE) {
    for (const item of content[cat]) {
      if (cookies[item.name] === 'false') {
        state.excluded[cat].push(item.id);
        found = true;
      }
    }
  }
  if (cookies.j) {
    state.players = clamp(cookies.j, 1, MAX_PLAYERS);
    found = true;
  }
  return found ? state : null;
}
