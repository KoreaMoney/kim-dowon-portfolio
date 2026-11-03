"use client";

import { ArrowCounterClockwiseIcon, ArrowRightIcon, FlagIcon, HeartIcon, RobotIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BearBubble, BlueBear } from "@/components/bluebear";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";

type Phase = "ready" | "run" | "stage" | "won" | "lost";
type Difficulty = "easy" | "normal" | "hard";
type EnemyState = "rise" | "live" | "dying" | "dead";
type Enemy = {
  slot: number;
  elite: boolean;
  hp: number;
  group: THREE.Group;
  bodyM: THREE.MeshStandardMaterial;
  eye: THREE.Sprite;
  head: THREE.Mesh;
  disk: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  charge: number;
  chargeMax: number;
  speed: number;
  strafeAmp: number;
  strafeSpd: number;
  shotSpeed: number;
  flash: number;
  state: EnemyState;
  t: number;
};
type GameEvent = { type: "hit" | "kill" | "hurt" | "intercept"; points?: number; crit?: boolean };
type EnemyShot = { mesh: THREE.Mesh; vel: THREE.Vector3 };
type TracerFx = { lines: THREE.Line[]; life: number; max: number };
type RingFx = { mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; life: number; max: number; flat: boolean };
type Flash = { light: THREE.PointLight; life: number; max: number; peak: number };
type Pulse = { sprite: THREE.Sprite; life: number; max: number; size: number };
type FloatText = { sprite: THREE.Sprite; tex: THREE.CanvasTexture; life: number; max: number };

const BG = 0x1a4f85;
const MAX_LEVEL = 5;
const MAG = 10;
const MAX_HEARTS = 5;
const RELOAD_MS = 950;
const MELEE_Z = 2.8;
const SLOTS: [number, number][] = [[-3.3, -10.5], [0, -11.5], [3.3, -10.5], [-1.7, -13], [1.7, -13], [0, -14.5]];
const LEVELS = [
  { quota: 8, active: 3, gap: 1300, speed: 0.62, charge: 4.4, bolt: 7, elite: 0, hp: 1 },
  { quota: 11, active: 4, gap: 1050, speed: 0.75, charge: 3.9, bolt: 8, elite: 0.12, hp: 1 },
  { quota: 14, active: 5, gap: 900, speed: 0.88, charge: 3.5, bolt: 9, elite: 0.2, hp: 2 },
  { quota: 17, active: 6, gap: 750, speed: 1.0, charge: 3.1, bolt: 10, elite: 0.28, hp: 2 },
  { quota: 21, active: 6, gap: 620, speed: 1.12, charge: 2.8, bolt: 11, elite: 0.35, hp: 2 },
];
const DIFFS: Record<Difficulty, { label: { ko: string; en: string }; speed: number; charge: number; bolt: number; gap: number }> = {
  easy: { label: { ko: "쉬움", en: "Easy" }, speed: 0.75, charge: 1.4, bolt: 0.8, gap: 1.3 },
  normal: { label: { ko: "보통", en: "Normal" }, speed: 1, charge: 1, bolt: 1, gap: 1 },
  hard: { label: { ko: "어려움", en: "Hard" }, speed: 1.3, charge: 0.8, bolt: 1.2, gap: 0.7 },
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

function makeSoftTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  if (!g) return tex;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return tex;
}

function makeTextTexture(text: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  if (!g) return tex;
  g.font = "800 34px ui-monospace, Menlo, monospace";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 7;
  g.strokeStyle = "rgba(4,12,24,.85)";
  g.strokeText(text, 128, 32);
  g.fillStyle = color;
  g.fillText(text, 128, 32);
  return tex;
}

