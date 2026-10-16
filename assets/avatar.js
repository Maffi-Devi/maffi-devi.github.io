/* Hero avatar: a stylised clay character built from three.js primitives.
   The head follows the pointer, the eyes blink and the body breathes. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const box = document.getElementById('avatar');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
} catch (e) {
  box.classList.add('no-gl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
box.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
camera.position.set(0, 1.35, 8.2);
camera.lookAt(0, 1.1, 0);

/* ── lights: soft key, cool fill, violet and pink rims ── */
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1640, 0.75));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2.5, 3.5, 5); scene.add(key);
const rimL = new THREE.DirectionalLight(0x9b6bff, 4); rimL.position.set(-4.5, 2.5, -3); scene.add(rimL);
const rimR = new THREE.DirectionalLight(0xff78d2, 2.6); rimR.position.set(4.5, 1.2, -3); scene.add(rimR);

/* ── materials ── */
const mat = (color, roughness = 0.55, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra });
const skin = mat(0xe4dadb, 0.5);
const cloth = mat(0xd3cadc, 0.72);
const blazer = mat(0x4b3f5e, 0.62);
const lapel = mat(0x5b4d72, 0.55);
const hair = mat(0x2a2131, 0.42);
const dark = mat(0x17121b, 0.35);
const lip = mat(0xc98896, 0.5);
const gold = mat(0xe8c27a, 0.25, { metalness: 0.6 });
const blush = mat(0xf2a3b8, 0.6, { transparent: true, opacity: 0.45 });
const white = mat(0xffffff, 0.2);

const mesh = (geo, m, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
  const o = new THREE.Mesh(geo, m);
  o.position.set(...pos); o.scale.set(...scale); o.rotation.set(...rot);
  return o;
};
const sphere = (r, seg = 48) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.66));

/* ── body ── */
const root = new THREE.Group();
scene.add(root);
const body = new THREE.Group();
root.add(body);
// torso: a lathe profile gives sloped, rounded shoulders
const profile = [[0, 1.08], [0.3, 1.06], [0.52, 0.98], [0.74, 0.86], [0.86, 0.7], [0.9, 0.45], [0.86, 0.1], [0.8, -0.4], [0.82, -1.2], [0, -1.2]]
  .map(([x, y]) => new THREE.Vector2(x, y));
body.add(mesh(new THREE.LatheGeometry(profile, 64), blazer, [0, 0, 0], [1, 1, 0.58]));
body.add(mesh(sphere(0.5), cloth, [0, 0.62, 0.3], [0.5, 0.95, 0.42]));                           // top under the blazer
[-1, 1].forEach(s => {
  body.add(mesh(new THREE.BoxGeometry(0.13, 0.85, 0.05), lapel, [s * 0.24, 0.52, 0.47], [1, 1, 1], [0.1, 0, -s * 0.36])); // lapels
  body.add(mesh(new THREE.CapsuleGeometry(0.19, 1.15, 12, 24), blazer, [s * 0.75, 0.02, 0], [1, 1, 0.9], [0, 0, s * 0.06])); // arms
});
body.add(mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.26, 40), cloth, [0, 1.13, 0]));            // turtleneck
body.add(mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.36, 32), skin, [0, 1.3, 0]));              // neck

/* ── head (pivots at the neck) ── */
const head = new THREE.Group();
head.position.set(0, 1.28, 0);
body.add(head);
head.add(mesh(sphere(0.58, 64), skin, [0, 0.5, 0], [1, 1.1, 0.97]));
[-1, 1].forEach(s => {
  head.add(mesh(sphere(0.1), skin, [s * 0.57, 0.47, -0.02], [0.55, 1, 0.55]));                  // ears
  head.add(mesh(sphere(0.032), gold, [s * 0.585, 0.35, 0.0]));                                  // earrings
  head.add(mesh(sphere(0.08), blush, [s * 0.3, 0.35, 0.47], [1, 0.6, 0.3]));                    // cheeks
  head.add(mesh(new THREE.CapsuleGeometry(0.02, 0.13, 6, 12), hair, [s * 0.2, 0.69, 0.53], [1, 1, 1], [0.25, 0, Math.PI / 2 + s * 0.12])); // brows
  head.add(mesh(new THREE.TorusGeometry(0.135, 0.013, 12, 48), dark, [s * 0.2, 0.52, 0.565], [1, 0.9, 1])); // glasses rims
});
const eyes = [-1, 1].map(s => {
  const e = new THREE.Group();
  e.position.set(s * 0.2, 0.52, 0.52);
  e.add(mesh(sphere(0.062), dark, [0, 0, 0], [1, 1.25, 0.6]));
  e.add(mesh(sphere(0.018), white, [0.02, 0.03, 0.04]));
  head.add(e);
  return e;
});
head.add(mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.14, 8), dark, [0, 0.54, 0.58], [1, 1, 1], [0, 0, Math.PI / 2])); // bridge
head.add(mesh(sphere(0.045), skin, [0, 0.42, 0.575], [0.8, 1, 0.9]));                             // nose
head.add(mesh(new THREE.TorusGeometry(0.07, 0.014, 8, 24, Math.PI), lip, [0, 0.31, 0.535], [1, 0.8, 1], [0.15, 0, Math.PI])); // smile

