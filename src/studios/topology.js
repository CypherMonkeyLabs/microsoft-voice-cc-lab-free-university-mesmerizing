import * as THREE from "three";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { cappedPixelRatio, mobileViewport } from "./pixel.js";

function motionReduced() {
  const mode = document.documentElement.dataset.motion;
  if (mode === "reduce") return true;
  if (mode === "full") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function makeLabel(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(4, 8, 376, 64, 12);
  else ctx.rect(4, 8, 376, 64);
  ctx.fill();
  ctx.fillStyle = "#f8fafc";
  ctx.font = "600 28px Segoe UI, Aptos, sans-serif";
  ctx.fillText(text, 18, 50);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.5, 1);
  sprite.userData.texture = texture;
  return sprite;
}

function linkMesh(start, end, color) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(0.03, 0.03, Math.max(length, 0.01), 10);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  const glowGeometry = new THREE.CylinderGeometry(0.07, 0.07, Math.max(length, 0.01), 8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(mesh.position);
  glow.quaternion.copy(mesh.quaternion);
  return { mesh, material, glow, glowMaterial };
}

export function mount(canvas) {
  const reduced = motionReduced();
  const mobile = mobileViewport();
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !mobile,
    alpha: true,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(cappedPixelRatio());
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1120, 0.045);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(9.2, 6.4, 11.5);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reduced;
  controls.target.set(0.2, 0.4, 0);
  controls.maxDistance = 28;
  controls.minDistance = 4;

  scene.add(new THREE.AmbientLight(0xf8fafc, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(7, 12, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x818cf8, 8, 30);
  rim.position.set(-4, 4, -3);
  scene.add(rim);
  const mint = new THREE.PointLight(0x2dd4bf, 6, 24);
  mint.position.set(4, 2, 3);
  scene.add(mint);

  const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
  grid.position.y = -1.35;
  scene.add(grid);

  const nodes = {};
  function addNode(id, position, color, label) {
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.28, 28, 28);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.32,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    const sprite = makeLabel(label);
    sprite.position.y = 0.62;
    group.add(sprite);
    group.position.set(position[0], position[1], position[2]);
    scene.add(group);
    nodes[id] = { group: group, material: material, base: color };
  }

  addNode("lon", [-4.4, 1.15, 1.5], 0x818cf8, "London client");
  addNode("man", [-4.3, 0.15, -1.7], 0xa5b4fc, "Manchester client");
  addNode("sip", [-1.5, 1.7, 0.2], 0x2dd4bf, "sip.pstnhub");
  addNode("sip2", [-1.15, 0.75, -0.8], 0x5eead4, "sip2");
  addNode("sip3", [-1.7, 0.25, 1.15], 0x99f6e4, "sip3");
  addNode("lona", [1.7, 1.25, 1.25], 0xfbbf24, "SBC LON-A");
  addNode("lonb", [2.45, 0.35, 2.15], 0xfcd34d, "SBC LON-B");
  addNode("mana", [1.85, 0.15, -1.55], 0xf472b6, "SBC MAN");
  addNode("sba", [3.1, -0.55, -2.15], 0xfb7185, "SBA");
  addNode("pstn", [4.7, 0.7, 0.1], 0x38bdf8, "Carrier");

  const pairs = [
    ["lon", "sip", "media"],
    ["man", "sip2", "wan"],
    ["sip", "lona", "tls"],
    ["sip2", "lona", "tls"],
    ["sip3", "mana", "tls"],
    ["lona", "lonb", "fail"],
    ["lona", "pstn", "pstn"],
    ["lonb", "pstn", "pstn"],
    ["mana", "pstn", "pstn"],
    ["man", "sba", "sba"],
    ["sba", "mana", "sba"],
  ];

  const links = pairs.map((pair) => {
    const built = linkMesh(nodes[pair[0]].group.position, nodes[pair[1]].group.position, 0x5eead4);
    scene.add(built.mesh);
    scene.add(built.glow);
    return { a: pair[0], b: pair[1], kind: pair[2], built: built };
  });

  const packetGeometry = new THREE.SphereGeometry(0.08, 12, 12);
  const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const packets = [0, 1, 2].map((offset) => {
    const mesh = new THREE.Mesh(packetGeometry, packetMaterial.clone());
    scene.add(mesh);
    mesh.userData.offset = offset / 3;
    return mesh;
  });

  const scenario = { lonDown: false, wanDown: false, certFail: false };

  function colorLink(link, color, opacity) {
    link.built.material.color.setHex(color);
    link.built.material.emissive.setHex(color);
    link.built.material.opacity = opacity;
    link.built.glowMaterial.color.setHex(color);
    link.built.glowMaterial.opacity = opacity > 0.4 ? 0.28 : 0.05;
  }

  function apply() {
    Object.keys(nodes).forEach((id) => {
      const node = nodes[id];
      node.material.color.setHex(node.base);
      node.material.emissive.setHex(node.base);
      node.material.emissiveIntensity = 0.55;
    });
    links.forEach((link) => colorLink(link, 0x5eead4, 0.92));
    if (scenario.lonDown) {
      nodes.lona.material.color.setHex(0xef4444);
      nodes.lona.material.emissive.setHex(0xef4444);
      links.forEach((link) => {
        if (link.a === "lona" || link.b === "lona") colorLink(link, link.b === "lonb" || link.a === "lonb" ? 0xfbbf24 : 0xef4444, 0.95);
      });
    }
    if (scenario.wanDown) {
      links.forEach((link) => {
        if (link.kind === "wan") colorLink(link, 0xef4444, 0.45);
        if (link.kind === "sba") colorLink(link, 0xfbbf24, 1);
      });
    }
    if (scenario.certFail) {
      links.forEach((link) => {
        if (link.kind === "tls") colorLink(link, 0xf472b6, 0.9);
      });
    }
  }

  function resize() {
    const parent = canvas.parentElement || canvas;
    const width = parent.clientWidth || 800;
    const height = parent.clientHeight || 460;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement || canvas);

  let frame = 0;
  let running = true;
  let paused = false;
  let onScreen = true;
  const clock = new THREE.Clock();

  function renderFrame() {
    const time = clock.getElapsedTime();
    if (!reduced) {
      const path = scenario.lonDown
        ? ["lon", "sip", "lonb"]
        : scenario.wanDown
          ? ["man", "sba", "mana"]
          : ["lon", "sip", "lona", "pstn"];
      packets.forEach((packet) => {
        const span = path.length - 1;
        const t = (time * 0.22 + packet.userData.offset) % 1;
        const cursor = t * span;
        const i = Math.min(span - 1, Math.floor(cursor));
        const local = cursor - i;
        const from = nodes[path[i]].group.position;
        const to = nodes[path[i + 1]].group.position;
        packet.position.lerpVectors(from, to, local);
        packet.material.color.setHex(scenario.certFail ? 0xf472b6 : 0xf8fafc);
      });
    } else {
      packets.forEach((packet) => { packet.visible = false; });
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function halt() {
    paused = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function resume() {
    if (!running || reduced || document.hidden || !onScreen) return;
    if (frame) return;
    paused = false;
    loop();
  }

  function loop() {
    if (!running || paused) return;
    frame = requestAnimationFrame(loop);
    renderFrame();
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

  apply();
  if (reduced) {
    controls.addEventListener("change", renderFrame);
    renderFrame();
  } else {
    resume();
  }

  return {
    setScenario(next) {
      if (typeof next.lonDown === "boolean") scenario.lonDown = next.lonDown;
      if (typeof next.wanDown === "boolean") scenario.wanDown = next.wanDown;
      if (typeof next.certFail === "boolean") scenario.certFail = next.certFail;
      apply();
      if (reduced) renderFrame();
    },
    dispose() {
      running = false;
      halt();
      document.removeEventListener("visibilitychange", onVisibility);
      seen.disconnect();
      observer.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
        if (obj.userData && obj.userData.texture) obj.userData.texture.dispose();
      });
      renderer.dispose();
    },
  };
}
