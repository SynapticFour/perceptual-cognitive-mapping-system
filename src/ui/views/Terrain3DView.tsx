'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CognitiveModel } from '@/core/cognitive-pipeline';
import type { UiStrings } from '@/lib/ui-strings';
import {
  buildCognitiveTerrainLandscape,
  type CognitiveTerrainLandscape,
} from '@/lib/cognitive-terrain-pipeline';

const HEIGHT_SCALE = 0.38;

export interface Terrain3DViewProps {
  model: CognitiveModel;
  strings: UiStrings;
  userAccentColor: string;
}

type ViewMode = '2d' | '3d';

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
    buildCognitiveTerrainLandscape(model, { heightScale: HEIGHT_SCALE })
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

    const geo = new THREE.PlaneGeometry(2, 2, terrain.segments, terrain.segments);
    geo.rotateX(-Math.PI / 2);
    applyTerrainToGeometry(geo, terrain, HEIGHT_SCALE);

    const mat = new THREE.MeshStandardMaterial({
      color: 0xc5d0e0,
      flatShading: false,
      roughness: 0.92,
      metalness: 0.04,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const userGeom = new THREE.SphereGeometry(0.045, 20, 20);
    const userMat = new THREE.MeshStandardMaterial({
      color: userAccentColor,
      roughness: 0.45,
      metalness: 0.15,
      emissive: new THREE.Color(userAccentColor),
      emissiveIntensity: 0.12,
    });
    const userMesh = new THREE.Mesh(userGeom, userMat);
    userMesh.position.set(terrain.user.x, terrain.user.y, terrain.user.z);
    scene.add(userMesh);

    const ringGeom = new THREE.RingGeometry(0.07, 0.095, 40);
    const clusterMeshes: THREE.Mesh[] = [];
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

    const perspControls = new OrbitControls(camera, renderer.domElement);
    perspControls.enableDamping = true;
    perspControls.dampingFactor = reducedMotion ? 0.18 : 0.08;
    perspControls.minDistance = 1.15;
    perspControls.maxDistance = 4.2;
    controlsRef.current = perspControls;
    configureControlsForMode(perspControls, camera, mode);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
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
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      userGeom.dispose();
      userMat.dispose();
      ringGeom.dispose();
      for (const cm of clusterMeshes) {
        cm.geometry.dispose();
        (cm.material as THREE.Material).dispose();
      }
      container.removeChild(renderer.domElement);
    };
    // mode is applied on toggle via the separate controls effect; initial mount uses mode from closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrain, userAccentColor]);

  return (
    <div className="w-full">
      <p className="mb-2 text-xs leading-relaxed text-slate-600">{strings['landscape.view_terrain3d_caption']}</p>
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
      <p className="mt-2 text-[11px] text-slate-500">{strings['landscape.view_terrain3d_hint']}</p>
    </div>
  );
}
