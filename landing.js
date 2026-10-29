"use strict";
// The titles are text; each character sits in a CSS circle.
document.querySelectorAll("[data-letters]").forEach((heading) => {
  for (const letter of heading.dataset.letters) {
    const span = document.createElement("span");
    span.textContent = letter;
    span.setAttribute("aria-hidden", "true");
    heading.append(span);
  }
});
function resizeIllustrations() {
  document.documentElement.style.setProperty(
    "--asset-scale",
    String(window.innerWidth / 1512),
  );
}
window.addEventListener("resize", resizeIllustrations);
resizeIllustrations();

const footer = document.querySelector('.site-footer');
if (footer && 'IntersectionObserver' in window) {
  footer.classList.add('footer-ready');
  const footerObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      footer.classList.add('footer-visible');
      footerObserver.disconnect();
    }
  }, { threshold:.2 });
  footerObserver.observe(footer);
}

// Both ends of a statistic reveal the same pair; tapping also works on phones.
const facts = [...document.querySelectorAll('.stat-labels li')];
const percentages = [20, 26, 10, 40];
const pairs = facts.map((fact, i) => ({ fact, ball: document.querySelector(`.stat-${percentages[i]}`) }));
let pinnedStat = null;
function showStat(index) {
  pairs.forEach(({ fact, ball }, i) => {
    const active = i === index;
    fact.classList.toggle('stat-active', active);
    ball.classList.toggle('stat-active', active);
    fact.setAttribute('aria-pressed', String(active));
    ball.setAttribute('aria-pressed', String(active));
  });
}
pairs.forEach(({ fact, ball }, index) => {
  fact.style.setProperty('--fact-color', ['#f3eedb', '#c5def8', '#eff99c', '#edc9ec'][index]);
  [fact, ball].forEach(el => {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-pressed', 'false');
    el.setAttribute('aria-label', `${percentages[index]}% — ${fact.textContent.trim()}`);
    el.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showStat(index); });
    el.addEventListener('pointerleave', () => showStat(pinnedStat));
    el.addEventListener('focus', () => showStat(index));
    el.addEventListener('blur', () => showStat(pinnedStat));
    el.addEventListener('click', () => { pinnedStat = pinnedStat === index ? null : index; showStat(pinnedStat); });
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); el.click(); }
      if (event.key === 'Escape') { pinnedStat = null; showStat(null); }
    });
  });
});
