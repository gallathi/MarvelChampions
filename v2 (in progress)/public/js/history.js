// Historique des parties jouées et statistiques (fonctions pures + persistance).

const KEY = 'mc-generator/v2/history';
const MAX_ENTRIES = 1000;

export const RESULTS = ['win', 'loss'];

export function loadHistory() {
  try {
    return sanitizeHistory(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  } catch {
    // stockage plein ou indisponible : l'historique reste en mémoire pour la session
  }
}

/** Valide une liste importée (fichier JSON) ou lue depuis le stockage. */
export function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g) => g && typeof g.scenario === 'string' && Array.isArray(g.heroes) && !Number.isNaN(Date.parse(g.date)))
    .map((g) => ({
      id: String(g.id ?? `${Date.parse(g.date)}`),
      date: new Date(g.date).toISOString(),
      scenario: g.scenario,
      modules: Array.isArray(g.modules) ? g.modules.filter((m) => typeof m === 'string') : [],
      mode: typeof g.mode === 'string' ? g.mode : null,
      heroes: g.heroes
        .filter((h) => h && typeof h.hero === 'string')
        .map((h) => ({ hero: h.hero, aspect: typeof h.aspect === 'string' ? h.aspect : null })),
      result: RESULTS.includes(g.result) ? g.result : null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Construit une entrée d'historique depuis les valeurs tirées. */
export function entryFromValues(values, { players, moduleCount }, now = new Date()) {
  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    date: now.toISOString(),
    scenario: values.scenario,
    modules: Array.from({ length: moduleCount }, (_, i) => values[`module-${i}`]).filter(Boolean),
    mode: values.mode ?? null,
    heroes: Array.from({ length: players }, (_, i) => ({
      hero: values[`hero-${i}`],
      aspect: values[`aspect-${i}`] ?? null,
    })).filter((h) => h.hero),
    result: null,
  };
}

/** Signature d'un tirage, pour ne pas enregistrer deux fois la même partie. */
export const drawSignature = (values) =>
  JSON.stringify(Object.keys(values).sort().map((k) => [k, values[k]]));

const ACCESSORS = {
  heroes: (g) => g.heroes.map((h) => h.hero),
  scenarios: (g) => [g.scenario],
  aspects: (g) => g.heroes.map((h) => h.aspect).filter(Boolean),
  modules: (g) => g.modules,
};

/** Map id -> { plays, wins, losses, last } pour une catégorie. */
export function playCounts(history, category) {
  const counts = new Map();
  for (const game of history) {
    for (const id of ACCESSORS[category](game)) {
      const c = counts.get(id) ?? { plays: 0, wins: 0, losses: 0, last: null };
      c.plays++;
      if (game.result === 'win') c.wins++;
      if (game.result === 'loss') c.losses++;
      if (!c.last || game.date > c.last) c.last = game.date;
      counts.set(id, c);
    }
  }
  return counts;
}

/**
 * Classement des éléments du moins joué au plus joué.
 * À égalité : celui joué il y a le plus longtemps d'abord, puis ordre du catalogue.
 */
export function leastPlayed(ids, counts) {
  const empty = { plays: 0, wins: 0, losses: 0, last: null };
  return ids
    .map((id, order) => ({ id, order, ...(counts.get(id) ?? empty) }))
    .sort((a, b) =>
      a.plays - b.plays
      || (a.last ?? '').localeCompare(b.last ?? '')
      || a.order - b.order);
}

/** Poids de tirage : un élément jamais joué a 4× plus de chances qu'un élément joué 3 fois. */
export const favorWeight = (plays) => Math.round(100 / (1 + plays));

export function summary(history) {
  const decided = history.filter((g) => g.result);
  const wins = decided.filter((g) => g.result === 'win').length;
  return {
    games: history.length,
    wins,
    losses: decided.length - wins,
    winRate: decided.length ? Math.round((wins / decided.length) * 100) : null,
  };
}
