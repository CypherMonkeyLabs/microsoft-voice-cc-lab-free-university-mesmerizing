import { animate } from "./vendor/anime.esm.min.js";
import rough from "./vendor/rough.esm.js";

let d3Ready = null;
let confettiReady = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-src="' + src + '"]');
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.src = src;
    script.onload = function () {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = function () { reject(new Error(src)); };
    document.body.appendChild(script);
  });
}

function ensureD3() {
  if (!d3Ready) d3Ready = loadScript("vendor/d3.min.js");
  return d3Ready;
}

function ensureConfetti() {
  if (!confettiReady) confettiReady = loadScript("vendor/confetti.browser.js");
  return confettiReady;
}

function countUp() {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const end = Number(node.getAttribute("data-count"));
    if (!Number.isFinite(end)) return;
    const state = { n: 0 };
    node.textContent = String(end);
    try {
      animate(state, {
        n: end,
        duration: 900,
        ease: "out(3)",
        onUpdate: function () { node.textContent = String(Math.round(state.n)); },
      });
    } catch (err) {
      node.textContent = String(end);
    }
  });
}

function pulsePackets() {
  const packets = document.querySelectorAll(".atlas-packet");
  if (!packets.length) return;
  animate(packets, {
    opacity: [0.35, 1],
    duration: 700,
    loop: true,
    alternate: true,
  });
}

function sketchBoundary() {
  const host = document.getElementById("rough-host");
  if (!host || host.dataset.drawn === "1") return;
  host.dataset.drawn = "1";
  try {
  sketchBoundaryDraw(host);
  } catch (err) {
    host.dataset.drawn = "";
  }
}

function sketchBoundaryDraw(host) {
  const pen = rough.svg(host);
  host.appendChild(pen.rectangle(8, 18, 132, 52, { stroke: "#5ee7ff", strokeWidth: 2, roughness: 1.5 }));
  host.appendChild(pen.line(156, 44, 230, 44, { stroke: "#ff7ad9", strokeWidth: 2, roughness: 1.2 }));
  host.appendChild(pen.rectangle(236, 18, 74, 52, { stroke: "#d6ff4a", strokeWidth: 2, roughness: 1.4 }));
  const ns = "http://www.w3.org/2000/svg";
  const label = document.createElementNS(ns, "text");
  label.setAttribute("x", "16");
  label.setAttribute("y", "48");
  label.setAttribute("fill", "currentColor");
  label.setAttribute("font-size", "14");
  label.textContent = "SBC trust";
  host.appendChild(label);
  const carrier = document.createElementNS(ns, "text");
  carrier.setAttribute("x", "246");
  carrier.setAttribute("y", "48");
  carrier.setAttribute("fill", "currentColor");
  carrier.setAttribute("font-size", "13");
  carrier.textContent = "PSTN";
  host.appendChild(carrier);
}

function paintCanvas() {
  const canvas = document.getElementById("signal-canvas");
  if (!canvas || !window.DATA || !window.lessonsIn) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const tracks = window.DATA.tracks || [];
  const values = tracks.map((track) => window.lessonsIn(track.id).length);
  const max = Math.max.apply(null, values.concat([1]));
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#9fb0c8";
  ctx.fillText("Lessons per track in this campus", 8, 16);
  const gap = (width - 16) / Math.max(tracks.length, 1);
  tracks.forEach((track, index) => {
    const bar = Math.max(4, (values[index] / max) * (height - 48));
    const x = 8 + index * gap;
    ctx.fillStyle = index % 2 ? "#7c9cff" : "#3ee0c3";
    ctx.fillRect(x, height - 22 - bar, Math.max(8, gap - 8), bar);
    ctx.fillStyle = "#d5deea";
    ctx.fillText(String(track.num || index + 1), x, height - 8);
  });
}

async function paintD3() {
  const host = document.getElementById("d3-host");
  if (!host || !window.DATA) return;
  try {
    await ensureD3();
  } catch (err) {
    return;
  }
  try {
  const d3 = window.d3;
  if (!d3) return;
  host.innerHTML = "";
  const tracks = window.DATA.tracks || [];
  const data = tracks.map((track) => ({
    name: String(track.num || ""),
    value: window.lessonsIn(track.id).length,
  }));
  const width = 640;
  const height = 180;
  const svg = d3.select(host).append("svg").attr("viewBox", "0 0 " + width + " " + height).attr("role", "img");
  svg.append("title").text("D3 lesson counts for every track");
  const x = d3.scaleBand().domain(data.map((row) => row.name)).range([28, width - 8]).padding(0.18);
  const y = d3.scaleLinear().domain([0, d3.max(data, (row) => row.value) || 1]).range([height - 28, 22]);
  svg.selectAll("rect").data(data).enter().append("rect")
    .attr("x", (row) => x(row.name))
    .attr("y", (row) => y(row.value))
    .attr("width", x.bandwidth())
    .attr("height", (row) => height - 28 - y(row.value))
    .attr("rx", 4)
    .attr("fill", "var(--teal)");
  svg.selectAll("text.n").data(data).enter().append("text")
    .attr("x", (row) => x(row.name) + x.bandwidth() / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "11")
    .text((row) => row.name);
  } catch (err) {
    /* D3 stays a progressive enhancement */
  }
}

function bindParallax() {
  document.querySelectorAll(".parallax").forEach((deck) => {
    if (deck.dataset.bound === "1") return;
    deck.dataset.bound = "1";
    deck.addEventListener("pointermove", function (event) {
      if (document.documentElement.dataset.motion === "reduce") return;
      const rect = deck.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      deck.querySelectorAll(".px").forEach((node) => {
        const depth = Number(node.getAttribute("data-depth") || 12);
        node.style.transform = "rotateX(" + (-y * depth) + "deg) rotateY(" + (x * depth) + "deg) translateZ(12px)";
      });
    });
  });
}

function armVisuals(root) {
  const reduce = document.documentElement.dataset.motion === "reduce";
  ensureConfetti().catch(function () { /* canvas-confetti stays optional */ });
  if (!reduce) {
    try { countUp(); } catch (err) { /* counters already show the final number until anime starts */ }
    try { pulsePackets(); } catch (err) { /* CSS offset-path still moves the packet */ }
  }
  if (root === "home" || root === "track" || root === "charts") {
    sketchBoundary();
    paintCanvas();
    paintD3();
    bindParallax();
  }
  if (root === "diagrams" || root === "flows") {
    if (!reduce) pulsePackets();
    bindParallax();
  }
}

window.armVisuals = armVisuals;