function createEngine(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.65;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 13, 30);
  const camera = new THREE.PerspectiveCamera(52, 640 / 420, 0.1, 80);
  const CAM = new THREE.Vector3(0, 1.95, 6.5);
  camera.rotation.order = "YXZ";
  camera.position.copy(CAM);
  camera.lookAt(0, 1.15, -5);
  const baseEuler = camera.rotation.clone();
  scene.add(camera);
  const soft = makeSoftTexture();

  const std = (color: number, roughness = 0.85, metalness = 0.08) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const fxMat = (color: number, opacity = 0.9, side: THREE.Side = THREE.DoubleSide) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side });
  const glowSprite = (color: number, scale: number, opacity = 0.85) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.scale.set(scale, scale, 1);
    return s;
  };

  scene.add(new THREE.AmbientLight(0xa8c8e8, 1.15));
  const dir = new THREE.DirectionalLight(0xcfe4ff, 1.35);
  dir.position.set(4, 9, 5);
  scene.add(dir);
  const arenaGlow = new THREE.PointLight(0x5a8ad0, 55, 28, 1.4);
  arenaGlow.position.set(0, 4.5, -6);
  scene.add(arenaGlow);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 56), std(0x1d4870, 0.95));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  for (const [r1, r2, op] of [[2.2, 2.3, 0.5], [3.4, 3.47, 0.35], [5.2, 5.27, 0.25]] as const) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 64), fxMat(0x4a8ad8, op));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    scene.add(ring);
  }
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 12.5;
    const z = Math.sin(a) * 12.5 - 4;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 4.4, 10), std(0x2a5584, 0.9));
    pillar.position.set(x, 2.2, z);
    const cap = glowSprite(0x3d78c8, 1.4, 0.5);
    cap.position.set(x, 4.5, z);
    scene.add(pillar, cap);
  }
  const moon = glowSprite(0x9fc8ff, 7, 0.35);
  moon.position.set(0, 5.2, -14);
  scene.add(moon);

  // viewmodel — a compact sidearm held bottom-right, kicks on every shot
  const gun = new THREE.Group();
  const gunM = std(0x1a2c42, 0.5, 0.55);
  const gunM2 = std(0x0d1c30, 0.6, 0.4);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.1, 0.3), gunM);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.3, 10), gunM2);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.28);
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.2), gunM);
  shroud.position.set(0, 0.02, -0.3);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.028, 0.012), gunM2);
  sight.position.set(0, 0.078, -0.34);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.06), gunM2);
  grip.position.set(0, -0.1, 0.09);
  grip.rotation.x = 0.32;
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.26), fxMat(0x2f6db3, 0.9, THREE.FrontSide));
  strip.position.set(0, 0.032, -0.02);
  const tipGlow = glowSprite(0x9fc8ff, 0.001, 0.9);
  tipGlow.position.set(0, 0.02, -0.46);
  gun.add(receiver, barrel, shroud, sight, grip, strip, tipGlow);
  const GUN_HIP = new THREE.Vector3(0.24, -0.21, -0.5);
  const GUN_ADS = new THREE.Vector3(0, -0.125, -0.42);
  const GUN_ROT_ADS = -0.06;
  gun.position.copy(GUN_HIP);
  camera.add(gun);

  // particle pool — one draw call for every spark and shard
  const PMAX = 2400;
  const pPos = new Float32Array(PMAX * 3);
  const pCol = new Float32Array(PMAX * 3);
  const pSiz = new Float32Array(PMAX);
  const vel = new Float32Array(PMAX * 3);
  const life = new Float32Array(PMAX);
  const span = new Float32Array(PMAX);
  const bs = new Float32Array(PMAX);
  const grav = new Float32Array(PMAX);
  const drg = new Float32Array(PMAX);
  const cr = new Float32Array(PMAX);
  const cg = new Float32Array(PMAX);
  const cb = new Float32Array(PMAX);
  let pCur = 0;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("pcolor", new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute("psize", new THREE.BufferAttribute(pSiz, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: soft }, uPx: { value: 500 } },
    vertexShader: `attribute float psize; attribute vec3 pcolor; varying vec3 vC;
      uniform float uPx;
      void main() { vC = pcolor; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = psize * (uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uMap; varying vec3 vC;
      void main() { float a = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(vC * a, 1.0); }`,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  function spawnP(x: number, y: number, z: number, vx: number, vy: number, vz: number, lifeS: number, size: number, r: number, g: number, b: number, gravV = 0, dragV = 0) {
    const i = pCur;
    pCur = (pCur + 1) % PMAX;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
    life[i] = lifeS; span[i] = lifeS; bs[i] = size;
    grav[i] = gravV; drg[i] = dragV;
    cr[i] = r; cg[i] = g; cb[i] = b;
  }
  function burst(p: THREE.Vector3, hex: number, n: number, power = 1, up = 0.7, size = 0.09, fx = 1) {
    const c = new THREE.Color(hex);
    const count = Math.round(n * fx);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const e = (Math.random() - 0.35) * Math.PI;
      const sp = power * (0.4 + Math.random());
      const tint = 0.7 + Math.random() * 0.5;
      spawnP(
        p.x, p.y, p.z,
        Math.cos(a) * Math.cos(e) * sp, Math.sin(e) * sp + up * power * 0.5, Math.sin(a) * Math.cos(e) * sp,
        0.45 + Math.random() * 0.75, size * (0.6 + Math.random() * 0.9),
        c.r * tint, c.g * tint, c.b * tint,
        2.6, 1.4,
      );
    }
  }

  const tracers: TracerFx[] = [];
  const rings: RingFx[] = [];
  const flashes: Flash[] = [];
  const pulses: Pulse[] = [];
  const floats: FloatText[] = [];
  let shakeT = 0;
  let ambientT = 0;
  let recoil = 0;
  let gunKick = 0;
  let adsT = 0;
  let adsOn = false;
  let reloadT = -1;
  const tmpV = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  function addFlash(p: THREE.Vector3, hex: number, peak = 22, dist = 9) {
    const light = new THREE.PointLight(hex, 0, dist, 1.6);
    light.position.copy(p);
    scene.add(light);
    flashes.push({ light, life: 0.3, max: 0.3, peak });
  }
  function addRing(p: THREE.Vector3, hex: number, flat: boolean) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.52, 40), fxMat(hex, 0.9));
    mesh.position.copy(p);
    if (flat) {
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.04;
    } else {
      mesh.lookAt(camera.position);
    }
    scene.add(mesh);
    rings.push({ mesh, life: 0.55, max: 0.55, flat });
  }
  function addPulse(p: THREE.Vector3, hex: number, size: number, dur = 0.35) {
    const sprite = glowSprite(hex, size * 0.4, 0.95);
    sprite.position.copy(p);
    scene.add(sprite);
    pulses.push({ sprite, life: dur, max: dur, size });
  }
  function addFloat(text: string, p: THREE.Vector3, hex: number) {
    const tex = makeTextTexture(text, `#${hex.toString(16).padStart(6, "0")}`);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sprite.scale.set(1.7, 0.42, 1);
    sprite.position.copy(p);
    scene.add(sprite);
    floats.push({ sprite, tex, life: 0.95, max: 0.95 });
  }
  function addTracer(src: THREE.Vector3, dst: THREE.Vector3, hex: number, dur = 0.09) {
    const lines: THREE.Line[] = [];
    for (const [hexL, op] of [[0xffffff, 0.9], [hex, 0.55]] as const) {
      const geo = new THREE.BufferGeometry().setFromPoints([src, dst]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: hexL, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
      line.frustumCulled = false;
      scene.add(line);
      lines.push(line);
    }
    tracers.push({ lines, life: dur, max: dur });
  }

  // enemies — assault bots that march on the player and fire when charged
  const enemies: Enemy[] = SLOTS.map((_, slot) => {
    const g = new THREE.Group();
    g.visible = false;
    g.position.set(SLOTS[slot][0], 0, SLOTS[slot][1]);
    const bodyM = new THREE.MeshStandardMaterial({ color: 0x33517a, roughness: 0.5, metalness: 0.55 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.62, 4, 12), bodyM);
    body.position.y = 0.92;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), bodyM);
    head.position.set(0, 1.55, 0);
    head.scale.set(1.1, 0.85, 1.1);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.08), new THREE.MeshBasicMaterial({ color: 0xff4455 }));
    visor.position.set(0, 1.58, 0.24);
    const eye = glowSprite(0xff4455, 0.5, 0.7);
    eye.position.set(0, 1.58, 0.3);
    const lshoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.22), bodyM);
    lshoulder.position.set(-0.42, 1.3, 0);
    const rshoulder = lshoulder.clone();
    rshoulder.position.x = 0.42;
    const core = glowSprite(0xff8844, 0.3, 0.8);
    core.position.set(0, 0.95, 0.3);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), fxMat(0xff4444, 0.2));
    disk.rotation.x = -Math.PI / 2;
    disk.position.y = 0.02;
    disk.scale.setScalar(0.001);
    g.add(body, head, visor, eye, lshoulder, rshoulder, core, disk);
    body.userData.slot = slot;
    head.userData.slot = slot;
    head.userData.head = true;
    scene.add(g);
    return { slot, elite: false, hp: 1, group: g, bodyM, eye, head, disk, charge: 0, chargeMax: 3.5, speed: 0.7, strafeAmp: 0.6, strafeSpd: 1.4, shotSpeed: 9, flash: 0, state: "dead" as EnemyState, t: 0 };
  });
  const hitList: THREE.Object3D[] = enemies.flatMap((e) => [e.group.children[0], e.head]);

  // interceptable enemy projectiles — shoot them down before they reach you
  const shotGeo = new THREE.SphereGeometry(0.15, 12, 10);
  const shotMat = new THREE.MeshBasicMaterial({ color: 0xff5533 });
  const enemyShots: EnemyShot[] = [];
  const shotMeshes: THREE.Object3D[] = [];
  function fireEnemyBolt(e: Enemy) {
    eyeWorld.set(0, 0, 0);
    e.eye.getWorldPosition(eyeWorld);
    const mesh = new THREE.Mesh(shotGeo, shotMat);
    mesh.position.copy(eyeWorld);
    mesh.add(glowSprite(0xff6644, 1.1, 0.85));
    const dst = new THREE.Vector3(CAM.x + rand(-0.3, 0.3), CAM.y + rand(-0.5, 0), CAM.z);
    const vel = dst.sub(eyeWorld).normalize().multiplyScalar(e.shotSpeed);
    const shot: EnemyShot = { mesh, vel };
    mesh.userData.shot = shot;
    scene.add(mesh);
    enemyShots.push(shot);
    shotMeshes.push(mesh);
    addFlash(eyeWorld, 0xff4455, 18, 8);
  }
  function detonateShot(shot: EnemyShot, fx: number, reward: boolean) {
    const p = shot.mesh.position.clone();
    burst(p, 0xff7744, 30, 2.2, 0.6, 0.08, fx);
    addPulse(p, 0xff7744, 1.2);
    addFlash(p, 0xff7744, 14, 7);
    removeShot(shot);
    if (reward) {
      addFloat("+30", p.setY(p.y + 0.4), 0xffe066);
      events.push({ type: "intercept", points: 30 });
    }
  }
  function removeShot(shot: EnemyShot) {
    scene.remove(shot.mesh);
    const gi = enemyShots.indexOf(shot);
    if (gi >= 0) enemyShots.splice(gi, 1);
    const mi = shotMeshes.indexOf(shot.mesh);
    if (mi >= 0) shotMeshes.splice(mi, 1);
  }

  function enemyPos(e: Enemy, y = 0): THREE.Vector3 {
    return tmpV.set(e.group.position.x, y, e.group.position.z).clone();
  }
  function spawnEnemy(slot: number, speed: number, chargeS: number, boltS: number, elite: boolean, hp: number) {
    const e = enemies[slot];
    e.elite = elite;
    e.hp = elite ? 3 : hp;
    e.speed = speed * rand(0.85, 1.15);
    e.chargeMax = chargeS * rand(0.9, 1.15);
    e.charge = chargeS * rand(0.15, 0.45);
    e.shotSpeed = boltS;
    e.state = "rise";
    e.t = 0;
    e.flash = 0;
    e.strafeAmp = rand(0.4, 1.1);
    e.strafeSpd = rand(1.2, 2.2) * (Math.random() < 0.5 ? 1 : -1);
    e.group.visible = true;
    e.group.scale.set(elite ? 1.18 : 1, 0.02, elite ? 1.18 : 1);
    e.group.rotation.set(0, 0, 0);
    e.group.position.set(SLOTS[slot][0], 0, SLOTS[slot][1]);
    e.bodyM.color.setHex(elite ? 0x6b5416 : 0x33517a);
    e.bodyM.emissive.setHex(0x000000);
    e.disk.scale.setScalar(0.001);
    e.eye.material.opacity = 0.7;
    burst(enemyPos(e, 0.3), elite ? 0xffe066 : 0xff4455, 14, 1.2, 0.8, 0.07, fxLevel);
    addRing(enemyPos(e), elite ? 0xffe066 : 0xff4455, true);
  }

  function killEnemy(e: Enemy, at: THREE.Vector3, fx: number) {
    const hex = e.elite ? 0xffe066 : 0xff6644;
    burst(at, hex, e.elite ? 90 : 60, e.elite ? 3.4 : 2.6, 0.9, 0.09, fx);
    burst(at, 0x22364e, 30, 1.6, 0.5, 0.07, fx);
    addRing(at.clone(), hex, false);
    addFlash(at, hex, e.elite ? 32 : 22, 9);
    addPulse(at, hex, e.elite ? 1.6 : 1.1);
    shakeT = Math.min(shakeT + 0.16, 0.5);
    e.state = "dying";
    e.t = 0;
  }

  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const CENTER = new THREE.Vector2(0, 0);
  const muzzleWorld = new THREE.Vector3();
  const eyeWorld = new THREE.Vector3();
  const tipLocal = new THREE.Vector3(0, 0.02, -0.46);

  function shoot(useCenter: boolean, nx: number, ny: number, mult: number, fx: number) {
    raycaster.setFromCamera(useCenter ? CENTER : ndc.set(nx, ny), camera);
    recoil = Math.min(recoil + 0.9, 1.6);
    gunKick = 1;
    camera.updateMatrixWorld();
    muzzleWorld.copy(tipLocal);
    gun.localToWorld(muzzleWorld);
    tipGlow.scale.set(0.5, 0.5, 1);
    tipGlow.material.opacity = 1;
    addFlash(muzzleWorld, 0xbfd8ff, 8, 4);
    spawnP(muzzleWorld.x, muzzleWorld.y, muzzleWorld.z, rand(-0.4, 0.4), rand(0.3, 0.9), rand(-0.4, 0.4), 0.18, 0.14, 1, 0.9, 0.6, 0, 0);

    let enemy: Enemy | null = null;
    let shotHit: EnemyShot | null = null;
    let crit = false;
    const point = new THREE.Vector3();
    for (const h of raycaster.intersectObjects(hitList.concat(shotMeshes), false)) {
      if (h.object.userData.shot) {
        shotHit = h.object.userData.shot as EnemyShot;
        point.copy(h.point);
        break;
      }
      const e = enemies[h.object.userData.slot as number];
      if (e.state === "live" || e.state === "rise") {
        enemy = e;
        crit = h.object.userData.head === true;
        point.copy(h.point);
        break;
      }
    }
    if (!enemy && !shotHit) {
      const gp = raycaster.ray.intersectPlane(floorPlane, tmpV);
      if (gp) point.copy(gp);
      else point.copy(raycaster.ray.direction).multiplyScalar(14).add(camera.position);
    }
    addTracer(muzzleWorld, point, 0xffc266);
    if (shotHit) {
      detonateShot(shotHit, fx, true);
      events.push({ type: "hit" });
    } else if (enemy) {
      enemy.hp -= crit ? 2 : 1;
      enemy.flash = 1;
      enemy.bodyM.emissive.setHex(0x9fc8ff);
      enemy.bodyM.emissiveIntensity = 0.9;
      burst(point, 0xffffff, 14, 1.5, 0.5, 0.06, fx);
      shakeT = Math.min(shakeT + 0.06, 0.5);
      if (enemy.hp <= 0) {
        const base = (enemy.elite ? 250 : 100) + (crit ? 50 : 0);
        const pts = Math.round(base * mult);
        killEnemy(enemy, point, fx);
        addFloat(`+${pts}`, point.clone().setY(point.y + 0.5), enemy.elite ? 0xffe066 : 0xc8ddef);
        if (crit) addFloat("HEADSHOT", point.clone().setY(point.y + 0.95), 0xffe066);
        events.push({ type: "kill", points: pts, crit });
      } else {
        events.push({ type: "hit" });
      }
    } else {
      burst(point, 0x5a7085, 10, 1.3, 0.6, 0.05, fx);
    }
  }

  let fxLevel = 1;
  const events: GameEvent[] = [];

  function update(dt: number, now: number, fullFx: boolean, running: boolean, aimYaw: number, aimPitch: number) {
    fxLevel = fullFx ? 1 : 0.45;
    ambientT += dt;
    if (ambientT > 0.9) {
      ambientT = 0;
      for (let i = 0; i < 3; i += 1) {
        spawnP(rand(-8, 8), rand(0.3, 3.6), rand(-13, 2), rand(-0.06, 0.06), rand(0.02, 0.1), rand(-0.04, 0.04), rand(3, 5), 0.045, 0.16, 0.28, 0.4, -0.01, 0);
      }
    }
    for (let i = 0; i < PMAX; i += 1) {
      if (life[i] <= 0) continue;
      life[i] -= dt;
      if (life[i] <= 0) {
        pSiz[i] = 0;
        pCol[i * 3] = 0; pCol[i * 3 + 1] = 0; pCol[i * 3 + 2] = 0;
        continue;
      }
      vel[i * 3 + 1] -= grav[i] * dt;
      const dr = Math.max(0, 1 - drg[i] * dt);
      vel[i * 3] *= dr; vel[i * 3 + 1] *= dr; vel[i * 3 + 2] *= dr;
      pPos[i * 3] += vel[i * 3] * dt;
      pPos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pPos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pPos[i * 3 + 1] < 0.02) { pPos[i * 3 + 1] = 0.02; vel[i * 3 + 1] *= -0.35; }
      const f = life[i] / span[i];
      pCol[i * 3] = cr[i] * f; pCol[i * 3 + 1] = cg[i] * f; pCol[i * 3 + 2] = cb[i] * f;
      pSiz[i] = bs[i] * (0.35 + 0.65 * f);
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.pcolor.needsUpdate = true;
    pGeo.attributes.psize.needsUpdate = true;

    for (let i = tracers.length - 1; i >= 0; i -= 1) {
      const tr = tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        for (const line of tr.lines) {
          scene.remove(line);
          line.geometry.dispose();
          (line.material as THREE.Material).dispose();
        }
        tracers.splice(i, 1);
        continue;
      }
      const f = tr.life / tr.max;
      for (const line of tr.lines) (line.material as THREE.LineBasicMaterial).opacity = f * 0.9;
    }
    for (let i = rings.length - 1; i >= 0; i -= 1) {
      const r = rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        rings.splice(i, 1);
        continue;
      }
      const t = 1 - r.life / r.max;
      r.mesh.scale.setScalar(0.4 + easeOut(t) * (r.flat ? 3.2 : 1.8));
      r.mesh.material.opacity = (1 - t) * 0.85;
      if (!r.flat) r.mesh.lookAt(camera.position);
    }
    for (let i = flashes.length - 1; i >= 0; i -= 1) {
      const f = flashes[i];
      f.life -= dt;
      if (f.life <= 0) {
        scene.remove(f.light);
        flashes.splice(i, 1);
        continue;
      }
      f.light.intensity = f.peak * (f.life / f.max) ** 2;
    }
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const p = pulses[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.sprite);
        (p.sprite.material as THREE.Material).dispose();
        pulses.splice(i, 1);
        continue;
      }
      const t = 1 - p.life / p.max;
      p.sprite.scale.setScalar(p.size * (0.4 + easeOut(t) * 1.4));
      (p.sprite.material as THREE.SpriteMaterial).opacity = (1 - t) * 0.95;
    }
    for (let i = floats.length - 1; i >= 0; i -= 1) {
      const f = floats[i];
      f.life -= dt;
      if (f.life <= 0) {
        scene.remove(f.sprite);
        f.sprite.material.dispose();
        f.tex.dispose();
        floats.splice(i, 1);
        continue;
      }
      f.sprite.position.y += dt * 0.75;
      (f.sprite.material as THREE.SpriteMaterial).opacity = f.life / f.max;
    }
    tipGlow.material.opacity += (0 - tipGlow.material.opacity) * dt * 14;

    for (const e of enemies) {
      if (e.state === "dead") continue;
      if (e.flash > 0) {
        e.flash = Math.max(0, e.flash - dt * 4);
        if (e.flash === 0) e.bodyM.emissiveIntensity = 0;
      }
      if (e.state === "rise") {
        e.t += dt;
        const s = easeOut(Math.min(e.t / 0.28, 1));
        const base = e.elite ? 1.18 : 1;
        e.group.scale.set(base, Math.max(s * base, 0.02), base);
        if (s >= 1) e.state = "live";
      } else if (e.state === "live") {
        if (running) {
          e.group.position.z += e.speed * dt;
          e.group.position.x = SLOTS[e.slot][0] + Math.sin(now * 0.001 * e.strafeSpd + e.slot * 2) * e.strafeAmp;
          e.group.rotation.y = Math.sin(now * 0.001 * e.strafeSpd + e.slot) * 0.15;
          e.charge += dt;
          const frac = Math.min(Math.max(e.charge / e.chargeMax, 0), 1);
          e.disk.scale.setScalar(Math.max(frac, 0.001));
          e.disk.material.opacity = 0.1 + 0.3 * frac;
          e.eye.material.opacity = 0.45 + 0.55 * frac;
          e.eye.scale.setScalar(0.4 + 0.5 * frac);
          if (e.charge >= e.chargeMax) {
            e.charge = -0.9;
            fireEnemyBolt(e);
          }
          if (e.group.position.z >= MELEE_Z) {
            burst(enemyPos(e, 1.1), 0xff5544, 70, 3.4, 0.9, 0.1, fxLevel);
            addFlash(enemyPos(e, 1), 0xff5544, 28, 10);
            addPulse(enemyPos(e, 1), 0xff5544, 1.8);
            shakeT = Math.min(shakeT + 0.4, 0.7);
            e.state = "dead";
            e.group.visible = false;
            events.push({ type: "hurt" });
          }
        }
      } else {
        e.t += dt;
        const s = Math.max(1 - e.t / 0.22, 0);
        e.group.rotation.x = -(1 - s) * 1.4;
        if (s <= 0) {
          e.state = "dead";
          e.group.visible = false;
          e.group.rotation.x = 0;
        }
      }
    }

    for (let i = enemyShots.length - 1; i >= 0; i -= 1) {
      const s = enemyShots[i];
      s.mesh.position.addScaledVector(s.vel, dt);
      if (Math.random() < dt * 30) {
        spawnP(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3), 0.3, 0.1, 1, 0.35, 0.15, 0, 0);
      }
      if (s.mesh.position.distanceToSquared(CAM) < 0.6 || s.mesh.position.z > CAM.z + 0.5) {
        const p = s.mesh.position.clone();
        burst(p, 0xff4433, 40, 2.8, 0.4, 0.09, fxLevel);
        addFlash(p, 0xff4433, 20, 8);
        shakeT = Math.min(shakeT + 0.35, 0.7);
        removeShot(s);
        if (running) events.push({ type: "hurt" });
      }
    }

    // viewmodel — breathing sway, recoil, reload dip, ADS centering
    recoil = Math.max(0, recoil - dt * 5);
    gunKick = Math.max(0, gunKick - dt * 7);
    adsT = Math.min(Math.max(adsT + (adsOn ? dt : -dt) * 7, 0), 1);
    const dip = reloadT >= 0 ? Math.sin(Math.min(reloadT, 1) * Math.PI) * 0.16 : 0;
    if (reloadT >= 0) {
      reloadT += dt / (RELOAD_MS / 1000);
      if (reloadT >= 1) reloadT = -1;
    }
    gun.position.lerpVectors(GUN_HIP, GUN_ADS, adsT);
    gun.position.z += gunKick * 0.07;
    gun.position.y += Math.sin(now * 0.0016) * 0.004 - dip;
    gun.rotation.x = recoil * 0.05;
    gun.rotation.z = GUN_ROT_ADS * adsT + dip * 0.5;
    camera.fov = 52 - adsT * 15;
    camera.updateProjectionMatrix();

    shakeT = Math.max(0, shakeT - dt * 1.6);
    const sway = fullFx ? 0.05 : 0;
    camera.position.set(
      CAM.x + Math.sin(now * 0.00045) * sway + (Math.random() - 0.5) * shakeT * 0.35,
      CAM.y + Math.sin(now * 0.0006 + 1) * sway * 0.6 + (Math.random() - 0.5) * shakeT * 0.25,
      CAM.z,
    );
    camera.rotation.y = baseEuler.y + aimYaw;
    camera.rotation.x = baseEuler.x + aimPitch + recoil * 0.045;
    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 420;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(Math.round(w * dpr), Math.round(h * dpr), false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uPx.value = (h * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  function freeSlots(): number[] {
    const free: number[] = [];
    for (const e of enemies) if (e.state === "dead") free.push(e.slot);
    return free;
  }
  function clearField() {
    for (const e of enemies) {
      e.state = "dead";
      e.group.visible = false;
    }
    for (const s of [...enemyShots]) removeShot(s);
    for (const tr of tracers) {
      for (const line of tr.lines) {
        scene.remove(line);
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      }
    }
    tracers.length = 0;
    for (const r of rings) {
      scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
    }
    rings.length = 0;
    for (const f of flashes) scene.remove(f.light);
    flashes.length = 0;
    for (const p of pulses) {
      scene.remove(p.sprite);
      (p.sprite.material as THREE.Material).dispose();
    }
    pulses.length = 0;
    for (const f of floats) {
      scene.remove(f.sprite);
      f.sprite.material.dispose();
      f.tex.dispose();
    }
    floats.length = 0;
  }

  return {
    events,
    update,
    shoot,
    spawn: spawnEnemy,
    clearField,
    freeSlots,
    setAds(on: boolean) {
      adsOn = on;
    },
    setReload() {
      reloadT = 0;
    },
    alive: () => enemies.filter((e) => e.state !== "dead").length,
    firework() {
      const p = new THREE.Vector3(rand(-4.5, 4.5), rand(2.4, 4.6), rand(-9, -3));
      const hex = [0xff8a3c, 0x8fc3ff, 0xffe066][Math.floor(Math.random() * 3)];
      burst(p, hex, 70, 3.2, 0.4, 0.08, fxLevel);
      addPulse(p, hex, 1.8);
      addFlash(p, hex, 16, 9);
    },
    dispose() {
      ro.disconnect();
      clearField();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          const m = mesh.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (m) m.dispose();
        }
        const spr = o as THREE.Sprite;
        if (spr.isSprite) spr.material.dispose();
      });
      pGeo.dispose();
      pMat.dispose();
      shotGeo.dispose();
      shotMat.dispose();
      soft.dispose();
      renderer.dispose();
    },
  };
}
type Engine = ReturnType<typeof createEngine>;

