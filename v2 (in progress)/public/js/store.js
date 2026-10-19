// État persistant de l'application (localStorage, plus de cookies).

import { COLLECTABLE, MAX_MODULES, MAX_PLAYERS, knownValues } from './config.js';

export const STATE_KEY = 'mc-generator/v2';

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

/**
 * Valide un état lu depuis le stockage. Les identifiants absents du catalogue (image renommée
 * ou retirée depuis la dernière visite) sont écartés : sinon l'écran Partie ne peut pas s'afficher.
 */
export function sanitize(raw, content) {
  const state = { ...defaultState(), ...raw };
  state.players = clamp(state.players, 1, MAX_PLAYERS);
  state.moduleCount = clamp(state.moduleCount, 1, MAX_MODULES);
  state.uniqueAspects = state.uniqueAspects !== false;
  state.favorUnplayed = state.favorUnplayed === true;
  state.excluded = Object.fromEntries(COLLECTABLE.map((c) => [
    c,
    Array.isArray(raw?.excluded?.[c]) ? raw.excluded[c].filter((id) => typeof id === 'string') : [],
  ]));
  state.values = knownValues(raw?.values, content);
  state.locked = Object.fromEntries(
    Object.keys(state.values).filter((key) => raw?.locked?.[key] === true).map((key) => [key, true]),
  );
  state.lastSaved = typeof raw?.lastSaved === 'string' ? raw.lastSaved : null;
  return state;
}

export function loadState(content) {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) return sanitize(JSON.parse(saved), content);
  } catch {
    // stockage indisponible (navigation privée...) ou contenu illisible : valeurs par défaut
  }
  return importV1Cookies(content) ?? defaultState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
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
