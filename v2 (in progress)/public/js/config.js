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

/** Catégorie du catalogue d'un emplacement de tirage ('hero-2' -> 'heroes'), ou null. */
export function categoryOfSlot(key) {
  if (key === 'scenario') return 'scenarios';
  if (key === 'mode') return 'modes';
  const match = /^(module|hero|aspect)-\d+$/.exec(key);
  return match ? { module: 'modules', hero: 'heroes', aspect: 'aspects' }[match[1]] : null;
}

/** Ne garde que les valeurs de tirage valides : emplacement connu et identifiant présent au catalogue. */
export function knownValues(values, content) {
  const clean = {};
  if (!values || typeof values !== 'object') return clean;
  for (const [key, id] of Object.entries(values)) {
    const cat = categoryOfSlot(key);
    if (cat && typeof id === 'string' && content[cat]?.some((item) => item.id === id)) clean[key] = id;
  }
  return clean;
}
