// No Blur: sets any blur() in filter / backdrop-filter to blur(0px),
// keeping other filter functions (grayscale, brightness...) intact.
const HAS_BLUR = /blur\((?!0(px)?\))/;

// Pseudo-elements can't be styled via inline style, so use CSS for them.
const style = document.createElement("style");
style.textContent =
  "*::before,*::after{filter:blur(0px)!important;" +
  "backdrop-filter:blur(0px)!important;-webkit-backdrop-filter:blur(0px)!important}";
(document.head || document.documentElement).appendChild(style);

function fix(el) {
  if (el.nodeType !== 1) return;
  const cs = getComputedStyle(el);
  for (const [prop, css] of [["filter", "filter"], ["backdropFilter", "backdrop-filter"]]) {
    const v = cs[prop];
    if (v && v !== "none" && HAS_BLUR.test(v)) {
      el.style.setProperty(css, v.replace(/blur\([^)]*\)/g, "blur(0px)"), "important");
    }
  }
}

function scan(root) {
  fix(root);
  if (root.querySelectorAll) root.querySelectorAll("*").forEach(fix);
}

let queued = new Set(), raf = 0;
function schedule(node) {
  queued.add(node);
  if (!raf) raf = requestAnimationFrame(() => {
    raf = 0;
    const nodes = queued; queued = new Set();
    nodes.forEach(scan);
  });
}

new MutationObserver(muts => {
  for (const m of muts) {
    if (m.type === "childList") m.addedNodes.forEach(n => n.nodeType === 1 && schedule(n));
    else schedule(m.target);
  }
}).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });

document.addEventListener("DOMContentLoaded", () => scan(document.documentElement));
window.addEventListener("load", () => scan(document.documentElement));
