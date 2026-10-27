"use strict";
(() => {
  const hero = document.querySelector(".hero");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const starImage = hero.querySelector(".hero-star");
  const star = document.createElement("div");
  star.className = "hero-star";
  const volume = document.createElement("div");
  volume.className = "star-volume";
  for (let z = -10; z <= 10; z += 2) {
    const face = starImage.cloneNode();
    face.removeAttribute("class");
    face.alt = "";
    face.draggable = false;
    face.style.transform = `translateZ(${z}px)`;
    if (Math.abs(z) < 10) {
      face.style.filter = "brightness(.86)";
      face.style.opacity = ".55";
    }
    volume.append(face);
  }
  star.append(volume);
  starImage.replaceWith(star);
  const normalize = (a) => {
    const n = Math.hypot(...a);
    return a.map((v) => v / n);
  };
  const states = [
    {
      el: hero.querySelector(".hero-blue"),
      axis: normalize([0.63, -0.46, -0.6257]),
      label: "Голубая бусина",
      glyph: {
        text: "в",
        x: 269,
        y: 129,
        rotation: -34.4,
        size: 239.12,
        color: "#76a8d8",
      },
    },
    { el: star, axis: normalize([1, 0.18, 0]), label: "Лаймовая звезда" },
    {
      el: hero.querySelector(".hero-pink"),
      axis: normalize([0.73, 0.39, -0.56125]),
      label: "Розовая бусина",
      glyph: {
        text: "е",
        x: 300,
        y: 244,
        rotation: 34.76,
        size: 239.12,
        color: "#c58cce",
      },
    },
  ].map((s) => ({
    ...s,
    angle: 0,
    velocity: 0,
    drag: false,
    manual: false,
    lastTime: 0,
    renderer: null,
    lastRendered: null,
  }));
  let visible = true,
    last = 0,
    raf = 0;
  new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), {
    rootMargin: "100px",
  }).observe(hero);
  document.fonts.ready.then(() =>
    states.forEach((state) => {
      if (!state.glyph) return;
      try {
        state.renderer = createBeadSurface(state.el, {
          width: 394.17,
          height: 394.17,
          center: [197.085, 197.085],
          radius: [196, 196],
          axis: state.axis,
          glyph: state.glyph,
        });
        state.renderer(state.angle);
      } catch {
        const glyph = state.el.querySelector(":scope>span");
        glyph.style.visibility = "visible";
        state.renderer = (angle) => {
          glyph.style.rotate = `${angle * 0.35}rad`;
        };
      }
    }),
  );
  states.forEach((state) => {
    const el = state.el;
    el.classList.add("spin-control");
    el.setAttribute("role", "slider");
    el.tabIndex = 0;
    el.setAttribute(
      "aria-label",
      `${state.label} — вращайте перетаскиванием или стрелками`,
    );
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "359");
    el.setAttribute("aria-valuenow", "0");
    el.querySelectorAll("span,i").forEach((child) =>
      child.setAttribute("aria-hidden", "true"),
    );
    el.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      state.drag = true;
      state.manual = true;
      state.velocity = 0;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = event.timeStamp;
      el.setPointerCapture(event.pointerId);
      el.classList.add("is-spinning");
    });
    el.addEventListener("pointermove", (event) => {
      if (!state.drag) return;
      const dx = event.clientX - state.lastX,
        dy = event.clientY - state.lastY;
      const radius = Math.max(45, el.clientWidth / 2);
      const [ax, ay] = state.axis;
      const projection = dx * 0.9 + dy * 0.65;
      const delta = projection / radius;
      const dt = Math.max(0.008, (event.timeStamp - state.lastTime) / 1000);
      state.angle += delta;
      state.velocity = Math.max(-8, Math.min(8, delta / dt));
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = event.timeStamp;
      event.preventDefault();
    });
    const release = (event) => {
      if (event.timeStamp - state.lastTime > 100) state.velocity = 0;
      state.drag = false;
      el.classList.remove("is-spinning");
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", () => {
      state.drag = false;
      state.velocity = 0;
      el.classList.remove("is-spinning");
    });
    el.addEventListener("lostpointercapture", () => {
      state.drag = false;
      el.classList.remove("is-spinning");
    });
    el.addEventListener("keydown", (event) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
          event.key,
        )
      ) {
        event.preventDefault();
        state.manual = true;
        state.velocity = 0;
        if (event.key === "Home") state.angle = 0;
        else
          state.angle += ["ArrowLeft", "ArrowUp"].includes(event.key)
            ? -0.3
            : 0.3;
      }
    });
  });
  function tick(time) {
    const dt = last ? Math.min((time - last) / 1000, 0.04) : 0;
    last = time;
    if (visible && !document.hidden) {
      for (const state of states) {
        if (!state.drag && !document.body.classList.contains("motion-paused")) {
          if (!reduced.matches) {
            state.angle += state.velocity * dt;
            state.velocity *= Math.exp(-1.5 * dt);
            if (!state.manual) state.angle += dt * 0.19;
          }
        }
        if (state.lastRendered !== state.angle) {
          if (state.renderer) state.renderer(state.angle);
          else if (state.el === star)
            volume.style.transform = `rotate3d(${state.axis.join(",")},${state.angle}rad)`;
          state.el.dataset.rotation = state.angle.toFixed(4);
          state.el.setAttribute(
            "aria-valuenow",
            String(
              Math.floor(((((state.angle * 180) / Math.PI) % 360) + 360) % 360),
            ),
          );
          state.lastRendered = state.angle;
        }
      }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  window.addEventListener("pagehide", () => cancelAnimationFrame(raf));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  });
})();
