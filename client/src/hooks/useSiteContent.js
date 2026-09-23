import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

// Merges a CMS override over the code defaults. The site renders its static
// defaults whenever the CMS is empty or unreachable, so a missing/corrupt
// content block can never take down a marketing page.
export function mergeContent(fallback, override) {
  if (override == null) return fallback;

  if (Array.isArray(fallback)) {
    // Override shaped as { [slug|name|id]: patch } — merge per item.
    if (!Array.isArray(override)) {
      return fallback.map((item) => {
        const id = item.slug || item.name || item.id;
        const patch = override[id];
        return patch ? { ...item, ...patch } : item;
      });
    }
    // Override is a full list — merge each item over its default so static
    // data (icons, slugs) survives, and allow the admin to re-order/append.
    const idOf = (x) => x?.slug || x?.name || x?.id || x?.plateNumber;
    const seen = new Set();
    const list = override.map((o) => {
      const def = fallback.find((d) => idOf(d) === idOf(o));
      if (!def) { seen.add(idOf(o)); return o; }
      seen.add(idOf(def));
      return { ...def, ...o };
    });
    // Keep any defaults the admin list still contains (already merged above).
    return list;
  }

  if (fallback && typeof fallback === 'object') {
    return { ...fallback, ...(override && typeof override === 'object' ? override : {}) };
  }
  return override ?? fallback;
}

const CONTENT_STALE = 10 * 60 * 1000;

export function useSiteContent(key, fallback) {
  const { data } = useQuery({
    queryKey: ['site-content', key],
    queryFn: async () => {
      try {
        const res = await api.get(`/content/${key}`);
        return res.data?.value ?? null;
      } catch {
        return null;
      }
    },
    staleTime: CONTENT_STALE,
    gcTime: CONTENT_STALE,
  });
  return mergeContent(fallback, data);
}