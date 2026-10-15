import * as THREE from "three";
import { EffectComposer } from "../vendor/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/postprocessing/UnrealBloomPass.js";

const PALETTES = {
  neon: { bg: 0x07010f, a: 0xff2d95, b: 0x22e6ff, c: 0xd6ff3f },
  holographic: { bg: 0x0a0618, a: 0x7af0ff, b: 0xc084fc, c: 0xf0abfc },
  cyberpunk: { bg: 0x120814, a: 0x39ff14, b: 0xff2bd6, c: 0xffe600 },
  sunset: { bg: 0x1a0a14, a: 0xff6b3d, b: 0xff4d8d, c: 0xffd166 },
  light: { bg: 0xe8eef8, a: 0x2563eb, b: 0x7c3aed, c: 0xdb2777 },
  dark: { bg: 0x0b1120, a: 0x818cf8, b: 0x2dd4bf, c: 0xfbbf24 },
  futuristic: { bg: 0x061018, a: 0x5ee7ff, b: 0x7c9cff, c: 0xd6ff4a },
  gaming: { bg: 0x120814, a: 0x39ff14, b: 0xff2bd6, c: 0xffe600 },
  hc: { bg: 0x000000, a: 0xffff00, b: 0xffffff, c: 0xffff00 },
  teams: { bg: 0x1b1233, a: 0xb9a7ff, b: 0x7ee0c8, c: 0xffd56a },
};

const ORBITS = [
  { name: "Teams", radius: 4.4, tilt: 0.2, speed: 0.24, phase: 0.1, y: 0.35, key: "b" },
  { name: "SIP proxy", radius: 6.1, tilt: 0.7, speed: -0.18, phase: 1.2, y: 1.35, key: "a" },
  { name: "SBC", radius: 7.6, tilt: -0.45, speed: 0.14, phase: 2.4, y: -0.55, key: "c" },
  { name: "Carrier", radius: 9.15, tilt: 0.28, speed: -0.11, phase: 3.5, y: 0.85, key: "b" },
  { name: "Copilot", radius: 5.2, tilt: 1.15, speed: 0.3, phase: 4.3, y: 2.15, key: "a" },
  { name: "Dynamics 365", radius: 8.35, tilt: -0.95, speed: 0.12, phase: 5.2, y: -1.55, key: "c" },
];

const TRAIL = 32;

function palette(id) {
  return PALETTES[id] || PALETTES.neon;
}

function motionReduced() {
  const mode = document.documentElement.dataset.motion;
  if (mode === "reduce") return true;
  if (mode === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 112;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 640, 112);
  ctx.fillStyle = "rgba(6, 2, 16, 0.78)";
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(8, 16, 624, 80, 22);
  else ctx.rect(8, 16, 624, 80);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 40px Segoe UI, Aptos, sans-serif";
  ctx.fillText(text, 28, 70);
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(text.length > 10 ? 3.8 : 3.1, 0.66, 1);
  sprite.userData.texture = texture;
  return sprite;
}

