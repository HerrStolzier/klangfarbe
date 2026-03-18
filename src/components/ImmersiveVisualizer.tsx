"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { AnalyserData } from "@/lib/visualizers/types";
import { colorSchemes } from "@/lib/visualizers/colors";

// Shared audio state via ref (zero React re-renders)
interface AudioState {
  frequency: Uint8Array<ArrayBuffer> | null;
  energy: { low: number; mid: number; high: number };
  beatIntensity: number;
  prevEnergy: number;
  colorSchemeIndex: number;
}

// --- Pulsating Sphere ---

const SPHERE_DETAIL = 4; // icosahedron subdivision
const PARTICLE_COUNT = 800;

function PulseSphere({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.IcosahedronGeometry | null>(null);
  const basePositions = useRef<Float32Array | null>(null);

  // Store base vertex positions on first frame
  useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(2, SPHERE_DETAIL);
    geoRef.current = geo;
    basePositions.current = new Float32Array(geo.attributes.position.array);
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const wire = wireRef.current;
    const geo = geoRef.current;
    const base = basePositions.current;
    const state = stateRef.current;
    if (!mesh || !wire || !geo || !base || !state?.frequency) return;

    const freq = state.frequency;
    const positions = geo.attributes.position.array as Float32Array;
    const vertCount = positions.length / 3;
    const t = clock.getElapsedTime();
    const intensity = state.energy.low * 0.5 + state.energy.mid * 0.3 + state.energy.high * 0.2;
    const beat = state.beatIntensity;

    // Beat detection
    const currentEnergy = state.energy.low;
    const delta = currentEnergy - state.prevEnergy;
    if (delta > 0.1) {
      state.beatIntensity = Math.min(1, delta * 6);
    } else {
      state.beatIntensity *= 0.88;
    }
    state.prevEnergy = currentEnergy;

    const binCount = freq.length;

    for (let i = 0; i < vertCount; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const bz = base[i * 3 + 2];

      // Map vertex position to frequency bin
      // Use the angle from center to determine which frequency to sample
      const angle = Math.atan2(bz, bx); // -PI to PI
      const elevation = Math.asin(by / 2); // -PI/2 to PI/2
      const normalizedAngle = (angle + Math.PI) / (Math.PI * 2); // 0-1
      const normalizedElev = (elevation + Math.PI / 2) / Math.PI; // 0-1

      // Combine angle and elevation to get frequency index
      const freqIndex = Math.floor(normalizedAngle * binCount * 0.5 + normalizedElev * binCount * 0.3) % binCount;
      const freqValue = freq[freqIndex] / 255;

      // Displacement: base radius + frequency displacement + organic noise
      const noise = Math.sin(bx * 2 + t * 0.8) * Math.cos(by * 2 + t * 0.6) * 0.15;
      const displacement = 1 + freqValue * 0.5 + noise + beat * 0.2;

      // Normalize direction and apply displacement
      const len = Math.sqrt(bx * bx + by * by + bz * bz);
      positions[i * 3] = (bx / len) * 2 * displacement;
      positions[i * 3 + 1] = (by / len) * 2 * displacement;
      positions[i * 3 + 2] = (bz / len) * 2 * displacement;
    }

    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();

    // Slow rotation
    mesh.rotation.y = t * 0.15;
    mesh.rotation.x = Math.sin(t * 0.1) * 0.2;
    wire.rotation.copy(mesh.rotation);

    // Color based on scheme + energy
    const scheme = colorSchemes[state.colorSchemeIndex] ?? colorSchemes[0];
    const isHot = intensity > scheme.threshold;
    const hue = isHot ? scheme.hotHue(0.5) : scheme.coolHue(0.5);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const wireMat = wire.material as THREE.MeshBasicMaterial;

    mat.emissive.setHSL(hue / 360, scheme.saturation / 100, 0.3 + intensity * 0.4);
    mat.color.setHSL(hue / 360, scheme.saturation / 100, 0.1);
    wireMat.color.setHSL(hue / 360, scheme.saturation / 100, 0.5 + intensity * 0.3);
    wireMat.opacity = 0.15 + intensity * 0.25;
  });

  const geo = geoRef.current!;

  return (
    <group>
      <mesh ref={meshRef} geometry={geo}>
        <meshStandardMaterial
          toneMapped={false}
          emissive="#fff"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      <mesh ref={wireRef} geometry={geo}>
        <meshBasicMaterial
          wireframe
          transparent
          opacity={0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// --- Beat Particles ---

function BeatParticles({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const life = new Float32Array(PARTICLE_COUNT);
    return { positions: pos, velocities: vel, lifetimes: life };
  }, []);

  useFrame((_, dt) => {
    const points = pointsRef.current;
    const state = stateRef.current;
    if (!points) return;

    const geo = points.geometry;
    const posAttr = geo.attributes.position.array as Float32Array;
    const beat = state?.beatIntensity ?? 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      lifetimes[i] -= dt * 0.8;

      if (lifetimes[i] <= 0 && beat > 0.5 && Math.random() > 0.7) {
        // Respawn from sphere surface
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 2.5 + Math.random();

        posAttr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posAttr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        posAttr[i * 3 + 2] = r * Math.cos(phi);

        const speed = 2 + Math.random() * 4 + beat * 3;
        velocities[i * 3] = (posAttr[i * 3] / r) * speed;
        velocities[i * 3 + 1] = (posAttr[i * 3 + 1] / r) * speed;
        velocities[i * 3 + 2] = (posAttr[i * 3 + 2] / r) * speed;

        lifetimes[i] = 0.5 + Math.random() * 1.5;
      }

      if (lifetimes[i] > 0) {
        posAttr[i * 3] += velocities[i * 3] * dt;
        posAttr[i * 3 + 1] += velocities[i * 3 + 1] * dt;
        posAttr[i * 3 + 2] += velocities[i * 3 + 2] * dt;

        // Fade by moving far away when dead
      } else {
        posAttr[i * 3] = 0;
        posAttr[i * 3 + 1] = -100;
        posAttr[i * 3 + 2] = 0;
      }
    }

    geo.attributes.position.needsUpdate = true;

    // Color
    const scheme = colorSchemes[state?.colorSchemeIndex ?? 0] ?? colorSchemes[0];
    const intensity = state ? state.energy.low * 0.5 + state.energy.mid * 0.3 : 0;
    const isHot = intensity > scheme.threshold;
    const hue = isHot ? scheme.hotHue(0.5) : scheme.coolHue(0.5);
    const mat = points.material as THREE.PointsMaterial;
    mat.color.setHSL(hue / 360, scheme.saturation / 100, 0.7);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        transparent
        opacity={0.8}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
}

// --- Orbiting Ring ---

function OrbitRing({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || !stateRef.current) return;
    const t = clock.getElapsedTime();
    const intensity = stateRef.current.energy.low * 0.5 + stateRef.current.energy.mid * 0.3;

    ringRef.current.rotation.x = t * 0.3;
    ringRef.current.rotation.z = t * 0.2;

    const scale = 3.5 + intensity * 0.8 + stateRef.current.beatIntensity * 0.5;
    ringRef.current.scale.setScalar(scale);

    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    const scheme = colorSchemes[stateRef.current.colorSchemeIndex] ?? colorSchemes[0];
    const hue = scheme.coolHue(0.3);
    mat.color.setHSL(hue / 360, scheme.saturation / 100, 0.3 + intensity * 0.3);
    mat.opacity = 0.1 + intensity * 0.2;
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[1, 0.01, 16, 100]} />
      <meshBasicMaterial transparent opacity={0.2} toneMapped={false} />
    </mesh>
  );
}

// --- Camera ---

function OrbitalCamera({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const beat = stateRef.current?.beatIntensity ?? 0;
    const intensity = stateRef.current
      ? stateRef.current.energy.low * 0.5 + stateRef.current.energy.mid * 0.3
      : 0;

    // Orbit around the sphere
    const radius = 9 - intensity * 1.5 - beat * 1;
    const speed = 0.12 + intensity * 0.05;
    camera.position.x = Math.sin(t * speed) * radius;
    camera.position.z = Math.cos(t * speed) * radius;
    camera.position.y = Math.sin(t * 0.08) * 2 + beat * 0.8;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// --- Scene ---

function Scene({ stateRef }: { stateRef: React.RefObject<AudioState> }) {
  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]} intensity={0.3} />
      <pointLight position={[-5, -5, -5]} intensity={0.15} color="#4af" />

      <OrbitalCamera stateRef={stateRef} />
      <PulseSphere stateRef={stateRef} />
      <BeatParticles stateRef={stateRef} />
      <OrbitRing stateRef={stateRef} />

      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette darkness={0.7} />
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
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 9], fov: 55 }}
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
