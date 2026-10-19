// Logique de tirage, sans DOM : testable avec `npm test`.

/** Entier aléatoire uniforme dans [0, n[ (crypto si dispo). */
export function randomInt(n) {
  if (globalThis.crypto?.getRandomValues) {
    const limit = Math.floor(0x100000000 / n) * n; // évite le biais du modulo
    const buf = new Uint32Array(1);
    do globalThis.crypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

/**
 * Choisit un élément selon des poids entiers positifs (poids 3 = 3× plus de chances que poids 1).
 * Sans `weightOf`, le tirage est uniforme.
 */
export function weightedPick(items, weightOf, rng = randomInt) {
  if (!weightOf) return items[rng(items.length)];
  const weights = items.map((item) => Math.max(1, Math.round(weightOf(item))));
  let r = rng(weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Liste des emplacements d'une partie.
 * `group` regroupe les emplacements qui ne peuvent pas partager la même valeur.
 */
export function buildSlots({ players, moduleCount, uniqueAspects }) {
  const slots = [{ key: 'scenario', category: 'scenarios', group: 'scenarios' }];
  for (let i = 0; i < moduleCount; i++) {
    slots.push({ key: `module-${i}`, category: 'modules', group: 'modules', index: i });
  }
  slots.push({ key: 'mode', category: 'modes', group: 'modes' });
  for (let i = 0; i < players; i++) {
    slots.push({ key: `hero-${i}`, category: 'heroes', group: 'heroes', index: i });
    slots.push({
      key: `aspect-${i}`,
      category: 'aspects',
      group: uniqueAspects ? 'aspects' : `aspect-${i}`,
      index: i,
    });
  }
  return slots;
}

/** Valeurs déjà prises par les autres emplacements du même groupe. */
export function takenValues(slots, values, slot) {
  return new Set(
    slots
      .filter((s) => s.key !== slot.key && s.group === slot.group && values[s.key])
      .map((s) => values[s.key]),
  );
}

/**
 * Tire les emplacements `targets` (clés). Les autres gardent leur valeur.
 * Avec `avoidRepeat`, un emplacement déjà rempli reçoit si possible une valeur différente
 * (utile pour « relancer » un seul élément ; à éviter pour un tirage complet, sinon biaisé).
 * `weights` (optionnel) : { catégorie: (id) => poids } pour favoriser certains éléments.
 * Retourne { values, missing } ; `missing` liste les emplacements sans candidat.
 */
export function roll({ slots, values, pools, targets, avoidRepeat = false, weights = {}, rng = randomInt }) {
  const next = { ...values };
  const targetSet = new Set(targets);
  const previous = {};
  for (const key of targetSet) {
    previous[key] = next[key];
    delete next[key];
  }

  const missing = [];
  for (const slot of slots) {
    if (!targetSet.has(slot.key)) continue;
    const taken = takenValues(slots, next, slot);
    let candidates = (pools[slot.category] ?? []).filter((id) => !taken.has(id));
    if (avoidRepeat && candidates.length > 1 && previous[slot.key]) {
      candidates = candidates.filter((id) => id !== previous[slot.key]);
    }
    if (candidates.length === 0) {
      missing.push(slot.key);
      continue;
    }
    next[slot.key] = weightedPick(candidates, weights[slot.category], rng);
  }
  return { values: next, missing };
}

/** Problèmes empêchant un tirage complet avec la collection actuelle. */
export function validatePools(pools, { players, moduleCount, uniqueAspects }) {
  const problems = [];
  const count = (cat) => (pools[cat] ?? []).length;
  if (count('scenarios') < 1) problems.push('Sélectionnez au moins un scénario.');
  if (count('modules') < moduleCount) {
    problems.push(`Il faut au moins ${moduleCount} module${moduleCount > 1 ? 's' : ''} pour cette configuration.`);
  }
  if (count('heroes') < players) {
    problems.push(`Il faut au moins ${players} héros pour ${players} joueur${players > 1 ? 's' : ''}.`);
  }
  if (uniqueAspects && count('aspects') < players) {
    problems.push('Pas assez d’affinités différentes pour ce nombre de joueurs.');
  }
  return problems;
}
