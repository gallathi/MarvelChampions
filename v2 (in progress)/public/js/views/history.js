// Historique : statistiques, personnages les moins joués et parties enregistrées.

import { ASPECT_COLORS } from '../config.js';
import { countUp, esc, stagger, thumbSrc, toast } from '../dom.js';
import { evaluateAchievements } from '../achievements.js';
import { leastPlayed, sanitizeHistory, summary } from '../history.js';
import { icons } from '../icons.js';

const PAGE_SIZE = 8;
const LEAST_PREVIEW = { heroes: 8, scenarios: 4 };

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const relativeFormat = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

function formatDate(iso) {
  const days = Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return days > -7 ? relativeFormat.format(days, 'day') : dateFormat.format(new Date(iso));
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function renderHistory(root, app, signal) {
  const expanded = { heroes: false, scenarios: false };
  let visibleGames = PAGE_SIZE;

  root.innerHTML = `
    <section class="view view--history" aria-labelledby="view-title">
      <div class="intro intro--row">
        <div>
          <p class="eyebrow">Suivi</p>
          <h1 id="view-title" class="display" tabindex="-1">Historique</h1>
          <p class="lead">Vos parties enregistrées, et les héros qui attendent toujours leur tour.</p>
        </div>
        <div class="toolbar toolbar--compact">
          <button type="button" class="btn btn--ghost btn--sm" data-action="export">${icons.download} Exporter</button>
          <button type="button" class="btn btn--ghost btn--sm" data-action="import">${icons.upload} Importer</button>
          <input type="file" accept="application/json,.json" data-role="import-file" hidden>
        </div>
      </div>
      <div data-role="content"></div>
    </section>`;

  const content = root.querySelector('[data-role="content"]');

  function emptyState() {
    return `
      <div class="empty-state panel">
        <span class="empty-state__q" aria-hidden="true">?</span>
        <h2 class="empty-state__title">Aucune partie enregistrée</h2>
        <p>Tirez une partie puis appuyez sur <strong>« On joue ! »</strong> : elle apparaîtra ici,
          et vous saurez quels héros n’ont encore jamais vu le combat.</p>
        <a class="btn btn--primary" href="#/partie">${icons.dice} Tirer une partie</a>
      </div>`;
  }

  function statsHtml() {
    const s = summary(app.history);
    const pools = app.pools();
    const heroCounts = app.playCounts('heroes');
    const playedHeroes = pools.heroes.filter((id) => heroCounts.has(id)).length;
    const villain = [...app.playCounts('scenarios')].sort((a, b) => b[1].plays - a[1].plays)[0];
    const villainName = villain ? app.item('scenarios', villain[0])?.name ?? '—' : '—';
    const heroPct = pools.heroes.length ? Math.round((playedHeroes / pools.heroes.length) * 100) : 0;
    return `
      <div class="stats">
        <div class="stat" ${stagger(0)}>
          <span class="stat__label">Parties jouées</span>
          <span class="stat__value" data-count="${s.games}">${s.games}</span>
        </div>
        <div class="stat" ${stagger(1)}>
          <span class="stat__label">Taux de victoire</span>
          <span class="stat__value">${s.winRate === null ? '—' : `<span data-count="${s.winRate}" data-suffix=" %">${s.winRate} %</span>`}</span>
          <span class="stat__hint">${s.wins} V · ${s.losses} D${s.games - s.wins - s.losses ? ` · ${s.games - s.wins - s.losses} sans résultat` : ''}</span>
        </div>
        <div class="stat" ${stagger(2)}>
          <span class="stat__label">Héros déjà joués</span>
          <span class="stat__value"><span data-count="${playedHeroes}">${playedHeroes}</span><small>/${pools.heroes.length}</small></span>
          <span class="meter" aria-hidden="true"><span class="meter__fill" style="--value:${heroPct}%"></span></span>
        </div>
        <div class="stat" ${stagger(3)}>
          <span class="stat__label">Méchant le plus affronté</span>
          <span class="stat__value stat__value--text">${esc(villainName)}</span>
          ${villain ? `<span class="stat__hint">${plural(villain[1].plays, 'partie')}</span>` : ''}
        </div>
      </div>`;
  }

  function leastHtml(cat, title, emptyLabel) {
    const pool = app.pools()[cat];
    const ranking = leastPlayed(pool, app.playCounts(cat));
    const max = Math.max(1, ...ranking.map((r) => r.plays));
    const shown = expanded[cat] ? ranking : ranking.slice(0, LEAST_PREVIEW[cat]);
    return `
      <section class="zone" aria-labelledby="least-${cat}">
        <h2 id="least-${cat}" class="zone__title">${title}</h2>
        <ol class="least least--${cat}">
          ${shown.map((r, i) => {
            const item = app.item(cat, r.id);
            const decided = r.wins + r.losses;
            return `
              <li class="least__card ${r.plays ? '' : 'is-new'}" ${stagger(i)}>
                <span class="least__rank">${i + 1}</span>
                <img class="least__img" src="${esc(thumbSrc(item))}" alt="" loading="lazy" decoding="async">
                <div class="least__body">
                  <span class="least__name">${esc(item.name)}</span>
                  <span class="least__meta">${r.plays
                    ? `${plural(r.plays, 'partie')}${decided ? ` · ${Math.round((r.wins / decided) * 100)} % de victoires` : ''}`
                    : `<span class="pill pill--gold">${icons.star} ${emptyLabel}</span>`}</span>
                  <span class="meter meter--thin" aria-hidden="true"><span class="meter__fill" style="--value:${(r.plays / max) * 100}%"></span></span>
                </div>
                <button type="button" class="icon-btn least__play" data-action="play-with" data-cat="${cat}" data-id="${esc(r.id)}"
                        title="Jouer avec ${esc(item.name)}" aria-label="Préparer une partie avec ${esc(item.name)}">${icons.play}</button>
              </li>`;
          }).join('')}
        </ol>
        ${ranking.length > LEAST_PREVIEW[cat] ? `
          <button type="button" class="btn btn--ghost btn--sm least__more" data-action="expand" data-cat="${cat}">
            ${expanded[cat] ? 'Réduire' : `Voir les ${ranking.length}`}
          </button>` : ''}
      </section>`;
  }

  function achievementsHtml() {
    const states = evaluateAchievements(app.history, { heroes: app.pools().heroes });
    const done = states.filter((a) => a.done).length;
    return `
      <section class="zone" aria-labelledby="achievements-title">
        <h2 id="achievements-title" class="zone__title">Succès
          <span class="zone__count">${done} / ${states.length}</span></h2>
        <ul class="achievements">
          ${states.map((a, i) => `
            <li class="achievement ${a.done ? 'is-done' : ''} ${a.meta ? 'achievement--meta' : ''}" ${stagger(i)}>
              <span class="achievement__badge" aria-hidden="true">${icons[a.icon]}</span>
              <div class="achievement__body">
                <span class="achievement__title">${esc(a.title)}</span>
                <span class="achievement__desc">${esc(a.description)}</span>
                ${a.done
                  ? '<span class="achievement__state">Débloqué</span>'
                  : `<span class="achievement__progress">
                      <span class="meter meter--thin" aria-hidden="true"><span class="meter__fill" style="--value:${(a.value / a.target) * 100}%"></span></span>
                      <span>${a.value} / ${a.target}</span>
                    </span>`}
              </div>
            </li>`).join('')}
        </ul>
      </section>`;
  }

  function gameHtml(game, i) {
    const scenario = app.item('scenarios', game.scenario);
    const mode = game.mode ? app.item('modes', game.mode)?.name : null;
    const modules = game.modules.map((m) => app.item('modules', m)?.name).filter(Boolean);
    return `
      <li class="game-card" data-id="${esc(game.id)}" data-result="${game.result ?? ''}" ${stagger(i, 8)}>
        ${scenario ? `<img class="game-card__img" src="${esc(thumbSrc(scenario))}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="game-card__body">
          <div class="game-card__top">
            <h3 class="game-card__title">${esc(scenario?.name ?? game.scenario)}</h3>
            ${mode ? `<span class="pill">${esc(mode)}</span>` : ''}
            <time class="game-card__date" datetime="${game.date}">${formatDate(game.date)}</time>
          </div>
          ${modules.length ? `<p class="game-card__modules">${esc(modules.join(' · '))}</p>` : ''}
          <ul class="game-card__heroes">
            ${game.heroes.map((h) => `
              <li><span class="dot" style="--c:${ASPECT_COLORS[h.aspect] ?? 'var(--muted)'}"
                        title="${esc(app.item('aspects', h.aspect)?.name ?? '')}"></span>
                ${esc(app.item('heroes', h.hero)?.name ?? h.hero)}</li>`).join('')}
          </ul>
        </div>
        <div class="game-card__actions">
          <div class="result" role="group" aria-label="Résultat de la partie">
            <button type="button" class="result__btn result__btn--win" data-action="result" data-value="win"
                    aria-pressed="${game.result === 'win'}">${icons.trophy}<span>Victoire</span></button>
            <button type="button" class="result__btn result__btn--loss" data-action="result" data-value="loss"
                    aria-pressed="${game.result === 'loss'}">${icons.skull}<span>Défaite</span></button>
          </div>
          <button type="button" class="icon-btn" data-action="delete" title="Supprimer" aria-label="Supprimer cette partie">${icons.trash}</button>
        </div>
      </li>`;
  }

  function gamesHtml() {
    const games = app.history.slice(0, visibleGames);
    return `
      <section class="zone" aria-labelledby="recent-games">
        <h2 id="recent-games" class="zone__title">Parties récentes</h2>
        <ol class="games">${games.map(gameHtml).join('')}</ol>
        ${app.history.length > visibleGames ? `
          <button type="button" class="btn btn--ghost btn--sm least__more" data-action="more-games">
            Afficher plus (${app.history.length - visibleGames})
          </button>` : ''}
      </section>`;
  }

  /** `animate` : rejouer les animations d'entrée (premier affichage uniquement). */
  function render(animate) {
    content.classList.toggle('is-settled', !animate);
    content.innerHTML = app.history.length
      ? statsHtml()
        + achievementsHtml()
        + leastHtml('heroes', 'Héros les moins joués', 'Jamais joué')
        + leastHtml('scenarios', 'Méchants les moins affrontés', 'Jamais affronté')
        + gamesHtml()
      : emptyState() + achievementsHtml();
    if (animate) {
      for (const el of content.querySelectorAll('[data-count]')) {
        countUp(el, Number(el.dataset.count), { suffix: el.dataset.suffix ?? '' });
      }
    }
  }

  function exportHistory() {
    if (!app.history.length) {
      toast('Rien à exporter pour l’instant.');
      return;
    }
    const blob = new Blob([JSON.stringify(app.history, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `marvel-champions-historique-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function importHistory(file) {
    try {
      const imported = sanitizeHistory(JSON.parse(await file.text()));
      if (!imported.length) throw new Error('vide');
      let added = 0;
      app.updateHistory((h) => {
        const ids = new Set(h.map((g) => g.id));
        const fresh = imported.filter((g) => !ids.has(g.id));
        added = fresh.length;
        return sanitizeHistory([...h, ...fresh]);
      });
      toast(`${plural(added, 'partie')} importée${added > 1 ? 's' : ''}.`, 'success');
    } catch {
      toast('Fichier invalide : choisissez un export de l’historique (.json).', 'error');
    }
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const card = button.closest('.game-card');
    switch (button.dataset.action) {
      case 'export': exportHistory(); break;
      case 'import': root.querySelector('[data-role="import-file"]').click(); break;
      case 'expand':
        expanded[button.dataset.cat] = !expanded[button.dataset.cat];
        render(false);
        break;
      case 'more-games':
        visibleGames += PAGE_SIZE;
        render(false);
        break;
      case 'result': {
        const value = button.getAttribute('aria-pressed') === 'true' ? null : button.dataset.value;
        app.updateHistory((h) => h.map((g) => (g.id === card.dataset.id ? { ...g, result: value } : g)));
        break;
      }
      case 'delete': {
        const removed = app.history.find((g) => g.id === card.dataset.id);
        card.classList.add('is-removing');
        card.addEventListener('animationend', () => {
          app.updateHistory((h) => h.filter((g) => g.id !== removed.id));
        }, { once: true });
        toast('Partie supprimée.', 'info', {
          action: { label: 'Annuler', onClick: () => {
            app.updateHistory((h) => sanitizeHistory([...h.filter((g) => g.id !== removed.id), removed]));
          } },
        });
        break;
      }
      case 'play-with': {
        const { cat, id } = button.dataset;
        const key = cat === 'heroes' ? 'hero-0' : 'scenario';
        app.update((s) => {
          // retire le héros d'un autre emplacement pour éviter un doublon
          for (const k of Object.keys(s.values)) {
            if (k.startsWith('hero-') && s.values[k] === id) { delete s.values[k]; delete s.locked[k]; }
          }
          s.values[key] = id;
          s.locked[key] = true;
        });
        toast(`${app.item(cat, id).name} est verrouillé pour la prochaine partie.`, 'success');
        app.go('#/partie');
        break;
      }
    }
  }, { signal });

  // Toute modification de l'historique (ici ou via « Annuler » d'un toast) rafraîchit la vue
  window.addEventListener('history-change', () => render(false), { signal });

  root.querySelector('[data-role="import-file"]').addEventListener('change', (event) => {
    const [file] = event.target.files;
    if (file) importHistory(file);
    event.target.value = '';
  }, { signal });

  render(true);
}
