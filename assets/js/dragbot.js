/* Draggable guide bot, adapted from the UC lab guide/dragbot.js and the NICE campus/js/dragbot.mjs.
   Pointer Events drag, edge snap with bounce, tilt from velocity, saved position, reset button.
   With no saved spot the bot stays at its home corner and steps aside to the nearest clear spot when
   it would cover a heading. Hidden under the full-screen menu by CSS. Self-contained, no dependencies. */
(function () {
  var CFG = /*CFG*/{"dock": ".mvcc-bot", "handle": ".bot-launch", "tilt": ".monkey-svg", "key": "mvcc-bot-pos-v1", "bottom": ".phone-dock", "main": "main", "sheet": ".is-open", "sheetMax": 720}/*END*/;
  var M = 8, tries = 0;
  function boot() {
    var dock = document.querySelector(CFG.dock);
    if (!dock) { if (++tries < 50) setTimeout(boot, 100); return; }
    init(dock);
  }
  function init(dock) {
    if (dock.getAttribute("data-dragbot")) return;
    dock.setAttribute("data-dragbot", "1");
    var handle = (CFG.handle && dock.querySelector(CFG.handle)) || dock;
    var calm = matchMedia("(prefers-reduced-motion: reduce)");
    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "bot-reset";
    reset.hidden = true;
    reset.setAttribute("aria-label", "Move the guide back to its home spot");
    reset.textContent = "\u21BA";
    document.body.appendChild(reset);
    var pos = null, drag = null, dodge = null, timer = 0, swallow = false;
    try { pos = JSON.parse(localStorage.getItem(CFG.key)); } catch (e) { pos = null; }
    if (!pos || typeof pos.fx !== "number" || typeof pos.fy !== "number") pos = null;

    function sheet() { return !!CFG.sheet && matchMedia("(max-width: " + (CFG.sheetMax || 800) + "px)").matches && dock.matches(CFG.sheet); }
    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), Math.max(lo, hi)); }
    function shown() { return dock.offsetWidth > 0 && getComputedStyle(dock).visibility !== "hidden"; }
    function bounds() {
      var bar = CFG.bottom && document.querySelector(CFG.bottom), bottom = M;
      if (bar && getComputedStyle(bar).display !== "none" && bar.getBoundingClientRect().height > 0) bottom = Math.max(M, innerHeight - bar.getBoundingClientRect().top + M);
      return { x0: M, y0: M, x1: innerWidth - dock.offsetWidth - M, y1: innerHeight - dock.offsetHeight - bottom };
    }
    function place(x, y) {
      var s = dock.style;
      s.setProperty("left", Math.round(x) + "px", "important"); s.setProperty("top", Math.round(y) + "px", "important");
      s.setProperty("right", "auto", "important"); s.setProperty("bottom", "auto", "important");
      dock.setAttribute("data-x", x + dock.offsetWidth / 2 < innerWidth / 2 ? "left" : "right");
      dock.setAttribute("data-y", y + dock.offsetHeight / 2 < innerHeight / 2 ? "top" : "bottom");
      nudge();
    }
    function home() { var s = dock.style; s.removeProperty("left"); s.removeProperty("top"); s.removeProperty("right"); s.removeProperty("bottom"); dock.removeAttribute("data-x"); dock.removeAttribute("data-y"); }
    function nudge() {
      var r = dock.getBoundingClientRect(), s = reset.style, w = 32;
      s.left = Math.round(clamp(r.left - 4, 4, innerWidth - w - 4)) + "px";
      s.top = Math.round(clamp(r.top - 4, 4, innerHeight - w - 4)) + "px";
    }
    function apply() {
      if (drag && drag.moved) return;
      dock.classList.toggle("is-moved", !!pos);
      if (!shown()) { reset.hidden = true; return; }
      reset.hidden = !pos || sheet();
      if (sheet()) { home(); return; }
      if (pos) {
        var b = bounds();
        place(clamp(b.x0 + pos.fx * (b.x1 - b.x0), b.x0, b.x1), clamp(b.y0 + pos.fy * (b.y1 - b.y0), b.y0, b.y1));
        return;
      }
      if (dodge) place(dodge.x, dodge.y); else home();
      if (!reset.hidden) nudge();
    }
    function store(x, y) {
      var b = bounds();
      pos = { fx: b.x1 > b.x0 ? (x - b.x0) / (b.x1 - b.x0) : 0, fy: b.y1 > b.y0 ? (y - b.y0) / (b.y1 - b.y0) : 0 };
      try { localStorage.setItem(CFG.key, JSON.stringify(pos)); } catch (e) { /* storage off */ }
    }
    function tiltEl() { return (CFG.tilt && dock.querySelector(CFG.tilt)) || dock.firstElementChild; }
    function tilt(rx, ry, lift) {
      var el = tiltEl();
      if (!el) return;
      el.style.transformOrigin = "50% 60%";
      el.style.transform = rx || ry || lift ? "perspective(600px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale(" + (lift ? 1.08 : 1) + ")" : "";
      dock.classList.toggle("is-lifted", !!lift);
    }
    function goHome() {
      pos = null; dodge = null;
      try { localStorage.removeItem(CFG.key); } catch (e) { /* storage off */ }
      dock.classList.add("is-snapping"); home(); apply(); tilt(0, 0, 0); reset.hidden = true; schedule(450);
    }

    function headings() {
      var main = document.querySelector(CFG.main) || document.getElementById("main") || document.body;
      return Array.prototype.slice.call(main.querySelectorAll("h1, h2, h3")).filter(function (n) { return !n.closest(CFG.dock) && !n.closest("[hidden]"); }).map(function (n) { var g = document.createRange(); g.selectNodeContents(n); return g.getBoundingClientRect(); }).filter(function (r) { return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; });
    }
    function hits(x, y, w, h, list) {
      return list.some(function (r) { return x < r.right + 6 && x + w > r.left - 6 && y < r.bottom + 6 && y + h > r.top - 6; });
    }
    function dodgeHeadings() {
      if (pos || drag || !shown() || sheet()) return;
      var list = headings(), b = bounds(), w = dock.offsetWidth, h = dock.offsetHeight, pick = null;
      // Measure the home corner, not a previous dodge.
      var keep = dodge; dodge = null;
      dock.style.transition = "none";
      home();
      var hr = dock.getBoundingClientRect();
      var hx = hr.left, hy = hr.top;
      if (keep) place(keep.x, keep.y);
      void dock.offsetWidth;
      dock.style.transition = "";
      if (hits(hx, hy, w, h, list)) {
        var best = 1e12, x, y, d;
        for (x = b.x1; x >= b.x0; x -= 40) for (y = b.y1; y >= b.y0; y -= 24) {
          if (hits(x, y, w, h, list)) continue;
          d = Math.pow(x - hx, 2) + Math.pow(y - hy, 2);
          if (d < best) { best = d; pick = { x: x, y: y }; }
        }
      }
      var same = (!pick && !keep) || (pick && keep && pick.x === keep.x && pick.y === keep.y);
      dodge = keep;
      if (same) return;
      dodge = pick;
      dock.classList.add("is-snapping");
      if (pick) place(pick.x, pick.y); else { home(); reset.hidden = true; }
    }
    function schedule(ms) { clearTimeout(timer); timer = setTimeout(dodgeHeadings, ms === undefined ? 260 : ms); }

    handle.style.touchAction = "none";
    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || sheet()) return;
      var hit = e.target.closest && e.target.closest("button, a, input, select, textarea, .idle-chip, .bot-panel");
      if (hit && hit !== dock && hit !== handle && dock.contains(hit)) return;
      var r = dock.getBoundingClientRect();
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, x: r.left, y: r.top, px: e.clientX, py: e.clientY, t: e.timeStamp, vx: 0, vy: 0, moved: false };
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* no capture */ }
    });
    handle.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
      if (!drag.moved) { drag.moved = true; dock.classList.remove("is-snapping"); }
      var b = bounds(), dt = Math.max(1, e.timeStamp - drag.t);
      drag.vx = drag.vx * 0.6 + ((e.clientX - drag.px) / dt) * 0.4;
      drag.vy = drag.vy * 0.6 + ((e.clientY - drag.py) / dt) * 0.4;
      drag.px = e.clientX; drag.py = e.clientY; drag.t = e.timeStamp;
      drag.x = clamp(drag.ox + e.clientX - drag.sx, b.x0, b.x1);
      drag.y = clamp(drag.oy + e.clientY - drag.sy, b.y0, b.y1);
      place(drag.x, drag.y);
      if (!calm.matches) tilt(clamp(-drag.vy * 22, -25, 25).toFixed(1), clamp(drag.vx * 22, -25, 25).toFixed(1), true);
      else tilt(0, 0, true);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* released */ }
      if (!d.moved) return;
      swallow = true; setTimeout(function () { swallow = false; }, 60);
      var b = bounds(), dist = [d.x - b.x0, b.x1 - d.x, d.y - b.y0, b.y1 - d.y], k = dist.indexOf(Math.min.apply(null, dist));
      var x = k === 0 ? b.x0 : k === 1 ? b.x1 : d.x, y = k === 2 ? b.y0 : k === 3 ? b.y1 : d.y;
      dock.classList.add("is-snapping");
      place(x, y); tilt(0, 0, 0); store(x, y); dock.classList.add("is-moved"); reset.hidden = false;
      setTimeout(nudge, 330);
    }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
    handle.addEventListener("click", function (e) { if (swallow) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    dock.addEventListener("transitionend", function (e) { if (e.target === dock) { dock.classList.remove("is-snapping"); nudge(); } });
    reset.addEventListener("click", goHome);
    addEventListener("resize", function () { apply(); schedule(); });
    addEventListener("scroll", function () { schedule(); }, { passive: true });
    addEventListener("hashchange", function () { dodge = null; apply(); schedule(700); });
    new MutationObserver(function () { apply(); schedule(); }).observe(dock, { attributes: true, attributeFilter: ["class", "hidden"] });
    var main = document.querySelector(CFG.main) || document.body;
    new MutationObserver(function () { schedule(400); }).observe(main, { childList: true, subtree: true });
    apply();
    schedule(900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
