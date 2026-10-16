import * as THREE from "three";
import { cappedPixelRatio, mobileViewport } from "./pixel.js";

function motionReduced() {
  const mode = document.documentElement.dataset.motion;
  if (mode === "reduce") return true;
  if (mode === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function themeColor() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--cc-accent-2").trim();
  try {
    return new THREE.Color(raw || "#22e6ff");
  } catch (err) {
    return new THREE.Color(0x22e6ff);
  }
}

function mesh(geometry, color, emissiveScale) {
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: emissiveScale,
    roughness: 0.28,
    metalness: 0.18,
  }));
}

function buildGroup(id, color) {
  const group = new THREE.Group();
  const hot = color.clone().offsetHSL(0.08, 0.1, 0.08);
  function put(geometry, x, y, z, scale) {
    const item = mesh(geometry, scale ? hot : color, scale ? 1.4 : 0.85);
    item.position.set(x, y, z);
    group.add(item);
    return item;
  }
  if (id === "t01") {
    put(new THREE.BoxGeometry(1.35, 0.22, 1.35), 0, -0.45, 0, false);
    put(new THREE.BoxGeometry(0.95, 0.2, 0.95), 0, -0.12, 0, true);
    put(new THREE.BoxGeometry(0.55, 0.2, 0.55), 0, 0.18, 0, false);
  } else if (id === "t02") {
    [ -0.28, 0, 0.28, 0.56 ].forEach((y, index) => {
      put(new THREE.CylinderGeometry(0.62 - index * 0.06, 0.62 - index * 0.06, 0.16, 24), 0, y - 0.2, 0, index % 2 === 1);
    });
  } else if (id === "t03") {
    put(new THREE.BoxGeometry(1.3, 0.16, 0.8), 0, -0.15, 0, false);
    put(new THREE.BoxGeometry(0.7, 0.5, 0.08), 0, 0.28, -0.2, true);
    put(new THREE.SphereGeometry(0.1, 12, 12), -0.35, -0.02, 0.2, true);
  } else if (id === "t04") {
    const pts = [];
    for (let i = 0; i <= 24; i += 1) {
      pts.push(new THREE.Vector3(-1.1 + i * 0.09, Math.sin(i * 0.55) * 0.38, 0));
    }
    put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 8, false), 0, 0, 0, true);
    put(new THREE.BoxGeometry(1.4, 0.08, 0.7), 0, -0.55, 0, false);
  } else if (id === "t05") {
    put(new THREE.TorusGeometry(0.48, 0.12, 12, 24), 0, 0.15, 0, true);
    put(new THREE.BoxGeometry(0.28, 0.7, 0.22), 0.15, -0.15, 0, false);
  } else if (id === "t06") {
    put(new THREE.TorusGeometry(0.62, 0.08, 10, 28), 0, 0, 0, true);
    put(new THREE.OctahedronGeometry(0.28), 0, 0, 0, false);
  } else if (id === "t07") {
    [ -0.45, 0, 0.45 ].forEach((x, index) => {
      put(new THREE.BoxGeometry(0.32, 0.7 - index * 0.12, 0.32), x, 0, -index * 0.18, index === 1);
    });
  } else if (id === "t08") {
    put(new THREE.ConeGeometry(0.42, 0.9, 16), 0, 0.15, 0, true);
    put(new THREE.SphereGeometry(0.16, 12, 12), 0, 0.75, 0, false);
    put(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), 0, -0.45, 0, false);
  } else if (id === "t09") {
    put(new THREE.BoxGeometry(0.7, 1.05, 0.16), 0, 0.05, 0, false);
    put(new THREE.BoxGeometry(0.5, 0.35, 0.04), 0, 0.15, 0.1, true);
    put(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 12), 0, -0.55, 0, false);
  } else if (id === "t10") {
    put(new THREE.BoxGeometry(0.9, 0.55, 0.55), -0.15, 0, 0, false);
    put(new THREE.BoxGeometry(0.4, 0.4, 0.4), 0.55, 0.1, 0.1, true);
    put(new THREE.TorusGeometry(0.22, 0.05, 8, 16), 0.55, 0.45, 0.1, true);
  } else if (id === "t11") {
    put(new THREE.IcosahedronGeometry(0.48, 0), 0, 0.05, 0, false);
    put(new THREE.TorusGeometry(0.72, 0.05, 8, 24), 0, 0, 0, true);
  } else if (id === "t12") {
    put(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), 0, 0, 0, false);
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), 0.35, 0.25, 0, true);
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), -0.32, 0.2, 0.1, true);
    group.children[1].rotation.z = 0.8;
    group.children[2].rotation.z = -0.7;
  } else if (id === "t13") {
    put(new THREE.TorusGeometry(0.55, 0.08, 10, 24, Math.PI), 0, 0.1, 0, true);
    put(new THREE.SphereGeometry(0.16, 12, 12), -0.55, -0.15, 0, false);
    put(new THREE.SphereGeometry(0.16, 12, 12), 0.55, -0.15, 0, false);
  } else if (id === "t14") {
    put(new THREE.SphereGeometry(0.28, 16, 16), -0.55, 0, 0, false);
    put(new THREE.SphereGeometry(0.28, 16, 16), 0.55, 0.15, 0, true);
    put(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), 0, 0.05, 0, true);
    group.children[2].rotation.z = Math.PI / 2;
  } else if (id === "t15") {
    put(new THREE.OctahedronGeometry(0.48), 0, 0.1, 0, true);
    put(new THREE.SphereGeometry(0.12, 10, 10), 0.55, 0.45, 0.1, false);
    put(new THREE.SphereGeometry(0.1, 10, 10), -0.5, -0.2, 0.2, false);
  } else if (id === "t16") {
    put(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 24), 0, 0, 0, true);
    put(new THREE.TorusGeometry(0.32, 0.08, 8, 20), 0, -0.28, 0, false);
    put(new THREE.ConeGeometry(0.16, 0.35, 4), 0, 0.28, 0, false);
  } else if (id === "t17") {
    put(new THREE.IcosahedronGeometry(0.55, 1), 0, 0, 0, false);
    group.children[0].material.wireframe = true;
    put(new THREE.SphereGeometry(0.1, 10, 10), 0.45, 0.3, 0.2, true);
    put(new THREE.SphereGeometry(0.08, 10, 10), -0.35, -0.25, 0.3, true);
  } else {
    put(new THREE.OctahedronGeometry(0.5), 0, 0, 0, true);
  }
  return group;
}

