// Marine life — procedural low-poly creatures living around the island's reef.
// Schools, sharks, a whale, turtles and coral are placed relative to an "anchor"
// (the golden-hour camera's view corridor) so the intro shot always has life in it.
// Surface heights come from the shared WaterQuery pipeline (1-3 frames stale,
// same as the floaters), so fins, backs and hulls track the actual swell.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _v = new THREE.Vector3(), _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();

function std(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.05, ...opts });
}
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function reflective(group, layer) { group.traverse((o) => o.layers?.enable(layer)); }
function shadowed(group) { group.traverse((o) => { if (o.isMesh) o.castShadow = true; }); }

// --- models -----------------------------------------------------------------
function fishGeometry() {
  const body = new THREE.SphereGeometry(0.5, 6, 4);
  body.scale(1.7, 0.55, 0.3);
  const tail = new THREE.ConeGeometry(0.3, 0.55, 4);
  tail.scale(1, 0.9, 0.18);
  tail.rotateZ(Math.PI / 2);        // apex → -x
  tail.translate(-0.85, 0, 0);
  const g = mergeGeometries([body, tail]);
  g.scale(0.62, 0.62, 0.62);        // ~0.7 m reef fish
  return g;
}

function makeShark() {
  const g = new THREE.Group();
  const top = std(0x4f6472), belly = std(0xa8b8be);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), top);
  body.scale.set(2.9, 0.72, 0.6);
  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.98, 10, 7), belly);
  bellyMesh.scale.set(2.85, 0.62, 0.58);
  bellyMesh.position.y = -0.16;
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 8), top);
  snout.rotation.z = -Math.PI / 2;
  snout.position.x = 3.1;
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 5), top);
  dorsal.scale.z = 0.24;
  dorsal.position.set(0.25, 0.82, 0);
  const tailUp = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.1, 4), top);
  tailUp.scale.z = 0.16;
  tailUp.rotation.z = -0.5;
  tailUp.position.set(-3.1, 0.45, 0);
  const tailDown = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 4), top);
  tailDown.scale.z = 0.16;
  tailDown.rotation.z = Math.PI + 0.6;
  tailDown.position.set(-3.1, -0.3, 0);
  const finL = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 4), top);
  finL.scale.set(1, 0.9, 0.2);
  finL.rotation.set(0.9, 0, 1.9);
  finL.position.set(0.9, -0.4, 0.6);
  const finR = finL.clone();
  finR.rotation.set(-0.9, 0, 1.9);
  finR.position.z = -0.6;
  g.add(body, bellyMesh, snout, dorsal, tailUp, tailDown, finL, finR);
  return g;
}

function makeWhale() {
  const g = new THREE.Group();
  const top = std(0x2e4154), belly = std(0x93a7b4);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), top);
  body.scale.set(7.2, 1.9, 1.7);
  const bellyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.97, 12, 8), belly);
  bellyMesh.scale.set(7.0, 1.6, 1.6);
  bellyMesh.position.y = -0.42;
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 7), top);
  head.scale.set(1.6, 1.15, 1.15);
  head.position.x = 6.4;
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.95, 4.5, 8), top);
  stock.rotation.z = Math.PI / 2 - 0.35;
  stock.position.set(-8.6, 0.3, 0);
  const flukeL = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.6, 5), top);
  flukeL.scale.z = 0.16;
  flukeL.rotation.set(Math.PI / 2, 0, 0.35);
  flukeL.position.set(-10.7, 0.15, 1.15);
  const flukeR = flukeL.clone();
  flukeR.rotation.set(-Math.PI / 2, 0, -0.35);
  flukeR.position.z = -1.15;
  const pecL = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.4, 5), top);
  pecL.scale.z = 0.2;
  pecL.rotation.set(1.0, 0, 2.1);
  pecL.position.set(3.2, -0.9, 1.5);
  const pecR = pecL.clone();
  pecR.rotation.set(-1.0, 0, 2.1);
  pecR.position.z = -1.5;
  const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 5), top);
  dorsal.scale.z = 0.24;
  dorsal.position.set(-3.4, 1.7, 0);
  g.add(body, bellyMesh, head, stock, flukeL, flukeR, pecL, pecR, dorsal);
  return g;
}

