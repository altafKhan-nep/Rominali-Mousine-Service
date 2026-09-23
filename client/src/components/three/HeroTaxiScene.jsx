import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import StudioEnvironment from './StudioEnvironment.js';
import TaxiLights from './TaxiLights.jsx';
import TaxiRig from './TaxiRig.jsx';
import TaxiModel from './TaxiModel.jsx';
import ShadowDisc from './ShadowDisc.jsx';

// The full 3D hero scene. Lazy-imported from Home.jsx so the WebGL bundle only loads
// when a supported, non-mobile viewport actually renders the taxi.
export default function HeroTaxiScene({ variant = 'desktop' }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.35, 6.6], fov: 38 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <Suspense fallback={null}>
        <StudioEnvironment />
        <TaxiLights />
        <TaxiRig model={<TaxiModel />} shadow={<ShadowDisc />} variant={variant} />
      </Suspense>
    </Canvas>
  );
}