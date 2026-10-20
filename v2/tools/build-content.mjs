// 1. Convertit en WebP toute image JPEG/PNG/AVIF de public/images (l'original est supprimé).
// 2. Génère les miniatures WebP et public/data/content.json.
// Le nom de chaque fichier (sans extension) devient le libellé affiché :
// pour ajouter un héros, déposer "images/heros/Wolverine.jpg" puis relancer `npm run content`.

import { readdir, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const TO_CONVERT = new Set(['.jpg', '.jpeg', '.png', '.avif']);

// Largeurs des miniatures : 400 pour les grilles et listes, 800 pour les cartes de la partie
const THUMB_WIDTHS = [400, 800];
const THUMB_QUALITY = 74;
const FULL_QUALITY = 82;

// clé du catalogue -> dossier dans public/images
const CATEGORIES = {
  scenarios: 'scenarios',
  modules: 'modules',
  heroes: 'heros',
  modes: 'modes',
  aspects: 'affinites',
  extensions: 'extensions', // illustrations des boîtes, nommées d'après l'identifiant de public/js/extensions.js
};

// Ordre imposé quand l'ordre alphabétique n'a pas de sens
const FIXED_ORDER = {
  modes: ['standard', 'expert'],
};

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const mtime = (path) => stat(path).then((s) => s.mtimeMs, () => 0);

/** Crée la miniature si elle n'existe pas ou si l'image source est plus récente. */
async function makeThumb(source, target, width) {
  if ((await mtime(target)) >= (await mtime(source))) return false;
  await mkdir(dirname(target), { recursive: true });
  await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY, effort: 5 })
    .toFile(target);
  return true;
}

let generated = 0;
let converted = 0;

/** Remplace chaque image non WebP de l'arborescence par sa version WebP pleine taille. */
async function convertToWebp(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      await convertToWebp(path);
    } else if (TO_CONVERT.has(extname(entry.name).toLowerCase())) {
      const target = `${dir}/${basename(entry.name, extname(entry.name))}.webp`;
      await sharp(path).webp({ quality: FULL_QUALITY, effort: 5 }).toFile(target);
      await rm(path);
      converted++;
    }
  }
}

await convertToWebp(`${PUBLIC_DIR}images`);

async function scan(key, dir) {
  const files = await readdir(`${PUBLIC_DIR}images/${dir}`, { withFileTypes: true });
  const items = [];
  for (const f of files) {
    if (!f.isFile() || extname(f.name).toLowerCase() !== '.webp') continue;
    const name = basename(f.name, extname(f.name)).normalize('NFC');
    const thumbs = {};
    for (const width of THUMB_WIDTHS) {
      const path = `thumbs/${width}/${dir}/${name}.webp`;
      if (await makeThumb(`${PUBLIC_DIR}images/${dir}/${f.name}`, `${PUBLIC_DIR}${path}`, width)) generated++;
      thumbs[width] = path;
    }
    items.push({ id: slugify(name), name, image: `images/${dir}/${f.name.normalize('NFC')}`, thumbs });
  }
  items.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const order = FIXED_ORDER[key];
  if (order) items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Identifiant en double dans ${dir}/ : "${item.id}"`);
    seen.add(item.id);
  }
  return items;
}

const content = {};
for (const [key, dir] of Object.entries(CATEGORIES)) {
  content[key] = await scan(key, dir);
}

// Supprime les miniatures orphelines (image source renommée ou retirée)
const expected = new Set(Object.keys(CATEGORIES).flatMap((k) => content[k].flatMap((i) => Object.values(i.thumbs))));
for (const width of THUMB_WIDTHS) {
  for (const dir of Object.values(CATEGORIES)) {
    const folder = `${PUBLIC_DIR}thumbs/${width}/${dir}`;
    for (const file of await readdir(folder).catch(() => [])) {
      const path = `thumbs/${width}/${dir}/${file}`;
      if (!expected.has(path.normalize('NFC'))) await rm(`${PUBLIC_DIR}${path}`);
    }
  }
}

await mkdir(`${PUBLIC_DIR}data`, { recursive: true });
await writeFile(`${PUBLIC_DIR}data/content.json`, JSON.stringify(content, null, 2) + '\n');

const summary = Object.keys(CATEGORIES).map((k) => `${content[k].length} ${k}`).join(', ');
console.log(`content.json généré : ${summary} (${converted} image(s) convertie(s) en WebP, ${generated} miniature(s) créée(s))`);
