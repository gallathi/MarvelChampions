// Étape 1 : la collection du joueur et la configuration de la partie.

import { CATEGORIES, COLLECTABLE, MAX_MODULES, MAX_PLAYERS } from '../config.js';
import { validatePools } from '../draw.js';
import { bump, esc, srcsetOf, stagger, thumbSrc, toast } from '../dom.js';
import { icons } from '../icons.js';

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

function segmented(name, legend, max, current) {
  return `
    <fieldset class="segmented">
      <legend class="field-label">${legend}</legend>
      <div class="segmented__options">
        <span class="segmented__indicator" aria-hidden="true"></span>
        ${range(max).map((n) => `
          <label class="segmented__option">
            <input type="radio" name="${name}" value="${n}" ${n === current ? 'checked' : ''}>
            <span>${n}</span>
          </label>`).join('')}
      </div>
    </fieldset>`;
}

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

export function renderCollection(root, app, signal) {
  const { content, state } = app;

  root.innerHTML = `
    <section class="view view--collection" aria-labelledby="view-title">
      <div class="intro">
        <p class="eyebrow">Étape 1</p>
        <h1 id="view-title" class="display" tabindex="-1">Votre collection</h1>
        <p class="lead">Indiquez le matériel que vous possédez et réglez la partie.
          Vos choix sont mémorisés sur cet appareil.</p>
      </div>

      <div class="panel setup">
        ${segmented('players', 'Joueurs', MAX_PLAYERS, state.players)}
        ${segmented('moduleCount', 'Modules de rencontre', MAX_MODULES, state.moduleCount)}
        <label class="switch">
          <input type="checkbox" name="uniqueAspects" ${state.uniqueAspects ? 'checked' : ''}>
          <span class="switch__track" aria-hidden="true"></span>
          <span><span class="field-label">Affinités toutes différentes</span>
            <span class="switch__hint">Deux joueurs ne peuvent pas avoir la même affinité</span></span>
        </label>
        <label class="switch">
          <input type="checkbox" name="favorUnplayed" ${state.favorUnplayed ? 'checked' : ''}>
          <span class="switch__track" aria-hidden="true"></span>
          <span><span class="field-label">Favoriser les moins joués</span>
            <span class="switch__hint">Héros et méchants rarement joués sortent plus souvent</span></span>
        </label>
      </div>

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

  root.addEventListener('click', (event) => {
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
      else app.go('#/partie');
    }
  }, { signal });

  root.addEventListener('change', (event) => {
    const { name, value, checked } = event.target;
    if (name === 'players' || name === 'moduleCount') {
      app.update((s) => { s[name] = Number(value); });
    } else if (name === 'uniqueAspects' || name === 'favorUnplayed') {
      app.update((s) => { s[name] = checked; });
      if (name === 'favorUnplayed' && checked && !app.history.length) {
        toast('Enregistrez vos parties (bouton « On joue ! ») pour que cette option ait de l’effet.');
      }
    }
    refresh();
  }, { signal });

  // Sliders : on peut aussi faire glisser la pastille du doigt ou à la souris
  for (const track of root.querySelectorAll('.segmented__options')) {
    const options = [...track.querySelectorAll('.segmented__option')];
    const pick = (x) => {
      const target = options.find((o) => x < o.getBoundingClientRect().right) ?? options.at(-1);
      const input = target.querySelector('input');
      if (!input.checked) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
    track.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }, { signal });
    track.addEventListener('pointermove', (event) => {
      if (track.hasPointerCapture(event.pointerId)) pick(event.clientX);
    }, { signal });
    const stop = (event) => {
      if (track.hasPointerCapture(event.pointerId)) {
        pick(event.clientX);
        track.releasePointerCapture(event.pointerId);
      }
      track.classList.remove('is-dragging');
    };
    track.addEventListener('pointerup', stop, { signal });
    track.addEventListener('pointercancel', stop, { signal });
  }

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
