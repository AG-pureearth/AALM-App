// app.js — AALM front-end application logic.
// Builds the input form from shared defaults + schema metadata, posts a run config
// to the backend, and renders the model results (summary + interactive chart).

(function () {
  "use strict";
  const API = (window.AALM_API_BASE || "");
  const S = window.AALM_SCHEMA;
  const clone = (o) => (window.structuredClone ? structuredClone(o) : JSON.parse(JSON.stringify(o)));
  const $ = (sel, root = document) => root.querySelector(sel);
  const ce = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const round2 = (x) => Math.round(x * 100) / 100;
  const round3 = (x) => Math.round(x * 1000) / 1000;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  let DEFAULTS = null;   // canonical defaults from /api/defaults (incl. growthBySex)
  let cfg = null;        // the working run configuration
  let lastResult = null; // last successful /api/run response

  // ---------------------------------------------------------------- helpers
  function numInput(value, onChange, opts = {}) {
    const inp = ce("input");
    inp.type = "number";
    inp.value = value;
    if (opts.min != null) inp.min = opts.min;
    if (opts.max != null) inp.max = opts.max;
    if (opts.step != null) inp.step = opts.step; else inp.step = "any";
    const clampOpt = (v) => {
      if (v === "" || isNaN(v)) return v;
      if (opts.min != null && v < opts.min) v = opts.min;
      if (opts.max != null && v > opts.max) v = opts.max;
      return v;
    };
    inp.addEventListener("input", () => {
      const raw = inp.value === "" ? "" : parseFloat(inp.value);
      onChange(clampOpt(raw));
    });
    // On blur, snap the displayed value back into range (e.g. a typed 100 -> the cap).
    inp.addEventListener("change", () => {
      if (inp.value === "") return;
      const c = clampOpt(parseFloat(inp.value));
      if (!isNaN(c)) { inp.value = c; onChange(c); }
    });
    return inp;
  }

  function field(labelText, unit, control, help) {
    const f = ce("div", "field");
    const lab = ce("label");
    lab.textContent = labelText + (unit ? ` (${unit})` : "");
    if (help) { const q = ce("span", "help", "ⓘ"); q.title = help; lab.appendChild(q); }
    f.appendChild(lab);
    f.appendChild(control);
    return f;
  }

  function selectInput(value, options, onChange) {
    const sel = ce("select");
    options.forEach(o => {
      const op = ce("option"); op.value = o.v; op.textContent = o.t;
      if (String(o.v) === String(value)) op.selected = true;
      sel.appendChild(op);
    });
    sel.addEventListener("change", () => onChange(isNaN(+sel.value) ? sel.value : +sel.value));
    return sel;
  }

  function section(title, opts = {}) {
    const sec = ce("section", "card" + (opts.advanced ? " advanced" : ""));
    const head = ce("div", "card-head");
    head.appendChild(ce("h2", null, title));
    const chev = ce("span", "chev", opts.collapsed ? "▸" : "▾");
    head.appendChild(chev);
    const body = ce("div", "card-body");
    if (opts.collapsed) body.style.display = "none";
    head.addEventListener("click", () => {
      const hidden = body.style.display === "none";
      body.style.display = hidden ? "" : "none";
      chev.textContent = hidden ? "▾" : "▸";
    });
    sec.appendChild(head); sec.appendChild(body);
    sec._body = body;
    return sec;
  }

  // editable vector table: ages row + one row per named value array (mutates arrays in place)
  function vectorTable(ages, agesUnit, rows, onStructural, opts = {}) {
    const wrap = ce("div", "vtable-wrap");
    const tbl = ce("table", "vtable");
    // header: ages
    const thead = ce("thead");
    const hr = ce("tr");
    hr.appendChild(ce("th", "rowhdr", `Age (${agesUnit})`));
    ages.forEach((a, ci) => {
      const th = ce("th");
      if (opts.agesEditable === false) {
        th.textContent = (Math.round(a / 365 * 100) / 100); // days -> years display
      } else {
        const inp = numInput(a, (v) => { ages[ci] = v; }, { min: 0 });
        th.appendChild(inp);
      }
      hr.appendChild(th);
    });
    thead.appendChild(hr); tbl.appendChild(thead);
    // body: value rows
    const tb = ce("tbody");
    rows.forEach(r => {
      const tr = ce("tr");
      tr.appendChild(ce("td", "rowhdr", r.label));
      r.arr.forEach((val, ci) => {
        const td = ce("td");
        td.appendChild(numInput(val, (v) => { r.arr[ci] = v; }));
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    wrap.appendChild(tbl);

    if (opts.agesEditable !== false) {
      const ctrls = ce("div", "vtable-ctrls");
      const addB = ce("button", "mini", "+ age");
      addB.type = "button";
      addB.addEventListener("click", () => {
        const last = ages.length ? ages[ages.length - 1] : 0;
        ages.push(last + 1);
        rows.forEach(r => r.arr.push(r.arr.length ? r.arr[r.arr.length - 1] : 0));
        onStructural();
      });
      const delB = ce("button", "mini", "− age");
      delB.type = "button";
      delB.addEventListener("click", () => {
        if (ages.length <= 1) return;
        ages.pop(); rows.forEach(r => r.arr.pop());
        onStructural();
      });
      ctrls.appendChild(addB); ctrls.appendChild(delB);
      wrap.appendChild(ctrls);
    }
    return wrap;
  }

  // ensure media array shapes are consistent with sources + age lengths
  function normalizeMedia(md) {
    const n = Math.max(1, parseInt(md.sources) || 1);
    md.sources = n;
    if (md.mode === "conc") {
      const ca = md.concAgesYr.length, ia = md.intakeAgesYr.length;
      md.concs = md.concs || [];
      md.frac = md.frac || [];
      while (md.concs.length < n) md.concs.push(md.concs.length ? md.concs[0].slice() : new Array(ca).fill(0));
      md.concs.length = n;
      md.concs = md.concs.map(a => fitLen(a, ca, 0));
      while (md.frac.length < n) md.frac.push(new Array(ia).fill(md.frac.length === 0 ? 1 : 0));
      md.frac.length = n;
      md.frac = md.frac.map(a => fitLen(a, ia, 0));
      md.intakeAmt = fitLen(md.intakeAmt, ia, 0);
      md.rba = fitLen(md.rba, n, 1);
      md.masks = md.masks || [];
    } else {
      const sa = md.srcAgesYr.length;
      md.srcAmt = md.srcAmt || [];
      while (md.srcAmt.length < n) md.srcAmt.push(new Array(sa).fill(0));
      md.srcAmt.length = n;
      md.srcAmt = md.srcAmt.map(a => fitLen(a, sa, 0));
      md.rba = fitLen(md.rba, n, 1);
    }
  }
  function fitLen(arr, len, fill) {
    arr = (arr || []).slice();
    while (arr.length < len) arr.push(arr.length ? arr[arr.length - 1] : fill);
    arr.length = len;
    return arr;
  }

  // ---------------------------------------------------------------- sections
  function renderSimulation(parent) {
    const sec = section("Simulation");
    sec.dataset.tour = "sim";
    const b = sec._body;
    const grid = ce("div", "grid");
    grid.appendChild(field(S.sim.simName.label, "", (() => {
      const inp = ce("input"); inp.type = "text"; inp.id = "f-simname"; inp.value = cfg.simName; inp.maxLength = 19;
      inp.addEventListener("input", () => { cfg.simName = inp.value; });
      return inp;
    })(), S.sim.simName.help));
    const MAX_AGE_SPAN = 12;
    const ageWarn = ce("p", "age-warn", "Simulation time cannot exceed 12 years.");
    ageWarn.style.display = "none";
    const ageMinIn = numInput(cfg.sim.ageMinYr, v => { cfg.sim.ageMinYr = v; validateAgeSpan(); }, { min: 0 });
    const ageMaxIn = numInput(cfg.sim.ageMaxYr, v => { cfg.sim.ageMaxYr = v; validateAgeSpan(); }, { min: 0 });
    function validateAgeSpan() {
      const lo = parseFloat(cfg.sim.ageMinYr), hi = parseFloat(cfg.sim.ageMaxYr);
      const span = (isNaN(hi) ? 0 : hi) - (isNaN(lo) ? 0 : lo);
      const bad = span > MAX_AGE_SPAN;
      ageMinIn.classList.toggle("input-error", bad);
      ageMaxIn.classList.toggle("input-error", bad);
      ageWarn.style.display = bad ? "" : "none";
      document.querySelectorAll("#run-btn, .run-btn-lg").forEach(bn => { if (bn) bn.disabled = bad; });
    }
    grid.appendChild(field(S.sim.ageMinYr.label, S.sim.ageMinYr.unit, ageMinIn));
    grid.appendChild(field(S.sim.ageMaxYr.label, S.sim.ageMaxYr.unit, ageMaxIn));
    grid.appendChild(field(S.sim.stepsPerDay.label, "", numInput(cfg.sim.stepsPerDay, v => cfg.sim.stepsPerDay = v, { min: 1, max: 25, step: 1 }), S.sim.stepsPerDay.help));
    grid.appendChild(field(S.sim.sex.label, "", selectInput(cfg.growth.sex, S.sim.sex.options, v => {
      cfg.growth = clone(DEFAULTS.growthBySex[String(v)]);
      renderGrowth(growthHost);
    })));
    grid.appendChild(field(S.sim.solution.label, "", selectInput(cfg.sim.iterate, S.sim.solution.options, v => {
      cfg.sim.iterate = v; iterSec.style.display = v === 1 ? "" : "none";
    }), S.sim.solution.help));
    grid.appendChild(field(S.sim.interp.label, "", selectInput(cfg.sim.interp, S.sim.interp.options, v => cfg.sim.interp = v), S.sim.interp.help));
    grid.appendChild(field(S.sim.irbc.label, "", selectInput(cfg.sim.irbc, S.sim.irbc.options, v => cfg.sim.irbc = v), S.sim.irbc.help));
    b.appendChild(grid);
    b.appendChild(ageWarn);
    b.appendChild(ce("p", "media-doc-note",
      "To fit free web hosting, this app limits simulations to 12 years and 25 steps per day. " +
      "These limits and the default values can be changed — see the README (“Simulation limits”)."));
    validateAgeSpan();
    parent.appendChild(sec);
  }

  function renderMedia(parent) {
    const sec = section("Exposure media");
    sec.dataset.tour = "media";
    const note = ce("p", "media-doc-note");
    note.appendChild(document.createTextNode("Ingestion rates based on the U.S. population can be found in the "));
    const link = ce("a", null, "All Ages Lead Model Technical Guidance document");
    link.href = "docs/AALM-Technical-Support-Document.pdf";
    link.target = "_blank";
    link.rel = "noopener";
    note.appendChild(link);
    note.appendChild(document.createTextNode(" in Appendix C."));
    sec._body.appendChild(note);
    sec._body.appendChild(mediaHost);
    parent.appendChild(sec);
    drawMedia();
  }
  function drawMedia() {
    mediaHost.innerHTML = "";
    Object.keys(S.media).forEach(key => {
      const md = cfg.media[key];
      const meta = S.media[key];
      normalizeMedia(md);
      const card = ce("div", "media-card");
      const head = ce("div", "media-head");
      const cb = ce("input"); cb.type = "checkbox"; cb.checked = !!md.active;
      cb.addEventListener("change", () => { md.active = cb.checked; drawMedia(); });
      const title = ce("label", "media-title");
      title.appendChild(cb); title.appendChild(ce("span", null, " " + meta.label));
      head.appendChild(title);
      if (md.active) {
        const srcWrap = ce("span", "src-sel");
        srcWrap.appendChild(ce("span", "muted", "Sources: "));
        srcWrap.appendChild(selectInput(md.sources, [{ v: 1, t: "1" }, { v: 2, t: "2" }, { v: 3, t: "3" }], v => { md.sources = v; drawMedia(); }));
        head.appendChild(srcWrap);
      }
      card.appendChild(head);

      if (md.active) {
        const body = ce("div", "media-body");
        if (md.mode === "conc") {
          // concentration table
          body.appendChild(ce("div", "subhead", `Concentration (${meta.concUnit})`));
          const concRows = [];
          for (let i = 0; i < md.sources; i++) concRows.push({ label: `Source ${i + 1}`, arr: md.concs[i] });
          body.appendChild(vectorTable(md.concAgesYr, "yr", concRows, drawMedia));
          // intake table
          body.appendChild(ce("div", "subhead", "Intake"));
          const intakeRows = [{ label: `Intake (${meta.intakeUnit})`, arr: md.intakeAmt }];
          if (md.sources > 1) for (let i = 0; i < md.sources; i++) intakeRows.push({ label: `Fraction S${i + 1}`, arr: md.frac[i] });
          body.appendChild(vectorTable(md.intakeAgesYr, "yr", intakeRows, drawMedia));
          // RBA
          body.appendChild(rbaRow(md));
          // masks
          body.appendChild(maskEditor(md));
        } else {
          body.appendChild(ce("div", "subhead", "Intake (source amount)"));
          const rows = [];
          for (let i = 0; i < md.sources; i++) rows.push({ label: `Source ${i + 1} (${meta.amtUnit})`, arr: md.srcAmt[i] });
          body.appendChild(vectorTable(md.srcAgesYr, "yr", rows, drawMedia));
          body.appendChild(rbaRow(md));
        }
        card.appendChild(body);
      }
      mediaHost.appendChild(card);
    });
  }
  function rbaRow(md) {
    const row = ce("div", "rba-row");
    row.appendChild(ce("span", "subhead inline", "Relative bioavailability (RBA): "));
    for (let i = 0; i < md.sources; i++) {
      const w = ce("span", "rba-cell");
      w.appendChild(ce("span", "muted", `S${i + 1} `));
      w.appendChild(numInput(md.rba[i], v => md.rba[i] = v, { min: 0 }));
      row.appendChild(w);
    }
    return row;
  }
  function maskEditor(md) {
    const box = ce("div", "mask-box");
    const head = ce("div", "subhead inline");
    head.textContent = "Time masks (intermittent exposure): ";
    const add = ce("button", "mini", "+ mask"); add.type = "button";
    add.addEventListener("click", () => { md.masks.push({ source: 1, period: 7, first: 6, last: 7 }); drawMedia(); });
    head.appendChild(add);
    box.appendChild(head);
    (md.masks || []).forEach((mk, mi) => {
      const r = ce("div", "mask-row");
      const mkField = (lab, key, opts) => { const s = ce("span", "mask-cell"); s.appendChild(ce("span", "muted", lab)); s.appendChild(numInput(mk[key], v => mk[key] = v, opts)); return s; };
      r.appendChild(mkField("source ", "source", { min: 1, step: 1 }));
      r.appendChild(mkField("period(d) ", "period", { min: 1, step: 1 }));
      r.appendChild(mkField("first day ", "first", { min: 0, step: 1 }));
      r.appendChild(mkField("last day ", "last", { min: 0, step: 1 }));
      const del = ce("button", "mini", "×"); del.type = "button";
      del.addEventListener("click", () => { md.masks.splice(mi, 1); drawMedia(); });
      r.appendChild(del);
      box.appendChild(r);
    });
    return box;
  }

  function renderIter(parent) {
    iterSec = section("Allowable-concentration solver");
    const b = iterSec._body;
    b.appendChild(ce("p", "muted", "Used when Solution type is “Solve for allowable concentration”. Iterates the chosen source to reach the target blood lead level."));
    const grid = ce("div", "grid");
    const m = S.iter;
    const it = cfg.iter;
    grid.appendChild(field(m.media.label, "", selectInput(it.media, m.media.options, v => it.media = v)));
    grid.appendChild(field(m.subtype.label, "", numInput(it.subtype, v => it.subtype = v, { min: 1, step: 1 })));
    grid.appendChild(field(m.dustsoil.label, "", selectInput(it.dustsoil, m.dustsoil.options, v => it.dustsoil = v)));
    grid.appendChild(field(m.targetbll.label, m.targetbll.unit, numInput(it.targetbll, v => it.targetbll = v, { min: 0 })));
    grid.appendChild(field(m.metric.label, "", selectInput(it.metric, m.metric.options, v => it.metric = v)));
    grid.appendChild(field(m.startAgeYr.label, m.startAgeYr.unit, numInput(it.startAgeYr, v => it.startAgeYr = v, { min: 0 })));
    grid.appendChild(field(m.endAgeYr.label, m.endAgeYr.unit, numInput(it.endAgeYr, v => it.endAgeYr = v, { min: 0 })));
    grid.appendChild(field(m.precision.label, "", numInput(it.precision, v => it.precision = v, { min: 0 })));
    grid.appendChild(field(m.maxiter.label, "", numInput(it.maxiter, v => it.maxiter = v, { min: 1, step: 1 })));
    grid.appendChild(field(m.gsd.label, "", numInput(it.gsd, v => it.gsd = v, { min: 1 })));
    grid.appendChild(field(m.tailfrac.label, "", numInput(it.tailfrac, v => it.tailfrac = v, { min: 0 })));
    b.appendChild(grid);
    iterSec.style.display = cfg.sim.iterate === 1 ? "" : "none";
    parent.appendChild(iterSec);
  }

  function renderGrowth(host) {
    host.innerHTML = "";
    const grid = ce("div", "grid");
    Object.keys(S.growth).forEach(k => {
      grid.appendChild(field(S.growth[k].label, S.growth[k].unit, numInput(cfg.growth[k], v => cfg.growth[k] = v)));
    });
    host.appendChild(grid);
  }

  function renderPhysConst(parent) {
    const sec = section("Physiology — constants", { advanced: true, collapsed: true });
    const grid = ce("div", "grid grid-tight");
    Object.keys(S.physConst).forEach(k => {
      const [unit, def] = S.physConst[k];
      grid.appendChild(field(`${def} (${k})`, unit === "--" ? "" : unit, numInput(cfg.physConst[k], v => cfg.physConst[k] = v)));
    });
    sec._body.appendChild(grid);
    parent.appendChild(sec);
  }

  function renderPhysTimeDep(parent) {
    const sec = section("Physiology — age-varying", { advanced: true, collapsed: true });
    sec._body.appendChild(ce("p", "muted", "Each row is a parameter; each column is an age breakpoint (years). Values are filled between breakpoints using the Stepwise/Interpolated setting."));
    const rows = Object.keys(S.physTimeDep).map(k => ({ label: `${S.physTimeDep[k][1]} (${k})`, arr: cfg.physTimeDep[k] }));
    // build with fixed (non-editable) age columns shown in years
    const t = vectorTable(cfg.physAges, "yr", rows, () => {}, { agesEditable: false });
    sec._body.appendChild(t);
    parent.appendChild(sec);
  }

  function renderLung(parent) {
    const sec = section("Lung / respiratory parameters", { advanced: true, collapsed: true });
    sec._body.appendChild(ce("p", "muted", "One column per inhaled-particle source (1–3)."));
    const tbl = ce("table", "vtable");
    const thead = ce("thead"); const hr = ce("tr");
    hr.appendChild(ce("th", "rowhdr", "Parameter"));
    ["Source 1", "Source 2", "Source 3"].forEach(s => hr.appendChild(ce("th", null, s)));
    thead.appendChild(hr); tbl.appendChild(thead);
    const tb = ce("tbody");
    Object.keys(S.lung).forEach(k => {
      const [unit, def] = S.lung[k];
      const tr = ce("tr");
      const rh = ce("td", "rowhdr"); rh.textContent = `${def} (${k})` + (unit ? ` (${unit})` : "");
      tr.appendChild(rh);
      cfg.lung[k].forEach((val, i) => {
        const td = ce("td"); td.appendChild(numInput(val, v => cfg.lung[k][i] = v)); tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); sec._body.appendChild(tbl);
    parent.appendChild(sec);
  }

  // ---------------------------------------------------------------- run + results
  function buildPayload() {
    Object.keys(cfg.media).forEach(k => normalizeMedia(cfg.media[k]));
    const c = clone(cfg);
    if (c.sim.iterate !== 1) c.iter = null;
    delete c.growthBySex;
    return c;
  }

  async function runModel() {
    const btn = $("#run-btn");
    btn.disabled = true; btn.textContent = "Running…";
    setStatus("Running the model — this takes a few seconds (if others are running, yours starts when they finish)…", "busy");
    try {
      const res = await fetch(API + "/api/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      if (!data.ok) {
        setStatus("Run did not complete: " + (data.message || "unknown error"), "error");
        renderError(data);
        showView("results");
        return;
      }
      lastResult = data;
      setStatus(`Run “${data.name}” complete.`, "ok");
      renderResults(data);
      showView("results");
    } catch (e) {
      setStatus("Could not reach the model server. Is it running? " + e.message, "error");
    } finally {
      btn.disabled = false; btn.textContent = "Run model";
    }
  }

  function setStatus(msg, kind) {
    const s = $("#status"); s.textContent = msg; s.className = "status " + (kind || "");
  }

  function renderError(data) {
    const host = $("#results"); host.innerHTML = "";
    const box = ce("div", "errbox");
    box.appendChild(ce("h3", null, "The model stopped before producing results"));
    if (data.message) box.appendChild(ce("p", null, data.message));
    const detail = (data.runInfo || "") + (data.stdoutTail ? "\n\n--- model output (tail) ---\n" + data.stdoutTail : "");
    if (detail.trim()) { const pre = ce("pre", "log"); pre.textContent = detail; box.appendChild(pre); }
    host.appendChild(box);
  }

  let selectedSeries = new Set(["Cblood"]);
  let activeStats = new Set();
  let markerAge = null;
  let focusKey = "Cblood";   // the output parameter the statistics describe
  let meanMode = "arith";    // "arith" (arithmetic) or "geo" (geometric) mean

  function computeStats(xs, ys) {
    let max = -Infinity, maxAge = xs[0], min = Infinity, minAge = xs[0], sum = 0;
    let logSum = 0, posN = 0;
    for (let i = 0; i < ys.length; i++) {
      const v = ys[i];
      sum += v;
      if (v > max) { max = v; maxAge = xs[i]; }
      if (v < min) { min = v; minAge = xs[i]; }
      if (v > 0) { logSum += Math.log(v); posN++; }   // geometric mean uses positive values only
    }
    const n = ys.length;
    return {
      max, maxAge, min, minAge,
      mean: sum / n,
      geomean: posN ? Math.exp(logSum / posN) : NaN,
      final: ys[n - 1], finalAge: xs[n - 1]
    };
  }

  function renderResults(data) {
    const host = $("#results"); host.innerHTML = "";
    const xs = data.xYears;

    // resolve the focus parameter (what the statistics describe); keep it plotted
    if (!focusKey || !data.series[focusKey]) focusKey = "Cblood";
    selectedSeries.add(focusKey);
    const fmeta = S.outputs.meta[focusKey] || { label: focusKey, unit: "" };
    const funit = fmeta.unit || "";
    const fst = computeStats(xs, data.series[focusKey]);

    host.appendChild(ce("h2", "results-title", `Results — “${data.name}”`));
    const forLine = ce("div", "stats-for");
    forLine.appendChild(ce("span", "muted", "Statistics for: "));
    forLine.appendChild(ce("span", "stats-for-name", fmeta.label + (funit ? ` (${funit})` : "")));
    host.appendChild(forLine);

    // interactive summary cards (clickable ones mark themselves on the chart)
    const cards = ce("div", "summary");
    const statCard = (key, label, val, unit, hint) => {
      const c = ce("div", "stat" + (key ? " clickable" : "") + (key && activeStats.has(key) ? " active" : ""));
      c.appendChild(ce("div", "stat-val", val + (unit ? " " + unit : "")));
      c.appendChild(ce("div", "stat-lab", label));
      if (key) {
        c.title = hint;
        c.appendChild(ce("div", "stat-mark", activeStats.has(key) ? "shown on chart ✓" : "click to mark"));
        c.addEventListener("click", () => {
          if (activeStats.has(key)) activeStats.delete(key); else activeStats.add(key);
          renderResults(data);   // re-render to refresh card states + chart
        });
      }
      return c;
    };

    // Mean card with an arithmetic / geometric toggle
    function meanCard() {
      const geo = meanMode === "geo";
      const val = geo ? fst.geomean : fst.mean;
      const c = ce("div", "stat clickable" + (activeStats.has("mean") ? " active" : ""));
      c.title = "Draw the average as a line on the chart";
      c.appendChild(ce("div", "stat-val", (isFinite(val) ? round3(val) : "n/a") + (funit ? " " + funit : "")));
      c.appendChild(ce("div", "stat-lab", (geo ? "Geometric mean " : "Mean ") + fmeta.label));
      const tog = ce("div", "mean-toggle");
      const mk = (mode, text) => {
        const b = ce("button", "mt-btn" + (meanMode === mode ? " on" : ""), text);
        b.type = "button";
        b.addEventListener("click", ev => { ev.stopPropagation(); if (meanMode !== mode) { meanMode = mode; renderResults(data); } });
        return b;
      };
      tog.appendChild(mk("arith", "Mean"));
      tog.appendChild(mk("geo", "Geo. mean"));
      c.appendChild(tog);
      c.appendChild(ce("div", "stat-mark", activeStats.has("mean") ? "shown on chart ✓" : "click to mark"));
      c.addEventListener("click", () => {
        if (activeStats.has("mean")) activeStats.delete("mean"); else activeStats.add("mean");
        renderResults(data);
      });
      return c;
    }

    cards.appendChild(statCard("max", `Max ${fmeta.label}`, round3(fst.max), funit, "Mark the maximum on the chart"));
    cards.appendChild(statCard(null, "Age at max", round2(fst.maxAge), "yr"));
    cards.appendChild(statCard("min", `Min ${fmeta.label}`, round3(fst.min), funit, "Mark the minimum on the chart"));
    cards.appendChild(statCard(null, "Age at min", round2(fst.minAge), "yr"));
    cards.appendChild(meanCard());
    cards.appendChild(statCard("final", `Final ${fmeta.label}`, round3(fst.final), funit, "Mark the final value"));
    host.appendChild(cards);

    host.appendChild(ce("p", "stat-hint",
      "Tip: check a parameter in the Series list (or click its name) to show its statistics here. " +
      "Click a statistic to mark it on the chart; hover the chart to read values."));

    // --- interactive "estimate at a chosen age" panel (uses the focus parameter) ---
    const ageMin = xs[0], ageMax = xs[xs.length - 1];
    if (markerAge == null || markerAge < ageMin || markerAge > ageMax) markerAge = data.summary.peakAgeYr;

    const est = ce("div", "estimator");
    est.appendChild(ce("h3", null, `Estimate ${fmeta.label} at a chosen age`));
    const controls = ce("div", "est-controls");
    controls.appendChild(ce("label", "est-label", "Age (years):"));
    const num = ce("input", "est-num");
    num.type = "number"; num.min = ageMin; num.max = ageMax; num.step = "any"; num.value = round2(markerAge);
    controls.appendChild(num);
    controls.appendChild(ce("span", "muted", `allowed range: ${round2(ageMin)} – ${round2(ageMax)}`));
    est.appendChild(controls);

    const readout = ce("div", "est-readout");
    const big = ce("div", "est-big");
    const bllVal = ce("span", "est-bll", "—");
    big.appendChild(bllVal); big.appendChild(ce("span", "est-unit", funit ? " " + funit : ""));
    const sub = ce("div", "est-sub");
    readout.appendChild(big); readout.appendChild(sub);
    est.appendChild(readout);

    const estTable = ce("div", "est-table");
    est.appendChild(estTable);
    host.appendChild(est);

    function refresh() {
      let a = parseFloat(num.value);
      if (isNaN(a)) a = markerAge;
      a = clamp(a, ageMin, ageMax);
      markerAge = a;
      bllVal.textContent = round3(window.AALM_interp(xs, data.series[focusKey], a));
      sub.textContent = `estimated ${fmeta.label.toLowerCase()} at age ${round2(a)} yr`;
      estTable.innerHTML = "";
      const keys = [...selectedSeries].filter(k => data.series[k] && k !== focusKey);
      if (keys.length) {
        estTable.appendChild(ce("div", "est-th", "Other plotted series at this age"));
        keys.forEach(k => {
          const meta = S.outputs.meta[k] || { label: k, unit: "" };
          const row = ce("div", "est-row");
          row.appendChild(ce("span", "est-k", meta.label + (meta.unit ? ` (${meta.unit})` : "")));
          row.appendChild(ce("span", "est-v", round3(window.AALM_interp(xs, data.series[k], a))));
          estTable.appendChild(row);
        });
      }
      drawChart(data);
    }
    num.addEventListener("input", () => { if (num.value !== "") refresh(); });
    num.addEventListener("change", () => { num.value = round2(markerAge); refresh(); });

    if (data.runInfo && /Allowable|allowable|Solved|solve|target/i.test(data.runInfo)) {
      const ri = ce("details", "runinfo");
      ri.appendChild(ce("summary", null, "Solver / run info"));
      const pre = ce("pre", "log"); pre.textContent = data.runInfo; ri.appendChild(pre);
      host.appendChild(ri);
    }

    // layout: series picker + chart
    const layout = ce("div", "results-layout");
    const picker = ce("div", "series-picker");
    picker.appendChild(ce("h3", null, "Series"));
    picker.appendChild(ce("p", "picker-note", "Check a box to plot. Click a name to show its statistics above (★)."));
    S.outputs.groups.forEach(g => {
      const present = g.keys.filter(k => data.series[k]);
      if (!present.length) return;
      picker.appendChild(ce("div", "pick-group", g.name));
      present.forEach(k => {
        const meta = S.outputs.meta[k] || { label: k, unit: "" };
        const row = ce("div", "pick" + (k === focusKey ? " focus" : ""));
        const cb = ce("input"); cb.type = "checkbox"; cb.checked = selectedSeries.has(k);
        cb.addEventListener("change", () => {
          if (cb.checked) { selectedSeries.add(k); focusKey = k; }
          else { selectedSeries.delete(k); if (focusKey === k) focusKey = [...selectedSeries][0] || "Cblood"; }
          renderResults(data);
        });
        const name = ce("span", "pick-name", " " + meta.label + (meta.unit ? ` (${meta.unit})` : ""));
        name.addEventListener("click", () => { selectedSeries.add(k); focusKey = k; renderResults(data); });
        if (k === focusKey) name.appendChild(ce("span", "focus-badge", " ★"));
        row.appendChild(cb); row.appendChild(name);
        picker.appendChild(row);
      });
    });
    const chartWrap = ce("div", "chart-wrap");
    const chartHost = ce("div"); chartHost.id = "chart"; chartWrap.appendChild(chartHost);
    const dl = ce("button", "secondary", "Download plotted data (CSV)");
    dl.addEventListener("click", () => downloadCsv(data));
    chartWrap.appendChild(dl);

    layout.appendChild(picker); layout.appendChild(chartWrap);
    host.appendChild(layout);

    refresh();   // initial readout + chart (chart host now exists)
  }

  function drawChart(data) {
    const keys = [...selectedSeries].filter(k => data.series[k]);
    const sameUnit = new Set(keys.map(k => (S.outputs.meta[k] || {}).unit));
    const yLabel = sameUnit.size === 1 ? [...sameUnit][0] : "value";
    const series = keys.map((k, i) => ({
      name: (S.outputs.meta[k] || { label: k }).label,
      values: data.series[k],
      color: window.AALM_PALETTE[i % window.AALM_PALETTE.length]
    }));
    const fkey = (focusKey && data.series[focusKey]) ? focusKey : "Cblood";
    const fst = computeStats(data.xYears, data.series[fkey]);
    const ann = { hlines: [], points: [] };
    if (activeStats.has("mean")) {
      const mv = meanMode === "geo" ? fst.geomean : fst.mean;
      if (isFinite(mv)) ann.hlines.push({ y: round3(mv), color: "#CC79A7",
        label: (meanMode === "geo" ? "geo mean " : "mean ") + round3(mv) });
    }
    if (activeStats.has("max")) ann.points.push({ x: fst.maxAge, y: fst.max, color: "#D55E00", label: "max " + round3(fst.max) });
    if (activeStats.has("min")) ann.points.push({ x: fst.minAge, y: fst.min, color: "#0072B2", label: "min " + round3(fst.min) });
    if (activeStats.has("final")) ann.points.push({ x: fst.finalAge, y: fst.final, color: "#009E73", label: "final " + round3(fst.final) });
    renderChart($("#chart"), {
      x: data.xYears, series, xLabel: "Age (years)", yLabel, annotations: ann
    });
  }

  function downloadCsv(data) {
    const keys = [...selectedSeries].filter(k => data.series[k]);
    let csv = "Age_years," + keys.join(",") + "\n";
    for (let i = 0; i < data.xYears.length; i++) {
      csv += data.xYears[i] + "," + keys.map(k => data.series[k][i]).join(",") + "\n";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const a = ce("a"); a.href = URL.createObjectURL(blob); a.download = `${data.name}_plot.csv`; a.click();
    URL.revokeObjectURL(a.href);
  }

  // ---------------------------------------------------------------- bootstrap
  let mediaHost, growthHost, iterSec;
  async function init() {
    try {
      const r = await fetch(API + "/api/defaults");
      DEFAULTS = await r.json();
    } catch (e) {
      setStatus("Could not load defaults from the server. Is the backend running?", "error");
      return;
    }
    cfg = clone(DEFAULTS);
    cfg.growth = clone(DEFAULTS.growthBySex[String(DEFAULTS.growth.sex)] || DEFAULTS.growth);

    // --- Tab 1: Simulation inputs ---
    const vInputs = $("#view-inputs");
    mediaHost = ce("div");
    renderSimulation(vInputs);
    renderMedia(vInputs);
    renderIter(vInputs);

    // bottom action bar so users can run without scrolling back to the top
    const runBar = ce("div", "run-bar");
    const runBtnBottom = ce("button", "run-btn-lg", "Run model");
    runBtnBottom.type = "button";
    runBtnBottom.addEventListener("click", runModel);
    runBar.appendChild(runBtnBottom);
    vInputs.appendChild(runBar);

    // --- Tab 2: Advanced options (growth / physiology / lung) ---
    const vAdv = $("#view-advanced");
    const note = ce("p", "adv-note");
    note.innerHTML = "These parameters are pre-filled with the standard AALM values. " +
      "You only need this tab if you want to change the growth curve, physiology, or lung settings — " +
      "most simulations use the defaults.";
    vAdv.appendChild(note);

    const advDoc = ce("p", "media-doc-note");
    advDoc.appendChild(document.createTextNode("Definitions and recommended values for these parameters can be found in the "));
    const advLink = ce("a", null, "All Ages Lead Model Technical Guidance document");
    advLink.href = "docs/AALM-Technical-Support-Document.pdf";
    advLink.target = "_blank";
    advLink.rel = "noopener";
    advDoc.appendChild(advLink);
    advDoc.appendChild(document.createTextNode("."));
    vAdv.appendChild(advDoc);

    const growthSec = section("Growth parameters", { advanced: true, collapsed: false });
    growthHost = ce("div"); growthSec._body.appendChild(growthHost); renderGrowth(growthHost);
    vAdv.appendChild(growthSec);
    renderPhysConst(vAdv);
    renderPhysTimeDep(vAdv);
    renderLung(vAdv);

    // tab navigation
    document.querySelectorAll(".tab").forEach(t =>
      t.addEventListener("click", () => showView(t.dataset.view)));

    $("#run-btn").addEventListener("click", runModel);
    const tb = $("#tour-btn");
    if (tb) tb.addEventListener("click", () => window.AALM_startTour(true));
    setStatus("Ready. Set your inputs, then press “Run model”.", "");
    if (window.AALM_maybeAutoTour) window.AALM_maybeAutoTour();
  }

  function showView(name) {
    ["inputs", "advanced", "results"].forEach(v => {
      const el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", v !== name);
    });
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.view === name));
    window.scrollTo(0, 0);
  }
  window.AALM_showView = showView;

  document.addEventListener("DOMContentLoaded", init);
})();
