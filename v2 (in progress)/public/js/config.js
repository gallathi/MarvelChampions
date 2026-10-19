export const CATEGORIES = {
  scenarios: { label: 'Scénarios', singular: 'Scénario', collectable: true },
  modules: { label: 'Modules', singular: 'Module', collectable: true },
  heroes: { label: 'Héros', singular: 'Héros', collectable: true },
  modes: { label: 'Difficultés', singular: 'Difficulté' },
  aspects: { label: 'Affinités', singular: 'Affinité' },
};

export const COLLECTABLE = Object.keys(CATEGORIES).filter((k) => CATEGORIES[k].collectable);

export const MAX_PLAYERS = 4;
export const MAX_MODULES = 3;

// Couleurs officielles des affinités, utilisées en liseré des cartes
export const ASPECT_COLORS = {
  agressivite: '#e5323d',
  commandement: '#3d8ee8',
  justice: '#f2c230',
  protection: '#3fb468',
};
