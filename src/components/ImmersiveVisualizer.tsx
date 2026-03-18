"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { AnalyserData } from "@/lib/visualizers/types";
import { colorSchemes } from "@/lib/visualizers/colors";

interface AudioState {
  frequency: Uint8Array<ArrayBuffer> | null;
  energy: { low: number; mid: number; high: number };
  beatIntensity: number;
  prevEnergy: number;
  colorSchemeIndex: number;
}

const PARTICLE_COUNT = 6000;
const BASE_RADIUS = 2;

function ParticleSphere({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Pre-compute base sphere positions + normals
  const { basePositions, normals, freqIndices } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const norm = new Float32Array(PARTICLE_COUNT * 3);
    const indices = new Uint16Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere distribution (uniform)
      const phi = Math.acos(1 - (2 * (i + 0.5)) / PARTICLE_COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      pos[i * 3] = x * BASE_RADIUS;
      pos[i * 3 + 1] = y * BASE_RADIUS;
      pos[i * 3 + 2] = z * BASE_RADIUS;

      norm[i * 3] = x;
      norm[i * 3 + 1] = y;
      norm[i * 3 + 2] = z;

      // Map position to frequency bin using angle
      const angle = Math.atan2(z, x);
      const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
      const elevation = Math.asin(y);
      const normalizedElev = (elevation + Math.PI / 2) / Math.PI;
      indices[i] = Math.floor((normalizedAngle * 0.6 + normalizedElev * 0.4) * 1024) % 1024;
    }

    return { basePositions: pos, normals: norm, freqIndices: indices };
  }, []);

  // Color array
  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) c[i] = 1;
    return c;
  }, []);

  // Sizes array for varying particle sizes
  const sizes = useMemo(() => {
    const s = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      s[i] = 0.5 + Math.random() * 1.5;
    }
    return s;
  }, []);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    const state = stateRef.current;
    if (!points) return;

    const geo = points.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    const colorArray = geo.attributes.color.array as Float32Array;
    const t = clock.getElapsedTime();

    const freq = state?.frequency;
    const energy = state?.energy ?? { low: 0, mid: 0, high: 0 };
    const intensity = energy.low * 0.5 + energy.mid * 0.3 + energy.high * 0.2;

    // Beat detection
    if (state) {
      const currentEnergy = energy.low;
      const delta = currentEnergy - state.prevEnergy;
      if (delta > 0.08) {
        state.beatIntensity = Math.min(1, delta * 7);
      } else {
        state.beatIntensity *= 0.9;
      }
      state.prevEnergy = currentEnergy;
    }

    const beat = state?.beatIntensity ?? 0;
    const scheme = colorSchemes[state?.colorSchemeIndex ?? 0] ?? colorSchemes[0];

    // Color
    const isHot = intensity > scheme.threshold;
    const hue1 = isHot ? scheme.hotHue(0) : scheme.coolHue(0);
    const hue2 = isHot ? scheme.hotHue(1) : scheme.coolHue(1);
    const sat = scheme.saturation / 100;

    const tempColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      // Frequency displacement
      let freqDisplacement = 0;
      if (freq) {
        const fi = freqIndices[i];
        freqDisplacement = freq[fi] / 255;
      }

      // Organic noise — slow undulation
      const noise =
        Math.sin(nx * 3 + t * 0.7) *
        Math.cos(ny * 3 + t * 0.5) *
        Math.sin(nz * 3 + t * 0.3) * 0.15;

      // Spike factor: particles shoot outward based on frequency
      const spike = freqDisplacement * freqDisplacement * 2.5;
      const beatPush = beat * 0.6;

      // When no audio: shrink to a small, dim sphere
      const hasAudio = freq !== null && intensity > 0.01;
      const idleScale = hasAudio ? 1 : 0.4;
      const breathe = Math.sin(t * 0.4) * (hasAudio ? 0.05 : 0.02);

      const displacement = idleScale * (1 + spike + noise + beatPush + breathe);

      posArray[i * 3] = bx * displacement;
      posArray[i * 3 + 1] = by * displacement;
      posArray[i * 3 + 2] = bz * displacement;

      // Color gradient based on displacement
      const colorMix = Math.min(1, spike * 1.5);
      const hue = hue1 + (hue2 - hue1) * colorMix;
      const lightness = hasAudio
        ? 0.4 + freqDisplacement * 0.5 + beat * 0.1
        : 0.15 + Math.sin(t * 0.3 + i * 0.01) * 0.05;
      tempColor.setHSL(hue / 360, sat, lightness);
      tempColor.toArray(colorArray, i * 3);
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    // Slow rotation
    points.rotation.y = t * 0.08;
    points.rotation.x = Math.sin(t * 0.05) * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(basePositions), 3]}
          count={PARTICLE_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.9}
        toneMapped={false}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Ambient dust particles floating around
function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={500}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#446"
        transparent
        opacity={0.4}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}

function OrbitalCamera({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const beat = stateRef.current?.beatIntensity ?? 0;
    const energy = stateRef.current?.energy;
    const intensity = energy ? energy.low * 0.5 + energy.mid * 0.3 : 0;

    const radius = 10 - intensity * 1 - beat * 0.8;
    const speed = 0.1 + intensity * 0.03;
    camera.position.x = Math.sin(t * speed) * radius;
    camera.position.z = Math.cos(t * speed) * radius;
    camera.position.y = Math.sin(t * 0.06) * 1.5;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Scene({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  return (
    <>
      <color attach="background" args={["#000"]} />

      <OrbitalCamera stateRef={stateRef} />
      <ParticleSphere stateRef={stateRef} />
      <DustParticles />

      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette darkness={0.5} />
      </EffectComposer>
    </>
  );
}

// --- Main export ---

interface ImmersiveVisualizerProps {
  getData: () => AnalyserData | null;
  colorSchemeIndex: number;
}

export function ImmersiveVisualizer({
  getData,
  colorSchemeIndex,
}: ImmersiveVisualizerProps) {
  const stateRef = useRef<AudioState>({
    frequency: null,
    energy: { low: 0, mid: 0, high: 0 },
    beatIntensity: 0,
    prevEnergy: 0,
    colorSchemeIndex: 0,
  });

  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  const pumpData = useCallback(() => {
    const data = getDataRef.current();
    if (data) {
      stateRef.current.frequency = data.frequency;
      stateRef.current.energy = data.energy;
    }
    stateRef.current.colorSchemeIndex = colorSchemeIndex;
  }, [colorSchemeIndex]);

  return (
    <Canvas
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 10], fov: 50 }}
    >
      <PumpAudioData pump={pumpData} />
      <Scene stateRef={stateRef} />
    </Canvas>
  );
}

function PumpAudioData({ pump }: { pump: () => void }) {
  useFrame(pump);
  return null;
}
