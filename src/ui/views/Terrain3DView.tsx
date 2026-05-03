'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import type { UiStrings } from '@/lib/ui-strings';
import {
  buildCognitiveTerrainLandscape,
  TERRAIN_DEFAULT_SEGMENTS,
  type CognitiveTerrainLandscape,
} from '@/lib/cognitive-terrain-pipeline';

const HEIGHT_SCALE = 0.38;

/** Normalised heightmap sample h ∈ [0, 1] at plane vertex (x, z) on [-1,1]². */
function heightmapSampleAtVertex(
  x: number,
  z: number,
  data: CognitiveTerrainLandscape
): number {
  const seg = data.segments;
  const hm = data.heightmap;
  const n = seg + 1;
  const ux = (x + 1) / 2;
  const uz = (z + 1) / 2;
  const ix = Math.round(ux * seg);
  const jz = Math.round(uz * seg);
  const ii = Math.max(0, Math.min(seg, ix));
  const jj = Math.max(0, Math.min(seg, jz));
  return hm[jj * n + ii] ?? 0;
}

function biomeColorFromH(h: number): THREE.Color {
  if (h < 0.08) return new THREE.Color(0x2a5f8f);
  if (h < 0.15) return new THREE.Color(0x4a8ab5);
  if (h < 0.28) return new THREE.Color(0x7aab6e);
  if (h < 0.5) return new THREE.Color(0xc8b560);
  if (h < 0.72) return new THREE.Color(0xa87a40);
  if (h < 0.88) return new THREE.Color(0x8a7060);
  return new THREE.Color(0xe8e4e0);
}

