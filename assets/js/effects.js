/* Offline effects. Vendored MIT/ISC libraries only. No CDN. */
import { animate, createMotionPath } from "../../vendor/anime.esm.min.js";
import * as THREE from "../../vendor/three.module.min.js";
import rough from "../../vendor/rough.esm.js";

function motionReduced() {
  var root = document.documentElement;
  if (root.dataset.motion === "reduce") return true;
  if (root.dataset.motion === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pixelRatio() {
  var mobile = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  return Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
}

function threeCube() {
  var host = document.querySelector("[data-three]");
  if (!host || motionReduced()) return;
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(pixelRatio());
  renderer.setSize(72, 72);
  host.appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 12);
  camera.position.z = 2.6;
  var mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial());
  scene.add(mesh);
  var edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0xfde68a }));
  mesh.add(edge);
  var alive = true;
  function frame() {
    if (!alive || motionReduced()) return;
    mesh.rotation.x += 0.012;
    mesh.rotation.y += 0.018;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
  function stop() { alive = false; }
  document.addEventListener("canon-motion", function () { if (motionReduced()) stop(); });
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", function () { if (motionReduced()) stop(); });
}

function motion() {
  var lane = document.querySelector("#fold-lane");
  var dot = document.querySelector("[data-anime-dot]");
  if (!lane || !dot || motionReduced() || typeof createMotionPath !== "function") return;
  try {
    var path = createMotionPath(lane);
    animate(dot, { ...path, duration: 2800, loop: true, ease: "linear" });
  } catch (err) {
    dot.setAttribute("visibility", "visible");
  }
  var faces = document.querySelectorAll(".mascot-row svg");
  if (faces.length) {
    animate(faces, {
      scale: [1, 1.08, 1],
      delay: function (_el, i) { return i * 140; },
      loop: true,
      duration: 1800
    });
  }
}

function chartData() {
  var node = document.getElementById("chart-data");
  if (!node) return null;
  try { return JSON.parse(node.textContent || "{}"); }
  catch (err) { return null; }
}

function drawD3(data) {
  var host = document.querySelector("[data-d3]");
  if (!host || !data || !window.d3) return;
  var rows = data.tracks || [];
  var width = Math.max(280, host.clientWidth || 640);
  var height = 220;
  var d3 = window.d3;
  var svg = d3.select(host).append("svg").attr("viewBox", "0 0 " + width + " " + height).attr("role", "img");
  svg.append("title").text("Rooms per track, counted from the Canon index");
  var x = d3.scaleBand().domain(rows.map(function (row) { return row.id; })).range([36, width - 8]).padding(0.2);
  var y = d3.scaleLinear().domain([0, d3.max(rows, function (row) { return row.rooms; }) || 1]).range([height - 28, 12]);
  svg.selectAll("rect").data(rows).enter().append("rect")
    .attr("x", function (row) { return x(row.id); })
    .attr("y", function (row) { return y(row.rooms); })
    .attr("width", x.bandwidth())
    .attr("height", function (row) { return height - 28 - y(row.rooms); })
    .attr("fill", function (row) { return row.color; });
  svg.selectAll("text.n").data(rows).enter().append("text")
    .attr("x", function (row) { return x(row.id) + x.bandwidth() / 2; })
    .attr("y", function (row) { return y(row.rooms) - 4; })
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .attr("font-size", "12")
    .text(function (row) { return row.rooms; });
}

function drawCanvas(data) {
  var canvas = document.querySelector("[data-canvas-chart]");
  if (!canvas || !data) return;
  var rows = data.quizzes || [];
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  var w = canvas.width;
  var h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var max = rows.reduce(function (n, row) { return Math.max(n, row.n); }, 1);
  var gap = 8;
  var bar = (w - 24 - gap * rows.length) / Math.max(rows.length, 1);
  rows.forEach(function (row, i) {
    var bh = Math.round(((h - 36) * row.n) / max);
    ctx.fillStyle = row.color;
    ctx.fillRect(16 + i * (bar + gap), h - 22 - bh, bar, bh);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(row.id, 16 + i * (bar + gap) + bar / 2, h - 6);
  });
}

function drawRough() {
  var frame = document.querySelector("[data-rough]");
  if (!frame || !rough || !rough.svg) return;
  var rc = rough.svg(frame);
  frame.appendChild(rc.rectangle(6, 6, 300, 86, { roughness: 1.6, stroke: "#22d3ee", strokeWidth: 2 }));
}

function boot() {
  threeCube();
  motion();
  var data = chartData();
  drawCanvas(data);
  drawRough();
  if (!document.querySelector("[data-d3]")) return;
  function loadD3() {
    if (window.d3) { drawD3(data); return; }
    var tag = document.createElement("script");
    tag.src = new URL("../../vendor/d3.min.js", import.meta.url).href;
    tag.async = true;
    tag.onload = function () { drawD3(data); };
    document.head.appendChild(tag);
  }
  if ("requestIdleCallback" in window) requestIdleCallback(loadD3, { timeout: 1500 });
  else setTimeout(loadD3, 250);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
