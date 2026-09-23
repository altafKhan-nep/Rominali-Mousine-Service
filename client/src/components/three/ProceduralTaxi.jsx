import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

/* ------------------------------------------------------------------ */
/* PBR materials — glossy black paint, realistic glass/metal/chrome    */
/* ------------------------------------------------------------------ */

const PAINT = new THREE.MeshStandardMaterial({
  color: '#1c1c21',
  metalness: 0.6,
  roughness: 0.18,
  envMapIntensity: 1.2,
});
const PAINT_DARK = new THREE.MeshStandardMaterial({
  color: '#0a0a0d',
  metalness: 0.65,
  roughness: 0.35,
  envMapIntensity: 0.7,
});
const GLASS = new THREE.MeshStandardMaterial({
  color: '#0a1218',
  metalness: 1,
  roughness: 0.03,
  envMapIntensity: 1.9,
});
const CHROME = new THREE.MeshStandardMaterial({
  color: '#c7ccd1',
  metalness: 1,
  roughness: 0.12,
  envMapIntensity: 1.4,
});
const BLACK = new THREE.MeshStandardMaterial({
  color: '#14151a',
  metalness: 0.3,
  roughness: 0.55,
});
const TIRE = new THREE.MeshStandardMaterial({
  color: '#0b0b0c',
  metalness: 0,
  roughness: 0.92,
});
const ALLOY = new THREE.MeshStandardMaterial({
  color: '#b7bdc4',
  metalness: 1,
  roughness: 0.22,
  envMapIntensity: 1.6,
});
const HEAD = new THREE.MeshStandardMaterial({
  color: '#f5faff',
  emissive: '#eaf6ff',
  emissiveIntensity: 3,
  roughness: 0.25,
});
const LENS = new THREE.MeshStandardMaterial({
  color: '#dfe8ee',
  transparent: true,
  opacity: 0.38,
  roughness: 0.05,
  metalness: 0.2,
});
const TAIL = new THREE.MeshStandardMaterial({
  color: '#e53935',
  emissive: '#ff3b30',
  emissiveIntensity: 2.2,
  roughness: 0.3,
});
const CYAN = new THREE.MeshStandardMaterial({
  color: '#fdfefe',
  emissive: '#ffffff',
  emissiveIntensity: 1.3,
  metalness: 0.4,
  roughness: 0.3,
});

/* ------------------------------------------------------------------ */
/* Canvas-generated decal + roof-sign textures (no AI, no external)    */
/* ------------------------------------------------------------------ */

