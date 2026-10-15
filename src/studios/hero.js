import * as THREE from "three";

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
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 512, 96);
  ctx.fillStyle = "rgba(6, 2, 16, 0.72)";
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(8, 14, 496, 68, 18);
  else ctx.rect(8, 14, 496, 68);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 36px Segoe UI, Aptos, sans-serif";
  ctx.fillText(text, 28, 60);
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.6, 0.68, 1);
  sprite.userData.texture = texture;
  return sprite;
}

function glowShell(geometry, color) {
  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

export function mount(canvas, themeId) {
  const reduced = motionReduced();
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07010f, 0.011);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(6.2, 3.1, 7.4);

  const root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.PointLight(0xffffff, 30, 60);
  key.position.set(4, 8, 6);
  scene.add(key);

  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.7, 1),
    new THREE.MeshBasicMaterial({ color: 0x22e6ff, wireframe: true })
  );
  root.add(globe);
  const globeGlow = glowShell(new THREE.IcosahedronGeometry(3.15, 1), 0x22e6ff);
  globeGlow.material.opacity = 0.45;
  root.add(globeGlow);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.15, 2),
    new THREE.MeshBasicMaterial({
      color: 0xff2d95,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  root.add(core);

  const rings = [];
  [1, 2, 3].forEach((index) => {
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.35 + index * 0.85, 0.07, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0xff2d95, transparent: true, opacity: 0.9 })
    );
    torus.rotation.x = Math.PI / 2.4 + index * 0.4;
    torus.rotation.y = index * 0.6;
    root.add(torus);
    rings.push(torus);
  });

  const nodeSpecs = [
    { name: "Teams", pos: [-5.4, 0.55, 1.6], color: 0x22e6ff },
    { name: "SIP proxy", pos: [-1.8, 1.7, -0.8], color: 0xff2d95 },
    { name: "SBC", pos: [2.1, 0.7, 1.3], color: 0xd6ff3f },
    { name: "Carrier", pos: [5.5, 1.45, -1.4], color: 0xb388ff },
  ];
  const nodeMats = [];
  const nodeGlows = [];
  const curvePoints = [];
  nodeSpecs.forEach((spec) => {
    const pos = new THREE.Vector3(spec.pos[0], spec.pos[1], spec.pos[2]);
    curvePoints.push(pos);
    const mat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: spec.color,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.58, 28, 28), mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    const shell = glowShell(new THREE.SphereGeometry(1.15, 16, 16), spec.color);
    shell.position.copy(pos);
    scene.add(shell);
    const label = makeLabel(spec.name);
    label.position.copy(pos);
    label.position.y += 1.25;
    scene.add(label);
    nodeMats.push(mat);
    nodeGlows.push(shell.material);
  });

  const curve = new THREE.CatmullRomCurve3(curvePoints);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.07, 8, false),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  scene.add(tube);
  const tubeGlow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, 0.18, 8, false),
    new THREE.MeshBasicMaterial({
      color: 0xff2d95,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(tubeGlow);

  const packet = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const packetGlow = glowShell(new THREE.SphereGeometry(0.38, 12, 12), 0xd6ff3f);
  scene.add(packet);
  scene.add(packetGlow);

  const count = (canvas.parentElement && canvas.parentElement.clientWidth < 800) ? 420 : 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = (Math.random() - 0.35) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pointsMat = new THREE.PointsMaterial({
    color: 0x22e6ff,
    size: 0.11,
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
    grid = new THREE.GridHelper(80, 40, colors.b, colors.a);
    grid.position.y = -2.35;
    const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.72;
    });
    scene.add(grid);
  }

  const colors = { nodes: nodeMats, glows: nodeGlows, globe: globe.material, globeGlow: globeGlow.material, core: core.material, rings: rings.map((ring) => ring.material), tube: tube.material, tubeGlow: tubeGlow.material, packet: packet.material, packetGlow: packetGlow.material, points: pointsMat, key: key };

  function applyPalette(id) {
    const p = palette(id);
    renderer.setClearColor(p.bg, 1);
    scene.fog.color.setHex(p.bg);
    scene.background = new THREE.Color(p.bg);
    buildGrid(p);
    colors.globe.color.setHex(p.b);
    colors.globeGlow.color.setHex(p.b);
    colors.core.color.setHex(p.a);
    colors.rings.forEach((material, index) => material.color.setHex(index === 1 ? p.a : p.c));
    colors.tube.color.setHex(p.b);
    colors.tubeGlow.color.setHex(p.a);
    colors.packet.color.setHex(0xffffff);
    colors.packetGlow.color.setHex(p.c);
    colors.points.color.setHex(p.b);
    colors.key.color.setHex(p.a);
    const nodeColors = [p.b, p.a, p.c, p.b];
    colors.nodes.forEach((material, index) => {
      material.color.setHex(nodeColors[index]);
      material.emissive.setHex(nodeColors[index]);
    });
    colors.glows.forEach((material, index) => material.color.setHex(nodeColors[index]));
    if (reduced) renderer.render(scene, camera);
  }

  let mx = 0;
  let my = 0;
  let stopped = false;
  let raf = 0;
  const clock = new THREE.Clock();

  function resize() {
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || 640;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function update() {
    const t = clock.getElapsedTime();
    const scroll = Math.min((window.scrollY || 0) / 900, 1.2);
    const wobble = Math.sin(t * 0.22) * 0.22;
    const ang = 0.62 + wobble;
    const radius = 6.9 + scroll * 2.2;
    camera.position.x = Math.sin(ang) * radius + mx * 0.9;
    camera.position.z = Math.cos(ang) * radius;
    camera.position.y = 2.7 + Math.sin(t * 0.25) * 0.28 + my * 0.55 + scroll * 1.1;
    camera.lookAt(0, 0.15, 0);
    globe.rotation.y = t * 0.18;
    globe.rotation.x = Math.sin(t * 0.12) * 0.15;
    globeGlow.rotation.copy(globe.rotation);
    core.rotation.y = -t * 0.12;
    core.rotation.z = t * 0.05;
    rings.forEach((ring, index) => {
      ring.rotation.z = t * (0.15 + index * 0.05);
    });
    points.rotation.y = t * 0.02;
    const at = (t * 0.08) % 1;
    const point = curve.getPoint(at);
    packet.position.copy(point);
    packetGlow.position.copy(point);
  }

  function loop() {
    if (stopped) return;
    update();
    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(loop);
  }

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
  applyPalette(themeId || "neon");
  if (reduced) {
    renderer.render(scene, camera);
  } else {
    loop();
  }

  return {
    setPalette: applyPalette,
    dispose: function dispose() {
      stopped = true;
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      observer.disconnect();
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
      renderer.dispose();
    },
  };
}