type GameState = {
  level: number;
  diff: Difficulty;
  hearts: number;
  kills: number;
  spawned: number;
  lastSpawn: number;
  score: number;
  combo: number;
  maxCombo: number;
  shots: number;
  hits: number;
  ammo: number;
  reloadUntil: number;
  lastBurst: number;
};
const freshGame = (diff: Difficulty): GameState => ({ level: 1, diff, hearts: MAX_HEARTS, kills: 0, spawned: 0, lastSpawn: 0, score: 0, combo: 0, maxCombo: 0, shots: 0, hits: 0, ammo: MAG, reloadUntil: 0, lastBurst: 0 });

const STAGE_VERDICTS = [
  { ko: "제품을 생각하고,", en: "Thinks about the product," },
  { ko: "기업을 생각하고,", en: "thinks about the business," },
  { ko: "문제부터 파고드는,", en: "digs into the problem first," },
  { ko: "의사소통이 뛰어난 —", en: "communicates brilliantly —" },
];

export function BotArena({ onExit }: { onExit?: () => void }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retRef = useRef<HTMLDivElement>(null);
  const ammoRef = useRef<HTMLSpanElement>(null);
  const reloadRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<Engine | null>(null);
  const gameRef = useRef<GameState>(freshGame("normal"));
  const phaseRef = useRef<Phase>("ready");
  const aimRef = useRef({ yaw: 0, pitch: 0, ads: false });
  const lockRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [diff, setDiff] = useState<Difficulty>("normal");
  const [hearts, setHearts] = useState(3);
  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hurt, setHurt] = useState(0);
  const [hitMark, setHitMark] = useState<"hit" | "kill" | 0>(0);
  const [showPromo, setShowPromo] = useState(false);
  const [fail, setFail] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockable, setLockable] = useState(false);
  const [stats, setStats] = useState<{ score: number; acc: number; maxCombo: number } | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  const snapshotStats = () => {
    const g = gameRef.current;
    setStats({ score: g.score, acc: g.shots ? Math.round((g.hits / g.shots) * 100) : 0, maxCombo: g.maxCombo });
  };
  const startGame = (d: Difficulty) => {
    gameRef.current = freshGame(d);
    engRef.current?.clearField();
    setDiff(d);
    setLevel(1);
    setHearts(MAX_HEARTS);
    setKills(0);
    setScore(0);
    setCombo(0);
    setStats(null);
    setShowPromo(false);
    setPhase("run");
  };
  const nextLevel = () => {
    const g = gameRef.current;
    g.level += 1;
    g.kills = 0;
    g.spawned = 0;
    g.lastSpawn = performance.now();
    g.hearts = Math.min(g.hearts + 1, MAX_HEARTS);
    engRef.current?.clearField();
    setLevel(g.level);
    setKills(0);
    setHearts(g.hearts);
    setPhase("run");
  };
  const continueRun = () => {
    gameRef.current.hearts = MAX_HEARTS;
    setHearts(MAX_HEARTS);
    setPhase("run");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let eng: Engine;
    try {
      eng = createEngine(canvas);
    } catch {
      requestAnimationFrame(() => setFail(true));
      return;
    }
    engRef.current = eng;
    const canLock = typeof canvas.requestPointerLock === "function" && window.matchMedia("(pointer:fine)").matches;
    setLockable(canLock);
    let unlockAt = 0;
    const tryLock = () => {
      if (performance.now() - unlockAt < 1350) return;
      try {
        Promise.resolve(canvas.requestPointerLock()).catch(() => {});
      } catch {
        /* browser still in its post-exit cooldown */
      }
    };

    const tryReload = () => {
      const g = gameRef.current;
      const now = performance.now();
      if (g.reloadUntil > now || g.ammo === MAG) return;
      g.reloadUntil = now + RELOAD_MS;
      eng.setReload();
    };
    const fire = (useCenter: boolean, nx = 0, ny = 0) => {
      const g = gameRef.current;
      const now = performance.now();
      if (g.reloadUntil > now) return;
      if (g.ammo <= 0) {
        tryReload();
        return;
      }
      g.ammo -= 1;
      g.shots += 1;
      const mult = 1 + Math.min(g.combo, 12) * 0.1;
      eng.shoot(useCenter, nx, ny, mult, reducedRef.current ? 0.45 : 1);
      if (g.ammo <= 0) tryReload();
    };
    const onDown = (e: PointerEvent) => {
      if (phaseRef.current !== "run") return;
      if (e.button === 2) {
        setAds(true);
        return;
      }
      if (e.button !== 0) return;
      if (lockRef.current) {
        fire(true);
        return;
      }
      const r = canvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      moveReticle(e.clientX - r.left, e.clientY - r.top);
      fire(false, nx, ny);
      if (canLock) tryLock();
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 2) setAds(false);
    };
    const moveReticle = (x: number, y: number) => {
      const el = retRef.current;
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (lockRef.current) return;
      const r = canvas.getBoundingClientRect();
      moveReticle(e.clientX - r.left, e.clientY - r.top);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!lockRef.current) return;
      const sens = aimRef.current.ads ? 0.0012 : 0.0022;
      aimRef.current.yaw = THREE.MathUtils.clamp(aimRef.current.yaw - e.movementX * sens, -0.62, 0.62);
      aimRef.current.pitch = THREE.MathUtils.clamp(aimRef.current.pitch - e.movementY * sens, -0.3, 0.42);
    };
    const setAds = (on: boolean) => {
      if (aimRef.current.ads === on) return;
      aimRef.current.ads = on;
      eng.setAds(on);
    };
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "run") return;
      if (e.key.toLowerCase() === "r") tryReload();
      if (e.key === "Shift" || e.key.toLowerCase() === "z") setAds(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift" || e.key.toLowerCase() === "z") setAds(false);
    };
    const onLockChange = () => {
      lockRef.current = document.pointerLockElement === canvas;
      setLocked(lockRef.current);
      if (lockRef.current) moveReticle(canvas.clientWidth / 2, canvas.clientHeight / 2);
      else unlockAt = performance.now();
    };
    const onMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("contextmenu", onMenu);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("pointerlockchange", onLockChange);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const g = gameRef.current;
      const ph = phaseRef.current;
      if (ph === "run") {
        const cfg = LEVELS[g.level - 1];
        const df = DIFFS[g.diff];
        if (g.spawned < cfg.quota && eng.alive() < cfg.active && now - g.lastSpawn > cfg.gap * df.gap) {
          const free = eng.freeSlots();
          if (free.length > 0) {
            const first = g.spawned === 0;
            g.spawned += 1;
            g.lastSpawn = now;
            const slot = free[Math.floor(Math.random() * free.length)];
            eng.spawn(slot, cfg.speed * df.speed * (first ? 0.7 : 1), cfg.charge * df.charge * (first ? 1.4 : 1), cfg.bolt * df.bolt, !first && Math.random() < cfg.elite, cfg.hp);
          }
        }
        if (g.reloadUntil > 0 && now >= g.reloadUntil) {
          g.ammo = MAG;
          g.reloadUntil = 0;
        }
      } else if (ph === "won" && !reducedRef.current && now - g.lastBurst > 380) {
        g.lastBurst = now;
        eng.firework();
      }
      if (ammoRef.current) {
        ammoRef.current.textContent = g.reloadUntil > now ? "RELOADING" : `${"▮".repeat(g.ammo)}${"▯".repeat(MAG - g.ammo)}`;
      }
      if (reloadRef.current) {
        reloadRef.current.style.width = g.reloadUntil > now ? `${(1 - (g.reloadUntil - now) / RELOAD_MS) * 100}%` : "0%";
      }
      eng.update(dt, now, !reducedRef.current, ph === "run", aimRef.current.yaw, aimRef.current.pitch);
      for (const ev of eng.events) {
        if (ev.type === "kill") {
          g.hits += 1;
          g.kills += 1;
          g.combo += 1;
          g.maxCombo = Math.max(g.maxCombo, g.combo);
          g.score += ev.points ?? 0;
          setScore(g.score);
          setCombo(g.combo);
          setKills(g.kills);
          setHitMark(ev.crit ? "kill" : "hit");
          window.setTimeout(() => setHitMark(0), 140);
          if (g.kills >= LEVELS[g.level - 1].quota) {
            snapshotStats();
            setPhase(g.level >= MAX_LEVEL ? "won" : "stage");
          }
        } else if (ev.type === "intercept") {
          g.hits += 1;
          g.score += ev.points ?? 0;
          setScore(g.score);
          setHitMark("hit");
          window.setTimeout(() => setHitMark(0), 140);
        } else if (ev.type === "hit") {
          g.hits += 1;
          setHitMark("hit");
          window.setTimeout(() => setHitMark(0), 140);
        } else if (ev.type === "hurt") {
          g.hearts -= 1;
          g.combo = 0;
          setCombo(0);
          setHearts(Math.max(g.hearts, 0));
          setHurt((h) => h + 1);
          if (g.hearts <= 0) {
            snapshotStats();
            setPhase("lost");
          }
        }
      }
      eng.events.length = 0;
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("contextmenu", onMenu);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onLockChange);
      eng.dispose();
      engRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = phase === "run" ? "none" : "crosshair";
  }, [phase]);

  useEffect(() => {
    if (phase !== "won") return;
    const timer = window.setTimeout(() => setShowPromo(true), reduced ? 300 : 1400);
    return () => window.clearTimeout(timer);
  }, [phase, reduced]);

  const quota = LEVELS[level - 1].quota;
  const acc = stats?.acc ?? 0;
  const commentary = phase === "won"
    ? (en ? `Arena cleared — ${stats?.score ?? 0} pts at ${acc}% accuracy. The top defender is Kim Dowon.` : `아레나 클리어 — ${stats?.score ?? 0}점, 명중률 ${acc}%. 최고의 디펜더는 김도원입니다.`)
    : phase === "lost"
      ? (en ? "The bots broke through. Reload, breathe, and hold the line." : "봇들이 뚫고 들어왔네요. 재장전하고 심호흡 후 다시 방어하세요.")
      : phase === "stage"
        ? (en ? `Wave ${level} cleared! The combat log records a verdict.` : `웨이브 ${level} 방어 성공! 전투 기록에 판정이 남습니다.`)
        : phase === "run"
          ? (en ? `Wave ${level}/${MAX_LEVEL} — incoming bolts can be shot down mid-flight. Gold elites take 3 hits. R reloads, right-click or Shift aims.` : `웨이브 ${level}/${MAX_LEVEL} — 날아오는 탄은 쏴서 요격하세요. 황금 엘리트는 3방. R 재장전, 우클릭/Shift 조준.`)
          : (en ? `${MAX_LEVEL} waves of assault bots. Headshots hit harder, kill streaks multiply.` : `돌격 봇 ${MAX_LEVEL}웨이브. 헤드샷은 더 강하고, 연속 킬은 배율 상승.`);

  return (
    <main id="main" className="wc-page">
      <div className="bb-shell">
        <header className="wc-hud">
          {onExit && <button type="button" className="ac-back" onClick={onExit}>← {en ? "Games" : "게임 선택"}</button>}
          <span className="wc-hud-stage">BOT ARENA</span>
          <span className="wc-hud-match">
            {phase === "run" || phase === "stage"
              ? `WAVE ${level}/${MAX_LEVEL} · ${"♥".repeat(hearts)}${"♡".repeat(Math.max(MAX_HEARTS - hearts, 0))} · ${kills}/${quota} · ${score}${combo > 1 ? ` · ×${(1 + Math.min(combo, 12) * 0.1).toFixed(1)}` : ""}`
              : `${MAX_LEVEL} WAVES · FPS`}
          </span>
        </header>
        <BearBubble>{commentary}</BearBubble>
        <div className="bb-frame">
          <canvas ref={canvasRef} className="bb-canvas" aria-label={en ? "First-person bot arena canvas" : "1인칭 봇 아레나 캔버스"} role="img" />
          {phase === "run" && (
            <>
              <div ref={retRef} className={`sc-reticle${hitMark ? ` sc-${hitMark}` : ""}`} aria-hidden="true" />
              <div className="sc-ammo" aria-hidden="true">
                <span ref={ammoRef} />
                <i className="sc-reload"><b ref={reloadRef} /></i>
              </div>
              {lockable && !locked && (
                <div className="sc-hint" aria-hidden="true">{en ? "CLICK TO AIM · ESC TO RELEASE" : "클릭하면 조준 · ESC 해제"}</div>
              )}
            </>
          )}
          {hurt > 0 && <div key={hurt} className="sc-flash" aria-hidden="true" />}
          {fail && (
            <div className="bb-overlay">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">BOT ARENA</span>
              <h2>{en ? "WebGL unavailable." : "WebGL을 사용할 수 없습니다."}</h2>
              <p>{en ? "This game needs a browser with WebGL2. The other games still work." : "이 게임은 WebGL2를 지원하는 브라우저가 필요합니다. 다른 게임은 그대로 즐길 수 있어요."}</p>
              {onExit && <Button type="button" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
            </div>
          )}
          {!fail && phase === "ready" && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">BOT ARENA</span>
              <h2>{en ? "Hold the line." : "전선을 사수하라."}</h2>
              <div className="sf-diff" role="group" aria-label={en ? "Difficulty" : "난이도"}>
                {(["easy", "normal", "hard"] as const).map((d) => (
                  <button key={d} type="button" className={diff === d ? "active" : ""} onClick={() => setDiff(d)}>
                    {DIFFS[d].label[locale]}
                  </button>
                ))}
              </div>
              <p>{en ? "Hostile bots charge in and fire plasma bolts when their red gauge fills — bolts can be shot down mid-flight for bonus points. Headshots deal double damage, gold elites take 3 hits, kill streaks multiply your score. Click to lock aim (ESC releases), R reloads, hold right-click or Shift to aim down sights." : "적 봇들이 돌격해오며 붉은 게이지가 차면 플라즈마탄을 발사합니다 — 날아오는 탄은 쏴서 요격하면 보너스 점수. 헤드샷은 2배 피해, 황금 엘리트는 3방, 연속 킬은 점수 배율 상승. 클릭하면 조준 모드(ESC 해제), R 재장전, 우클릭 또는 Shift 홀드로 정조준."}</p>
              <Button type="button" onClick={() => startGame(diff)}>{en ? "Deploy" : "출격"} <RobotIcon size={17} /></Button>
            </div>
          )}
          {!fail && phase === "stage" && stats && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="happy" className="bb-overlay-bear" />
              <span className="wc-kicker">{en ? `WAVE ${level} CLEARED` : `웨이브 ${level} 방어 성공`}</span>
              <h2>{en ? "Line held." : "전선 사수."}</h2>
              <p>
                {`SCORE ${stats.score} · ACC ${stats.acc}% · MAX COMBO ×${stats.maxCombo}`}<br />
                {en ? `The combat log records: "${STAGE_VERDICTS[level - 1].en}"` : `전투 기록의 판정 — "${STAGE_VERDICTS[level - 1].ko}"`}
              </p>
              <Button type="button" onClick={nextLevel}>{en ? `Wave ${level + 1}` : `웨이브 ${level + 1}`} <ArrowRightIcon size={17} /></Button>
            </div>
          )}
          {!fail && phase === "lost" && stats && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="shocked" className="bb-overlay-bear" />
              <span className="wc-kicker">OVERRUN</span>
              <h2>{en ? "The bots broke through." : "전선 돌파."}</h2>
              <p>{`SCORE ${stats.score} · ACC ${stats.acc}% · MAX COMBO ×${stats.maxCombo}`}</p>
              <div className="sf-diff" role="group" aria-label={en ? "Difficulty" : "난이도"}>
                {(["easy", "normal", "hard"] as const).map((d) => (
                  <button key={d} type="button" className={diff === d ? "active" : ""} onClick={() => setDiff(d)}>
                    {DIFFS[d].label[locale]}
                  </button>
                ))}
              </div>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b><br />
                {en ? "(He'll reload your hearts.)" : "(하트는 김도원이 채워줍니다.)"}
              </p>
              <div className="bb-promo-actions">
                <Button type="button" onClick={continueRun}><HeartIcon size={17} /> {en ? "Recharge & continue" : "하트 재충전"}</Button>
                <Button type="button" variant="secondary" onClick={() => startGame(diff)}><ArrowCounterClockwiseIcon size={17} /> {en ? "From the top" : "처음부터"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
          {!fail && showPromo && stats && (
            <div className="bb-overlay bb-promo">
              <BlueBear mood="smug" className="bb-overlay-bear" />
              <span className="wc-kicker">ARENA CLEARED</span>
              <h2>{en ? "Top defender: Kim Dowon." : "최고의 디펜더는… 김도원."}</h2>
              <p>{`SCORE ${stats.score} · ACC ${stats.acc}% · MAX COMBO ×${stats.maxCombo}`}</p>
              <p className="bb-promo-copy">
                {en ? "Thinks about the product," : "제품을 생각하고"}<br />
                {en ? "thinks about the business," : "기업을 생각하고"}<br />
                {en ? "communicates brilliantly —" : "의사소통이 뛰어난"}<br />
                <b>{en ? "Kim Dowon. Recommended." : "김도원 추천합니다."}</b>
              </p>
              <div className="bb-promo-actions">
                <Button asChild><Link href="/work">{en ? "View projects" : "프로젝트 보기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button asChild variant="secondary"><Link href="/contact">{en ? "Contact" : "연락하기"} <ArrowRightIcon size={17} /></Link></Button>
                <Button type="button" variant="secondary" onClick={() => startGame(diff)}><FlagIcon size={17} /> {en ? "Defend again" : "다시 방어"}</Button>
                {onExit && <Button type="button" variant="secondary" onClick={onExit}>{en ? "All games" : "다른 게임"}</Button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
