// Étape 1 : le matériel que possède le joueur.

import { CATEGORIES, COLLECTABLE } from '../config.js';
import { validatePools } from '../draw.js';
import { bump, esc, srcsetOf, stagger, thumbSrc, toast } from '../dom.js';
import { EXTENSIONS, extensionItems } from '../extensions.js';
import { icons } from '../icons.js';

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function playsLabel(plays) {
  if (plays === undefined) return '';
  return plays ? `${plays} partie${plays > 1 ? 's' : ''}` : 'Jamais joué';
}

function tile(item, owned, i, plays) {
  return `
    <button type="button" class="tile" data-id="${esc(item.id)}" data-search="${esc(normalize(item.name))}"
            aria-pressed="${owned}" ${stagger(i)}>
      <span class="tile__media">
        <img src="${esc(thumbSrc(item))}" srcset="${esc(srcsetOf(item))}"
             sizes="(max-width: 640px) 45vw, 220px" alt="" loading="lazy" decoding="async" width="1169" height="886">
      </span>
      <span class="tile__body">
        <span class="tile__name">${esc(item.name)}</span>
        ${plays === undefined ? '' : `<span class="tile__meta ${plays ? '' : 'tile__meta--new'}">${playsLabel(plays)}</span>`}
      </span>
      <span class="tile__check">${icons.check}</span>
    </button>`;
}

function shelf(cat, app) {
  const { content, state } = app;
  // Le compteur de parties n'apparaît qu'une fois l'historique commencé
  const counts = app.history.length && (cat === 'heroes' || cat === 'scenarios') ? app.playCounts(cat) : null;
  return `
    <section class="shelf" data-cat="${cat}" aria-labelledby="shelf-${cat}">
      <header class="shelf__head">
        <h2 id="shelf-${cat}" class="shelf__title">${CATEGORIES[cat].label}
          <span class="shelf__count" data-count></span>
        </h2>
        <div class="shelf__actions">
          <button type="button" class="btn btn--ghost btn--sm" data-action="all">Tout</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="none">Aucun</button>
        </div>
      </header>
      <div class="tiles">
        ${content[cat].map((item, i) => tile(
          item, !state.excluded[cat].includes(item.id), i, counts ? (counts.get(item.id)?.plays ?? 0) : undefined,
        )).join('')}
      </div>
    </section>`;
}

function extensionCard(ext, app, i) {
  const cover = app.content.extensions?.find((item) => item.id === ext.id);
  const summary = extensionItems(ext)
    .map(([cat, ids]) => `${ids.length} ${(ids.length > 1 ? CATEGORIES[cat].label : CATEGORIES[cat].singular).toLowerCase()}`)
    .join(' · ');
  return `
    <button type="button" class="ext" role="checkbox" aria-checked="false" data-ext="${esc(ext.id)}" ${stagger(i)}>
      <span class="ext__media" ${cover ? `style="--cover: url('${esc(new URL(thumbSrc(cover), document.baseURI).href)}')"` : ''}>${cover
        ? `<img src="${esc(thumbSrc(cover))}" srcset="${esc(srcsetOf(cover))}"
             sizes="(max-width: 640px) 46vw, 200px" alt="" loading="lazy" decoding="async">`
        : ''}</span>
      <span class="ext__body">
        <span class="ext__name">${esc(ext.name)}</span>
        <span class="ext__meta">${summary}</span>
      </span>
      <span class="ext__count" data-count></span>
      <span class="ext__check" aria-hidden="true">${icons.check}<span class="ext__dash"></span></span>
    </button>`;
}

