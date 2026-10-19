import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSlots, roll, validatePools, randomInt } from '../public/js/draw.js';

const pools = {
  scenarios: ['rhino', 'klaw', 'ultron'],
  modules: ['bomb', 'masters', 'hydra'],
  modes: ['standard', 'expert'],
  heroes: ['thor', 'hulk', 'drax', 'groot'],
  aspects: ['aggression', 'justice', 'leadership', 'protection'],
};

const allKeys = (slots) => slots.map((s) => s.key);

test('buildSlots crée un héros et une affinité par joueur', () => {
  const slots = buildSlots({ players: 3, moduleCount: 2, uniqueAspects: true });
  assert.deepEqual(allKeys(slots), [
    'scenario', 'module-0', 'module-1', 'mode',
    'hero-0', 'aspect-0', 'hero-1', 'aspect-1', 'hero-2', 'aspect-2',
  ]);
});

test('roll remplit tout sans doublon de héros, module ni affinité', () => {
  const slots = buildSlots({ players: 4, moduleCount: 3, uniqueAspects: true });
  for (let i = 0; i < 200; i++) {
    const { values, missing } = roll({ slots, values: {}, pools, targets: allKeys(slots) });
    assert.equal(missing.length, 0);
    for (const prefix of ['hero-', 'module-', 'aspect-']) {
      const picked = Object.entries(values).filter(([k]) => k.startsWith(prefix)).map(([, v]) => v);
      assert.equal(new Set(picked).size, picked.length, `doublon sur ${prefix}`);
    }
  }
});

test('roll respecte les emplacements non ciblés (verrouillés)', () => {
  const slots = buildSlots({ players: 2, moduleCount: 1, uniqueAspects: true });
  const locked = { 'hero-0': 'thor', scenario: 'klaw' };
  const targets = allKeys(slots).filter((k) => !(k in locked));
  for (let i = 0; i < 50; i++) {
    const { values } = roll({ slots, values: locked, pools, targets });
    assert.equal(values['hero-0'], 'thor');
    assert.equal(values.scenario, 'klaw');
    assert.notEqual(values['hero-1'], 'thor');
  }
});

test('relancer un emplacement change sa valeur quand c’est possible', () => {
  const slots = buildSlots({ players: 1, moduleCount: 1, uniqueAspects: true });
  for (let i = 0; i < 50; i++) {
    const { values } = roll({
      slots, values: { scenario: 'rhino' }, pools, targets: ['scenario'], avoidRepeat: true,
    });
    assert.notEqual(values.scenario, 'rhino');
  }
});

test('un tirage complet peut retomber sur la même valeur (pas de biais)', () => {
  const slots = buildSlots({ players: 1, moduleCount: 1, uniqueAspects: true });
  const outcomes = new Set();
  for (let i = 0; i < 100; i++) {
    outcomes.add(roll({ slots, values: { mode: 'standard' }, pools, targets: ['mode'] }).values.mode);
  }
  assert.deepEqual([...outcomes].sort(), ['expert', 'standard']);
});

test('affinités en double autorisées quand uniqueAspects est désactivé', () => {
  const slots = buildSlots({ players: 4, moduleCount: 1, uniqueAspects: false });
  const { missing } = roll({
    slots, values: {}, pools: { ...pools, aspects: ['justice'] }, targets: allKeys(slots),
  });
  assert.equal(missing.length, 0);
});

test('roll signale les emplacements impossibles à remplir', () => {
  const slots = buildSlots({ players: 3, moduleCount: 1, uniqueAspects: true });
  const { missing } = roll({
    slots, values: {}, pools: { ...pools, heroes: ['thor', 'hulk'] }, targets: allKeys(slots),
  });
  assert.deepEqual(missing, ['hero-2']);
});

test('validatePools détecte une collection insuffisante', () => {
  assert.deepEqual(validatePools(pools, { players: 4, moduleCount: 3, uniqueAspects: true }), []);
  const problems = validatePools({ ...pools, heroes: ['thor'], scenarios: [] }, {
    players: 2, moduleCount: 1, uniqueAspects: true,
  });
  assert.equal(problems.length, 2);
});

test('randomInt reste dans les bornes', () => {
  for (let i = 0; i < 1000; i++) {
    const n = randomInt(7);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 7);
  }
});