function makeTurtle() {
  const g = new THREE.Group();
  const shellMat = std(0x516b42), skinMat = std(0x7d8f6d), belly = std(0xc9c7a8);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.62, 9, 7), shellMat);
  shell.scale.set(1.25, 0.5, 0.95);
  const plastron = new THREE.Mesh(new THREE.SphereGeometry(0.58, 9, 7), belly);
  plastron.scale.set(1.2, 0.34, 0.9);
  plastron.position.y = -0.1;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 6), skinMat);
  head.position.set(0.85, -0.02, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.35, 6), skinMat);
  neck.rotation.z = Math.PI / 2 - 0.25;
  neck.position.set(0.72, -0.05, 0);
  const flippers = [];
  const mkFin = (x, z, front) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 5), skinMat);
    f.scale.z = 0.3;
    f.rotation.set(z > 0 ? 1.25 : -1.25, 0, front ? 2.2 : 2.9);
    f.position.set(x, -0.12, z);
    f.userData.baseRot = f.rotation.x;
    f.userData.front = front;
    flippers.push(f);
    return f;
  };
  g.add(shell, plastron, head, neck, mkFin(0.35, 0.5, true), mkFin(0.35, -0.5, true), mkFin(-0.45, 0.42, false), mkFin(-0.45, -0.42, false));
  g.userData.flippers = flippers;
  return g;
}

function makeCoral(rand) {
  const group = new THREE.Group();
  const defs = [
    { geo: new THREE.ConeGeometry(0.07, 1.0, 5), count: 90, palette: [0xe08a7a, 0xd9759f, 0xc95f76, 0xe8b48a], sMin: 0.5, sMax: 1.6 },   // branching
    { geo: new THREE.CylinderGeometry(0.34, 0.5, 0.09, 7), count: 45, palette: [0xd9a05b, 0xbf7c8f, 0x8f7ab8], sMin: 0.7, sMax: 2.2 },    // plates
    { geo: new THREE.IcosahedronGeometry(0.4, 0), count: 45, palette: [0x6f9e8f, 0x8a9e6f, 0xb08a6a], sMin: 0.6, sMax: 2.4 },           // boulders
  ];
  for (const def of defs) {
    const mesh = new THREE.InstancedMesh(def.geo, std(0xffffff), def.count);
    for (let i = 0; i < def.count; i++) {
      _e.set((rand() - 0.5) * 0.7, rand() * Math.PI * 2, (rand() - 0.5) * 0.7);
      _q.setFromEuler(_e);
      const s = def.sMin + rand() * (def.sMax - def.sMin);
      _s.set(s, s * (0.7 + rand() * 0.6), s);
      _m.compose(_v.set(0, 0, 0), _q, _s);
      mesh.setMatrixAt(i, _m);
      mesh.setColorAt(i, new THREE.Color(def.palette[(rand() * def.palette.length) | 0]));
    }
    mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;   // instances are spread over the reef, not the base geometry bounds
    group.add(mesh);
  }
  return group;
}

