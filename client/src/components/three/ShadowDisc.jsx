import { useMemo } from 'react';
import * as THREE from 'three';

// Soft, non-black shadow that anchors the taxi to the hero. Travels with the taxi group so it
// animates together (entrance + idle bob). Uses a radial alpha gradient — never a hard blob.
export default function ShadowDisc({ scale = 2.0, opacity = 0.32 }) {
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
    grad.addColorStop(0, `rgba(0,0,0,${opacity})`);
    grad.addColorStop(0.55, `rgba(0,0,0,${opacity * 0.45})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, [opacity]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 0]} renderOrder={-1}>
      <planeGeometry args={[scale * 1.9, scale * 1.9]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={1} />
    </mesh>
  );
}