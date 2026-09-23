import { useEffect, useState } from 'react';

/* global fetch */

// Returns true when a GLB/GLTF exists at `url`.
// Uses HEAD and rejects HTML fallbacks (e.g. SPA servers that return index.html for missing files),
// so a missing model gracefully falls back to the procedural taxi instead of erroring.
export function useModelAvailable(url) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        const type = res.headers.get('content-type') || '';
        if (!cancelled) setAvailable(res.ok && !type.includes('text/html'));
      } catch {
        if (!cancelled) setAvailable(false);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return available;
}