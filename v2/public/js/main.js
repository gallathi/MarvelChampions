import { CATEGORIES, COLLECTABLE } from './config.js';
import { newlyUnlocked } from './achievements.js';
import { buildSlots } from './draw.js';
import { bump, comicBurst, confirmDialog, reducedMotion, toast } from './dom.js';
import {
  HISTORY_KEY, drawSignature, entryFromValues, favorWeight, loadHistory, playCounts, readStoredHistory, saveHistory,
} from './history.js';
import { icons } from './icons.js';
import { decodeGame } from './share.js';
import { STATE_KEY, loadState, saveState } from './store.js';
import { renderCollection } from './views/collection.js';
import { renderGame } from './views/game.js';
import { renderHistory } from './views/history.js';

const root = document.getElementById('view');
const VIEWS = {
  collection: { render: renderCollection, title: 'Collection' },
  game: { render: renderGame, title: 'Partie' },
  history: { render: renderHistory, title: 'Historique' },
};
const ORDER = Object.keys(VIEWS);
const HASHES = { collection: '#/collection', game: '#/partie', history: '#/historique' };
let controller = null;
let currentView = null;

/** Place la pastille du slider sous l'onglet actif. */
function placeIndicator({ animate = true } = {}) {
  const tabs = document.querySelector('.tabs');
  const active = tabs.querySelector('[aria-current="page"]');
  if (!active) return;
  tabs.classList.toggle('no-anim', !animate);
  tabs.style.setProperty('--ind-x', `${active.offsetLeft}px`);
  tabs.style.setProperty('--ind-y', `${active.offsetTop}px`);
  tabs.style.setProperty('--ind-w', `${active.offsetWidth}px`);
  tabs.style.setProperty('--ind-h', `${active.offsetHeight}px`);
  tabs.classList.add('is-ready');
  if (!animate) requestAnimationFrame(() => tabs.classList.remove('no-anim'));
}

async function loadContent() {
  const response = await fetch('data/content.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function createApp(content) {
  const state = loadState(content);
  let playedGames = loadHistory();
  const index = Object.fromEntries(
    Object.keys(CATEGORIES).map((cat) => [cat, new Map(content[cat].map((item) => [item.id, item]))]),
  );

  return {
    content,
    state,
    get history() { return playedGames; },
    update(mutate) {
      mutate(state);
      saveState(state);
    },
    updateHistory(mutate) {
      // Relit le stockage avant d'écrire : un autre onglet a pu enregistrer une partie entre-temps
      const before = readStoredHistory() ?? playedGames;
      playedGames = mutate(before) ?? before;
      saveHistory(playedGames);
      this.refreshNav();
      window.dispatchEvent(new CustomEvent('history-change'));
      announceAchievements(newlyUnlocked(before, playedGames, { heroes: this.pools().heroes }));
    },
    /** Recharge état et historique écrits par un autre onglet (l'objet `state` est mis à jour sur place). */
    reloadFromStorage() {
      const fresh = loadState(content);
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, fresh);
      playedGames = loadHistory();
    },
    item: (cat, id) => index[cat].get(id),
    slots: () => buildSlots(state),
    /** Identifiants possédés par catégorie (difficultés et affinités : toutes). */
    pools() {
      return Object.fromEntries(Object.keys(CATEGORIES).map((cat) => [
        cat,
        content[cat].map((i) => i.id).filter((id) => !state.excluded[cat]?.includes(id)),
      ]));
    },
    playCounts: (category) => playCounts(playedGames, category),
    /** Poids de tirage si l'option « favoriser les moins joués » est active. */
    weights() {
      if (!state.favorUnplayed) return {};
      return Object.fromEntries(['heroes', 'scenarios'].map((cat) => {
        const counts = playCounts(playedGames, cat);
        return [cat, (id) => favorWeight(counts.get(id)?.plays ?? 0)];
      }));
    },
    isSaved: () => state.lastSaved === drawSignature(state.values),
    /** Enregistre le tirage courant dans l'historique. */
    recordGame() {
      const entry = entryFromValues(state.values, state);
      this.updateHistory((h) => [entry, ...h]);
      this.update((s) => { s.lastSaved = drawSignature(s.values); });
      return entry;
    },
    go(hash) {
      window.location.hash = hash;
    },
    refreshNav() {
      const pools = this.pools();
      const owned = COLLECTABLE.reduce((n, cat) => n + pools[cat].length, 0);
      const total = COLLECTABLE.reduce((n, cat) => n + content[cat].length, 0);
      document.querySelector('[data-role="owned-count"]').textContent = `${owned}/${total}`;
      const games = document.querySelector('[data-role="games-count"]');
      const text = playedGames.length ? String(playedGames.length) : '';
      if (games.textContent !== text) {
        games.textContent = text;
        bump(games);
      }
    },
  };
}

/** Célèbre les succès débloqués (après l'éventuelle onomatopée de l'action en cours). */
function announceAchievements(unlocked) {
  if (!unlocked.length) return;
  if (unlocked.length > 2) {
    toast(`${unlocked.length} succès débloqués !`, 'success');
    return;
  }
  unlocked.forEach((a, i) => {
    setTimeout(() => {
      toast(`🏅 Succès débloqué : ${a.title}`, 'success', { duration: 4500 });
      if (i === 0) comicBurst(unlocked.some((u) => u.meta) ? 'LÉGENDAIRE !' : 'SUCCÈS !');
    }, 1100 + i * 600);
  });
}

function viewFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#/partie')) return 'game';
  if (hash.startsWith('#/historique')) return 'history';
  return 'collection';
}

