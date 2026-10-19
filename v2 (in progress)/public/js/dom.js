const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Chemin d'image -> URL (les noms de fichiers contiennent espaces et accents). */
export const imgSrc = (path) => path.split('/').map(encodeURIComponent).join('/');

/** Miniature WebP d'un élément du catalogue (repli sur l'image originale). */
export const thumbSrc = (item, width = 400) => imgSrc(item.thumbs?.[width] ?? item.image);

/** srcset complet : miniatures WebP 400/800 puis l'original pour les très grands écrans. */
export const srcsetOf = (item) => [
  ...Object.entries(item.thumbs ?? {}).map(([w, path]) => `${imgSrc(path)} ${w}w`),
  `${imgSrc(item.image)} 1169w`,
].join(', ');

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Notification éphémère. `action` optionnelle : { label, onClick } (ex. « Annuler »).
 */
export function toast(message, tone = 'info', { action, duration = 3200 } = {}) {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  const text = document.createElement('span');
  text.textContent = message;
  el.append(text);

  const remove = () => {
    if (!el.isConnected || el.classList.contains('is-leaving')) return;
    el.classList.add('is-leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  };

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast__action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      action.onClick();
      remove();
    });
    el.append(button);
    duration = Math.max(duration, 6000);
  }

  host.append(el);
  setTimeout(remove, duration);
}

const BURST_WORDS = ['BAM !', 'POW !', 'KRAKOOM !', 'WHAM !', 'SNIKT !', 'THWIP !', 'ZAP !'];

/** Onomatopée façon comics au centre de l'écran (purement décorative). */
export function comicBurst(word = BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)]) {
  if (reducedMotion()) return;
  const el = document.createElement('div');
  el.className = 'burst';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="burst__text">${esc(word)}</span>`;
  el.style.setProperty('--tilt', `${Math.round(Math.random() * 16 - 8)}deg`);
  document.body.append(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 1500);
}

/** Fait « rebondir » un élément (compteurs, badges...). */
export function bump(el) {
  if (!el || reducedMotion()) return;
  el.classList.remove('is-bumping');
  void el.offsetWidth; // relance l'animation CSS
  el.classList.add('is-bumping');
}

/** Anime un nombre de 0 à sa valeur finale. */
export function countUp(el, to, { duration = 700, suffix = '' } = {}) {
  if (reducedMotion() || !to) {
    el.textContent = `${to}${suffix}`;
    return;
  }
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = `${Math.round(to * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Délai d'apparition en cascade, plafonné pour ne pas faire attendre. */
export const stagger = (i, max = 16) => `style="--i:${Math.min(i, max)}"`;