function applyTerrainToGeometry(
  geo: THREE.PlaneGeometry,
  data: CognitiveTerrainLandscape,
  heightScale: number
): void {
  const pos = geo.attributes.position;
  const seg = data.segments;
  const hm = data.heightmap;
  const n = seg + 1;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const ux = (x + 1) / 2;
    const uz = (z + 1) / 2;
    const ix = Math.round(ux * seg);
    const jz = Math.round(uz * seg);
    const ii = Math.max(0, Math.min(seg, ix));
    const jj = Math.max(0, Math.min(seg, jz));
    const h = (hm[jj * n + ii] ?? 0) * heightScale;
    pos.setY(i, h);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

/** Second pass: vertex colours from normalised height (biomes). */
function applyVertexBiomeColors(geo: THREE.PlaneGeometry, data: CognitiveTerrainLandscape): void {
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightmapSampleAtVertex(x, z, data);
    c.copy(biomeColorFromH(h));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function createClusterLabelSprite(text: string): THREE.Sprite {
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const fontPx = 12;
  const pad = 8;
  const radius = 4;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const c0 = document.createElement('canvas');
    c0.width = 1;
    c0.height = 1;
    const empty = new THREE.CanvasTexture(c0);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: empty }));
  }
  ctx.font = `${fontPx}px system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width + pad * 2);
  const h = fontPx + pad * 2;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  ctx.scale(dpr, dpr);
  ctx.fillStyle = 'rgba(15,23,42,0.92)';
  roundedRect(ctx, 0, 0, w, h, radius);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, pad, h / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  const aspect = w / h;
  sprite.scale.set(0.24 * aspect, 0.24, 1);
  return sprite;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  r: number
): void {
  const rr = Math.min(r, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + width - rr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + rr);
  ctx.lineTo(x + width, y + height - rr);
  ctx.quadraticCurveTo(x + width, y + height, x + width - rr, y + height);
  ctx.lineTo(x + rr, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export interface Terrain3DViewProps {
  model: CognitiveModel;
  strings: UiStrings;
  userAccentColor: string;
}

type ViewMode = '2d' | '3d';

function configureControlsForMode(controls: OrbitControls, camera: THREE.PerspectiveCamera, mode: ViewMode) {
  if (mode === '2d') {
    controls.minPolarAngle = 0.001;
    controls.maxPolarAngle = 0.001;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    camera.position.set(0, 3.25, 0.02);
    controls.target.set(0, HEIGHT_SCALE * 0.25, 0);
  } else {
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    camera.position.set(1.35, 1.55, 1.65);
    controls.target.set(0, HEIGHT_SCALE * 0.35, 0);
  }
  controls.update();
}

export default function Terrain3DView({ model, strings, userAccentColor }: Terrain3DViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [terrain, setTerrain] = useState<CognitiveTerrainLandscape | null>(null);
  const [busy, setBusy] = useState(true);
  const [mode, setMode] = useState<ViewMode>('3d');

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    buildCognitiveTerrainLandscape(model, {
      heightScale: HEIGHT_SCALE,
      segments: TERRAIN_DEFAULT_SEGMENTS,
    })
      .then((d) => {
        if (!cancelled) {
          setTerrain(d);
          setBusy(false);
        }
      })
      .catch(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- model.fingerprint is the stable identity for this async build
  }, [model.fingerprint]);

  useEffect(() => {
    const c = controlsRef.current;
    const cam = cameraRef.current;
    if (c && cam) configureControlsForMode(c, cam, mode);
  }, [mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !terrain) return undefined;

    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = Math.max(320, container.clientWidth);
    const height = Math.min(420, Math.max(280, width * 0.72));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.18);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 80);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, reducedMotion ? 1.5 : 2));
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xb8c6d8, 0.85);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.55);
    dir.position.set(2.2, 4.5, 1.8);
    scene.add(dir);
    const pointSun = new THREE.PointLight(0xffe8c0, 0.35, 20, 2);
    pointSun.position.set(0, 2, 0);
    scene.add(pointSun);

    const waterY = 0.08 * HEIGHT_SCALE;
    const waterGeom = new THREE.PlaneGeometry(2.2, 2.2);
    waterGeom.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2a5f8f,
      transparent: true,
      opacity: 0.6,
      roughness: 0.55,
      metalness: 0.02,
      depthWrite: false,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = waterY;
    waterMesh.renderOrder = -2;
    scene.add(waterMesh);

    const geo = new THREE.PlaneGeometry(2, 2, terrain.segments, terrain.segments);
    geo.rotateX(-Math.PI / 2);
    applyTerrainToGeometry(geo, terrain, HEIGHT_SCALE);
    applyVertexBiomeColors(geo, terrain);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      flatShading: false,
      roughness: 0.92,
      metalness: 0.04,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const accent = new THREE.Color(userAccentColor);
    const pillarH = 0.18;
    const pillarGeom = new THREE.CylinderGeometry(0.018, 0.025, pillarH, 16, 1);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.35,
      metalness: 0.2,
      emissive: accent,
      emissiveIntensity: 0.45,
    });
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(terrain.user.x, terrain.user.y + pillarH / 2, terrain.user.z);
    scene.add(pillar);

    // Upper hemisphere: theta 0→π/2 is north pole → equator (Three.js: phi = azimuth, theta = polar from +Y).
    const capGeom = new THREE.SphereGeometry(0.03, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.35,
      metalness: 0.25,
      emissive: accent,
      emissiveIntensity: 0.35,
    });
    const cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(terrain.user.x, terrain.user.y + pillarH, terrain.user.z);
    scene.add(cap);

    const pulseRingGeom = new THREE.RingGeometry(0.04, 0.062, 48);
    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(pulseRingGeom, pulseRingMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.set(terrain.user.x, terrain.user.y + 0.003, terrain.user.z);
    scene.add(pulseRing);

    const ringGeom = new THREE.RingGeometry(0.07, 0.095, 40);
    const clusterMeshes: THREE.Mesh[] = [];
    const labelSprites: THREE.Sprite[] = [];
    for (const c of terrain.clusters) {
      const m = new THREE.MeshStandardMaterial({
        color: c.color,
        roughness: 0.75,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      });
      const ring = new THREE.Mesh(ringGeom.clone(), m);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(c.x, c.y + 0.002, c.z);
      scene.add(ring);
      clusterMeshes.push(ring);
    }

    const peakLabels =
      terrain.dominantPeaks.length > 0
        ? terrain.dominantPeaks.map((p) => ({ x: p.x, y: p.y, z: p.z, text: p.dimensionLabel }))
        : terrain.clusters.length <= 8
          ? terrain.clusters.map((c) => ({ x: c.x, y: c.y, z: c.z, text: c.label }))
          : [];
    for (const pl of peakLabels) {
      const spr = createClusterLabelSprite(pl.text);
      spr.position.set(pl.x, pl.y + 0.12, pl.z);
      scene.add(spr);
      labelSprites.push(spr);
    }

    const perspControls = new OrbitControls(camera, renderer.domElement);
    perspControls.enableDamping = true;
    perspControls.dampingFactor = reducedMotion ? 0.18 : 0.08;
    perspControls.minDistance = 1.15;
    perspControls.maxDistance = 4.2;
    controlsRef.current = perspControls;
    configureControlsForMode(perspControls, camera, mode);

    const pulsePeriod = 1.8;
    let raf = 0;
    const t0 = performance.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!reducedMotion) {
        const t = (performance.now() - t0) / 1000;
        const s = 1 + 0.4 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / pulsePeriod));
        pulseRing.scale.set(s, s, 1);
      } else {
        pulseRing.scale.set(1, 1, 1);
      }
      perspControls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = Math.max(320, container.clientWidth);
      const h = Math.min(420, Math.max(280, w * 0.72));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      perspControls.dispose();
      controlsRef.current = null;
      cameraRef.current = null;
      scene.fog = null;
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      waterGeom.dispose();
      waterMat.dispose();
      pillarGeom.dispose();
      pillarMat.dispose();
      capGeom.dispose();
      capMat.dispose();
      pulseRingGeom.dispose();
      pulseRingMat.dispose();
      ringGeom.dispose();
      for (const cm of clusterMeshes) {
        cm.geometry.dispose();
        (cm.material as THREE.Material).dispose();
      }
      for (const spr of labelSprites) {
        const sm = spr.material as THREE.SpriteMaterial;
        sm.map?.dispose();
        sm.dispose();
      }
      container.removeChild(renderer.domElement);
    };
    // mode is applied on toggle via the separate controls effect; initial mount uses mode from closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrain, userAccentColor]);

  const legendId = 'terrain3d-legend-heading';

  return (
    <div className="w-full">
      <p className="mb-2 text-xs leading-relaxed text-slate-600">{strings['landscape.view_terrain3d_caption']}</p>
      <section
        className="mb-3 rounded-lg border border-slate-200/90 bg-slate-50/90 px-3 py-2.5"
        aria-labelledby={legendId}
      >
        <h3 id={legendId} className="text-xs font-semibold text-slate-800">
          {strings['landscape.view_terrain3d_legend_title']}
        </h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-slate-600">
          <li>{strings['landscape.view_terrain3d_legend_peak']}</li>
          <li>{strings['landscape.view_terrain3d_legend_you']}</li>
          <li>{strings['landscape.view_terrain3d_legend_rings']}</li>
          <li>{strings['landscape.view_terrain3d_legend_layout']}</li>
        </ul>
      </section>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">{strings['landscape.view_terrain3d_mode_label']}</span>
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === '2d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('2d')}
          >
            {strings['landscape.view_terrain3d_2d']}
          </button>
          <button
            type="button"
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === '3d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setMode('3d')}
          >
            {strings['landscape.view_terrain3d_3d']}
          </button>
        </div>
        {terrain ? (
          <span className="text-[11px] text-slate-600">
            {terrain.source === 'umap'
              ? strings['landscape.view_terrain3d_source_umap']
              : strings['landscape.view_terrain3d_source_pca']}
          </span>
        ) : null}
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100/50 shadow-inner"
        role="img"
        aria-label={strings['landscape.view_terrain3d_aria']}
      >
        {busy && !terrain ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
            {strings['landscape.view_terrain3d_loading']}
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{strings['landscape.view_terrain3d_hint']}</p>
    </div>
  );
}
