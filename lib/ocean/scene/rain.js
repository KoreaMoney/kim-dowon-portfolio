// Precipitation — instanced streaks recycled inside a box that follows the view.
// Rain = thin fast blue-grey streaks; snow = slower, bigger, brighter flakes.
// Added to the opaque scene so depth sorts correctly against the water surface.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const BOX = 70, TOP = 42, BOTTOM = -9;

export class Precipitation {
  constructor() {
    const a = new THREE.PlaneGeometry(0.018, 0.7);
    const b = a.clone().rotateY(Math.PI / 2);
    const geo = mergeGeometries([a, b]);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({
      color: 0x9db8cc, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false,
    }), 6000);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.pos = new Float32Array(6000 * 3);
    this.speed = new Float32Array(6000);
    this.wind = { x: 0, z: 0 };
    this.mode = 'rain';
    this.active = 0;
    _q.identity();
  }

  // mm/h → how much shows. wind slants the fall direction.
  set(precipMm, windX = 0, windZ = 0, snow = false) {
    this.mode = snow ? 'snow' : 'rain';
    this.wind.x = windX * 0.35;
    this.wind.z = windZ * 0.35;
    this.active = precipMm <= 0 ? 0 : Math.min(6000, Math.max(700, Math.round(precipMm * 1300)));
    this.mesh.count = this.active;
    const m = this.mesh.material;
    if (snow) { m.color.setHex(0xe8f2fa); m.opacity = 0.55; }
    else { m.color.setHex(0x9db8cc); m.opacity = 0.3; }
    for (let i = 0; i < this.active; i++) {
      if (this.pos[i * 3 + 1] === 0) this.respawn(i, 0, 0, true);
      this.speed[i] = (snow ? 1.6 : 9) + (i % 7) * (snow ? 0.25 : 1.4);
    }
  }

  respawn(i, cx, cz, anywhere = false) {
    this.pos[i * 3] = cx + (Math.random() - 0.5) * BOX * 2;
    this.pos[i * 3 + 1] = anywhere ? BOTTOM + Math.random() * (TOP - BOTTOM) : TOP - Math.random() * 4;
    this.pos[i * 3 + 2] = cz + (Math.random() - 0.5) * BOX * 2;
  }

  // cx/cz: the point being looked at (controls.target is a good choice)
  update(dt, cx, cz) {
    if (this.active === 0) return;
    const snow = this.mode === 'snow';
    const pos = this.pos;
    for (let i = 0; i < this.active; i++) {
      pos[i * 3] += (this.wind.x + (snow ? Math.sin(pos[i * 3 + 1] * 0.6 + i) * 0.5 : 0)) * dt;
      pos[i * 3 + 1] -= this.speed[i] * dt;
      pos[i * 3 + 2] += (this.wind.z + (snow ? Math.cos(pos[i * 3] * 0.5 + i) * 0.5 : 0)) * dt;
      if (pos[i * 3 + 1] < BOTTOM) this.respawn(i, cx, cz);
      _p.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      const slant = Math.min(Math.abs(this.wind.x) + Math.abs(this.wind.z), 6) * 0.06;
      _q.setFromAxisAngle(_s.set(this.wind.z || 1, 0, -this.wind.x || 0).normalize(), snow ? 0 : slant);
      _m.compose(_p, _q, _s.set(snow ? 2.4 : 1, snow ? 0.4 : 1, 1));
      this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