export function renderCollection(root, app, signal) {
  const { content, state } = app;

  root.innerHTML = `
    <section class="view view--collection" aria-labelledby="view-title">
      <div class="intro">
        <p class="eyebrow">Étape 1</p>
        <h1 id="view-title" class="display" tabindex="-1">Votre collection</h1>
        <p class="lead">Cochez les boîtes que vous possédez, puis ajustez carte par carte si besoin
          (héros vendus seuls, extension incomplète…). Vos choix sont mémorisés sur cet appareil.</p>
      </div>

      <section class="extensions" aria-labelledby="extensions-title">
        <h2 id="extensions-title" class="shelf__title">Extensions</h2>
        <div class="ext-grid">${EXTENSIONS.map((ext, i) => extensionCard(ext, app, i)).join('')}</div>
      </section>

      <div class="search">
        ${icons.search}
        <input type="search" class="search__input" placeholder="Rechercher un héros, un méchant…"
               aria-label="Rechercher dans la collection" autocomplete="off">
      </div>

      ${COLLECTABLE.map((cat) => shelf(cat, app)).join('')}
      <p class="empty-search" hidden>Aucun résultat pour cette recherche.</p>
    </section>

    <div class="cta-bar">
      <div class="cta-bar__inner">
        <div class="cta-bar__status" aria-live="polite"></div>
        <button type="button" class="btn btn--primary" data-action="go">
          Préparer la partie ${icons.arrowRight}
        </button>
      </div>
    </div>`;

  const status = root.querySelector('.cta-bar__status');
  const goButton = root.querySelector('[data-action="go"]');

  function refresh() {
    const pools = app.pools();
    for (const cat of COLLECTABLE) {
      const counter = root.querySelector(`.shelf[data-cat="${cat}"] [data-count]`);
      const text = `${pools[cat].length} / ${content[cat].length}`;
      if (counter.textContent !== text) {
        if (counter.textContent) bump(counter);
        counter.textContent = text;
      }
    }
    const problems = validatePools(pools, state);
    goButton.setAttribute('aria-disabled', String(problems.length > 0));
    status.innerHTML = problems.length
      ? `<span class="status status--warn">${icons.alert} ${esc(problems[0])}</span>`
      : `<span class="status">${COLLECTABLE.map((cat) =>
          `<strong>${pools[cat].length}</strong> ${CATEGORIES[cat].label.toLowerCase()}`).join(' · ')}</span>`;
    for (const ext of EXTENSIONS) {
      const items = extensionItems(ext).flatMap(([cat, ids]) => ids.map((id) => pools[cat].includes(id)));
      const owned = items.filter(Boolean).length;
      const card = root.querySelector(`.ext[data-ext="${CSS.escape(ext.id)}"]`);
      card.setAttribute('aria-checked', owned === items.length ? 'true' : owned ? 'mixed' : 'false');
      card.querySelector('[data-count]').textContent = owned && owned < items.length ? `${owned}/${items.length}` : '';
    }
    app.refreshNav();
  }

  function setOwned(cat, ids, owned) {
    app.update((s) => {
      const excluded = new Set(s.excluded[cat]);
      for (const id of ids) owned ? excluded.delete(id) : excluded.add(id);
      s.excluded[cat] = [...excluded];
    });
    for (const id of ids) {
      root.querySelector(`.shelf[data-cat="${cat}"] .tile[data-id="${CSS.escape(id)}"]`)
        ?.setAttribute('aria-pressed', String(owned));
    }
    refresh();
  }

  function toggleExtension(card) {
    const ext = EXTENSIONS.find((e) => e.id === card.dataset.ext);
    // Partielle ou absente : on coche tout ; complète : on décoche tout
    const owned = card.getAttribute('aria-checked') !== 'true';
    for (const [cat, ids] of extensionItems(ext)) setOwned(cat, ids, owned);
    bump(card.querySelector('.ext__check'));
  }

  root.addEventListener('click', (event) => {
    const extEl = event.target.closest('.ext');
    if (extEl) {
      toggleExtension(extEl);
      return;
    }
    const tileEl = event.target.closest('.tile');
    if (tileEl) {
      const cat = tileEl.closest('.shelf').dataset.cat;
      setOwned(cat, [tileEl.dataset.id], tileEl.getAttribute('aria-pressed') !== 'true');
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'all' || action === 'none') {
      const shelfEl = event.target.closest('.shelf');
      // « Tout / Aucun » ne s'applique qu'aux éléments visibles (respecte la recherche)
      const ids = [...shelfEl.querySelectorAll('.tile:not([hidden])')].map((t) => t.dataset.id);
      setOwned(shelfEl.dataset.cat, ids, action === 'all');
    } else if (action === 'go') {
      const problems = validatePools(app.pools(), state);
      if (problems.length) toast(problems[0], 'error');
      else {
        app.update((s) => { s.collectionReady = true; });
        app.go('#/partie');
      }
    }
  }, { signal });

  root.querySelector('.search__input').addEventListener('input', (event) => {
    const query = normalize(event.target.value.trim());
    let visible = 0;
    for (const shelfEl of root.querySelectorAll('.shelf')) {
      let shelfVisible = 0;
      for (const t of shelfEl.querySelectorAll('.tile')) {
        t.hidden = !t.dataset.search.includes(query);
        if (!t.hidden) shelfVisible++;
      }
      shelfEl.hidden = shelfVisible === 0;
      visible += shelfVisible;
    }
    root.querySelector('.empty-search').hidden = visible > 0;
  }, { signal });

  refresh();
}
