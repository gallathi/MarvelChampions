// Étape 2 : le tirage de la partie.

import { ASPECT_COLORS, CATEGORIES } from '../config.js';
import { roll, takenValues, validatePools } from '../draw.js';
import { bump, comicBurst, esc, reducedMotion, srcsetOf, stagger, thumbSrc, toast } from '../dom.js';
import { icons } from '../icons.js';
import { shareUrl } from '../share.js';

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slotLabel(slot) {
  switch (slot.category) {
    case 'scenarios': return 'Scénario';
    case 'modules': return `Module ${slot.index + 1}`;
    case 'modes': return 'Difficulté';
    case 'heroes': return `Héros du joueur ${slot.index + 1}`;
    case 'aspects': return `Affinité du joueur ${slot.index + 1}`;
    default: return CATEGORIES[slot.category].singular;
  }
}

let slotIndex = 0;

function slotHtml(slot) {
  const label = slotLabel(slot);
  return `
    <article class="slot slot--${slot.category}" data-key="${slot.key}" ${stagger(slotIndex++, 12)}>
      <div class="slot__media">
        <img class="slot__img" alt="" sizes="${slot.category === 'scenarios'
          ? '(max-width: 760px) 92vw, 640px'
          : '(max-width: 640px) 46vw, 340px'}" hidden>
        <span class="slot__tag" data-role="tag" hidden></span>
        <div class="slot__empty" aria-hidden="true">
          <span class="slot__q">?</span>
          <span class="slot__empty-label">${esc(CATEGORIES[slot.category].singular)} aléatoire</span>
        </div>
        <div class="slot__actions">
          <button type="button" class="icon-btn icon-btn--overlay" data-action="lock" aria-pressed="false"
                  aria-label="Verrouiller : ${esc(label)}" title="Verrouiller">${icons.unlock}</button>
          <button type="button" class="icon-btn icon-btn--overlay" data-action="reroll"
                  aria-label="Relancer : ${esc(label)}" title="Relancer">${icons.reroll}</button>
        </div>
      </div>
      <label class="visually-hidden" for="sel-${slot.key}">${esc(label)}</label>
      <select id="sel-${slot.key}" class="select" data-role="select"></select>
    </article>`;
}

