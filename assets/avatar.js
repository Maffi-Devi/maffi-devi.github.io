/* Scroll-driven 3D character built from three.js primitives.
   Stage 0 (hero): bust, head follows the pointer.
   Stage 1 (about): closer, moves beside the text.
   Stage 2 (what I do): sits at a desk and types on a laptop.
   The canvas is fixed behind the page; each stage is anchored to a .slot element. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const slots = [...document.querySelectorAll('.slot[data-stage]')];
if (!slots.length) throw new Error('no slots');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
} catch (e) {
  document.documentElement.classList.add('no-gl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const canvas = renderer.domElement;
canvas.className = 'stage';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

const scene = new THREE.Scene();
const FOV = 28;
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/* ── lights ── */
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1640, 0.75));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2.5, 3.5, 6); scene.add(key);
const rimL = new THREE.DirectionalLight(0x9b6bff, 4); rimL.position.set(-5, 2.5, -3); scene.add(rimL);
const rimR = new THREE.DirectionalLight(0xff78d2, 2.6); rimR.position.set(5, 1.2, -3); scene.add(rimR);

/* ── materials ── */
const mat = (color, roughness = 0.55, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
const skin = mat(0xe4dadb, 0.5);
const cloth = mat(0xd3cadc, 0.72);
const blazer = mat(0x4b3f5e, 0.62);
const lapel = mat(0x5b4d72, 0.55);
const pants = mat(0x2e2738, 0.65);
const hair = mat(0x2a2131, 0.42);
const dark = mat(0x17121b, 0.35);
const lip = mat(0xc98896, 0.5);
const gold = mat(0xe8c27a, 0.25, { metalness: 0.6 });
const blush = mat(0xf2a3b8, 0.6, { transparent: true, opacity: 0.45 });
const white = mat(0xffffff, 0.2);
const furniture = mat(0xe9e5ef, 0.45);
const metal = mat(0xbdb6c8, 0.3, { metalness: 0.5 });
const laptopShell = mat(0xd96aa6, 0.35, { metalness: 0.3 });
const keys = mat(0x2b2433, 0.6);

const mesh = (geo, m, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...pos); o.scale.set(...scale); o.rotation.set(...rot);
  return o;
};
const sphere = (r, seg = 48) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.66));
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 12, 24);

/* ── rig ── */
const rig = new THREE.Group();
scene.add(rig);
const body = new THREE.Group();
rig.add(body);

// torso: lathe profile gives sloped, rounded shoulders
const profile = [[0, 1.08], [0.3, 1.06], [0.52, 0.98], [0.74, 0.86], [0.86, 0.7], [0.9, 0.45], [0.86, 0.1], [0.8, -0.5], [0.8, -1.15], [0, -1.15]]
  .map(([x, y]) => new THREE.Vector2(x, y));
body.add(mesh(new THREE.LatheGeometry(profile, 64), blazer, [0, 0, 0], [1, 1, 0.58]));
body.add(mesh(sphere(0.5), cloth, [0, 0.62, 0.3], [0.5, 0.95, 0.42]));
[-1, 1].forEach(s => body.add(mesh(new THREE.BoxGeometry(0.13, 0.85, 0.05), lapel, [s * 0.24, 0.52, 0.47], [1, 1, 1], [0.1, 0, -s * 0.36])));
body.add(mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.26, 40), cloth, [0, 1.13, 0]));
body.add(mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.36, 32), skin, [0, 1.3, 0]));

// arms: shoulder → upper arm → elbow → forearm → hand
const arms = [-1, 1].map(s => {
  const shoulder = new THREE.Group();
  shoulder.position.set(s * 0.74, 0.78, 0);
  shoulder.add(mesh(sphere(0.17), blazer));
  shoulder.add(mesh(capsule(0.165, 0.52), blazer, [0, -0.36, 0]));
  const elbow = new THREE.Group();
  elbow.position.set(0, -0.72, 0);
  elbow.add(mesh(capsule(0.15, 0.44), blazer, [0, -0.3, 0]));
  elbow.add(mesh(sphere(0.13), skin, [0, -0.66, 0], [1, 1.1, 0.8]));
  shoulder.add(elbow);
  body.add(shoulder);
  return { s, shoulder, elbow };
});