// lay a coral garden out over the slope where the water is 1.5-9 m deep
function placeCoral(group, cx, cz, bearing, heightAt, rand) {
  for (const mesh of group.children) {
    const count = mesh.count;
    let placed = 0, tries = 0;
    while (placed < count && tries++ < 4000) {
      const a = bearing + (rand() - 0.5) * 1.7;
      const r = 20 + rand() * 130;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      const h = heightAt(x, z);
      if (h < -9 || h > -1.4) continue;
      mesh.getMatrixAt(placed, _m);
      _m.setPosition(x, h + 0.05, z);
      mesh.setMatrixAt(placed, _m);
      placed++;
    }
    // park unused instances under the seabed so they don't show
    for (let i = placed; i < count; i++) {
      mesh.getMatrixAt(i, _m);
      _m.setPosition(cx, -999, cz);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

const FISH = 140;

export class MarineLife {
  constructor({ scene, anchor, heightAt, reflectLayer = 1 }) {
    this.heightAt = heightAt;
    const rand = mulberry(1337);
    const { x: ax, z: az, dirX, dirZ } = anchor;
    const sideX = -dirZ, sideZ = dirX;

    this.group = new THREE.Group();
    scene.add(this.group);

    // fish school — hangs off the coast inside the golden-hour view corridor
    this.school = { x: ax + dirX * 240, z: az + dirZ * 240, depth: 2.3, rx: 26, rz: 14, speed: 0.045 };
    this.fish = new THREE.InstancedMesh(fishGeometry(), std(0xb9ccd6, { metalness: 0.35, roughness: 0.45 }), FISH);
    this.fish.frustumCulled = false;
    this.fishSeeds = new Float32Array(FISH * 4);
    for (let i = 0; i < FISH; i++) {
      this.fishSeeds[i * 4] = rand() * Math.PI * 2;       // orbital phase
      this.fishSeeds[i * 4 + 1] = 2 + rand() * 12;        // orbital radius
      this.fishSeeds[i * 4 + 2] = (rand() - 0.5) * 3;     // vertical band
      this.fishSeeds[i * 4 + 3] = 0.6 + rand() * 0.9;     // individual speed
    }
    this.group.add(this.fish);

    // sharks — slow circling inside the same corridor, dorsal breaking the surface
    this.sharks = [];
    for (const [sx, sz, r, ph, sp] of [[60, 40, 30, 0, 0.055], [-50, 70, 40, 2.4, -0.04]]) {
      const mesh = makeShark();
      shadowed(mesh);
      reflective(mesh, reflectLayer);
      this.group.add(mesh);
      this.sharks.push({ mesh, cx: ax + dirX * 150 + sideX * sx, cz: az + dirZ * 150 + sideZ * sz, r, ph, sp });
    }

    // whale — long ellipse crossing the view; surfaces, blows, dives with the fluke up
    this.whale = { mesh: makeWhale(), cx: ax + dirX * 560, cz: az + dirZ * 560, rx: 170, rz: 95, speed: 0.011, ph: 1.1 };
    shadowed(this.whale.mesh);
    reflective(this.whale.mesh, reflectLayer);
    this.group.add(this.whale.mesh);

    // turtles — paddling shallow near the shore
    this.turtles = [];
    for (const [sx, sz, r, ph] of [[26, 62, 12, 0], [-34, 78, 9, 2.8]]) {
      const mesh = makeTurtle();
      shadowed(mesh);
      reflective(mesh, reflectLayer);
      this.group.add(mesh);
      this.turtles.push({ mesh, cx: ax + dirX * 70 + sideX * sx, cz: az + dirZ * 70 + sideZ * sz, r, ph });
    }

    // coral garden on the reef slope
    const coral = makeCoral(rand);
    placeCoral(coral, ax, az, Math.atan2(dirZ, dirX), heightAt, rand);
    this.group.add(coral);

    // probes: [school, shark0, shark1, whale, turtle0, turtle1]
    this.probes = [
      { x: this.school.x, z: this.school.z, h: 0 },
      { x: this.sharks[0].cx, z: this.sharks[0].cz, h: 0 },
      { x: this.sharks[1].cx, z: this.sharks[1].cz, h: 0 },
      { x: this.whale.cx, z: this.whale.cz, h: 0 },
      { x: this.turtles[0].cx, z: this.turtles[0].cz, h: 0 },
      { x: this.turtles[1].cx, z: this.turtles[1].cz, h: 0 },
    ];
  }

  static get PROBE_COUNT() { return 6; }

  collectPoints() { return this.probes; }

  // read back this frame's surface heights (slots 1..6 — camera owns slot 0)
  ingest(query) {
    for (let i = 0; i < this.probes.length; i++) {
      if (1 + i < query.resultCount) this.probes[i].h = query.result[(1 + i) * 4];
    }
  }

  update(dt, t) {
    const P = this.probes;

    // school: centre drifts on a slow ellipse, fish swirl around it
    const sc = this.school;
    const cx = sc.x + Math.cos(t * sc.speed) * sc.rx;
    const cz = sc.z + Math.sin(t * sc.speed * 1.3) * sc.rz;
    const cy = P[0].h - sc.depth;
    P[0].x = cx; P[0].z = cz;
    for (let i = 0; i < FISH; i++) {
      const ph = this.fishSeeds[i * 4], r = this.fishSeeds[i * 4 + 1], dy = this.fishSeeds[i * 4 + 2], sp = this.fishSeeds[i * 4 + 3];
      const a = ph + t * sp * 0.8;
      const x = cx + Math.cos(a) * r + Math.sin(t * 1.7 + ph * 5) * 1.5;
      const z = cz + Math.sin(a) * r * 0.6 + Math.cos(t * 1.3 + ph * 3) * 1.5;
      const y = cy + dy + Math.sin(t * 2 + ph * 7) * 0.5;
      // face along travel + tail wag (models face +x: yaw = atan2(-vz, vx))
      _e.set(0, Math.atan2(-Math.cos(a) * r * 0.6 * sp, -Math.sin(a) * r * sp) + Math.sin(t * 9 + ph * 11) * 0.25, 0);
      _q.setFromEuler(_e);
      _s.set(1, 1, 1);
      _m.compose(_v.set(x, y, z), _q, _s);
      this.fish.setMatrixAt(i, _m);
    }
    this.fish.instanceMatrix.needsUpdate = true;

    // sharks
    this.sharks.forEach((s, i) => {
      const a = s.ph + t * s.sp;
      const x = s.cx + Math.cos(a) * s.r, z = s.cz + Math.sin(a) * s.r;
      const h = P[1 + i].h;
      P[1 + i].x = x; P[1 + i].z = z;
      const y = h - 0.9 + Math.sin(t * 0.5 + s.ph) * 0.3;
      s.mesh.position.set(x, y, z);
      const heading = Math.atan2(-Math.cos(a) * Math.sign(s.sp), -Math.sin(a) * Math.sign(s.sp));
      s.mesh.rotation.set(Math.sin(t * 1.1 + s.ph) * 0.05, heading + Math.sin(t * 3.2 + s.ph) * 0.08, 0, 'YXZ');
    });

    // whale: ellipse path + a 55 s surface/dive cycle
    const w = this.whale, wa = w.ph + t * w.speed;
    const wx = w.cx + Math.cos(wa) * w.rx, wz = w.cz + Math.sin(wa) * w.rz;
    const wh = P[3].h;
    P[3].x = wx; P[3].z = wz;
    const cyc = (t % 55) / 55;
    // [cycleT, depth, pitch°] — surface cruise → nose-down dive → steep tail-out fluke → gone → back up
    const keys = [[0, -1.9, 2], [0.45, -2.2, 3], [0.58, -8, -32], [0.7, -6.5, -52], [0.78, -14, -12], [1, -1.9, 2]];
    let ki = 0;
    while (ki < keys.length - 2 && cyc > keys[ki + 1][0]) ki++;
    const [t0, y0, p0] = keys[ki], [t1, y1, p1] = keys[ki + 1];
    const f = THREE.MathUtils.smoothstep((cyc - t0) / (t1 - t0 || 1), 0, 1);
    const wy = wh + y0 + (y1 - y0) * f;
    const pitch = THREE.MathUtils.degToRad(p0 + (p1 - p0) * f);
    w.mesh.position.set(wx, wy, wz);
    const wHeading = Math.atan2(-Math.cos(wa) * w.rz, -Math.sin(wa) * w.rx);
    w.mesh.rotation.set(Math.sin(t * 0.4) * 0.03, wHeading, pitch, 'YXZ');

    // turtles
    this.turtles.forEach((tu, i) => {
      const a = tu.ph + t * 0.03;
      const x = tu.cx + Math.cos(a) * tu.r, z = tu.cz + Math.sin(a) * tu.r;
      const h = P[4 + i].h;
      P[4 + i].x = x; P[4 + i].z = z;
      tu.mesh.position.set(x, h - 0.75, z);
      tu.mesh.rotation.set(Math.sin(t * 0.8 + tu.ph) * 0.06, Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 'YXZ');
      for (const f of tu.mesh.userData.flippers) {
        f.rotation.x = f.userData.baseRot + Math.sin(t * (f.userData.front ? 3.4 : 2.6) + tu.ph) * 0.3;
      }
    });
  }
}