function glowShell(geometry, color) {
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function place(spec, t) {
  const angle = t * spec.speed + spec.phase;
  const x = Math.cos(angle) * spec.radius;
  const z = Math.sin(angle) * spec.radius;
  const y = spec.y + Math.sin(angle * 2) * 0.28 + Math.sin(spec.tilt) * z * 0.22;
  return { x: x, y: y, z: z };
}

function orbitLine(spec, color) {
  const pts = [];
  for (let i = 0; i <= 128; i += 1) {
    const angle = (i / 128) * Math.PI * 2;
    const x = Math.cos(angle) * spec.radius;
    const z = Math.sin(angle) * spec.radius;
    const y = spec.y + Math.sin(spec.tilt) * z * 0.22;
    pts.push(new THREE.Vector3(x, y, z));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
  return new THREE.Line(geo, mat);
}

export function mount(canvas, themeId) {
  const reduced = motionReduced();
  const narrow = (canvas.parentElement && canvas.parentElement.clientWidth < 800);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NoToneMapping;
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07010f, 0.0065);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 160);
  camera.position.set(7.2, 4.4, 12.4);

  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));
  const key = new THREE.PointLight(0xffffff, 26, 80);
  key.position.set(4, 8, 6);
  scene.add(key);

  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.35, 1),
    new THREE.MeshBasicMaterial({ color: 0x22e6ff, wireframe: true })
  );
  root.add(globe);
  const globeGlow = glowShell(new THREE.IcosahedronGeometry(2.7, 1), 0x22e6ff);
  root.add(globeGlow);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 2),
    new THREE.MeshBasicMaterial({
      color: 0xff2d95,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  root.add(core);
  const depthShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(11.2, 1),
    new THREE.MeshBasicMaterial({ color: 0x22e6ff, wireframe: true, transparent: true, opacity: 0.22 })
  );
  scene.add(depthShell);

  const rings = [];
  [1, 2, 3].forEach((index) => {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(2.9 + index * 0.55, 0.045, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0xff2d95, transparent: true, opacity: 0.9 })
    );
    torus.rotation.x = Math.PI / 2.4 + index * 0.45;
    torus.rotation.y = index * 0.55;
    root.add(torus);
    rings.push(torus);
  });

  const orbits = ORBITS.map((spec) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.12,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 24), mat);
    const shell = glowShell(new THREE.SphereGeometry(0.95, 16, 16), 0xffffff);
    const label = makeLabel(spec.name);
    const positions = new Float32Array(TRAIL * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const trail = new THREE.Points(geo, trailMat);
    const ring = orbitLine(spec, 0xffffff);
    scene.add(mesh);
    scene.add(shell);
    scene.add(label);
    scene.add(trail);
    scene.add(ring);
    return {
      spec: spec,
      mesh: mesh,
      shell: shell,
      label: label,
      trail: trail,
      positions: positions,
      history: [],
      mat: mat,
      shellMat: shell.material,
      trailMat: trailMat,
      ringMat: ring.material,
    };
  });

  const packet = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const packetGlow = glowShell(new THREE.SphereGeometry(0.46, 12, 12), 0xd6ff3f);
  scene.add(packet);
  scene.add(packetGlow);

  const count = narrow ? 520 : 1600;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 3 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pointsMat = new THREE.PointsMaterial({
    color: 0x22e6ff,
    size: 0.09,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pointsGeo, pointsMat);
  scene.add(points);

  let grid = null;
  function buildGrid(colors) {
    if (grid) {
      scene.remove(grid);
      grid.geometry.dispose();
      if (grid.material.dispose) grid.material.dispose();
    }
    grid = new THREE.GridHelper(90, 46, colors.b, colors.a);
    grid.position.y = -3.1;
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.55;
    });
    scene.add(grid);
  }

  let composer = null;
  let bloomPass = null;
  function renderScene() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function resize() {
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || 640;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (composer) composer.setSize(width, height);
  }

  function colorOf(colors, key) {
    if (key === "a") return colors.a;
    if (key === "c") return colors.c;
    return colors.b;
  }

  function applyPalette(id) {
    const p = palette(id);
    renderer.setClearColor(p.bg, 1);
    scene.fog.color.setHex(p.bg);
    scene.background = new THREE.Color(p.bg);
    buildGrid(p);
    globe.material.color.setHex(p.b);
    globeGlow.material.color.setHex(p.b);
    core.material.color.setHex(p.a);
    depthShell.material.color.setHex(p.b);
    rings.forEach((ring, index) => ring.material.color.setHex(index === 1 ? p.a : p.c));
    pointsMat.color.setHex(p.b);
    key.color.setHex(p.a);
    packet.material.color.setHex(0xffffff);
    packetGlow.material.color.setHex(p.c);
    orbits.forEach((node) => {
      const hex = colorOf(p, node.spec.key);
      node.mat.color.setHex(hex);
      node.mat.emissive.setHex(hex);
      node.shellMat.color.setHex(hex);
      node.trailMat.color.setHex(hex);
      node.ringMat.color.setHex(hex);
    });
    if (reduced) renderScene();
  }

  let mx = 0;
  let my = 0;
  let stopped = false;
  let paused = false;
  let onScreen = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const voiceNames = ["Teams", "SIP proxy", "SBC", "Carrier"];

  function update() {
    const t = clock.getElapsedTime();
    const scroll = Math.min((window.scrollY || 0) / 900, 1.2);
    const wobble = Math.sin(t * 0.18) * 0.2;
    const ang = 0.5 + wobble;
    const radius = 13.4 + scroll * 1.8;
    camera.position.x = Math.sin(ang) * radius + mx * 1.1;
    camera.position.z = Math.cos(ang) * radius * 0.92;
    camera.position.y = 4.1 + Math.sin(t * 0.22) * 0.35 + my * 0.6 + scroll;
    camera.lookAt(0, 0.25, 0);
    globe.rotation.y = t * 0.18;
    globe.rotation.x = Math.sin(t * 0.12) * 0.12;
    globeGlow.rotation.copy(globe.rotation);
    core.rotation.y = -t * 0.14;
    core.rotation.z = t * 0.05;
    depthShell.rotation.y = -t * 0.03;
    rings.forEach((ring, index) => {
      ring.rotation.z = t * (0.12 + index * 0.04);
    });
    points.rotation.y = t * 0.015;
    orbits.forEach((node) => {
      const p = place(node.spec, t);
      node.mesh.position.set(p.x, p.y, p.z);
      node.shell.position.copy(node.mesh.position);
      node.label.position.set(p.x, p.y + 0.95, p.z);
      node.history.push(p.x, p.y, p.z);
      if (node.history.length > TRAIL * 3) node.history.splice(0, node.history.length - TRAIL * 3);
      for (let i = 0; i < TRAIL; i += 1) {
        const start = node.history.length / 3 - TRAIL;
        const sample = Math.max(0, start + i);
        const idx = Math.floor(sample) * 3;
        node.positions[i * 3] = node.history[idx] || p.x;
        node.positions[i * 3 + 1] = node.history[idx + 1] || p.y;
        node.positions[i * 3 + 2] = node.history[idx + 2] || p.z;
      }
      node.trail.geometry.attributes.position.needsUpdate = true;
    });
    const seg = (t * 0.18) % voiceNames.length;
    const i0 = Math.floor(seg);
    const i1 = (i0 + 1) % voiceNames.length;
    const from = orbits.find((node) => node.spec.name === voiceNames[i0]);
    const to = orbits.find((node) => node.spec.name === voiceNames[i1]);
    if (from && to) {
      const mix = seg - i0;
      packet.position.lerpVectors(from.mesh.position, to.mesh.position, mix);
      packetGlow.position.copy(packet.position);
    }
  }

  function halt() {
    paused = true;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function resume() {
    if (stopped || reduced || document.hidden || !onScreen) return;
    if (raf) return;
    paused = false;
    loop();
  }

  function loop() {
    if (stopped || paused) return;
    update();
    renderScene();
    raf = window.requestAnimationFrame(loop);
  }

  function onVisibility() {
    if (document.hidden) halt();
    else resume();
  }

  const seen = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    if (onScreen) resume();
    else halt();
  });
  seen.observe(canvas);
  document.addEventListener("visibilitychange", onVisibility);

  function onMove(event) {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    mx = (event.clientX / width - 0.5) * 2;
    my = (event.clientY / height - 0.5) * 2;
  }

  const observer = new ResizeObserver(resize);
  if (canvas.parentElement) observer.observe(canvas.parentElement);
  window.addEventListener("pointermove", onMove, { passive: true });
  resize();
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const size = renderer.getSize(new THREE.Vector2());
    bloomPass = new UnrealBloomPass(size, 0.78, 0.52, 0.08);
    composer.addPass(bloomPass);
  } catch (err) {
    composer = null;
    bloomPass = null;
  }
  applyPalette(themeId || "neon");
  if (reduced) {
    update();
    renderScene();
  } else {
    resume();
  }

  return {
    setPalette: applyPalette,
    dispose: function dispose() {
      stopped = true;
      halt();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      seen.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
        if (obj.material) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material];
          list.forEach((material) => {
            if (material.map && material.map.dispose) material.map.dispose();
            if (material.dispose) material.dispose();
          });
        }
        if (obj.userData && obj.userData.texture && obj.userData.texture.dispose) obj.userData.texture.dispose();
      });
      if (composer && composer.dispose) composer.dispose();
      renderer.dispose();
    },
  };
}
