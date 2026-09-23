import { Component, useEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import ProceduralTaxi from './ProceduralTaxi.jsx';
import { useModelAvailable } from './useModelAvailable.js';

// If the GLB fails to load/parse, fall back to the procedural taxi instead of crashing.
class GLBGuard extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function GLBModel() {
  const { scene } = useLoader(GLTFLoader, '/models/taxi.glb');
  const ref = useRef(null);

  useEffect(() => {
    const group = ref.current;
    if (!group) return;

    // Normalize any glTF so it matches the hero scale (length ~4.6 units) and sits on the ground.
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 4.6 / Math.max(size.x, 1e-4);

    group.scale.setScalar(s);
    group.position.set(-center.x * s, -center.y * s + 0.42, -center.z * s);

    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (m && typeof m.envMapIntensity === 'number') m.envMapIntensity = 1.0;
      });
    });
  }, [scene]);

  return (
    <group ref={ref}>
      <primitive object={scene} />
    </group>
  );
}

export default function TaxiModel() {
  const hasGLB = useModelAvailable('/models/taxi.glb');
  return (
    <GLBGuard fallback={<ProceduralTaxi />}>
      {hasGLB ? <GLBModel /> : <ProceduralTaxi />}
    </GLBGuard>
  );
}