import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, evaluateAchievements, newlyUnlocked, unlockedIds } from '../public/js/achievements.js';

let n = 0;
const game = (scenario, heroes, { result = null, mode = 'standard', day = ++n } = {}) => ({
  id: `g${day}`,
  date: new Date(Date.UTC(2026, 9, day)).toISOString(),
  scenario,
  modules: [],
  mode,
  heroes: heroes.map(([hero, aspect]) => ({ hero, aspect })),
  result,
});

test('douze succès (dont le succès ultime), identifiants uniques', () => {
  assert.equal(ACHIEVEMENTS.length, 12);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, 12);
});

test('historique vide : rien de débloqué, progression à zéro', () => {
  const states = evaluateAchievements([]);
  assert.ok(states.every((a) => !a.done && a.value === 0));
});

test('une première partie débloque « Premier appel » uniquement', () => {
  const ids = unlockedIds([game('rhino', [['thor', 'justice']])]);
  assert.deepEqual([...ids], ['premier-appel']);
});

test('progression plafonnée à la cible', () => {
  const history = Array.from({ length: 8 }, () => game('rhino', [['thor', 'justice']]));
  const habitue = evaluateAchievements(history).find((a) => a.id === 'habitue');
  assert.equal(habitue.value, 5);
  assert.ok(habitue.done);
});

test('succès de variété : héros, méchants, affinités', () => {
  const history = [
    game('rhino', [['thor', 'justice'], ['hulk', 'agressivite']]),
    game('klaw', [['drax', 'protection'], ['groot', 'commandement']]),
    game('ultron', [['venom', 'justice']], { mode: 'expert' }),
  ];
  const ids = unlockedIds(history);
  for (const id of ['casting-varie', 'chasseur', 'touche-a-tout', 'esprit-equipe', 'tete-brulee']) {
    assert.ok(ids.has(id), id);
  }
});

test('« La revanche » exige une défaite puis une victoire contre le même méchant', () => {
  const lossThenWin = [
    game('rhino', [['thor', 'justice']], { result: 'loss', day: 1 }),
    game('rhino', [['hulk', 'justice']], { result: 'win', day: 2 }),
  ];
  assert.ok(unlockedIds(lossThenWin).has('revanche'));

  const winThenLoss = [
    game('rhino', [['thor', 'justice']], { result: 'win', day: 1 }),
    game('rhino', [['hulk', 'justice']], { result: 'loss', day: 2 }),
  ];
  assert.ok(!unlockedIds(winThenLoss).has('revanche'));

  const otherVillain = [
    game('rhino', [['thor', 'justice']], { result: 'loss', day: 1 }),
    game('klaw', [['hulk', 'justice']], { result: 'win', day: 2 }),
  ];
  assert.ok(!unlockedIds(otherVillain).has('revanche'));
});

test('« Le grand rassemblement » : tous les héros de la collection', () => {
  const ctx = { heroes: ['thor', 'hulk', 'drax'] };
  const state = (h) => evaluateAchievements(h, ctx).find((a) => a.id === 'grand-rassemblement');
  const partial = [game('rhino', [['thor', 'justice'], ['venom', 'justice']])]; // Venom hors collection
  assert.deepEqual([state(partial).value, state(partial).target, state(partial).done], [1, 3, false]);

  const full = [...partial, game('klaw', [['hulk', 'justice'], ['drax', 'protection']])];
  assert.ok(state(full).done);
  assert.deepEqual(newlyUnlocked(partial, full, ctx).map((a) => a.id).includes('grand-rassemblement'), true);
});

test('« Le grand rassemblement » sans collection connue ne se débloque pas', () => {
  assert.ok(!unlockedIds([game('rhino', [['thor', 'justice']])]).has('grand-rassemblement'));
});

test('newlyUnlocked ne renvoie que les nouveaux succès', () => {
  const before = [game('rhino', [['thor', 'justice']])];
  const after = [{ ...before[0], result: 'win' }];
  assert.deepEqual(newlyUnlocked(before, after).map((a) => a.id), ['premier-triomphe']);
  assert.deepEqual(newlyUnlocked(after, after), []);
});

test('« Marvel Champion » suit les autres succès et se débloque en dernier', () => {
  n = 0;
  const allButRevenge = [
    game('rhino', [['thor', 'justice'], ['hulk', 'agressivite']], { result: 'win', mode: 'expert' }),
    game('klaw', [['drax', 'protection'], ['groot', 'commandement']], { result: 'loss' }),
    game('ultron', [['venom', 'justice']]),
    game('ultron', [['venom', 'justice']]),
    game('ultron', [['venom', 'justice']]),
  ];
  // collection = les 5 héros joués, pour que « Le grand rassemblement » soit obtenu
  const ctx = { heroes: ['thor', 'hulk', 'drax', 'groot', 'venom'] };
  const meta = (h) => evaluateAchievements(h, ctx).find((a) => a.id === 'champion-des-champions');
  assert.deepEqual([meta(allButRevenge).value, meta(allButRevenge).target, meta(allButRevenge).done], [10, 11, false]);

  const all = [...allButRevenge, game('klaw', [['thor', 'justice']], { result: 'win' })];
  assert.ok(meta(all).done);
  assert.deepEqual(newlyUnlocked(allButRevenge, all, ctx).map((a) => a.id), ['revanche', 'champion-des-champions']);
});
