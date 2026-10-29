"use strict";
(() => {
  const photos = [
    {
      id: "pottery",
      src: "assets/media/pottery.jpg",
      title: "За гончарным кругом",
      credit: "cottonbro studio · Pexels",
    },
    {
      id: "painting",
      src: "assets/media/painting.jpg",
      title: "Расписываем керамику",
      credit: "Poly Myakisheva · Pexels",
    },
    {
      id: "colors",
      src: "assets/media/colors.jpg",
      title: "Выбираем любимые цвета",
      credit: "Демонстрационная фотография · Pexels",
    },
    {
      id: "together",
      src: "assets/figma/ffa82.png",
      title: "Маленькие моменты вместе",
      credit: "Фотография из исходного макета",
    },
    {
      id: "pottery-detail",
      src: "assets/media/pottery.jpg",
      title: "Всё начинается с рук",
      credit: "cottonbro studio · Pexels",
      position: "70% center",
    },
    {
      id: "painting-detail",
      src: "assets/media/painting.jpg",
      title: "Последний штрих",
      credit: "Poly Myakisheva · Pexels",
      position: "center 65%",
    },
  ];
  const voiceTracks = [
    {
      title: "Голосовое сообщение",
      src: "assets/media/gs.mp3",
      caption: "29.10",
    },
    {
      title: "Город влюблённых",
      src: "assets/media/anna-german-gorod-vljublennykh.mp3",
      caption: "Анна Герман",
    },
    {
      title: "Дельтаплан",
      src: "assets/media/valerijj-leontev-deltaplan.mp3",
      caption: "Валерий Леонтьев",
    },
  ];
  const dialog = document.querySelector(".media-dialog");
  const content = dialog.querySelector(".dialog-content");
  const title = dialog.querySelector("h2");
  const caption = dialog.querySelector(".dialog-caption");
  const panel = document.querySelector("#media-panel");
  const tabs = [...document.querySelectorAll("[role=tab]")];
  const media = new Set();
  let opener = null;
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  function pauseOthers(except) {
    media.forEach((item) => {
      if (item !== except) item.pause();
    });
  }
  function register(player) {
    media.add(player);
    player.addEventListener("play", () => pauseOthers(player));
    return player;
  }
  function openDialog(heading, description, from) {
    opener = from;
    title.textContent = heading;
    caption.textContent = description;
    dialog.showModal();
  }
  function openPhoto(photo, from) {
    pauseOthers();
    content.replaceChildren();
    const img = make("img");
    img.src = photo.src;
    img.alt = photo.title;
    content.append(img);
    openDialog(photo.title, photo.credit, from);
  }
  function openCircle(start, from) {
    pauseOthers();
    content.replaceChildren();
    const video = register(make("video"));
    video.src = "assets/media/pottery-circle.mp4";
    video.poster = "assets/media/pottery.jpg";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", "Кружочек: работаем с глиной");
    content.append(video);
    openDialog(
      "Маленький момент из мастерской",
      "Демокружочек · cottonbro studio / Pexels · без звука",
      from,
    );
    video.addEventListener(
      "loadedmetadata",
      () => {
        video.currentTime = start;
        video.play().catch(() => {});
      },
      { once: true },
    );
  }
  dialog.querySelector(".dialog-close").onclick = () => dialog.close();
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    content.querySelectorAll("audio,video").forEach((p) => {
      p.pause();
      media.delete(p);
      p.removeAttribute("src");
      p.load();
    });
    content.replaceChildren();
    opener?.focus({ preventScroll: true });
  });
  document.querySelector(".polaroids").addEventListener("click", (event) => {
    const button = event.target.closest("[data-photo]");
    if (button)
      openPhoto(
        photos.find((p) => p.id === button.dataset.photo),
        button,
      );
  });
  const time = (value) =>
    `${Math.floor((value || 0) / 60)}:${String(Math.floor((value || 0) % 60)).padStart(2, "0")}`;
  function track(item, isVoice) {
    const row = make("div", `track${isVoice ? " voice-track" : ""}`);
    const button = make("button", "track-button", "▶");
    button.type = "button";
    button.setAttribute("aria-label", `Воспроизвести: ${item.title}`);
    button.setAttribute("aria-pressed", "false");
    const info = make("div");
    info.append(
      make("p", "track-title", item.title),
      make("p", "track-caption", item.caption),
    );
    const seek = make("input", "track-progress");
    seek.type = "range";
    seek.min = "0";
    seek.max = "100";
    seek.value = "0";
    seek.step = ".1";
    seek.setAttribute("aria-label", `Позиция воспроизведения: ${item.title}`);
    const player = register(new Audio(item.src));
    player.preload = "metadata";
    row._player = player;
    const update = () => {
      const playing = !player.paused && !player.ended;
      button.textContent = playing ? "Ⅱ" : "▶";
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute(
        "aria-label",
        `${playing ? "Приостановить" : "Воспроизвести"}: ${item.title}`,
      );
    };
    button.onclick = () => {
      if (player.paused)
        player.play().catch(() => {
          info.lastChild.textContent =
            "Не удалось воспроизвести. Попробуйте ещё раз.";
        });
      else player.pause();
    };
    ["play", "pause", "ended"].forEach((event) =>
      player.addEventListener(event, update),
    );
    player.addEventListener("timeupdate", () => {
      seek.value = player.duration
        ? String((player.currentTime / player.duration) * 100)
        : "0";
      seek.setAttribute(
        "aria-valuetext",
        `${time(player.currentTime)} из ${time(player.duration)}`,
      );
    });
    seek.oninput = () => {
      if (Number.isFinite(player.duration))
        player.currentTime = (Number(seek.value) / 100) * player.duration;
    };
    row.append(button, info, seek);
    return row;
  }
  let activeTab = null;
  let panelAnimation = null;
  function selectTab(kind, focus = false) {
    if (kind === activeTab) {
      if (focus) tabs.find(tab => tab.dataset.tab === kind)?.focus();
      return;
    }
    const animate = activeTab !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTab = kind;
    panelAnimation?.cancel();
    panel.querySelectorAll(".track").forEach((row) => {
      row._player?.pause();
      media.delete(row._player);
    });
    panel.replaceChildren();
    panel.scrollTop = 0;
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === kind;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        panel.setAttribute("aria-labelledby", tab.id);
        if (focus) tab.focus();
      }
    });
    if (kind === "photos") {
      const grid = make("div", "media-grid");
      photos.forEach((photo) => {
        const button = make("button", "photo-thumb");
        button.type = "button";
        button.setAttribute("aria-label", `Открыть фото: ${photo.title}`);
        const img = make("img");
        img.src = photo.src;
        img.alt = photo.title;
        img.loading = "lazy";
        if (photo.position) img.style.objectPosition = photo.position;
        button.append(img);
        button.onclick = () => openPhoto(photo, button);
        grid.append(button);
      });
      panel.append(grid);
    } else if (kind === "circles") {
      const grid = make("div", "circle-grid");
      ["Глина оживает", "Внимание к деталям"].forEach((label, i) => {
        const button = make("button", "circle-thumb");
        button.type = "button";
        button.setAttribute("aria-label", `Смотреть кружочек: ${label}`);
        const circle = make("span");
        const img = make("img");
        img.src = "assets/media/pottery.jpg";
        img.alt = "";
        circle.append(img, make("b", "", "▶"));
        button.append(circle, make("span", "", label));
        button.onclick = () => openCircle(i * 5, button);
        grid.append(button);
      });
      panel.append(grid);
    } else {
      const list = make("div", "track-list");
      voiceTracks.forEach((item) => list.append(track(item, true)));
      panel.append(list);
    }
    if (animate) {
      panelAnimation = panel.animate(
        [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 260, easing: 'cubic-bezier(.22,.61,.36,1)' }
      );
    }
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => selectTab(tab.dataset.tab);
    tab.onkeydown = (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft")
        next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next].dataset.tab, true);
      }
    };
  });
  selectTab("photos");
  const voice = register(new Audio(voiceTracks[0].src));
  voice.preload = "metadata";
  const voiceButton = document.querySelector(".voice-bubble .play");
  const voiceBubble = document.querySelector(".voice-bubble");
  const duration = voiceBubble.querySelector(".duration");
  voiceButton.onclick = () => {
    if (voice.paused)
      voice.play().catch(() => {
        duration.textContent = "↻";
      });
    else voice.pause();
  };
  function voiceState() {
    const playing = !voice.paused && !voice.ended;
    voiceButton.textContent = playing ? "Ⅱ" : "▶";
    voiceButton.setAttribute("aria-pressed", String(playing));
    voiceButton.setAttribute(
      "aria-label",
      playing
        ? "Приостановить голосовое сообщение"
        : "Послушать голосовое сообщение",
    );
    voiceBubble.classList.toggle("is-playing", playing);
  }
  ["play", "pause", "ended"].forEach((e) =>
    voice.addEventListener(e, voiceState),
  );
  voice.addEventListener(
    "loadedmetadata",
    () => (duration.textContent = time(voice.duration)),
  );
  voice.addEventListener(
    "timeupdate",
    () =>
      (duration.textContent = time(
        voice.paused ? voice.duration : voice.duration - voice.currentTime,
      )),
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseOthers();
  });
})();
