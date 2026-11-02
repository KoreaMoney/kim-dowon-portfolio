// Ocean scene — adapted from Ultra-Water (MIT, https://github.com/Humpalumps/Ultra-Water).
// Same scene graph and per-frame pipeline as the upstream demo (src/main.js); the
// lil-gui panel, perf HUD and benchmark harness are removed, and the module exposes
// a small imperative API instead: mount into `container`, run the loop, dispose.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OceanSim, defaultOceanParams } from './water/OceanSim.js';
import { OceanSurface } from './water/OceanSurface.js';
import { bakeShoreMap } from './water/shoreMap.js';
import { bakeWaterTextures } from './water/bakeTextures.js';
import { SkySystem } from './scene/sky.js';
import { createTerrain } from './scene/terrain.js';
import { islandHeight } from './scene/islandHeight.js';
import { PlanarReflection } from './engine/PlanarReflection.js';
import { PostFX } from './engine/PostFX.js';
import { GpuTimer } from './engine/gpuTimer.js';
import { FullscreenQuad, rawPass } from './engine/fullscreen.js';
import { WaterQuery } from './water/WaterQuery.js';
import { UnderwaterPass } from './water/UnderwaterPass.js';
import { Spray } from './water/Spray.js';
import { MarineSnow } from './water/MarineSnow.js';
import { Floaters } from './scene/floaters.js';
import { FloaterShadow } from './scene/floaterShadow.js';
import { MarineLife } from './scene/marine.js';
import { Precipitation } from './scene/rain.js';
import { solarPosition } from './solar.js';
import { WaveCaustics } from './water/Caustics.js';

const REFLECT_LAYER = 1;

// water colour presets from the upstream demo (linear RGB)
const WATER_PRESETS = {
  clear: { absorption: [0.42, 0.075, 0.048], scatter: [0.0, 0.05, 0.08], foam: [0.62, 0.78, 0.82], turbidity: 0.03 },
  tropical: { absorption: [0.36, 0.045, 0.06], scatter: [0.0, 0.085, 0.085], foam: [0.66, 0.86, 0.84], turbidity: 0.02 },
  'toxic green': { absorption: [0.45, 0.1, 1.1], scatter: [0.05, 0.1, 0.004], foam: [0.74, 0.84, 0.42], turbidity: 0.08 },
  purple: { absorption: [0.22, 0.85, 0.1], scatter: [0.05, 0.0, 0.09], foam: [0.8, 0.66, 0.88], turbidity: 0.04 },
  'rust orange': { absorption: [0.1, 0.34, 1.2], scatter: [0.11, 0.035, 0.004], foam: [0.9, 0.72, 0.55], turbidity: 0.1 },
  'murky brown': { absorption: [0.55, 0.62, 0.9], scatter: [0.045, 0.045, 0.022], foam: [0.78, 0.74, 0.6], turbidity: 0.25 },
};

