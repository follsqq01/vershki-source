"use strict";
(() => {
  const section = document.querySelector('.story-figma');
  const sticky = section.querySelector('.story-sticky');
  const track = section.querySelector('.story-track');
  const invitation = document.querySelector('.test');
  const viewport = document.createElement('div');
  viewport.className = 'story-window';
  track.before(viewport);
  viewport.append(track);
  const mobile = matchMedia('(max-width:700px)');
  function arrange() {
    if (mobile.matches) sticky.append(invitation);
    else section.after(invitation);
  }
  arrange();
  const design = { width: 4734, height: 760 };
  let travel = 0, top = 0, pending = false;
  function measure() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    // On phones, show a closer portion of the same composition so text stays readable.
    const preferredScale = width <= 700 ? Math.max(.55, width / 700) : width / 1512;
    const scale = Math.min(preferredScale, height / design.height);
    section.style.setProperty('--story-scale', scale);
    section.style.setProperty('--story-width', `${design.width * scale}px`);
    section.style.setProperty('--story-height', `${design.height * scale}px`);
    travel = Math.max(0, design.width * scale - width);
    section.style.height = `${sticky.clientHeight + travel}px`;
    top = section.getBoundingClientRect().top + scrollY;
    update();
  }
  function update() {
    pending = false;
    const x = Math.max(0, Math.min(travel, scrollY - top));
    track.style.transform = `translate3d(${-x}px,0,0)`;
  }
  addEventListener('scroll', () => {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }, { passive: true });
  mobile.addEventListener('change', () => { arrange(); measure(); });
  addEventListener('resize', measure);
  addEventListener('load', measure, { once: true });
  new ResizeObserver(measure).observe(viewport);
  measure();
})();
