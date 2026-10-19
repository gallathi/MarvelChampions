import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  drawSignature, entryFromValues, favorWeight, leastPlayed, playCounts, sanitizeHistory, summary,
} from '../public/js/history.js';
import { weightedPick } from '../public/js/draw.js';

const game = (date, heroes, result = null, scenario = 'rhino') => ({
  id: date, date, scenario, modules: ['bomb'], mode: 'standard',
  heroes: heroes.map((hero) => ({ hero, aspect: 'justice' })), result,
});

const history = [
  game('2026-10-03T20:00:00.000Z', ['thor', 'hulk'], 'win', 'klaw'),
  game('2026-10-02T20:00:00.000Z', ['thor'], 'loss'),
  game('2026-10-01T20:00:00.000Z', ['drax'], null),
];

test('entryFromValues reconstruit la partie depuis les emplacements', () => {
  const entry = entryFromValues(
    { scenario: 'rhino', 'module-0': 'bomb', 'module-1': 'hydra', mode: 'expert',
      'hero-0': 'thor', 'aspect-0': 'justice', 'hero-1': 'hulk', 'aspect-1': 'protection' },
    { players: 2, moduleCount: 2 },
    new Date('2026-10-19T10:00:00Z'),
  );
  assert.equal(entry.scenario, 'rhino');
  assert.deepEqual(entry.modules, ['bomb', 'hydra']);
  assert.deepEqual(entry.heroes, [{ hero: 'thor', aspect: 'justice' }, { hero: 'hulk', aspect: 'protection' }]);
  assert.equal(entry.result, null);
});

test('playCounts compte parties, victoires et défaites', () => {
  const counts = playCounts(history, 'heroes');
  assert.deepEqual(counts.get('thor'), { plays: 2, wins: 1, losses: 1, last: '2026-10-03T20:00:00.000Z' });
  assert.equal(counts.get('drax').plays, 1);
  assert.equal(counts.has('groot'), false);
});

test('leastPlayed : jamais joués d’abord, puis le plus ancien', () => {
  const ranking = leastPlayed(['thor', 'hulk', 'drax', 'groot'], playCounts(history, 'heroes'));
  assert.deepEqual(ranking.map((r) => r.id), ['groot', 'drax', 'hulk', 'thor']);
});

test('summary calcule le taux de victoire sur les parties terminées', () => {
  assert.deepEqual(summary(history), { games: 3, wins: 1, losses: 1, winRate: 50 });
  assert.equal(summary([]).winRate, null);
});

test('sanitizeHistory ignore les entrées invalides et trie par date', () => {
  const clean = sanitizeHistory([
    { nope: true },
    game('2026-01-01T00:00:00.000Z', ['thor']),
    { ...game('2026-05-01T00:00:00.000Z', ['hulk']), result: 'bizarre' },
  ]);
  assert.equal(clean.length, 2);
  assert.equal(clean[0].heroes[0].hero, 'hulk');
  assert.equal(clean[0].result, null);
  assert.deepEqual(sanitizeHistory('pas une liste'), []);
});

test('drawSignature ne dépend pas de l’ordre des clés', () => {
  assert.equal(drawSignature({ a: '1', b: '2' }), drawSignature({ b: '2', a: '1' }));
});

test('weightedPick respecte les poids', () => {
  // rng déterministe : parcourt toutes les valeurs possibles une fois
  const weights = { never: favorWeight(0), often: favorWeight(4) }; // 100 vs 20
  const picks = { never: 0, often: 0 };
  const total = weights.never + weights.often;
  for (let r = 0; r < total; r++) {
    picks[weightedPick(['never', 'often'], (id) => weights[id], () => r)]++;
  }
  assert.deepEqual(picks, { never: 100, often: 20 });
});