/* hair: back shell, top cap, side-swept fringe and a bun */
head.add(mesh(new THREE.SphereGeometry(0.65, 64, 40, Math.PI, Math.PI, 0, Math.PI * 0.86), hair, [0, 0.5, -0.03], [1.06, 1.15, 1.05]));head.add(mesh(new THREE.SphereGeometry(0.625, 64, 40, 0, Math.PI * 2, 0, 0.98), hair, [0, 0.5, 0], [1.03, 1.12, 1.02]));
head.add(mesh(sphere(0.32), hair, [-0.16, 0.9, 0.36], [1.35, 0.42, 0.62], [0.35, 0.1, 0.38]));
head.add(mesh(sphere(0.24), hair, [0.24, 0.92, 0.33], [1.1, 0.38, 0.6], [0.4, -0.1, -0.3]));
head.add(mesh(sphere(0.27), hair, [0, 1.2, -0.2]));
/* ── sizing ── */
const fit = () => {
  const w = box.clientWidth, h = box.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the shoulders inside narrow canvases
  camera.position.z = w / h < 0.64 ? 8.2 * (0.64 / (w / h)) : 8.2;
  camera.updateProjectionMatrix();
};
new ResizeObserver(fit).observe(box);
fit();

/* ── motion ── */
const target = { x: 0, y: 0 };
let pointerSeen = false;
addEventListener('pointermove', e => {
  pointerSeen = true;
  target.x = (e.clientX / innerWidth) * 2 - 1;
  target.y = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(box);

const t0 = performance.now();
let last = t0, nextBlink = 2, blinkT = -1, intro = 0;
const tick = now => {
  requestAnimationFrame(tick);
  if (!visible) { last = now; return; }
  const t = (now - t0) / 1000;
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  intro = Math.min(1, intro + dt * 0.9);
  const ease = 1 - Math.pow(1 - intro, 3);
  root.position.y = -1.2 * (1 - ease);

  const tx = pointerSeen ? target.x : Math.sin(t * 0.5) * 0.35;
  const ty = pointerSeen ? target.y : Math.sin(t * 0.37) * 0.15;
  head.rotation.y += (tx * 0.55 - head.rotation.y) * 0.08;
  head.rotation.x += (ty * 0.3 - head.rotation.x) * 0.08;
  head.rotation.z += (-tx * 0.06 - head.rotation.z) * 0.08;
  body.rotation.y += (tx * 0.12 - body.rotation.y) * 0.05;

  body.scale.y = 1 + Math.sin(t * 1.7) * 0.008;
  body.position.y = Math.sin(t * 1.7) * 0.012;

  if (t > nextBlink && blinkT < 0) blinkT = 0;
  if (blinkT >= 0) {
    blinkT += dt;
    const k = blinkT < 0.07 ? 1 - blinkT / 0.07 : Math.min(1, (blinkT - 0.07) / 0.09);
    eyes.forEach(e => (e.scale.y = Math.max(0.08, k)));
    if (blinkT > 0.16) { blinkT = -1; nextBlink = t + 2.5 + Math.random() * 3; eyes.forEach(e => (e.scale.y = 1)); }
  }
  renderer.render(scene, camera);
};

if (reduceMotion) {
  intro = 1;
  renderer.render(scene, camera);
  addEventListener('resize', () => renderer.render(scene, camera));
  new ResizeObserver(() => renderer.render(scene, camera)).observe(box);
} else {
  requestAnimationFrame(tick);
}
box.classList.add('ready');