export function mount(root) {
  const canvases = root ? root.querySelectorAll("canvas.track-gl") : [];
  if (!canvases.length) return { dispose: function dispose() {} };
  const reduced = motionReduced();
  const gl = document.createElement("canvas");
  gl.width = 160;
  gl.height = 150;
  const mobile = mobileViewport();
  const renderer = new THREE.WebGLRenderer({
    canvas: gl,
    antialias: !mobile,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(cappedPixelRatio());
  renderer.setSize(160, 150, false);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 160 / 150, 0.1, 20);
  camera.position.set(2.4, 1.5, 2.8);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const lamp = new THREE.PointLight(0xffffff, 12, 16);
  lamp.position.set(2, 3, 2);
  scene.add(lamp);
  let tint = themeColor();
  let themeMark = document.documentElement.dataset.theme || "";
  const jobs = [];
  canvases.forEach((canvas) => {
    const id = canvas.getAttribute("data-track") || "t01";
    const group = buildGroup(id, tint);
    jobs.push({ canvas: canvas, ctx: canvas.getContext("2d"), group: group, id: id });
  });
  let stopped = false;
  let paused = false;
  let raf = 0;
  const clock = new THREE.Clock();

  function recolor(next) {
    jobs.forEach((job) => {
      scene.remove(job.group);
      job.group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material && obj.material.dispose) obj.material.dispose();
      });
      job.group = buildGroup(job.id, next);
    });
  }

  function visibleJob(job) {
    const rect = job.canvas.getBoundingClientRect();
    return rect.width > 0 && rect.bottom > -20 && rect.top < window.innerHeight + 20;
  }

  function shouldRun() {
    return !stopped && !reduced && !paused && !document.hidden && jobs.some(visibleJob);
  }

  function halt() {
    paused = true;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function poke() {
    if (stopped || reduced || document.hidden || !jobs.some(visibleJob)) return;
    if (raf) return;
    paused = false;
    frame();
  }

  function onVisibility() {
    if (document.hidden) halt();
    else poke();
  }

  function frame() {
    if (stopped) return;
    const mark = document.documentElement.dataset.theme || "";
    if (mark !== themeMark) {
      themeMark = mark;
      tint = themeColor();
      recolor(tint);
    }
    const t = clock.getElapsedTime();
    const visible = jobs.filter(visibleJob);
    if (!reduced && (document.hidden || !visible.length)) {
      halt();
      return;
    }
    const draw = reduced ? jobs : visible;
    draw.forEach((job) => {
      const spin = (job.id.charCodeAt(2) || 1) * 0.04;
      job.group.rotation.y = t * (0.7 + spin) + spin;
      job.group.rotation.x = Math.sin(t * 0.9 + spin) * 0.35;
      scene.add(job.group);
      renderer.render(scene, camera);
      if (job.ctx) {
        job.ctx.clearRect(0, 0, 160, 150);
        job.ctx.drawImage(gl, 0, 0, 160, 150);
      }
      scene.remove(job.group);
    });
    if (!reduced && shouldRun()) raf = window.requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("scroll", poke, { passive: true });
  frame();
  return {
    dispose: function dispose() {
      stopped = true;
      halt();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", poke);
      jobs.forEach((job) => {
        job.group.traverse((obj) => {
          if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
          if (obj.material && obj.material.dispose) obj.material.dispose();
        });
      });
      renderer.dispose();
    },
  };
}
