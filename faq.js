"use strict";
(() => {
  const cards = [...document.querySelectorAll('.faq-grid details')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new WeakMap();

  function setOpen(card, expand) {
    const summary = card.querySelector('summary');
    const current = card.getBoundingClientRect().height;
    animations.get(card)?.cancel();
    card.open = true; // Keep the answer rendered until closing finishes.
    card.style.height = 'auto';
    const target = expand ? card.scrollHeight : summary.getBoundingClientRect().height;
    card.style.height = `${current}px`;
    summary.setAttribute('aria-expanded', String(expand));
    card.classList.toggle('is-expanded', expand);

    if (reduced.matches || Math.abs(current - target) < 1) {
      card.open = expand;
      card.style.height = '';
      return;
    }
    const animation = card.animate(
      [{ height: `${current}px` }, { height: `${target}px` }],
      { duration: 320, easing: 'cubic-bezier(.25,.8,.25,1)' },
    );
    animations.set(card, animation);
    animation.onfinish = () => {
      if (animations.get(card) !== animation) return;
      card.open = expand;
      card.style.height = '';
      animations.delete(card);
    };
  }

  cards.forEach(card => {
    const summary = card.querySelector('summary');
    summary.setAttribute('aria-expanded', String(card.open));
    summary.addEventListener('click', event => {
      event.preventDefault();
      const expand = summary.getAttribute('aria-expanded') !== 'true';
      if (expand) cards.filter(other => other !== card && other.querySelector('summary').getAttribute('aria-expanded') === 'true')
        .forEach(other => setOpen(other, false));
      setOpen(card, expand);
    });
  });
})();
