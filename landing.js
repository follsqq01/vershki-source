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
// The questionnaire is intentionally deferred; no answers are collected.
const notice = document.querySelector(".notice");
let noticeTimer;
document.querySelector("#test-link").addEventListener("click", () => {
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.hidden = true), 3500);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") notice.hidden = true;
});
function resizeIllustrations() {
  document.documentElement.style.setProperty(
    "--asset-scale",
    String(window.innerWidth / 1512),
  );
}
window.addEventListener("resize", resizeIllustrations);
resizeIllustrations();