function makeDecalTexture(flip = false) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');
  if (flip) ctx.scale(-1, 1);
  ctx.translate(flip ? -512 : 0, 0);
  ctx.clearRect(-512, 0, 1024, 160);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 58px Inter, system-ui, sans-serif';
  ctx.fillText('Romina', 256, 62);
  ctx.shadowBlur = 5;
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#e6e6e8';
  ctx.fillText('Limousine Service', 256, 112);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSignTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 36px Inter, system-ui, sans-serif';
  ctx.fillText('ROMINA', 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Wheel: realistic tire + 6-spoke alloy rim                           */
/* ------------------------------------------------------------------ */

function Wheel({ x, z }) {
  const spokes = useMemo(() => [0, 1, 2, 3, 4, 5].map((i) => (i / 6) * Math.PI * 2), []);
  return (
    <group position={[x, 0.34, z]}>
      {/* Tire carcass + tread band */}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.33, 0.33, 0.26, 32]} />
        <primitive object={TIRE} attach="material" />
      </mesh>
      {/* Sidewall ring */}
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.3, 0.035, 8, 32]} />
        <primitive object={TIRE} attach="material" />
      </mesh>
      {/* Alloy barrel */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, 0.006]}>
        <cylinderGeometry args={[0.215, 0.215, 0.27, 24]} />
        <primitive object={ALLOY} attach="material" />
      </mesh>
      {/* Rim face */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0.135]}>
        <cylinderGeometry args={[0.215, 0.215, 0.012, 24]} />
        <primitive object={ALLOY} attach="material" />
      </mesh>
      {/* Spokes */}
      {spokes.map((a) => (
        <mesh key={a} rotation-z={a} position={[Math.cos(a) * 0.125, Math.sin(a) * 0.125, 0.14]}>
          <boxGeometry args={[0.26, 0.07, 0.02]} />
          <primitive object={ALLOY} attach="material" />
        </mesh>
      ))}
      {/* Hub + lug nuts */}
      <mesh position={[0, 0, 0.142]}>
        <cylinderGeometry args={[0.05, 0.05, 0.016, 14]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Fender arch — painted lip arching over each wheel                   */
/* ------------------------------------------------------------------ */

function FenderArch({ x, z }) {
  return (
    <group position={[x, 0.34, z]}>
      <mesh>
        <torusGeometry args={[0.42, 0.075, 10, 28, Math.PI]} />
        <primitive object={PAINT} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.35, 0.045, 8, 24, Math.PI]} />
        <primitive object={PAINT_DARK} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Sloped glass panel (windshield / rear window)                       */
/* ------------------------------------------------------------------ */

function SlopedGlass({ position: p, facing, rake, args }) {
  return (
    <group position={p} rotation-y={facing === 'front' ? Math.PI / 2 : -Math.PI / 2}>
      <mesh rotation-z={rake}>
        <planeGeometry args={args} />
        <primitive object={GLASS} attach="material" />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Trapezoid side window                                               */
/* ------------------------------------------------------------------ */

function SideGlass({ wTop, wBottom, h, position: p, flip = false }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-wBottom / 2, 0);
    s.lineTo(-wTop / 2, h);
    s.lineTo(wTop / 2, h);
    s.lineTo(wBottom / 2, 0);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [wTop, wBottom, h]);
  return (
    <mesh geometry={geo} position={p} rotation-y={flip ? Math.PI : 0}>
      <primitive object={GLASS} attach="material" />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* The taxi — a modern full-size American sedan, facing +X            */
/* ------------------------------------------------------------------ */

export default function ProceduralTaxi() {
  const decalRight = useMemo(() => makeDecalTexture(false), []);
  const decalLeft = useMemo(() => makeDecalTexture(true), []);
  const signTex = useMemo(makeSignTexture, []);
  const decalMatRight = useMemo(
    () => new THREE.MeshStandardMaterial({ map: decalRight, transparent: true, roughness: 0.35, metalness: 0.1 }),
    [decalRight]
  );
  const decalMatLeft = useMemo(
    () => new THREE.MeshStandardMaterial({ map: decalLeft, transparent: true, roughness: 0.35, metalness: 0.1 }),
    [decalLeft]
  );
  const signMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: signTex,
        transparent: true,
        emissiveMap: signTex,
        emissive: '#9fe9ff',
        emissiveIntensity: 2.4,
        roughness: 0.4,
      }),
    [signTex]
  );

  // Smooth, aerodynamic sedan silhouette (side profile) extruded across the width.
  const bodyGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.4, 0.28);
    s.lineTo(-2.4, 0.52);
    s.quadraticCurveTo(-2.43, 0.64, -2.35, 0.76); // rear deck
    s.lineTo(-1.32, 0.86);
    s.lineTo(-1.14, 0.9);
    s.quadraticCurveTo(-1.28, 1.16, -0.58, 1.36); // rear glass rake
    s.quadraticCurveTo(-0.22, 1.46, 0.22, 1.43); // roof arc
    s.quadraticCurveTo(0.66, 1.28, 0.9, 0.92); // windshield rake
    s.lineTo(1.32, 0.88); // cowl
    s.quadraticCurveTo(1.9, 0.84, 2.3, 0.8); // hood
    s.lineTo(2.42, 0.6); // nose
    s.lineTo(2.42, 0.44); // grille face
    s.quadraticCurveTo(2.44, 0.34, 2.39, 0.28); // bumper lip
    s.lineTo(-2.4, 0.28); // rocker bottom
    s.closePath();
    return new THREE.ExtrudeGeometry(s, {
      depth: 1.78,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 20,
      steps: 1,
    });
  }, []);

  return (
    <group>
      {/* ============ BODY SHELL ============ */}
      <mesh geometry={bodyGeo} position={[0, 0, -0.89]}>
        <primitive object={PAINT} attach="material" />
      </mesh>

      {/* Underbody / rockers */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[4.4, 0.14, 1.3]} />
        <primitive object={PAINT_DARK} attach="material" />
      </mesh>

      {/* ============ GLASS (greenhouse) ============ */}
      <SlopedGlass position={[0.58, 1.16, 0]} facing="front" rake={0.78} args={[1.52, 0.6]} />
      <SlopedGlass position={[-0.82, 1.12, 0]} facing="rear" rake={-0.62} args={[1.3, 0.52]} />

      <SideGlass wTop={0.34} wBottom={0.42} h={0.42} position={[0.82, 1.1, 0.905]} />
      <SideGlass wTop={0.34} wBottom={0.42} h={0.42} position={[-0.2, 1.1, 0.905]} />
      <SideGlass wTop={0.34} wBottom={0.42} h={0.42} position={[0.82, 1.1, -0.905]} flip />
      <SideGlass wTop={0.34} wBottom={0.42} h={0.42} position={[-0.2, 1.1, -0.905]} flip />

      {/* B-pillars */}
      <mesh position={[0.3, 1.1, 0.91]}>
        <boxGeometry args={[0.06, 0.4, 0.05]} />
        <primitive object={PAINT} attach="material" />
      </mesh>
      <mesh position={[0.3, 1.1, -0.91]}>
        <boxGeometry args={[0.06, 0.4, 0.05]} />
        <primitive object={PAINT} attach="material" />
      </mesh>

      {/* ============ CHROME + DETAILS ============ */}
      {/* Beltline chrome strip */}
      <mesh position={[0, 0.86, 0.905]}>
        <boxGeometry args={[4.55, 0.035, 0.02]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
      <mesh position={[0, 0.86, -0.905]}>
        <boxGeometry args={[4.55, 0.035, 0.02]} />
        <primitive object={CHROME} attach="material" />
      </mesh>

      {/* Rocker dark + chrome accent */}
      <mesh position={[-0.1, 0.34, 0.89]}>
        <boxGeometry args={[2.6, 0.12, 0.02]} />
        <primitive object={PAINT_DARK} attach="material" />
      </mesh>
      <mesh position={[-0.1, 0.34, -0.89]}>
        <boxGeometry args={[2.6, 0.12, 0.02]} />
        <primitive object={PAINT_DARK} attach="material" />
      </mesh>

      {/* Door handles */}
      <mesh position={[0.86, 0.8, 0.9]}>
        <boxGeometry args={[0.18, 0.045, 0.04]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
      <mesh position={[-0.14, 0.8, 0.9]}>
        <boxGeometry args={[0.18, 0.045, 0.04]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
      <mesh position={[0.86, 0.8, -0.9]}>
        <boxGeometry args={[0.18, 0.045, 0.04]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
      <mesh position={[-0.14, 0.8, -0.9]}>
        <boxGeometry args={[0.18, 0.045, 0.04]} />
        <primitive object={CHROME} attach="material" />
      </mesh>

      {/* ============ FRONT FASCIA ============ */}
      {/* Chrome grille surround + dark mesh */}
      <mesh position={[2.4, 0.5, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.98]} />
        <primitive object={CHROME} attach="material" />
      </mesh>
      <mesh position={[2.41, 0.5, 0]}>
        <boxGeometry args={[0.03, 0.14, 0.86]} />
        <primitive object={BLACK} attach="material" />
      </mesh>
      {/* Lower grille */}
      <mesh position={[2.4, 0.36, 0]}>
        <boxGeometry args={[0.04, 0.09, 0.8]} />
        <primitive object={BLACK} attach="material" />
      </mesh>

      {/* LED headlights + clear lenses */}
      {[0.34, -0.34].map((z) => (
        <group key={z}>
          <mesh position={[2.33, 0.6, z]}>
            <boxGeometry args={[0.07, 0.07, 0.32]} />
            <primitive object={HEAD} attach="material" />
          </mesh>
          <mesh position={[2.38, 0.6, z]}>
            <boxGeometry args={[0.03, 0.09, 0.36]} />
            <primitive object={LENS} attach="material" />
          </mesh>
          {/* Cyan DRL accent */}
          <mesh position={[2.37, 0.52, z]}>
            <boxGeometry args={[0.02, 0.025, 0.3]} />
            <primitive object={CYAN} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ============ REAR FASCIA ============ */}
      {[0.34, -0.34].map((z) => (
        <group key={z}>
          <mesh position={[-2.37, 0.8, z]}>
            <boxGeometry args={[0.06, 0.08, 0.38]} />
            <primitive object={TAIL} attach="material" />
          </mesh>
          <mesh position={[-2.33, 0.8, z * 2.3]}>
            <boxGeometry args={[0.04, 0.08, 0.2]} />
            <primitive object={TAIL} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[-2.4, 0.44, 0]}>
        <boxGeometry args={[0.05, 0.14, 1.6]} />
        <primitive object={BLACK} attach="material" />
      </mesh>
      {/* Rear plate surround */}
      <mesh position={[-2.39, 0.62, 0]}>
        <boxGeometry args={[0.02, 0.14, 0.34]} />
        <primitive object={BLACK} attach="material" />
      </mesh>

      {/* ============ MIRRORS ============ */}
      <group position={[0.72, 1.04, 0.92]}>
        <mesh>
          <boxGeometry args={[0.2, 0.1, 0.06]} />
          <primitive object={PAINT} attach="material" />
        </mesh>
        <mesh position={[0.01, 0, -0.035]}>
          <planeGeometry args={[0.18, 0.08]} />
          <primitive object={GLASS} attach="material" />
        </mesh>
      </group>
      <group position={[0.72, 1.04, -0.92]}>
        <mesh>
          <boxGeometry args={[0.2, 0.1, 0.06]} />
          <primitive object={PAINT} attach="material" />
        </mesh>
        <mesh position={[0.01, 0, 0.035]}>
          <planeGeometry args={[0.18, 0.08]} />
          <primitive object={GLASS} attach="material" />
        </mesh>
      </group>

      {/* ============ WHEELS + FENDER ARCHES ============ */}
      <Wheel x={1.5} z={0.8} />
      <Wheel x={-1.55} z={0.8} />
      <Wheel x={1.5} z={-0.8} />
      <Wheel x={-1.55} z={-0.8} />
      <FenderArch x={1.5} z={0.885} />
      <FenderArch x={-1.55} z={0.885} />
      <FenderArch x={1.5} z={-0.885} />
      <FenderArch x={-1.55} z={-0.885} />

      {/* ============ ROOF SIGN ============ */}
      <group position={[0, 1.49, 0]}>
        <RoundedBox args={[0.62, 0.1, 0.24]} radius={0.03} smoothness={3}>
          <primitive object={BLACK} attach="material" />
        </RoundedBox>
        <mesh position={[0.32, 0, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.2, 0.075]} />
          <primitive object={signMat} attach="material" />
        </mesh>
        <mesh position={[-0.32, 0, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.2, 0.075]} />
          <primitive object={signMat} attach="material" />
        </mesh>
      </group>

      {/* ============ BRANDING DECALS (rear doors) ============ */}
      <mesh position={[-0.28, 0.72, 0.895]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.05, 0.3]} />
        <primitive object={decalMatRight} attach="material" />
      </mesh>
      <mesh position={[-0.28, 0.72, -0.895]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.05, 0.3]} />
        <primitive object={decalMatLeft} attach="material" />
      </mesh>
    </group>
  );
}