import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EXTENSIONS, extensionItems } from '../public/js/extensions.js';

const content = JSON.parse(await readFile(new URL('../public/data/content.json', import.meta.url), 'utf8'));

test('extensions : chaque identifiant existe au catalogue', () => {
  for (const ext of EXTENSIONS) {
    for (const [cat, ids] of extensionItems(ext)) {
      for (const id of ids) {
        assert.ok(content[cat].some((item) => item.id === id), `${ext.name} : "${id}" absent de ${cat}`);
      }
    }
  }
});

test('extensions : un élément n’appartient qu’à une seule boîte', () => {
  const seen = new Map();
  for (const ext of EXTENSIONS) {
    for (const [cat, ids] of extensionItems(ext)) {
      for (const id of ids) {
        const key = `${cat}/${id}`;
        assert.ok(!seen.has(key), `${key} présent dans ${seen.get(key)} et ${ext.name}`);
        seen.set(key, ext.name);
      }
    }
  }
});

test('extensions : identifiants uniques et image de couverture (premier scénario)', () => {
  assert.equal(new Set(EXTENSIONS.map((e) => e.id)).size, EXTENSIONS.length);
  for (const ext of EXTENSIONS) assert.ok(ext.scenarios?.length, `${ext.name} sans scénario`);
});

test('extensions : chaque boîte a son illustration (images/extensions/<id>.webp)', () => {
  for (const ext of EXTENSIONS) {
    assert.ok(content.extensions.some((item) => item.id === ext.id), `${ext.name} : illustration manquante`);
  }
});