/** Affiche la vue demandée (sans animation de transition si `animate` est faux). */
function renderView(app, view, { animate }) {
  for (const link of document.querySelectorAll('[data-nav]')) {
    if (link.dataset.nav === view) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  placeIndicator({ animate });
  document.title = `${VIEWS[view].title} · Générateur Marvel Champions`;
  controller?.abort();
  controller = new AbortController();
  VIEWS[view].render(root, app, controller.signal);
  app.refreshNav();
}

/** Résumé lisible d'une partie partagée, pour la boîte de confirmation. */
function describeGame(app, game) {
  const name = (cat, id) => app.item(cat, id)?.name;
  const lines = [];
  if (game.values.scenario) {
    const mode = name('modes', game.values.mode);
    lines.push(`Méchant : ${name('scenarios', game.values.scenario)}${mode ? ` (${mode})` : ''}`);
  }
  for (let i = 0; i < game.players; i++) {
    const hero = name('heroes', game.values[`hero-${i}`]);
    const aspect = name('aspects', game.values[`aspect-${i}`]);
    if (hero) lines.push(`Joueur ${i + 1} : ${hero}${aspect ? ` · ${aspect}` : ''}`);
  }
  return lines;
}

/** Applique une partie reçue par lien, après confirmation si elle remplace un tirage en cours. */
async function applySharedGame(app, game) {
  const hasDraw = Object.keys(app.state.values).length > 0;
  const identical = JSON.stringify(app.state.values) === JSON.stringify(game.values);
  if (hasDraw && !identical) {
    const confirmed = await confirmDialog({
      title: 'Charger la partie partagée ?',
      message: 'Elle remplacera votre tirage actuel. Votre collection et votre historique ne changent pas.',
      details: describeGame(app, game),
      confirmLabel: 'Charger la partie',
      cancelLabel: 'Garder la mienne',
    });
    if (!confirmed) {
      toast('Lien ignoré : votre tirage actuel est conservé.');
      return;
    }
  }
  app.update((s) => Object.assign(s, game, { locked: {} }));
  renderView(app, 'game', { animate: false });
  toast('Partie partagée chargée.', 'success');
}

function route(app) {
  // Lien partagé : on nettoie l'adresse, on affiche la page, puis on propose de charger la partie
  const match = window.location.hash.match(/^#\/partie\/(.+)$/);
  let sharedGame;
  if (match) {
    window.history.replaceState(null, '', '#/partie');
    sharedGame = decodeGame(match[1], app.content);
    if (!sharedGame) toast('Ce lien de partie est invalide.', 'error');
  }

  const view = viewFromHash();
  const moveFocus = Boolean(currentView) && view !== currentView;
  // Sens du glissement : vers la droite si on avance dans les onglets, vers la gauche sinon
  if (moveFocus) {
    document.documentElement.dataset.nav = ORDER.indexOf(view) > ORDER.indexOf(currentView) ? 'next' : 'prev';
  }
  currentView = view;

  const render = () => {
    renderView(app, view, { animate: moveFocus });
    if (moveFocus) {
      window.scrollTo({ top: 0 });
      root.querySelector('#view-title')?.focus({ preventScroll: true });
    }
  };

  // Transition fluide entre les vues quand le navigateur le permet
  const transition = moveFocus && document.startViewTransition && !reducedMotion()
    ? document.startViewTransition(render)
    : (render(), null);

  if (sharedGame) {
    Promise.resolve(transition?.finished).finally(() => applySharedGame(app, sharedGame));
  }
}

for (const el of document.querySelectorAll('[data-icon]')) el.innerHTML = icons[el.dataset.icon];

try {
  const app = createApp(await loadContent());
  window.addEventListener('hashchange', () => route(app));
  // Un autre onglet a modifié la collection, le tirage ou l'historique : on se met à jour
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== STATE_KEY && event.key !== HISTORY_KEY) return;
    app.reloadFromStorage();
    if (currentView) renderView(app, currentView, { animate: false });
  });
  route(app);
} catch (error) {
  console.error(error);
  root.innerHTML = `
    <div class="panel load-error">
      <h1 class="display">Oups…</h1>
      <p>Impossible de charger le catalogue (<code>data/content.json</code>).
        Lancez le site via un serveur web (<code>npm run dev</code>) plutôt qu’en ouvrant le fichier directement.</p>
    </div>`;
}

if (!document.startViewTransition) document.documentElement.classList.add('no-vt');

// La pastille suit les changements de taille (polices chargées, rotation de l'écran...)
new ResizeObserver(() => placeIndicator({ animate: false })).observe(document.querySelector('.tabs'));

// Balayage horizontal sur mobile pour passer d'un onglet à l'autre
let touch = null;
root.addEventListener('touchstart', (event) => {
  const t = event.touches[0];
  touch = event.touches.length === 1 && !event.target.closest('input, select, textarea, dialog, .segmented')
    ? { x: t.clientX, y: t.clientY }
    : null;
}, { passive: true });
root.addEventListener('touchend', (event) => {
  if (!touch || !currentView) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  const next = ORDER[ORDER.indexOf(currentView) + (dx < 0 ? 1 : -1)];
  if (next) window.location.hash = HASHES[next];
}, { passive: true });

// Les en-têtes de rayon collent sous la barre du haut, dont la hauteur varie (mobile)
const topbar = document.querySelector('.topbar');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
}).observe(topbar);

document.getElementById('share-dialog').addEventListener('click', (event) => {
  if (event.target.closest('[data-action="close-dialog"]') || event.target === event.currentTarget) {
    event.currentTarget.close();
  }
});
