import { useEffect, useState } from 'react';

// True when the device exposes a WebGL context (lets us hide the scene on old hardware).
export function useWebGLSupport() {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    let ok = true;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) ok = false;
    } catch {
      ok = false;
    }
    setSupported(ok);
  }, []);
  return supported;
}