export function createOcean(container, options = {}) {
  const {
    view = 'Now',
    onReady = null,
    coords = { lat: 37.5665, lon: 126.978 },   // Seoul — sky follows real time here
  } = options;

  const renderer = new THREE.WebGLRenderer({
    antialias: false, depth: false, stencil: false, alpha: false, powerPreference: 'high-performance',
  });
  renderer.autoClear = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  container.appendChild(renderer.domElement);

  // one build: phones and tablets (a finger is the main pointer) start on a lighter
  // profile, measured on an Adreno 732 to hold 60 fps
  const mobile = matchMedia('(pointer: coarse)').matches;
  const quality = mobile
    ? { resolution: 0.6, msaa: 2, reflections: true, reflectionScale: 0.35, autoResolution: true }
    : { resolution: 1, msaa: 4, reflections: true, reflectionScale: 0.5 };
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 80000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxDistance = 6000;

  // --- world ------------------------------------------------------------------------
  const sky = new SkySystem(renderer);
  const shore = bakeShoreMap(islandHeight, 1800, 512);
  const tex = bakeWaterTextures(renderer);
  const ocean = new OceanSim(renderer, defaultOceanParams());
  const caustics = new WaveCaustics(renderer, ocean);
  const floatShadow = new FloaterShadow();
  const surface = new OceanSurface(ocean, shore, sky, floatShadow.uniforms);
  surface.uniforms.uFoamTex.value = tex.foam;

  const scene = new THREE.Scene();
  scene.environment = sky.cube;
  scene.add(sky.background);
  const terrain = createTerrain({
    sky, caustics: caustics.uniforms, floatShadow: floatShadow.uniforms, water: surface.uniforms,
    absorption: surface.uniforms.uAbsorption.value, reflectionLayer: REFLECT_LAYER,
  });
  scene.add(terrain.group);

  const sunLight = new THREE.DirectionalLight(0xffffff, Math.PI);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(4096, 4096);
  Object.assign(sunLight.shadow.camera, { left: -900, right: 900, top: 900, bottom: -900, near: 10, far: 5000 });
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.6;
  scene.add(sunLight, sunLight.target);
  surface.uniforms.uShadowMatrix.value = terrain.uniforms.uSunShadowMatrix.value = sunLight.shadow.matrix;
  surface.uniforms.uShadowBias.value = 0.05 / (sunLight.shadow.camera.far - sunLight.shadow.camera.near);

  // buoyancy: slot 0 of every water query is the camera (underwater test), then floaters
  const query = new WaterQuery(renderer, surface, 512);
  const floaters = new Floaters({ scene, heightAt: islandHeight, patchMaterial: terrain.patchProp });
  const underwater = new UnderwaterPass(surface, camera, caustics.uniforms);
  let camWater = 0, wasSubmerged = false, uwComp = 1;
  const look = { underwater: 0.55 };   // exposure compensation under water

  const reflection = new PlanarReflection(REFLECT_LAYER);
  surface.uniforms.uReflMatrix.value = reflection.textureMatrix;
  const emptyReflection = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  emptyReflection.needsUpdate = true;

  // water pass: draw into the same MSAA buffer, sampling the resolved opaque colour and
  // depth. three keeps the MSAA colour after a resolve except on the Oculus browser,
  // where it invalidates it; only there is the colour copied back first.
  const waterScene = new THREE.Scene();
  const restore = new FullscreenQuad(rawPass(/* glsl */`
precision highp float;
uniform sampler2D uTex;
in vec2 vUv;
out vec4 outColor;
void main() { outColor = texture(uTex, vUv); }`, { uTex: { value: null } }));
  restore.mesh.renderOrder = -1;
  if (/OculusBrowser/.test(navigator.userAgent)) waterScene.add(restore.mesh);
  const spray = new Spray(surface, shore);
  const snow = new MarineSnow(surface);
  waterScene.add(surface.mesh, spray.mesh, spray.splash, snow.mesh);

  const post = new PostFX(renderer);
  post.params.bloomStrength = 0.05;
  post.params.bloomThreshold = 1.5;
  if (mobile) post.params.bloomStrength = 0;   // its 12 passes cost a phone more than this faint glow is worth

  let hdrRT = null;
  function makeTargets() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    hdrRT?.dispose();
    hdrRT = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType, samples: quality.msaa, generateMipmaps: false,
      depthTexture: new THREE.DepthTexture(size.x, size.y, THREE.FloatType),
    });
    restore.material.uniforms.uTex.value = hdrRT.texture;
    surface.uniforms.uSceneColor.value = hdrRT.texture;
    surface.uniforms.uSceneDepth.value = hdrRT.depthTexture;
    surface.uniforms.uResolution.value.copy(size);
    reflection.scale = quality.reflectionScale;
    reflection.setSize(size.x, size.y);
    post.setSize(size.x, size.y);
    underwater.setSize(size.x, size.y);
  }

  function resize() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * quality.resolution);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    makeTargets();
  }
  window.addEventListener('resize', resize);

  let sunDirty = true;
  function applySun() {
    sky.update();
    sunLight.position.copy(sky.sunDir).multiplyScalar(2000);
    sunLight.color.setRGB(sky.sunColor.x, sky.sunColor.y, sky.sunColor.z).multiplyScalar(1 / Math.max(sky.sunColor.x, 1e-4));
    sunLight.intensity = Math.PI * Math.max(sky.sunColor.x, 1e-4);
    renderer.shadowMap.needsUpdate = true;
    sunDirty = false;
  }

  // --- camera presets -----------------------------------------------------------------
  function coast(bearingDeg) {
    const a = THREE.MathUtils.degToRad(bearingDeg);
    let r = 100;
    while (r < 800 && islandHeight(Math.cos(a) * r, Math.sin(a) * r) > 0) r += 2;
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  }
  function sunBearing() { return Math.atan2(sky.sunDir.z, sky.sunDir.x); }
  function setSun(elevation, azimuth) {
    Object.assign(sky.params, { elevation, azimuth });
    applySun();
  }
  // real sky for `coords` right now; clamped so a winter night still reads as a sea, not a void
  function applyRealtimeSun() {
    const s = solarPosition(new Date(), coords.lat, coords.lon);
    setSun(Math.max(s.elevation, -3), s.azimuth);
  }
  let realtime = false;
  const views = {
    'Now': () => {
      realtime = true;
      applyRealtimeSun();
      const b = sunBearing(), c = coast(THREE.MathUtils.radToDeg(b) + 18);
      camera.position.set(c.x + Math.cos(b) * 120, 5, c.y + Math.sin(b) * 120);
      controls.target.set(c.x + Math.cos(b) * 400, 0, c.y + Math.sin(b) * 400);
    },
    'Golden hour': () => {
      setSun(3.5, 205);
      const b = sunBearing(), c = coast(THREE.MathUtils.radToDeg(b) + 18);
      camera.position.set(c.x + Math.cos(b) * 120, 5, c.y + Math.sin(b) * 120);
      controls.target.set(c.x + Math.cos(b) * 400, 0, c.y + Math.sin(b) * 400);
    },
    'Breakers': () => {
      setSun(22, 205);
      const b = sunBearing() + 1.9, c = coast(THREE.MathUtils.radToDeg(b));
      camera.position.set(c.x + Math.cos(b) * 35 + Math.sin(b) * 40, 3.2, c.y + Math.sin(b) * 35 - Math.cos(b) * 40);
      controls.target.set(c.x - Math.sin(b) * 30, 0, c.y + Math.cos(b) * 30);
    },
    'Lagoon': () => {
      setSun(52, 205);
      const b = sunBearing() + Math.PI, c = coast(THREE.MathUtils.radToDeg(b));
      camera.position.set(c.x * 0.86, 28, c.y * 0.86);
      controls.target.set(c.x * 1.25, 0, c.y * 1.25);
    },
    'Open ocean': () => {
      setSun(14, 205);
      const b = sunBearing() + 0.5;
      camera.position.set(Math.cos(b) * 1500, 9, Math.sin(b) * 1500);
      controls.target.set(Math.cos(b) * 2400, 0, Math.sin(b) * 2400 + 600);
    },
    'Aerial': () => {
      setSun(30, 205);
      camera.position.set(900, 420, 900);
      controls.target.set(0, 0, 0);
    },
    'Flotsam': () => {
      setSun(26, 205);
      const b = sunBearing() + 1.2, c = coast(THREE.MathUtils.radToDeg(b));
      const out = new THREE.Vector2(Math.cos(b), Math.sin(b)), side = new THREE.Vector2(-out.y, out.x);
      camera.position.set(c.x + out.x * 75 + side.x * 10, 4.5, c.y + out.y * 75 + side.y * 10);
      controls.target.set(c.x + out.x * 45 - side.x * 15, 0, c.y + out.y * 45 - side.y * 15);
      floaters.spawn(camera.position, controls.target.clone().sub(camera.position));
    },
    'Underwater': () => {
      setSun(48, 205);
      // on the lee of the island, looking back up the reef slope into the sun (shafts)
      const a = sunBearing() + Math.PI + 0.3;
      let r = 200;
      while (r < 1000 && islandHeight(Math.cos(a) * r, Math.sin(a) * r) > -9) r += 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      camera.position.set(x, -3.2, z);
      controls.target.set(x - Math.cos(a) * 25, -1.8, z - Math.sin(a) * 25);
      floaters.spawn(camera.position, controls.target.clone().sub(camera.position));
    },
  };

  const su = surface.uniforms;
  const absorptionBase = su.uAbsorption.value.clone();
  function setWaterPreset(name) {
    const p = WATER_PRESETS[name];
    if (!p) return;
    absorptionBase.fromArray(p.absorption);
    su.uAbsorption.value.copy(absorptionBase);
    su.uScatterColor.value.fromArray(p.scatter);
    su.uFoamTint.value.fromArray(p.foam);
    underwater.params.scattering = p.turbidity;
  }

  const ui = { exposure: 1 };

  // weather: rain/snow streaks + cloud cover + real wind feeding the wave spectrum
  const precip = new Precipitation();
  scene.add(precip.mesh);
  function setWeather(w) {
    if (!w) return;
    sky.params.cloudCoverage = Math.min(Math.max(w.cloudCover ?? 0.3, 0), 1);
    sunDirty = true;
    ocean.params.windSpeed = Math.min(Math.max(w.windMs ?? 5, 2), 25);
    ocean.params.windDirection = (((w.windDirection ?? 205) + 180) % 360) - 180;
    ocean.dirty = true;
    const snow = (w.precipMm ?? 0) > 0 && (w.tempC ?? 5) <= 1;
    const slant = Math.min(Math.max(w.windMs ?? 0, 0), 15);
    const dirRad = ((w.windDirection ?? 0) + 180) * Math.PI / 180;
    precip.set(w.precipMm ?? 0, Math.cos(dirRad) * slant, Math.sin(dirRad) * slant, snow);
  }
  // follow the real sun once a minute while the 'Now' view is up
  const sunTimer = setInterval(() => {
    if (!realtime || disposed) return;
    applyRealtimeSun();
  }, 60000);

  // --- frame ---------------------------------------------------------------------
  const gl = renderer.getContext();
  const timer = new GpuTimer(gl);
  let elapsed = 0;

  function renderFrame(dt) {
    elapsed += dt;
    if (sunDirty) applySun();
    timer.beginFrame();

    // latest water heights (1-3 frames old) drive the camera test and the floaters
    if (query.resultCount > 0) camWater = query.result[0];
    marine.ingest(query);
    floaters.ingest(query, 1 + MarineLife.PROBE_COUNT);
    floaters.step(dt);
    timer.begin('floatShadow');
    floatShadow.update(renderer, floaters.scene, floaters.bodies, sky.sunDir);
    // water entries -> ripple rings + splash (ages on the floaters' clock)
    for (let i = 0; i < 8; i++) {
      const e = floaters.impacts[i], age = e ? floaters.time - e.t : 1e9;
      su.uImpact.value[i].set(e?.x ?? 0, e?.z ?? 0, age, age < 30 ? e.amp : 0);
      su.uImpactSize.value[i] = e?.size ?? 1;
    }

    ocean.update(dt, timer);
    timer.begin('caustics');
    caustics.update(sky.sunDir);
    surface.update(camera, elapsed % 3600);
    spray.update();
    timer.begin('query');
    const pts = floaters.collectPoints([camera.position, ...marine.collectPoints()]);
    query.submit(pts, floaters.count, floaters.layout, elapsed);
    marine.update(dt, elapsed);

    const camY = camera.position.y;
    const submerged = camY < camWater - 0.3, nearSurface = camY < camWater + 1.2;
    su.uCamSide.value = camY > camWater + 0.5 ? -1 : camY < camWater - 0.5 ? 1 : 0;
    snow.update(camera, hdrRT.height, nearSurface);
    uwComp += ((submerged ? look.underwater : 1) - uwComp) * Math.min(1, dt * 3);
    post.params.exposure = ui.exposure * uwComp;
    // water on the lens for a few seconds after surfacing
    post.params.droplets = wasSubmerged && !submerged ? 1 : submerged ? 0 : Math.max(0, post.params.droplets - dt / 5);
    wasSubmerged = submerged;

    timer.begin('reflection');
    if (quality.reflections && !submerged) {
      reflection.render(renderer, scene, camera);
      su.uReflection.value = reflection.target.texture;
    } else su.uReflection.value = emptyReflection;

    timer.begin('opaque');
    renderer.setRenderTarget(hdrRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    timer.begin('water');
    su.uShadowMap.value = sunLight.shadow.map.depthTexture;
    hdrRT.resolveDepthBuffer = nearSurface;   // only the underwater pass needs depth with water
    renderer.render(waterScene, camera);
    hdrRT.resolveDepthBuffer = true;

    let frame = hdrRT.texture;
    if (nearSurface) {
      timer.begin('underwater');
      frame = underwater.render(renderer, hdrRT, camY < camWater - 0.8);
    }

    timer.begin('post');
    precip.update(dt, controls.target.x, controls.target.z);
    post.render(frame, dt);
    timer.endFrame();
  }

  function clampCamera() {
    // free to dive; just stay out of the ground
    const floor = islandHeight(camera.position.x, camera.position.z) + 0.8;
    if (camera.position.y < floor) camera.position.y = floor;
  }

  // mobile: hold 60 fps by stepping resolution down from the profile's, judged over 2 s
  // windows (a frame over 20 ms is a missed vsync), and back up once frames are clean again.
  // Still missing at the floor, render every other vsync for a steady 30.
  const auto = { n: -240, missed: 0, clean: 0, top: quality.resolution, cap30: false, odd: false };   // skip startup
  function autoResolution(ms) {
    if (ms > 250) return;   // tab switch, not load
    if (++auto.n <= 0) return;
    if (ms > (auto.cap30 ? 40 : 20)) auto.missed++;
    if (auto.n < 120 || auto.cap30) return;
    const r = quality.resolution, miss = auto.missed / auto.n;
    auto.n = auto.missed = 0;
    if (miss > 0.04) {
      auto.clean = 0;
      if (r > 0.5) setResolution(r - 0.05);
      else if (miss > 0.25) auto.cap30 = true;
    } else if (miss <= 0.01 && ++auto.clean >= 3 && r < auto.top) {
      auto.clean = 0;
      setResolution(r + 0.05);
    }
  }
  function setResolution(r) {
    quality.resolution = Math.round(r * 20) / 20;
    resize();
    auto.n = -60;   // the resize hitches; let it settle
  }

  // --- loop ----------------------------------------------------------------------
  let raf = 0, disposed = false, paused = false, ready = false;
  let last = performance.now();

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    controls.update();
    clampCamera();
    renderFrame(dt);
    if (!ready) { ready = true; onReady?.(); }
  }

  function loop(now) {
    if (disposed) return;
    if (auto.cap30 && (auto.odd = !auto.odd)) { raf = requestAnimationFrame(loop); return; }
    if (!paused) {
      if (quality.autoResolution) autoResolution(now - last);
      tick(now);
    } else {
      last = now;
    }
    raf = requestAnimationFrame(loop);
  }

  resize();
  applySun();
  (views[view] || views['Now'])();
  controls.update();

  // reef life anchored to the golden-hour view corridor (computed from the current sun)
  const gb = sunBearing(), gc = coast(THREE.MathUtils.radToDeg(gb) + 18);
  const marine = new MarineLife({
    scene,
    anchor: { x: gc.x, z: gc.y, dirX: Math.cos(gb), dirZ: Math.sin(gb) },
    heightAt: islandHeight,
    reflectLayer: REFLECT_LAYER,
  });

  raf = requestAnimationFrame(loop);

  return {
    views: Object.keys(views),
    setView(name) { realtime = name === 'Now'; views[name]?.(); },
    setWaterPreset,
    setWeather,
    pause() { paused = true; },
    resume() { paused = false; },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      clearInterval(sunTimer);
      window.removeEventListener('resize', resize);
      controls.dispose();
      post.dispose();
      hdrRT?.dispose();
      reflection.target.dispose();
      underwater.target?.dispose();
      underwater.shaftRT?.dispose();
      underwater.lens?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
