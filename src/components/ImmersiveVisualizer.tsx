"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { AnalyserData } from "@/lib/visualizers/types";
import { colorSchemes } from "@/lib/visualizers/colors";

const BAR_COUNT = 48;
const BAR_ROWS = 3;

// Shared state passed via ref (no React re-renders)
interface AudioState {
  frequency: Uint8Array<ArrayBuffer> | null;
  energy: { low: number; mid: number; high: number };
  beatIntensity: number;
  prevEnergy: number;
  colorSchemeIndex: number;
}

// --- Inner scene components (must be inside Canvas) ---

function Bars({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const smoothBars = useMemo(() => new Float32Array(BAR_COUNT * BAR_ROWS), []);
  const colors = useMemo(() => new Float32Array(BAR_COUNT * BAR_ROWS * 3), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    const state = stateRef.current;
    if (!mesh || !state?.frequency) return;

    const freq = state.frequency;
    const binCount = freq.length;
    const binsPerBar = Math.floor(binCount / BAR_COUNT);
    const intensity = state.energy.low * 0.5 + state.energy.mid * 0.3 + state.energy.high * 0.2;
    const scheme = colorSchemes[state.colorSchemeIndex] ?? colorSchemes[0];

    // Beat detection
    const currentEnergy = state.energy.low;
    const delta = currentEnergy - state.prevEnergy;
    if (delta > 0.1) {
      state.beatIntensity = Math.min(1, delta * 5);
    } else {
      state.beatIntensity *= 0.92;
    }
    state.prevEnergy = currentEnergy;

    for (let row = 0; row < BAR_ROWS; row++) {
      const zOffset = -row * 2.5;
      const rowAlpha = 1 - row * 0.25;

      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = row * BAR_COUNT + i;

        // Average frequency bins
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          sum += freq[i * binsPerBar + j];
        }
        const rawValue = sum / binsPerBar / 255;

        // Smooth
        smoothBars[idx] += (rawValue - smoothBars[idx]) * 0.35;
        const value = smoothBars[idx];

        // Position
        const barHeight = Math.max(0.05, value * 8);
        const x = (i - BAR_COUNT / 2) * 0.45;

        dummy.position.set(x, barHeight / 2, zOffset);
        dummy.scale.set(0.3, barHeight, 0.3);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);

        // Color
        const position = i / BAR_COUNT;
        const isHot = intensity > scheme.threshold;
        const hue = isHot ? scheme.hotHue(position) : scheme.coolHue(position);
        const lightness = 0.4 + intensity * 0.4;
        const sat = scheme.saturation / 100;

        tempColor.setHSL(hue / 360, sat, lightness * rowAlpha);
        tempColor.toArray(colors, idx * 3);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Update instance colors
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, BAR_COUNT * BAR_ROWS]}
    >
      <meshStandardMaterial
        toneMapped={false}
        emissive="white"
        emissiveIntensity={2}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colors, 3]}
      />
    </instancedMesh>
  );
}

function FloorGrid({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (!materialRef.current || !stateRef.current) return;
    const intensity = stateRef.current.energy.low * 0.5 + stateRef.current.energy.mid * 0.3;
    materialRef.current.opacity = 0.05 + intensity * 0.1;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[40, 20]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#0ff"
        transparent
        opacity={0.05}
        wireframe
      />
    </mesh>
  );
}

function CameraRig({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const beat = stateRef.current?.beatIntensity ?? 0;

    // Subtle camera sway
    camera.position.x = Math.sin(t * 0.2) * 0.5;
    camera.position.y = 4 + Math.sin(t * 0.15) * 0.3 + beat * 0.5;
    camera.position.z = 12 - beat * 1.5;
    camera.lookAt(0, 1, -3);
  });

  return null;
}

function Scene({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 10, 5]} intensity={0.5} />

      <CameraRig stateRef={stateRef} />
      <Bars stateRef={stateRef} />
      <FloorGrid stateRef={stateRef} />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />
        <Vignette darkness={0.6} />
      </EffectComposer>
    </>
  );
}

// --- Main component (outside Canvas) ---

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

  // Pump audio data into the ref on each R3F frame
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
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 4, 12], fov: 55 }}
      onCreated={({ gl }) => {
        gl.setClearColor("#000");
      }}
    >
      <PumpAudioData pump={pumpData} />
      <Scene stateRef={stateRef} />
    </Canvas>
  );
}

// Helper to run pumpData inside the R3F render loop
function PumpAudioData({ pump }: { pump: () => void }) {
  useFrame(pump);
  return null;
}
