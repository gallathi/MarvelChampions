import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryOfSlot, knownValues } from '../public/js/config.js';
import { decodeGame, encodeGame } from '../public/js/share.js';
import { sanitize } from '../public/js/store.js';

const content = {
  scenarios: [{ id: 'rhino' }, { id: 'klaw' }],
  modules: [{ id: 'bomb' }, { id: 'hydra' }],
  modes: [{ id: 'standard' }, { id: 'expert' }],
  heroes: [{ id: 'thor' }, { id: 'hulk' }],
  aspects: [{ id: 'justice' }, { id: 'protection' }],
};

const code = (data) => btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

test('categoryOfSlot reconnaît les emplacements et rejette le reste', () => {
  assert.equal(categoryOfSlot('scenario'), 'scenarios');
  assert.equal(categoryOfSlot('hero-3'), 'heroes');
  assert.equal(categoryOfSlot('module-0'), 'modules');
  assert.equal(categoryOfSlot('hero-x'), null);
  assert.equal(categoryOfSlot('__proto__'), null);
});

test('knownValues écarte les identifiants absents du catalogue', () => {
  assert.deepEqual(
    knownValues({ scenario: 'rhino', 'hero-0': 'rocket-renomme', 'hero-1': 42, intrus: 'thor' }, content),
    { scenario: 'rhino' },
  );
  assert.deepEqual(knownValues(null, content), {});
});

test('sanitize : état corrompu ou périmé → état utilisable', () => {
  const state = sanitize({
    players: '9',
    moduleCount: 0,
    values: { scenario: 'rhino', 'hero-0': 'heros-supprime' },
    locked: { scenario: true, 'hero-0': true, mode: 'oui' },
    excluded: { heroes: ['thor', 12] },
  }, content);
  assert.equal(state.players, 4);
  assert.equal(state.moduleCount, 1);
  assert.deepEqual(state.values, { scenario: 'rhino' });
  assert.deepEqual(state.locked, { scenario: true });
  assert.deepEqual(state.excluded.heroes, ['thor']);
});

test('lien partagé : aller-retour encode → decode', () => {
  const state = {
    players: 2, moduleCount: 1, uniqueAspects: true,
    values: { scenario: 'klaw', 'module-0': 'bomb', mode: 'expert', 'hero-0': 'thor', 'aspect-0': 'justice', 'hero-1': 'hulk', 'aspect-1': 'protection' },
  };
  assert.deepEqual(decodeGame(encodeGame(state), content), {
    players: 2, moduleCount: 1, uniqueAspects: true, values: state.values,
  });
});

test('lien partagé trafiqué : doublons et identifiants inconnus écartés', () => {
  const game = decodeGame(code({
    p: 2, m: 2, u: 1,
    v: { 'hero-0': 'thor', 'hero-1': 'thor', 'module-0': 'bomb', 'module-1': 'bomb', 'aspect-0': 'justice', 'aspect-1': 'justice', scenario: '<script>' },
  }), content);
  assert.deepEqual(game.values, { 'hero-0': 'thor', 'module-0': 'bomb', 'aspect-0': 'justice' });
});

test('lien partagé : affinités en double conservées si autorisées', () => {
  const game = decodeGame(code({ p: 2, m: 1, u: 0, v: { 'aspect-0': 'justice', 'aspect-1': 'justice' } }), content);
  assert.deepEqual(game.values, { 'aspect-0': 'justice', 'aspect-1': 'justice' });
});

test('lien partagé invalide → null', () => {
  assert.equal(decodeGame('pas-du-base64!!', content), null);
  assert.equal(decodeGame(code({ p: 7, m: 1, v: {} }), content), null);
  assert.equal(decodeGame(code(null), content), null);
});

test('sanitize : collectionReady repris des états enregistrés avant son ajout', () => {
  assert.equal(sanitize({}, content).collectionReady, false);
  assert.equal(sanitize({ excluded: { heroes: ['thor'] } }, content).collectionReady, true);
  assert.equal(sanitize({ values: { scenario: 'rhino' } }, content).collectionReady, true);
  assert.equal(sanitize({ collectionReady: false, values: { scenario: 'rhino' } }, content).collectionReady, false);
  assert.equal(sanitize({ collectionReady: true }, content).collectionReady, true);
});

test('identifiant renommé : repris dans la collection et le tirage enregistrés', () => {
  const renamedContent = { ...content, modules: [{ id: 'milices-kree' }] };
  const state = sanitize({ excluded: { modules: ['milice-kree'] }, values: { 'module-0': 'milice-kree' } }, renamedContent);
  assert.deepEqual(state.excluded.modules, ['milices-kree']);
  assert.deepEqual(state.values, { 'module-0': 'milices-kree' });
});