// legs (seated): thighs forward, shins down
[-1, 1].forEach(s => {
  body.add(mesh(capsule(0.24, 0.75), pants, [s * 0.33, -1.1, 0.42], [1, 1, 1], [Math.PI / 2, 0, 0]));
  body.add(mesh(capsule(0.2, 1.0), pants, [s * 0.33, -1.75, 0.92]));
  body.add(mesh(sphere(0.2), dark, [s * 0.33, -2.38, 1.06], [1.05, 0.6, 1.6]));
});

/* head (pivots at the neck) */
const head = new THREE.Group();
head.position.set(0, 1.28, 0);
body.add(head);
head.add(mesh(sphere(0.58, 64), skin, [0, 0.5, 0], [1, 1.1, 0.97]));
[-1, 1].forEach(s => {
  head.add(mesh(sphere(0.1), skin, [s * 0.57, 0.47, -0.02], [0.55, 1, 0.55]));
  head.add(mesh(sphere(0.032), gold, [s * 0.585, 0.35, 0.0]));
  head.add(mesh(sphere(0.08), blush, [s * 0.3, 0.35, 0.47], [1, 0.6, 0.3]));
  head.add(mesh(new THREE.CapsuleGeometry(0.02, 0.13, 6, 12), hair, [s * 0.2, 0.69, 0.53], [1, 1, 1], [0.25, 0, Math.PI / 2 + s * 0.12]));
  head.add(mesh(new THREE.TorusGeometry(0.135, 0.013, 12, 48), dark, [s * 0.2, 0.52, 0.565], [1, 0.9, 1]));
});
const eyes = [-1, 1].map(s => {
  const e = new THREE.Group();
  e.position.set(s * 0.2, 0.52, 0.52);
  e.add(mesh(sphere(0.062), dark, [0, 0, 0], [1, 1.25, 0.6]));
  e.add(mesh(sphere(0.018), white, [0.02, 0.03, 0.04]));
  head.add(e);
  return e;
});
head.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 8), dark, [0, 0.54, 0.58], [1, 1, 1], [0, 0, Math.PI / 2]));
head.add(mesh(sphere(0.045), skin, [0, 0.42, 0.575], [0.8, 1, 0.9]));
head.add(mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 24, Math.PI), lip, [0, 0.31, 0.535], [1, 0.8, 1], [0.15, 0, Math.PI]));
head.add(mesh(new THREE.SphereGeometry(0.65, 64, 40, Math.PI, Math.PI, 0, Math.PI * 0.86), hair, [0, 0.5, -0.03], [1.06, 1.15, 1.05]));
head.add(mesh(new THREE.SphereGeometry(0.625, 64, 40, 0, Math.PI * 2, 0, 0.98), hair, [0, 0.5, 0], [1.03, 1.12, 1.02]));
head.add(mesh(sphere(0.32), hair, [-0.16, 0.9, 0.36], [1.35, 0.42, 0.62], [0.35, 0.1, 0.38]));
head.add(mesh(sphere(0.24), hair, [0.24, 0.92, 0.33], [1.1, 0.38, 0.6], [0.4, -0.1, -0.3]));
head.add(mesh(sphere(0.27), hair, [0, 1.2, -0.2]));

/* ── desk set: desk, laptop, chair, floor glow (slides in for stage 2) ── */
const set = new THREE.Group();
rig.add(set);
set.add(mesh(new THREE.BoxGeometry(2.6, 0.08, 1.5), furniture, [0.15, -0.12, 1.3]));
[[-1.05, 0.65], [1.35, 0.65], [-1.05, 1.95], [1.35, 1.95]].forEach(([x, z]) =>
  set.add(mesh(new THREE.BoxGeometry(0.07, 2.42, 0.07), metal, [x, -1.37, z])));
