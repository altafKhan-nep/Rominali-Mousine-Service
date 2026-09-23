import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { HOMECONTENT_DEFAULTS } from '../../../../data/homeContent.js';
import { SERVICES } from '../../../../data/services.js';
import { FLEET } from '../../../../data/fleet.js';
import { mergeContent } from '../../../../hooks/useSiteContent.js';

const INPUT = 'input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none dark:border-accent-700 dark:bg-accent-800 dark:text-white';

export default function WebsitePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin','content'], queryFn: async () => (await api.get('/crm/content')).data });
  const map: Record<string, any> = (data as any)?.content ?? {};

  const [tab, setTab] = useState<'home' | 'services' | 'fleet'>('home');
  const [home, setHome] = useState<any>(HOMECONTENT_DEFAULTS);
  const [services, setServices] = useState<any[]>(SERVICES);
  const [fleet, setFleet] = useState<any[]>(FLEET);
  const [savedKey, setSavedKey] = useState('');
  const [error, setError] = useState('');

  // Hydrate local editors with CMS values (merged over defaults) once loaded.
  useEffect(() => {
    if (!map) return;
    setHome(mergeContent(HOMECONTENT_DEFAULTS, map.home ?? null));
    setServices(mergeContent(SERVICES, map.services ?? null));
    setFleet(mergeContent(FLEET, map.fleet ?? null));
  }, [map]);

  const save = useMutation({
    mutationFn: async () => {
      const fallback = tab === 'home' ? HOMECONTENT_DEFAULTS : tab === 'services' ? SERVICES : FLEET;
      const value = tab === 'home' ? home : tab === 'services' ? services : fleet;
      const mergedSupported = (tab === 'home' ? home : mergeContent(fallback, value));
      await api.patch('/crm/content', { key: tab, value: mergedSupported });
      setError('');
      setSavedKey(tab);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin','content'] }),
    onError: (e: any) => setError(e?.response?.data?.message || 'Save failed'),
  });

  const reset = useMutation({
    mutationFn: async () => { await api.patch('/crm/content', { key: tab, value: null }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin','content'] });
      if (tab === 'home') setHome(HOMECONTENT_DEFAULTS);
      if (tab === 'services') setServices(SERVICES);
      if (tab === 'fleet') setFleet(FLEET);
      setSavedKey(tab);
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Reset failed'),
  });

  const setService = (slug: string, patch: any) => setServices(services.map((s) => (s.slug === slug ? { ...s, ...patch } : s)));
  const setFleetCard = (id: string, patch: any) => setFleet(fleet.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const TABS: { id: typeof tab; label: string; hint: string }[] = [
    { id: 'home', label: 'Home Hero & Banner', hint: 'Homepage headline, subtitle, CTA, and the fleet image-band copy.' },
    { id: 'services', label: 'Services (10)', hint: 'Names, one-liners, summaries and feature lists for your services.' },
    { id: 'fleet', label: 'Fleet (3)', hint: 'Vehicle cards shown on /fleet — names, tags, perks and features.' },
  ];

  const saved = savedKey === tab;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Website Content</h1>
      <p className="max-w-2xl text-sm text-muted">Edit the marketing copy the public site renders. The code defaults are restored automatically if CMS is empty or unreachable.</p>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'btn-brand-gradient text-white shadow' : 'border border-accent-200 text-muted hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <p className="text-xs text-muted">{TABS.find((t) => t.id === tab)?.hint}</p>

        {tab === 'home' && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm">Eyebrow / service area
                <input value={home.hero?.eyebrow || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, eyebrow: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
              <label className="text-sm">Title part 1
                <input value={home.hero?.title1 || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, title1: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
              <label className="text-sm">Title accent (gold)
                <input value={home.hero?.titleAccent || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, titleAccent: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Title part 2
                <input value={home.hero?.title2 || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, title2: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
              <label className="text-sm">CTA button
                <input value={home.hero?.cta || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, cta: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
            </div>
            <label className="text-sm">Hero subtitle
              <textarea rows={3} value={home.hero?.subtitle || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, subtitle: e.target.value } })} className={`${INPUT} mt-1`} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Image-band title
                <input value={home.banner?.title || ''} onChange={(e) => setHome({ ...home, banner: { ...home.banner, title: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
              <label className="text-sm">Image-band text
                <textarea rows={2} value={home.banner?.text || ''} onChange={(e) => setHome({ ...home, banner: { ...home.banner, text: e.target.value } })} className={`${INPUT} mt-1`} />
              </label>
            </div>
          </div>
        )}

        {tab === 'services' && (
          <div className="mt-4 space-y-3">
            {services.map((s, i) => (
              <details key={s.slug} className="rounded-2xl border border-accent-200 bg-accent-50/50 p-3 dark:border-accent-800 dark:bg-white/5">
                <summary className="cursor-pointer text-sm font-semibold">{i + 1}. {s.name} <span className="ml-1 font-normal text-muted">/ {s.slug}</span></summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Name
                    <input value={s.name || ''} onChange={(e) => setService(s.slug, { name: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">One-liner (short)
                    <input value={s.short || ''} onChange={(e) => setService(s.slug, { short: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Tagline
                    <input value={s.tagline || ''} onChange={(e) => setService(s.slug, { tagline: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Summary
                    <textarea rows={3} value={s.summary || ''} onChange={(e) => setService(s.slug, { summary: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                </div>
                <label className="mt-3 block text-sm">Features (one per line)
                  <textarea rows={4} value={(s.features || []).join('\n')} onChange={(e) => setService(s.slug, { features: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })} className={`${INPUT} mt-1`} />
                </label>
              </details>
            ))}
          </div>
        )}

        {tab === 'fleet' && (
          <div className="mt-4 space-y-3">
            {fleet.map((f, i) => (
              <details key={f.id} className="rounded-2xl border border-accent-200 bg-accent-50/50 p-3 dark:border-accent-800 dark:bg-white/5">
                <summary className="cursor-pointer text-sm font-semibold">{i + 1}. {f.name}</summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">Vehicle name
                    <input value={f.name || ''} onChange={(e) => setFleetCard(f.id, { name: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Tag / badge
                    <input value={f.tag || ''} onChange={(e) => setFleetCard(f.id, { tag: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Image URL or path
                    <input value={f.img || ''} onChange={(e) => setFleetCard(f.id, { img: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Tagline
                    <input value={f.tagline || ''} onChange={(e) => setFleetCard(f.id, { tagline: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Passengers
                    <input value={f.passengers || ''} onChange={(e) => setFleetCard(f.id, { passengers: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                  <label className="text-sm">Luggage
                    <input value={f.luggage || ''} onChange={(e) => setFleetCard(f.id, { luggage: e.target.value })} className={`${INPUT} mt-1`} />
                  </label>
                </div>
                <label className="mt-3 block text-sm">Perks (comma separated)
                  <input value={(f.perks || []).join(', ')} onChange={(e) => setFleetCard(f.id, { perks: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} className={`${INPUT} mt-1`} />
                </label>
                <label className="mt-3 block text-sm">Features (one per line)
                  <textarea rows={4} value={(f.features || []).join('\n')} onChange={(e) => setFleetCard(f.id, { features: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })} className={`${INPUT} mt-1`} />
                </label>
              </details>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {saved && <p className="mt-3 text-sm text-green-600">Saved — live on the site now.</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={() => { if (confirm('Reset this section to the code defaults?')) reset.mutate(); }} className="rounded-full border border-accent-200 px-4 py-2 text-sm text-muted hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5">
            Reset to defaults
          </button>
        </div>
      </Card>
    </div>
  );
}