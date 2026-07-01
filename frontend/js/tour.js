// tour.js — a small, dependency-free guided walkthrough (spotlight + bubbles).
// Highlights each step needed to run a simulation. Auto-starts on first visit and
// can be replayed with the "Guide" button. No external libraries.

(function () {
  "use strict";

  const STEPS = [
    { center: true, title: "Welcome to the AALM app",
      text: "This 6-step tour shows how to run a simulation. You can replay it any time with the “Guide” button at the top." },
    { sel: "#f-simname", title: "Step 1 — Name your run",
      text: "Type a short name using letters, numbers, or underscores (for example City_Test1). It labels your results files." },
    { sel: '[data-tour="sim"]', title: "Step 2 — Set the basics",
      text: "Choose the start and end age (in years) and the sex. The other settings have sensible defaults — leave them unless you have a reason to change them." },
    { sel: '[data-tour="media"]', title: "Step 3 — Set the exposure",
      text: "Turn on the lead sources that apply, then enter the concentrations and daily intake amounts. Use the “+ age” button to add values at more ages." },
    { sel: '[data-tour="advanced"]', title: "Step 4 — Advanced settings (optional)",
      text: "These sections are pre-filled with standard values. Open them only if you need to change growth, physiology, or lung settings." },
    { sel: "#run-btn", title: "Step 5 — Run the model",
      text: "When your inputs are ready, click “Run model.” It takes a few seconds (longer for very long simulations)." },
    { sel: ".results-col", title: "Step 6 — Read your results",
      text: "Peak, average, and final blood-lead levels appear here with a chart. Tick series on the left to add more lines, and hover the chart to read exact values." }
  ];

  const SEEN_KEY = "aalm_tour_seen";
  let idx = 0;
  let overlay, spot, bubble, arrow, active = false;

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function build() {
    overlay = el("div", "tour-overlay");
    spot = el("div", "tour-spot");
    bubble = el("div", "tour-bubble");
    arrow = el("div", "tour-arrow");
    bubble.appendChild(arrow);

    const h = el("div", "tour-title");
    const p = el("div", "tour-text");
    const foot = el("div", "tour-foot");
    const counter = el("span", "tour-count");
    const btns = el("span", "tour-btns");
    const skip = el("button", "tour-skip"); skip.type = "button"; skip.textContent = "Skip tour";
    const back = el("button", "tour-back"); back.type = "button"; back.textContent = "Back";
    const next = el("button", "tour-next"); next.type = "button"; next.textContent = "Next";
    btns.appendChild(back); btns.appendChild(next);
    foot.appendChild(counter); foot.appendChild(btns);

    const body = el("div", "tour-body");
    body.appendChild(h); body.appendChild(p);
    bubble.appendChild(body); bubble.appendChild(foot);
    bubble.appendChild(skip);

    bubble._title = h; bubble._text = p; bubble._counter = counter;
    bubble._back = back; bubble._next = next;

    skip.addEventListener("click", end);
    back.addEventListener("click", () => go(idx - 1));
    next.addEventListener("click", () => (idx >= STEPS.length - 1 ? end() : go(idx + 1)));

    document.body.appendChild(overlay);
    document.body.appendChild(spot);
    document.body.appendChild(bubble);
  }

  function place() {
    const step = STEPS[idx];
    const target = step.sel ? document.querySelector(step.sel) : null;
    const vw = window.innerWidth, vh = window.innerHeight;

    if (!target) {
      spot.style.display = "none";
      bubble.style.left = Math.max(12, (vw - bubble.offsetWidth) / 2) + "px";
      bubble.style.top = Math.max(12, (vh - bubble.offsetHeight) / 2) + "px";
      arrow.style.display = "none";
      return;
    }

    const r = target.getBoundingClientRect();
    const pad = 6;
    spot.style.display = "block";
    spot.style.left = (r.left - pad) + "px";
    spot.style.top = (r.top - pad) + "px";
    spot.style.width = (r.width + pad * 2) + "px";
    spot.style.height = (r.height + pad * 2) + "px";

    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    const gap = 14;
    const below = r.bottom + gap + bh <= vh;
    let top, arrowTop;
    if (below) { top = r.bottom + gap; arrow.className = "tour-arrow up"; arrowTop = -8; }
    else { top = Math.max(12, r.top - gap - bh); arrow.className = "tour-arrow down"; arrowTop = bh - 1; }

    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(12, Math.min(left, vw - bw - 12));
    bubble.style.left = left + "px";
    bubble.style.top = top + "px";

    arrow.style.display = "block";
    let ax = r.left + r.width / 2 - left - 7;
    ax = Math.max(14, Math.min(ax, bw - 28));
    arrow.style.left = ax + "px";
    arrow.style.top = arrowTop + "px";
  }

  function go(n) {
    idx = Math.max(0, Math.min(n, STEPS.length - 1));
    const step = STEPS[idx];
    bubble._title.textContent = step.title;
    bubble._text.textContent = step.text;
    bubble._counter.textContent = (idx + 1) + " of " + STEPS.length;
    bubble._back.style.visibility = idx === 0 ? "hidden" : "visible";
    bubble._next.textContent = idx >= STEPS.length - 1 ? "Done" : "Next";

    const target = step.sel ? document.querySelector(step.sel) : null;
    if (target && target.scrollIntoView) target.scrollIntoView({ block: "center", inline: "nearest" });
    requestAnimationFrame(() => requestAnimationFrame(place));
  }

  function start(force) {
    if (active) return;
    if (!force && localStorage.getItem(SEEN_KEY)) return;
    try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    active = true; idx = 0;
    build();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("keydown", onKey, true);
    go(0);
  }

  function end() {
    if (!active) return;
    active = false;
    window.removeEventListener("resize", place);
    window.removeEventListener("scroll", place, true);
    document.removeEventListener("keydown", onKey, true);
    [overlay, spot, bubble].forEach(n => n && n.parentNode && n.parentNode.removeChild(n));
  }

  function onKey(e) {
    if (e.key === "Escape") end();
    else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); (idx >= STEPS.length - 1) ? end() : go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
  }

  window.AALM_startTour = start;
  window.AALM_maybeAutoTour = function () { setTimeout(() => start(false), 450); };
})();