set.add(mesh(new THREE.BoxGeometry(2.5, 0.05, 0.1), metal, [0.15, -2.55, 1.3]));
// laptop: base with keyboard, lid hinged at the far edge and tilted back
set.add(mesh(new THREE.BoxGeometry(1.0, 0.045, 0.66), laptopShell, [0, -0.055, 1.02]));
set.add(mesh(new THREE.BoxGeometry(0.86, 0.01, 0.34), keys, [0, -0.03, 0.98]));
const lid = new THREE.Group();
lid.position.set(0, -0.04, 1.35);
lid.rotation.x = 0.28;
lid.add(mesh(new THREE.BoxGeometry(1.0, 0.68, 0.035), laptopShell, [0, 0.34, 0]));
const screenTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 170;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 256, 170); grd.addColorStop(0, '#2a1650'); grd.addColorStop(1, '#5b2a7c');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 170);
  const lines = [[20, 30, 120, '#c9b2ff'], [36, 50, 160, '#ff8fd0'], [36, 68, 110, '#e9e2f2'], [20, 88, 90, '#c9b2ff'], [36, 106, 150, '#8fe3ff'], [36, 124, 70, '#e9e2f2'], [20, 144, 40, '#c9b2ff']];
  lines.forEach(([x, y, w, col]) => { g.fillStyle = col; g.globalAlpha = 0.85; g.fillRect(x, y, w, 7); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
lid.add(mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ map: screenTex }), [0, 0.35, -0.02], [1, 1, 1], [0, Math.PI, 0]));
set.add(lid);
// chair
set.add(mesh(new THREE.BoxGeometry(1.1, 0.1, 1.0), furniture, [0, -1.27, -0.05]));
set.add(mesh(new THREE.BoxGeometry(1.1, 1.25, 0.09), furniture, [0, -0.55, -0.62], [1, 1, 1], [-0.12, 0, 0]));
[[-0.45, 0.35], [0.45, 0.35], [-0.45, -0.45], [0.45, -0.45]].forEach(([x, z]) =>
  set.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.28, 10), metal, [x, -1.94, z])));
// floor glow
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,240,255,0.9)'); grd.addColorStop(0.35, 'rgba(200,150,255,0.35)'); grd.addColorStop(1, 'rgba(120,60,200,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
set.add(mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), [0.1, -2.58, 0.7], [1, 1, 1], [-Math.PI / 2, 0, 0]));

/* ── stages ── */
// focusY / height: the world-space box framed inside the slot; rotY: body turn; pose: 0 standing bust → 1 seated typing
const STAGES = [
  { focusY: 1.15, height: 3.7, rotY: 0, pose: 0, track: 1 },
  { focusY: 1.45, height: 3.0, rotY: 0.32, pose: 0, track: 0.8 },
  { focusY: 0.1, height: 7.0, rotY: 0.85, pose: 1, track: 0.25 },
];

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const clamp01 = t => Math.min(1, Math.max(0, t));

let W = 0, H = 0;
const resize = () => {
  W = innerWidth; H = innerHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
};
addEventListener('resize', resize);
resize();

// camera parameters that frame a stage inside its slot rectangle (slot assumed centred vertically on screen)
const frameFor = (stage, slot) => {
  const r = slot.getBoundingClientRect();
  const st = STAGES[stage];
  const slotH = Math.min(r.height, H) || H;
  const visH = st.height * (H / slotH);
  const dist = visH / (2 * TAN);
  const perPx = visH / H;
  const cx = r.left + r.width / 2;
  const bottomAligned = stage === 0;                 // hero bust sits on the bottom of its slot
  const cy = bottomAligned ? H - slotH / 2 : H / 2;
  return {
    x: -(cx - W / 2) * perPx,
    y: st.focusY + (cy - H / 2) * perPx,
    z: dist,
    ...st,
  };
};

const visibleSlots = () => slots.filter(s => s.offsetWidth > 0 && s.offsetHeight > 0)
  .map(s => ({ el: s, stage: +s.dataset.stage, center: s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 }))
  .sort((a, b) => a.center - b.center);