export function renderGame(root, app, signal) {
  const { state } = app;
  const slots = app.slots();
  const slotByKey = new Map(slots.map((s) => [s.key, s]));

  // Nettoie les emplacements qui n'existent plus (nombre de joueurs/modules réduit)
  app.update((s) => {
    for (const key of Object.keys(s.values)) if (!slotByKey.has(key)) delete s.values[key];
    for (const key of Object.keys(s.locked)) if (!slotByKey.has(key) || !s.values[key]) delete s.locked[key];
  });

  const of = (cat) => slots.filter((s) => s.category === cat);
  slotIndex = 0;
  const players = of('heroes').map((hero) => ({ hero, aspect: slotByKey.get(`aspect-${hero.index}`) }));

  root.innerHTML = `
    <section class="view view--game" aria-labelledby="view-title">
      <div class="intro intro--row">
        <div>
          <p class="eyebrow">Étape 2</p>
          <h1 id="view-title" class="display" tabindex="-1">Votre partie</h1>
          <p class="lead">${plural(state.players, 'joueur')} · ${plural(state.moduleCount, 'module')}.
            Verrouillez ce que vous voulez garder, puis lancez les dés
            <kbd>R</kbd>.</p>
        </div>
        <div class="toolbar">
          <button type="button" class="btn btn--primary btn--lg" data-action="roll-all">${icons.dice} Tout tirer</button>
          <button type="button" class="btn btn--gold" data-action="record">${icons.play} <span data-role="record-label">On joue !</span></button>
          <div class="toolbar__secondary">
            <button type="button" class="btn btn--ghost" data-action="reset" title="Réinitialiser">${icons.reset}<span class="btn__label">Réinitialiser</span></button>
            <button type="button" class="btn btn--ghost" data-action="share" title="Partager">${icons.share}<span class="btn__label">Partager</span></button>
          </div>
        </div>
      </div>

      <div class="notice" data-role="problems" hidden></div>

      <section class="zone" aria-labelledby="zone-villain">
        <h2 id="zone-villain" class="zone__title">Le méchant</h2>
        <div class="villain">
          <div class="villain__main">${of('scenarios').map(slotHtml).join('')}</div>
          <div class="villain__side">
            ${of('modules').map(slotHtml).join('')}
            ${of('modes').map(slotHtml).join('')}
          </div>
        </div>
      </section>

      <section class="zone" aria-labelledby="zone-heroes">
        <h2 id="zone-heroes" class="zone__title">Les héros</h2>
        <div class="players players--${state.players}">
          ${players.map(({ hero, aspect }) => `
            <article class="player">
              <header class="player__head">
                <span class="player__num">${hero.index + 1}</span> Joueur ${hero.index + 1}
              </header>
              <div class="player__slots">${slotHtml(hero)}${slotHtml(aspect)}</div>
            </article>`).join('')}
        </div>
      </section>
    </section>`;

  const slotEls = new Map([...root.querySelectorAll('.slot')].map((el) => [el.dataset.key, el]));
  const playCounts = { heroes: app.playCounts('heroes'), scenarios: app.playCounts('scenarios') };
  let busy = false;

  function syncSlot(key) {
    const slot = slotByKey.get(key);
    const el = slotEls.get(key);
    const pools = app.pools();
    const value = state.values[key];
    const locked = Boolean(state.locked[key]);
    const item = value ? app.item(slot.category, value) : null;

    // Liste déroulante : collection possédée + valeur courante (ex. partie partagée)
    const taken = takenValues(slots, state.values, slot);
    const ids = pools[slot.category].includes(value) || !value
      ? pools[slot.category]
      : [value, ...pools[slot.category]];
    const select = el.querySelector('[data-role="select"]');
    select.innerHTML = `<option value="">🎲 Aléatoire</option>${ids.map((id) => {
      const it = app.item(slot.category, id);
      return `<option value="${esc(id)}" ${taken.has(id) ? 'disabled' : ''}>${esc(it.name)}</option>`;
    }).join('')}`;
    select.value = value ?? '';

    const img = el.querySelector('.slot__img');
    if (item) {
      const src = thumbSrc(item, 800);
      if (img.getAttribute('src') !== src) {
        img.srcset = srcsetOf(item);
        img.src = src;
      }
      img.alt = item.name;
    }
    img.hidden = !item;
    el.querySelector('.slot__empty').hidden = Boolean(item);

    el.classList.toggle('is-locked', locked);
    el.classList.toggle('is-filled', Boolean(item));
    if (slot.category === 'aspects') el.style.setProperty('--accent', ASPECT_COLORS[value] ?? '');

    const lockBtn = el.querySelector('[data-action="lock"]');
    lockBtn.setAttribute('aria-pressed', String(locked));
    lockBtn.disabled = !item;
    lockBtn.title = locked ? 'Déverrouiller' : 'Verrouiller';
    lockBtn.innerHTML = locked ? icons.lock : icons.unlock;
    el.querySelector('[data-action="reroll"]').disabled = locked;

    // Badge « jamais joué / joué N× » une fois l'historique commencé
    const tag = el.querySelector('[data-role="tag"]');
    const counts = item && app.history.length ? playCounts[slot.category] : null;
    if (counts) {
      const plays = counts.get(value)?.plays ?? 0;
      tag.textContent = plays ? `Joué ${plays}×` : (slot.category === 'heroes' ? 'Jamais joué' : 'Jamais affronté');
      tag.classList.toggle('slot__tag--new', !plays);
    }
    tag.hidden = !counts;
  }

  function syncRecord() {
    const button = root.querySelector('[data-action="record"]');
    const complete = slots.every((s) => state.values[s.key]);
    const saved = complete && app.isSaved();
    button.disabled = !complete || saved;
    button.classList.toggle('is-saved', saved);
    button.querySelector('.icon').outerHTML = saved ? icons.check : icons.play;
    button.querySelector('[data-role="record-label"]').textContent = saved ? 'Enregistrée' : 'On joue !';
    button.title = complete ? '' : 'Tirez tous les éléments avant de lancer la partie';
  }

  function syncAll() {
    for (const key of slotEls.keys()) syncSlot(key);
    syncRecord();
    const problems = validatePools(app.pools(), state);
    const notice = root.querySelector('[data-role="problems"]');
    notice.hidden = problems.length === 0;
    notice.innerHTML = problems.length
      ? `${icons.alert}<span>${esc(problems.join(' '))}</span>
         <a class="btn btn--ghost btn--sm" href="#/collection">Modifier ma collection</a>`
      : '';
  }

  /** Révèle les nouvelles valeurs avec un retournement de carte. */
  async function reveal(keys) {
    if (reducedMotion() || !Element.prototype.animate) {
      syncAll();
      return;
    }
    await Promise.all(keys.map(async (key, i) => {
      const slot = slotByKey.get(key);
      const item = state.values[key] ? app.item(slot.category, state.values[key]) : null;
      const media = slotEls.get(key).querySelector('.slot__media');
      const preload = item ? new Image() : null;
      if (preload) preload.src = thumbSrc(item, 800);
      await Promise.all([preload?.decode().catch(() => {}), wait(i * 70)]);
      await media.animate(
        [{ transform: 'perspective(900px) rotateY(0)' }, { transform: 'perspective(900px) rotateY(90deg)' }],
        { duration: 160, easing: 'ease-in' },
      ).finished;
      syncSlot(key);
      await media.animate(
        [{ transform: 'perspective(900px) rotateY(-90deg)' }, { transform: 'perspective(900px) rotateY(0)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1.25)' },
      ).finished;
    }));
    syncAll();
  }

  async function drawSlots(targets, { avoidRepeat = false, celebrate = false } = {}) {
    if (busy) return;
    if (!targets.length) {
      toast('Tout est verrouillé : déverrouillez un élément pour le tirer à nouveau.');
      return;
    }
    busy = true;
    root.classList.add('is-busy');
    const result = roll({
      slots, values: state.values, pools: app.pools(), targets, avoidRepeat, weights: app.weights(),
    });
    app.update((s) => { s.values = result.values; });
    if (result.missing.length) {
      toast('Pas assez de matériel dans votre collection pour tout tirer.', 'error');
    }
    try {
      await reveal(targets.filter((k) => !result.missing.includes(k)));
      if (celebrate && !result.missing.length) comicBurst();
    } finally {
      syncAll();
      busy = false;
      root.classList.remove('is-busy');
    }
  }

  const rollAll = () =>
    drawSlots(slots.filter((s) => !state.locked[s.key]).map((s) => s.key), { celebrate: true });

  function record() {
    const entry = app.recordGame();
    playCounts.heroes = app.playCounts('heroes');
    playCounts.scenarios = app.playCounts('scenarios');
    syncAll();
    comicBurst('RASSEMBLEMENT !');
    toast('Partie enregistrée. Indiquez le résultat dans l’historique.', 'success', {
      action: { label: 'Annuler', onClick: () => {
        app.updateHistory((h) => h.filter((g) => g.id !== entry.id));
        app.update((st) => { st.lastSaved = null; });
        playCounts.heroes = app.playCounts('heroes');
        playCounts.scenarios = app.playCounts('scenarios');
        if (!signal.aborted) syncAll();
      } },
    });
  }

  async function share() {
    if (!Object.keys(state.values).length) {
      toast('Tirez une partie avant de la partager.');
      return;
    }
    const url = shareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      toast('Lien de la partie copié dans le presse-papiers.', 'success');
    } catch {
      const dialog = document.getElementById('share-dialog');
      const input = dialog.querySelector('input');
      input.value = url;
      dialog.showModal();
      input.select();
    }
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const key = button.closest('.slot')?.dataset.key;
    switch (button.dataset.action) {
      case 'roll-all': rollAll(); break;
      case 'record': record(); break;
      case 'reroll': drawSlots([key], { avoidRepeat: true }); break;
      case 'lock':
        app.update((s) => {
          if (s.locked[key]) delete s.locked[key];
          else s.locked[key] = true;
        });
        syncSlot(key);
        bump(button);
        break;
      case 'reset':
        app.update((s) => { s.values = {}; s.locked = {}; });
        syncAll();
        toast('Partie réinitialisée.');
        break;
      case 'share': share(); break;
    }
  }, { signal });

  root.addEventListener('change', (event) => {
    if (event.target.dataset.role !== 'select') return;
    const key = event.target.closest('.slot').dataset.key;
    const { value } = event.target;
    app.update((s) => {
      if (value) {
        s.values[key] = value;
        s.locked[key] = true; // un choix manuel est conservé lors des tirages suivants
      } else {
        delete s.values[key];
        delete s.locked[key];
      }
    });
    reveal([key]);
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'r' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, select, textarea, dialog')) return;
    event.preventDefault();
    rollAll();
  }, { signal });

  syncAll();
}
