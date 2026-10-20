// Floral Café – Interaktionen
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ---------- Scrollfortschritt: Blüten, Kopfzeile, Kaffeeglas ----------
const blooms = [...document.querySelectorAll('.bloom')];
const header = document.querySelector('.site-header');
const glass = document.querySelector('.glass');
const level = glass.querySelector('.glass__level');

const GLASS_EMPTY = 137;
const GLASS_FULL = 26;

let ticking = false;
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 1;

  // Blüten öffnen sich nach und nach, je weiter man scrollt
  for (const bloom of blooms) {
    if (!bloom.classList.contains('is-open') && progress >= parseFloat(bloom.dataset.bloom)) {
      bloom.classList.add('is-open');
    }
  }

  header.classList.toggle('is-scrolled', window.scrollY > 10);

  const y = GLASS_EMPTY - progress * (GLASS_EMPTY - GLASS_FULL);
  level.setAttribute('transform', `translate(0 ${y.toFixed(1)})`);
  glass.classList.toggle('is-visible', window.scrollY > 120);
  glass.classList.toggle('is-full', progress > 0.985);

  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
window.addEventListener('resize', onScroll);

// Die ersten Blüten öffnen sich kurz nach dem Laden von selbst
requestAnimationFrame(() => setTimeout(onScroll, reduceMotion ? 0 : 250));

glass.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

// ---------- Einblenden ----------
const revealer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-in');
      revealer.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

// ---------- Torte: Stücke herausziehen ----------
const slices = [...document.querySelectorAll('.cake__slice')];
const nums = [...document.querySelectorAll('.cake__num')];
const cards = [...document.querySelectorAll('.slice-card')];
const count = document.querySelector('[data-count]');
let current = 0;

function selectSlice(i) {
  current = (i + slices.length) % slices.length;
  slices.forEach((s, j) => {
    s.classList.toggle('is-active', j === current);
    s.setAttribute('aria-pressed', j === current);
  });
  nums.forEach((n, j) => n.classList.toggle('is-active', j === current));
  cards.forEach((c, j) => c.classList.toggle('is-active', j === current));
  count.textContent = current + 1;
}

slices.forEach((slice, i) => {
  slice.addEventListener('click', () => selectSlice(i));
  slice.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectSlice(i);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      selectSlice(i + 1);
      slices[current].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      selectSlice(i - 1);
      slices[current].focus();
    }
  });
});
document.querySelectorAll('[data-step]').forEach((btn) =>
  btn.addEventListener('click', () => selectSlice(current + Number(btn.dataset.step))));

// Das erste Stück wird angeschnitten, sobald die Torte ins Bild kommt
const plate = document.querySelector('.cake__plate');
new IntersectionObserver((entries, obs) => {
  if (entries[0].isIntersecting) {
    setTimeout(() => selectSlice(current), reduceMotion ? 0 : 700);
    obs.disconnect();
  }
}, { threshold: 0.4 }).observe(plate);
