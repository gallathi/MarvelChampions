// Succès débloqués à partir de l'historique (fonctions pures, testées).

const distinct = (values) => new Set(values.filter(Boolean)).size;

/** Battre un méchant qui vous avait vaincu lors d'une partie précédente. */
function revenge(history) {
  const beatenBy = new Set();
  for (const game of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
    if (game.result === 'win' && beatenBy.has(game.scenario)) return 1;
    if (game.result === 'loss') beatenBy.add(game.scenario);
  }
  return 0;
}

export const ACHIEVEMENTS = [
  {
    id: 'premier-appel',
    title: 'Premier appel',
    description: 'Enregistrer votre première partie',
    icon: 'play',
    target: 1,
    progress: (h) => h.length,
  },
  {
    id: 'premier-triomphe',
    title: 'Premier triomphe',
    description: 'Remporter une partie',
    icon: 'trophy',
    target: 1,
    progress: (h) => h.filter((g) => g.result === 'win').length,
  },
  {
    id: 'ca-arrive',
    title: 'Ça arrive aux meilleurs',
    description: 'Perdre une partie (il faut bien commencer)',
    icon: 'skull',
    target: 1,
    progress: (h) => h.filter((g) => g.result === 'loss').length,
  },
  {
    id: 'esprit-equipe',
    title: 'Esprit d’équipe',
    description: 'Jouer une partie à deux joueurs ou plus',
    icon: 'users',
    target: 1,
    progress: (h) => h.filter((g) => g.heroes.length >= 2).length,
  },
  {
    id: 'tete-brulee',
    title: 'Tête brûlée',
    description: 'Jouer une partie en Expert',
    icon: 'flame',
    target: 1,
    progress: (h) => h.filter((g) => g.mode === 'expert').length,
  },
  {
    id: 'habitue',
    title: 'Habitué du QG',
    description: 'Enregistrer 5 parties',
    icon: 'history',
    target: 5,
    progress: (h) => h.length,
  },
  {
    id: 'casting-varie',
    title: 'Casting varié',
    description: 'Jouer 5 héros différents',
    icon: 'grid',
    target: 5,
    progress: (h) => distinct(h.flatMap((g) => g.heroes.map((x) => x.hero))),
  },
  {
    id: 'chasseur',
    title: 'Chasseur de méchants',
    description: 'Affronter 3 méchants différents',
    icon: 'target',
    target: 3,
    progress: (h) => distinct(h.map((g) => g.scenario)),
  },
  {
    id: 'touche-a-tout',
    title: 'Touche-à-tout',
    description: 'Jouer les 4 affinités',
    icon: 'aspects',
    target: 4,
    progress: (h) => distinct(h.flatMap((g) => g.heroes.map((x) => x.aspect))),
  },
  {
    id: 'grand-rassemblement',
    title: 'Le grand rassemblement',
    description: 'Jouer tous les héros de votre collection',
    icon: 'star',
    // la cible dépend de la collection : ctx.heroes = identifiants des héros possédés
    target: (ctx) => Math.max(1, ctx.heroes?.length ?? 0),
    progress: (h, ctx) => {
      const played = new Set(h.flatMap((g) => g.heroes.map((x) => x.hero)));
      return (ctx.heroes ?? []).filter((id) => played.has(id)).length;
    },
  },
  {
    id: 'revanche',
    title: 'La revanche',
    description: 'Battre un méchant qui vous avait vaincu',
    icon: 'swords',
    target: 1,
    progress: revenge,
  },
  {
    // Succès ultime : sa progression dépend des autres, calculée dans evaluateAchievements
    id: 'champion-des-champions',
    title: 'Marvel Champion',
    description: 'Débloquer tous les autres succès',
    icon: 'medal',
    meta: true,
  },
];

/**
 * État de chaque succès : { ...succès, target, value, done }.
 * `ctx.heroes` : héros de la collection (pour « Le grand rassemblement »).
 */
export function evaluateAchievements(history, ctx = {}) {
  const regular = ACHIEVEMENTS.filter((a) => !a.meta).map((a) => {
    const target = typeof a.target === 'function' ? a.target(ctx) : a.target;
    const value = Math.min(target, a.progress(history, ctx));
    return { ...a, target, value, done: value >= target };
  });
  const unlocked = regular.filter((a) => a.done).length;
  const meta = ACHIEVEMENTS.filter((a) => a.meta).map((a) => ({
    ...a, target: regular.length, value: unlocked, done: unlocked === regular.length,
  }));
  return [...regular, ...meta];
}

export const unlockedIds = (history, ctx = {}) =>
  new Set(evaluateAchievements(history, ctx).filter((a) => a.done).map((a) => a.id));

/** Succès débloqués entre deux versions de l'historique. */
export function newlyUnlocked(before, after, ctx = {}) {
  const was = unlockedIds(before, ctx);
  return evaluateAchievements(after, ctx).filter((a) => a.done && !was.has(a.id));
}
