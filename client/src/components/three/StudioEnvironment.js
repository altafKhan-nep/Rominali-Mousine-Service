import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Procedural PMREM environment -> soft automotive reflections without any external HDR file.
// Gives the paint and glass their premium "studio showroom" look against the red hero.
export default function StudioEnvironment({ intensity = 0.55 }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const rt = pmrem.fromScene(room, 0.04);
    scene.environment = rt.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
      if (room.dispose) room.dispose();
    };
  }, [gl, scene, intensity]);

  return null;
}