const state = { x: 0, y: 1.15, z: 9, rotY: 0, pose: 0, track: 1, opacity: 1 };
const computeTarget = () => {
  const list = visibleSlots();
  const v = scrollY + H / 2;
  let i = 0;
  while (i < list.length - 1 && v > list[i + 1].center) i++;
  const a = list[i], b = list[i + 1];
  const fa = frameFor(a.stage, a.el);
  let t = 0, out = fa;
  if (b && v > a.center) {
    t = smooth(clamp01((v - a.center) / (b.center - a.center)));
    const fb = frameFor(b.stage, b.el);
    out = {};
    for (const k of ['x', 'y', 'z', 'rotY', 'pose', 'track']) out[k] = lerp(fa[k], fb[k], t);
  }
  // fade out past the last slot, and between slots that are far apart (mobile skips the about stage)
  const last = list[list.length - 1];
  let opacity = 1;
  if (v > last.center) opacity = 1 - clamp01((v - last.center - H * 0.05) / (H * 0.3));
  if (b && v > a.center) {
    const gap = b.center - a.center;
    if (gap > H * 1.6) opacity = Math.min(opacity, Math.max(clamp01(1 - (v - a.center) / (H * 0.5)), clamp01(1 - (b.center - v) / (H * 0.5))));
  }
  out.opacity = opacity;
  return out;
};

/* ── pointer ── */
const pointer = { x: 0, y: 0, seen: false };
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  pointer.seen = true;
  pointer.x = (e.clientX / W) * 2 - 1;
  pointer.y = (e.clientY / H) * 2 - 1;
}, { passive: true });

/* ── loop ── */
const t0 = performance.now();
let last = t0, nextBlink = 2, blinkT = -1, intro = reduceMotion ? 1 : 0, first = true;

const pose = (p, t) => {
  // arms: hanging (p=0) → reaching for the keyboard (p=1), with a typing wobble
  arms.forEach(({ s, shoulder, elbow }) => {
    const type = reduceMotion ? 0 : Math.sin(t * 13 + s * 1.7) * 0.06 * p;
    shoulder.rotation.x = lerp(0, -0.42, p);
    shoulder.rotation.z = lerp(s * 0.05, s * -0.12, p);
    shoulder.rotation.y = lerp(0, s * -0.12, p);
    elbow.rotation.x = lerp(0, -1.2, p) + type;
  });
  set.visible = p > 0.01;
  set.position.y = (1 - p) * -4.5;
};

const tick = now => {
  requestAnimationFrame(tick);
  const t = (now - t0) / 1000;
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  const target = computeTarget();
  const k = first || reduceMotion ? 1 : 1 - Math.pow(0.0015, dt);   // frame-rate independent smoothing
  first = false;
  for (const key of Object.keys(target)) state[key] = lerp(state[key], target[key], k);

  canvas.style.opacity = state.opacity.toFixed(3);
  if (state.opacity < 0.01) return;

  intro = Math.min(1, intro + dt * 0.9);
  rig.position.y = -1.2 * (1 - (1 - Math.pow(1 - intro, 3)));

  camera.position.set(state.x, state.y, state.z);
  camera.lookAt(state.x, state.y, 0);
  rig.rotation.y = state.rotY;
  pose(state.pose, t);

  // head: follow the pointer (or idle sway), look down at the laptop when seated
  const idle = !pointer.seen || reduceMotion;
  const tx = idle ? Math.sin(t * 0.5) * 0.3 : pointer.x;
  const ty = idle ? Math.sin(t * 0.37) * 0.12 : pointer.y;
  const w = state.track;
  const hy = tx * 0.55 * w;
  const hx = ty * 0.3 * w + state.pose * 0.28;
  head.rotation.y += (hy - head.rotation.y) * 0.08;
  head.rotation.x += (hx - head.rotation.x) * 0.08;
  head.rotation.z += (-tx * 0.06 * w - head.rotation.z) * 0.08;
  body.rotation.y += (tx * 0.1 * w - body.rotation.y) * 0.05;

  if (!reduceMotion) {
    body.position.y = Math.sin(t * 1.7) * 0.012;
    if (t > nextBlink && blinkT < 0) blinkT = 0;
    if (blinkT >= 0) {
      blinkT += dt;
      const kb = blinkT < 0.07 ? 1 - blinkT / 0.07 : Math.min(1, (blinkT - 0.07) / 0.09);
      eyes.forEach(e => (e.scale.y = Math.max(0.08, kb)));
      if (blinkT > 0.16) { blinkT = -1; nextBlink = t + 2.5 + Math.random() * 3; eyes.forEach(e => (e.scale.y = 1)); }
    }
  }
  renderer.render(scene, camera);
};
requestAnimationFrame(tick);
document.documentElement.classList.add('gl-ready');
