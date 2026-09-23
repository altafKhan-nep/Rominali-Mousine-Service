import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { prefersReducedMotion } from './prefersReducedMotion.js';
// Per-variant placement: where the taxi should rest inside the hero canvas.
const CONFIG = {
  desktop: { scale: 0.95, xFactor: -0.03, yOffset: -0.05, yaw: 0.42 },
  tablet: { scale: 0.55, xFactor: 0, yFactor: 0.16, yOffset: 0, yaw: 0.42 },
};

// Entrance timeline (seconds), matches the "premium automotive" feel.
const T = {
  start: 0.3,
  position: 1.25,
  scale: 1.35,
  rotation: 1.5,
};

export default function TaxiRig({ model, shadow, variant = 'desktop' }) {
  const rig = useRef(null);
  const car = useRef(null);
  const { viewport } = useThree();
  const reducedMotion = useRef(prefersReducedMotion());
  const introDone = useRef(reducedMotion.current);
  const mouse = useRef({ x: 0, y: 0 });

  const cfg = CONFIG[variant] || CONFIG.desktop;
  const finalX = viewport.width * (cfg.xFactor || 0);
  const finalY = (cfg.yOffset || 0) + (cfg.yFactor ? viewport.height * cfg.yFactor : 0);

  // --- Entrance animation (GSAP) -----------------------------------------
  useEffect(() => {
    const g = rig.current;
    if (!g) return undefined;

    if (reducedMotion.current) {
      // Static placement, no motion.
      g.position.set(finalX, finalY, 0);
      g.scale.setScalar(cfg.scale);
      g.rotation.set(0, 0, 0);
      introDone.current = true;
      return undefined;
    }

    introDone.current = false;

    // Start slightly off the right side of the hero, small + tilted.
    g.position.set(viewport.width * 1.2, finalY + 0.5, 0.4);
    g.scale.setScalar(cfg.scale * 0.55);
    g.rotation.set(0, 0, 0.32);

    const tl = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => {
        introDone.current = true;
      },
    });

    tl.to(g.position, { x: finalX, y: finalY, z: 0, duration: T.position, ease: 'power4.out' }, T.start)
      .to(g.scale, { x: cfg.scale, y: cfg.scale, z: cfg.scale, duration: T.scale, ease: 'expo.out' }, T.start)
      .to(g.rotation, { z: 0, duration: T.rotation, ease: 'power3.out' }, T.start + 0.05);

    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Mouse parallax (window-level so the canvas can stay pointer-events-none) --
  useEffect(() => {
    if (reducedMotion.current) return undefined;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // --- Idle + parallax per frame (lerped, never snaps) -------------------
  useFrame((state) => {
    const g = rig.current;
    if (!g) return;
    if (reducedMotion.current) return;
    if (!introDone.current) return;

    const t = state.clock.elapsedTime;
    const m = mouse.current;

    // Idle: subtle float + slight sway, stays essentially in place.
    const bobY = Math.sin(t * 1.3) * 0.02;
    const swayZ = Math.sin(t * 0.85) * 0.012;

    const targetRotY = m.x * 0.16;
    const targetRotX = -m.y * 0.07;
    const targetX = finalX + m.x * 0.22;
    const targetY = finalY + bobY + m.y * 0.05;

    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, 0.05);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 0.05);
    g.position.x = THREE.MathUtils.lerp(g.position.x, targetX, 0.05);
    g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, 0.06);
    g.rotation.z = swayZ;
  });

  return (
    <group ref={rig}>
      {/* Soft ground shadow moves with the taxi */}
      {shadow}
      {/* The car itself turns to a 3/4 view */}
      <group ref={car} rotation={[0, cfg.yaw, 0]}>
        {model}
      </group>
    </group>
  );
}