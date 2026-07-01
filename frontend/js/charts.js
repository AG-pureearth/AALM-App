// charts.js — dependency-free SVG line chart for AALM results.
// renderChart(container, { x, series, xLabel, yLabel }) where
//   x      : array of numbers (shared x axis, e.g. age in years)
//   series : [{ name, color, values: [numbers aligned to x] }]

(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const PALETTE = ["#1f6feb", "#d1242f", "#1a7f37", "#9a6700", "#8250df",
                   "#bf3989", "#0969da", "#cf222e", "#116329", "#4d2d00"];

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function niceTicks(min, max, count) {
    if (min === max) { max = min + 1; }
    const span = max - min;
    const step0 = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag;
    let step;
    if (norm < 1.5) step = 1; else if (norm < 3) step = 2; else if (norm < 7) step = 5; else step = 10;
    step *= mag;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
    return ticks;
  }

  function fmt(v) {
    if (v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 1000 || a < 0.01) return v.toExponential(1);
    return (Math.round(v * 1000) / 1000).toString();
  }

  // linear interpolation of ys (aligned to xs) at position x
  function interpSeries(xs, ys, x) {
    const n = xs.length;
    if (!n) return 0;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] <= x) lo = mid; else hi = mid; }
    const t = (x - xs[lo]) / (xs[hi] - xs[lo] || 1);
    return ys[lo] + t * (ys[hi] - ys[lo]);
  }
  window.AALM_interp = interpSeries;

  window.renderChart = function (container, opts) {
    container.innerHTML = "";
    const x = opts.x || [];
    const series = (opts.series || []).filter(s => s.values && s.values.length);
    const W = container.clientWidth || 720;
    const H = opts.height || 420;
    const m = { t: 16, r: 18, b: 46, l: 64 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, class: "chart" }, container);

    if (!series.length || !x.length) {
      el("text", { x: W / 2, y: H / 2, "text-anchor": "middle", fill: "#777" }, svg).textContent =
        "Select one or more series to plot.";
      return;
    }

    let xmin = Math.min(...x), xmax = Math.max(...x);
    let ymin = Infinity, ymax = -Infinity;
    for (const s of series) for (const v of s.values) { if (v < ymin) ymin = v; if (v > ymax) ymax = v; }
    const ann = opts.annotations || {};
    (ann.hlines || []).forEach(h => { if (h.y < ymin) ymin = h.y; if (h.y > ymax) ymax = h.y; });
    (ann.points || []).forEach(p => { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; });
    if (!isFinite(ymin)) { ymin = 0; ymax = 1; }
    if (ymin === ymax) { ymax = ymin + 1; }
    if (ymin > 0) ymin = 0;                       // anchor at zero for readability
    ymax += (ymax - ymin) * 0.06;

    const sx = v => m.l + (v - xmin) / (xmax - xmin || 1) * iw;
    const sy = v => m.t + ih - (v - ymin) / (ymax - ymin || 1) * ih;

    // gridlines + axis labels
    for (const ty of niceTicks(ymin, ymax, 6)) {
      const yy = sy(ty);
      el("line", { x1: m.l, y1: yy, x2: m.l + iw, y2: yy, stroke: "#e6e8eb" }, svg);
      el("text", { x: m.l - 8, y: yy + 4, "text-anchor": "end", class: "axis" }, svg).textContent = fmt(ty);
    }
    for (const tx of niceTicks(xmin, xmax, 8)) {
      const xx = sx(tx);
      el("line", { x1: xx, y1: m.t, x2: xx, y2: m.t + ih, stroke: "#f0f2f4" }, svg);
      el("text", { x: xx, y: m.t + ih + 18, "text-anchor": "middle", class: "axis" }, svg).textContent = fmt(tx);
    }
    // axes
    el("line", { x1: m.l, y1: m.t + ih, x2: m.l + iw, y2: m.t + ih, stroke: "#9aa0a6" }, svg);
    el("line", { x1: m.l, y1: m.t, x2: m.l, y2: m.t + ih, stroke: "#9aa0a6" }, svg);
    el("text", { x: m.l + iw / 2, y: H - 6, "text-anchor": "middle", class: "axis-title" }, svg).textContent = opts.xLabel || "";
    const yt = el("text", { x: 14, y: m.t + ih / 2, "text-anchor": "middle", class: "axis-title",
                            transform: `rotate(-90 14 ${m.t + ih / 2})` }, svg);
    yt.textContent = opts.yLabel || "";

    // series paths
    series.forEach((s, i) => {
      const color = s.color || PALETTE[i % PALETTE.length];
      let d = "";
      for (let k = 0; k < x.length; k++) {
        d += (k === 0 ? "M" : "L") + sx(x[k]).toFixed(1) + " " + sy(s.values[k]).toFixed(1) + " ";
      }
      el("path", { d, fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    });

    // annotations (from interactive summary statistics)
    (ann.hlines || []).forEach(h => {
      const yy = sy(h.y);
      el("line", { x1: m.l, y1: yy, x2: m.l + iw, y2: yy, stroke: h.color, "stroke-width": 1.5, "stroke-dasharray": "6 4" }, svg);
      const t = el("text", { x: m.l + iw - 4, y: yy - 5, "text-anchor": "end", class: "annot", fill: h.color }, svg);
      t.textContent = h.label;
    });
    (ann.points || []).forEach(p => {
      const px = sx(p.x), py = sy(p.y);
      el("line", { x1: px, y1: py, x2: px, y2: m.t + ih, stroke: p.color, "stroke-width": 1, "stroke-dasharray": "4 3" }, svg);
      el("circle", { cx: px, cy: py, r: 4.5, fill: p.color, stroke: "#fff", "stroke-width": 1.5 }, svg);
      const t = el("text", { x: Math.min(px + 6, W - m.r - 60), y: py - 7, class: "annot", fill: p.color }, svg);
      t.textContent = p.label;
    });

    // user-set age marker (from the "estimate at age" control)
    if (opts.marker && opts.marker.x != null && opts.marker.x >= xmin && opts.marker.x <= xmax) {
      const mx2 = opts.marker.x, px = sx(mx2);
      el("line", { x1: px, y1: m.t, x2: px, y2: m.t + ih, stroke: "#0b3d63", "stroke-width": 2 }, svg);
      series.forEach((s, i) => {
        const yv = interpSeries(x, s.values, mx2);
        el("circle", { cx: px, cy: sy(yv), r: 4.5, fill: s.color || PALETTE[i % PALETTE.length], stroke: "#0b3d63", "stroke-width": 1.5 }, svg);
      });
      const lab = el("text", { x: Math.min(px + 6, W - m.r - 48), y: m.t + 12, class: "annot", fill: "#0b3d63" }, svg);
      lab.textContent = "age " + fmt(mx2);
    }

    // hover crosshair + tooltip
    const hoverLine = el("line", { y1: m.t, y2: m.t + ih, stroke: "#9aa0a6", "stroke-dasharray": "3 3", visibility: "hidden" }, svg);
    const dots = series.map((s, i) =>
      el("circle", { r: 3.5, fill: s.color || PALETTE[i % PALETTE.length], visibility: "hidden" }, svg));
    const tip = document.createElement("div");
    tip.className = "chart-tip"; tip.style.display = "none";
    container.style.position = "relative";
    container.appendChild(tip);

    const overlay = el("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent" }, svg);
    overlay.addEventListener("mousemove", ev => {
      const pt = svg.getBoundingClientRect();
      const scale = W / pt.width;
      const mxData = xmin + ((ev.clientX - pt.left) * scale - m.l) / iw * (xmax - xmin);
      // nearest index
      let lo = 0, hi = x.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (x[mid] < mxData) lo = mid; else hi = mid; }
      const k = (Math.abs(x[lo] - mxData) <= Math.abs(x[hi] - mxData)) ? lo : hi;
      const xx = sx(x[k]);
      hoverLine.setAttribute("x1", xx); hoverLine.setAttribute("x2", xx);
      hoverLine.setAttribute("visibility", "visible");
      let rows = `<div class="tip-x">${opts.xLabel || "x"}: <b>${fmt(x[k])}</b></div>`;
      series.forEach((s, i) => {
        dots[i].setAttribute("cx", xx); dots[i].setAttribute("cy", sy(s.values[k]));
        dots[i].setAttribute("visibility", "visible");
        const color = s.color || PALETTE[i % PALETTE.length];
        rows += `<div><span class="tip-dot" style="background:${color}"></span>${s.name}: <b>${fmt(s.values[k])}</b></div>`;
      });
      tip.innerHTML = rows; tip.style.display = "block";
      const left = Math.min(xx + 12, W - 160);
      tip.style.left = (left / W * 100) + "%";
      tip.style.top = "10px";
    });
    overlay.addEventListener("mouseleave", () => {
      hoverLine.setAttribute("visibility", "hidden");
      dots.forEach(d => d.setAttribute("visibility", "hidden"));
      tip.style.display = "none";
    });

    return { palette: PALETTE };
  };

  window.AALM_PALETTE = PALETTE;
})();
