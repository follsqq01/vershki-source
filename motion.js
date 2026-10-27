"use strict";
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const body = document.body;
  document
    .querySelectorAll(".story-art .bead,.shared-photo,.stat-ball")
    .forEach((el, i) => {
      el.classList.add("float-motion");
      el.style.setProperty("--float-delay", `${-i * 1.15}s`);
    });
  const reveals = [
    ...document.querySelectorAll(
      ".bead-title,.familiar-intro,.stat-labels,.story-intro,.story-outro,.test>p,.faq-grid",
    ),
  ];
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  reveals.forEach((el) => {
    el.classList.add("reveal");
    el.querySelectorAll("span").forEach((span, i) =>
      span.style.setProperty("--letter-index", i),
    );
    revealObserver.observe(el);
  });
  const together = document.querySelector(".together");
  const particles = together.querySelector(".particles");
  for (let i = 0; i < 22; i++) {
    const dot = document.createElement("i");
    dot.className = "particle";
    dot.style.cssText = `left:${(i * 37 + 11) % 100}%;top:${(i * 23 + 17) % 100}%;--size:${2 + (i % 4)}px;--duration:${4 + (i % 5)}s;--delay:${-i * 0.45}s`;
    particles.append(dot);
  }
  // One rigid wheel: its centre is BELOW the clipped section, so only
  // the upper arc of the circle passes through the frame (the user's sketch).
  const wheel = together.querySelector(".polaroids");
  const originals = [...wheel.querySelectorAll(".orbit-card")];
  for (let i = originals.length; i < 8; i++) {
    const clone = originals[i % originals.length].cloneNode(true);
    wheel.append(clone);
  }
  const cards = [...wheel.querySelectorAll(".orbit-card")].map((el, i) => ({
    el,
    card: el.querySelector(".polaroid"),
    phase: ((i - 1) * Math.PI) / 4,
    hover: false,
    focused: false,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
  }));
  let visible = false,
    paused = reduced.matches,
    last = 0,
    frame = 0,
    rotation = 0,
    initialized = false,
    speed = 0;
  let drag = null,
    suppressClick = false;
  const motionToggle = document.querySelector(".motion-toggle");
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      together.classList.toggle("is-offscreen", !visible);
    },
    { rootMargin: "100px" },
  );
  visibilityObserver.observe(together);
  function updateToggle() {
    motionToggle.textContent = paused ? "▷" : "Ⅱ";
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.setAttribute(
      "aria-label",
      paused ? "Включить движение" : "Приостановить движение",
    );
    body.classList.toggle("motion-paused", paused);
  }
  motionToggle.onclick = () => {
    paused = !paused;
    updateToggle();
  };
  updateToggle();
  const coarse = matchMedia("(pointer:coarse)");
  let geometry = { width: 0, height: 0, mobile: false };
  function resizeOrbit() {
    geometry = {
      width: together.clientWidth,
      height: together.clientHeight,
      mobile: innerWidth <= 700,
    };
  }
  new ResizeObserver(resizeOrbit).observe(together);
  resizeOrbit();
  function clearHover(state) {
    state.hover = false;
    state.tx = state.ty = 0;
    state.card.style.setProperty("--shine", ".32");
  }
  cards.forEach((state) => {
    state.card.addEventListener("pointerenter", () => {
      if (!coarse.matches) state.hover = true;
    });
    state.card.addEventListener("pointermove", (event) => {
      if (drag && drag.id === event.pointerId) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) {
          rotation = drag.rotation + dx / Math.max(150, geometry.width * 0.54);
          event.preventDefault();
        }
        return;
      }
      if (coarse.matches || reduced.matches) return;
      const rect = state.el.getBoundingClientRect();
      const x = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      const y = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      state.tx = -y * 12;
      state.ty = x * 15;
      state.card.style.setProperty("--light-x", `${(x + 1) * 50}%`);
      state.card.style.setProperty("--light-y", `${(y + 1) * 50}%`);
      state.card.style.setProperty("--shine", ".95");
    });
    state.card.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        rotation,
        moved: false,
      };
      state.card.setPointerCapture(event.pointerId);
      wheel.classList.add("is-dragging");
    });
    const release = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      suppressClick = drag.moved;
      drag = null;
      wheel.classList.remove("is-dragging");
      if (coarse.matches) clearHover(state);
      if (state.card.hasPointerCapture(event.pointerId))
        state.card.releasePointerCapture(event.pointerId);
    };
    state.card.addEventListener("pointerup", release);
    state.card.addEventListener("pointercancel", (event) => {
      release(event);
      clearHover(state);
    });
    state.card.addEventListener("lostpointercapture", () => {
      drag = null;
      wheel.classList.remove("is-dragging");
    });
    state.card.addEventListener("pointerleave", () => clearHover(state));
    state.card.addEventListener("focus", () => (state.focused = true));
    state.card.addEventListener("blur", () => {
      state.focused = false;
      clearHover(state);
    });
    state.card.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        rotation += event.key === "ArrowLeft" ? -Math.PI / 12 : Math.PI / 12;
      }
    });
  });
  wheel.addEventListener(
    "click",
    (event) => {
      if (suppressClick) {
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      }
    },
    true,
  );
  function render(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.06) : 0;
    last = now;
    if ((visible && !document.hidden) || !initialized) {
      initialized = true;
      const { width, height, mobile } = geometry;
      const held =
        cards.some((s) => s.hover || s.focused) ||
        drag ||
        document.querySelector(".media-dialog[open]");
      const targetSpeed = paused || held ? 0 : 0.075;
      speed += (targetSpeed - speed) * Math.min(1, dt * 9);
      if (!drag) rotation += speed * dt;
      const rx = width * (mobile ? 0.75 : 0.54),
        ry = width * (mobile ? 0.64 : 0.52);
      const topY = height * (mobile ? 0.73 : 0.65),
        centerY = topY + ry;
      wheel.style.setProperty("--wheel-progress", rotation);
      for (const state of cards) {
        const angle = state.phase + rotation,
          s = Math.sin(angle),
          c = Math.cos(angle);
        const x = s * rx,
          y = centerY - c * ry + x * 0.1;
        const z = reduced.matches ? 0 : c * (mobile ? 12 : 35);
        const tilt = s * 30;
        state.el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateZ(${tilt.toFixed(2)}deg) rotateY(${(-s * 9).toFixed(2)}deg)`;
        state.el.style.zIndex = state.hover
          ? "20"
          : String(Math.round((c + 1) * 4));
        // Off-screen lower cards are excluded from focus/accessibility until
        // they return to the visible upper arc; this prevents focus scrolling.
        const inFrame =
          y - state.el.offsetHeight * 0.6 < height &&
          Math.abs(x) < width * 0.75;
        state.el.style.visibility = inFrame ? "visible" : "hidden";
        state.card.tabIndex = inFrame ? 0 : -1;
        state.el.setAttribute("aria-hidden", String(!inFrame));
        state.x += (state.tx - state.x) * 0.12;
        state.y += (state.ty - state.y) * 0.12;
        state.card.style.setProperty("--tilt-x", `${state.x.toFixed(2)}deg`);
        state.card.style.setProperty("--tilt-y", `${state.y.toFixed(2)}deg`);
        state.card.style.setProperty(
          "--lift",
          state.hover && !reduced.matches ? "18px" : "0px",
        );
      }
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);
  // The chat owns scrolling only during this bounded sequence. Every exit path
  // restores body styles, including skip, reduced motion, resize and pagehide.
  const scene = document.querySelector(".conversation");
  const messages = scene.querySelector(".messages");
  const bubbles = [...messages.querySelectorAll(".message")];
  const reaction = scene.querySelector(".reaction");
  const typing = scene.querySelector(".typing");
  const status = scene.querySelector(".scene-status");
  const skip = scene.querySelector(".scene-skip");
  const replay = scene.querySelector(".scene-replay");
  let active = false,
    played = false,
    lockY = 0,
    timers = [],
    previousStyle = null;
  scene.classList.add("chat-ready");
  const editable = (target) =>
    target.closest("input,textarea,select,[contenteditable=true]");
  function stopScroll(event) {
    if (active && !event.target.closest(".media-panel,.media-dialog"))
      event.preventDefault();
  }
  function stopKeys(event) {
    if (
      active &&
      [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key) &&
      !editable(event.target) &&
      !event.target.closest("button,[role=tab],.media-dialog")
    )
      event.preventDefault();
    if (event.key === "Escape" && active) finish();
  }
  window.addEventListener("wheel", stopScroll, { passive: false });
  window.addEventListener("touchmove", stopScroll, { passive: false });
  document.addEventListener("keydown", stopKeys);
  function lock() {
    const rect = scene.getBoundingClientRect(),
      mr = messages.getBoundingClientRect();
    const target = rect.height <= innerHeight - 24 ? rect : mr;
    lockY = Math.max(
      0,
      scrollY + target.top - Math.max(12, (innerHeight - target.height) / 2),
    );
    previousStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `${-lockY}px`;
    body.style.left = "0";
    body.style.width = "100%";
    body.classList.add("scene-locked");
  }
  function unlock() {
    if (!previousStyle) return;
    Object.assign(body.style, previousStyle);
    previousStyle = null;
    body.classList.remove("scene-locked");
    const scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, lockY);
    document.documentElement.style.scrollBehavior = scrollBehavior;
  }
  function later(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }
  function finish() {
    timers.forEach(clearTimeout);
    timers = [];
    active = false;
    played = true;
    bubbles.forEach((b) => {
      b.classList.add("is-sent");
      b.removeAttribute("inert");
    });
    reaction.classList.add("is-reacted");
    typing.classList.remove("is-typing");
    scene.style.setProperty("--scene-progress", "1");
    status.textContent = "";
    skip.hidden = true;
    replay.hidden = false;
    unlock();
  }
  function start() {
    if (active) return;
    if (reduced.matches) {
      finish();
      return;
    }
    played = true;
    active = true;
    replay.hidden = true;
    skip.hidden = false;
    bubbles.forEach((b) => {
      b.classList.remove("is-sent");
      b.setAttribute("inert", "");
    });
    reaction.classList.remove("is-reacted");
    scene.style.setProperty("--scene-progress", "0");
    status.textContent = "Бабуля печатает…";
    typing.classList.add("is-typing");
    lock();
    [1400, 4200, 6300, 8400].forEach((delay, index) =>
      later(() => {
        typing.classList.remove("is-typing");
        bubbles[index].classList.add("is-sent");
        bubbles[index].removeAttribute("inert");
        status.textContent = `Переписка · ${index + 1} из 4`;
        scene.style.setProperty("--scene-progress", String((index + 1) / 5));
      }, delay),
    );
    later(() => reaction.classList.add("is-reacted"), 9700);
    later(finish, 11100);
  }
  skip.onclick = finish;
  replay.onclick = start;
  const chatObserver = new IntersectionObserver(
    (entries) => {
      if (
        !played &&
        entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35)
      )
        start();
    },
    { threshold: [0.35] },
  );
  chatObserver.observe(messages);
  reduced.addEventListener("change", () => {
    paused = reduced.matches;
    updateToggle();
    if (reduced.matches) finish();
  });
  window.addEventListener("resize", () => {
    if (active) finish();
  });
  window.addEventListener("pagehide", () => {
    if (active) finish();
    cancelAnimationFrame(frame);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      last = 0;
      frame = requestAnimationFrame(render);
    }
  });
  if (reduced.matches) finish();
})();
