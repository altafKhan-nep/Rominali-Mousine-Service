import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Trash2, Plus, ExternalLink, Sparkles, Lock } from 'lucide-react';
import api from '../../../../services/api.js';
import { Card } from '../../components/ui/card';
import { Modal } from '../../components/ui/Modal';
import { HOMECONTENT_DEFAULTS } from '../../../../data/homeContent.js';
import { SERVICES } from '../../../../data/services.js';
import { FLEET } from '../../../../data/fleet.js';
import { mergeContent } from '../../../../hooks/useSiteContent.js';
import { SERVICE_ICON_OPTIONS, resolveServiceIcon } from '../../../../data/serviceIcons.js';

const INPUT = 'input-pill w-full border border-accent-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 dark:border-accent-700 dark:bg-accent-800 dark:text-white';

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);

const idOf = (x: any) => x?.slug || x?.name || x?.id;

// Strip anything non-serializable (live icon components) before persisting.
const cleanItems = (items: any[]) => items.map(({ icon, ...rest }: any) => rest);

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-ink dark:text-white">{label}</span>
      {hint && <span className="ml-1.5 text-xs text-muted">{hint}</span>}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

export default function WebsitePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin', 'content'], queryFn: async () => (await api.get('/crm/content')).data });
  const map: Record<string, any> = (data as any)?.content ?? {};

  const [tab, setTab] = useState<'home' | 'services' | 'fleet'>('home');
  const [home, setHome] = useState<any>(HOMECONTENT_DEFAULTS);
  const [services, setServices] = useState<any[]>(SERVICES);
  const [fleet, setFleet] = useState<any[]>(FLEET);
  const [savedKey, setSavedKey] = useState('');
  const [error, setError] = useState('');
  const [openKey, setOpenKey] = useState('');

  // Service & fleet add/edit modal state
  const [svcModal, setSvcModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [fleetModal, setFleetModal] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });

  const emptyService = { name: '', short: '', iconKey: 'airport', tagline: '', summary: '', features: [] };
  const emptyFleet = { name: '', tag: '', img: '', tagline: '', passengers: '', luggage: '', perks: [], features: [] };

  // Hydrate local editors with CMS values (merged over defaults) once loaded.
  useEffect(() => {
    if (!map) return;
    setHome(mergeContent(HOMECONTENT_DEFAULTS, map.home ?? null));
    setServices(mergeContent(SERVICES, map.services ?? null));
    setFleet(mergeContent(FLEET, map.fleet ?? null));
  }, [map]);

  const resetEditors = () => {
    setHome(HOMECONTENT_DEFAULTS);
    setServices(SERVICES);
    setFleet(FLEET);
  };

  const save = useMutation({
    mutationFn: async () => {
      const value =
        tab === 'home' ? mergeContent(HOMECONTENT_DEFAULTS, home)
        : tab === 'services' ? mergeContent(SERVICES, cleanItems(services))
        : mergeContent(FLEET, cleanItems(fleet));
      await api.patch('/crm/content', { key: tab, value });
      setError('');
      setSavedKey(tab);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'content'] }),
    onError: (e: any) => setError(e?.response?.data?.message || 'Save failed'),
  });

  const reset = useMutation({
    mutationFn: async () => { await api.patch('/crm/content', { key: tab, value: null }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'content'] });
      resetEditors();
      setSavedKey(tab);
    },
    onError: (e: any) => setError(e?.response?.data?.message || 'Reset failed'),
  });

  const setService = (slug: string, patch: any) =>
    setServices(services.map((s) => (s.slug === slug ? { ...s, ...patch } : s)));
  const setFleetCard = (id: string, patch: any) =>
    setFleet(fleet.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeService = (slug: string) => {
    if (!confirm(`Remove "${services.find((s) => s.slug === slug)?.name}" from the website services?`)) return;
    setServices(services.filter((s) => s.slug !== slug));
  };
  const removeFleet = (id: string) => {
    if (!confirm(`Remove "${fleet.find((f) => f.id === id)?.name}" from the website fleet?`)) return;
    setFleet(fleet.filter((f) => f.id !== id));
  };

  const uniqueSlug = (name: string, list: any[]) => {
    let base = slugify(name) || 'item';
    let candidate = base;
    let n = 2;
    while (list.some((x) => idOf(x) === candidate)) candidate = `${base}-${n++}`;
    return candidate;
  };

  const submitService = () => {
    const editing = svcModal.editing;
    if (!editing?.name?.trim()) return;
    if (!editing.slug) {
      setServices([...services, { ...editing, slug: uniqueSlug(editing.name, services) }]);
    } else {
      setServices(services.map((s) => (s.slug === editing.slug ? { ...s, ...editing } : s)));
    }
    setSvcModal({ open: false, editing: null });
  };

  const submitFleet = () => {
    const editing = fleetModal.editing;
    if (!editing?.name?.trim()) return;
    const id = editing.id || uniqueSlug(editing.name, fleet);
    const item = { ...editing, id };
    if (editing.id) setFleet(fleet.map((x) => (x.id === editing.id ? item : x)));
    else setFleet([...fleet, item]);
    setFleetModal({ open: false, editing: null });
  };

  const saved = savedKey === tab;
  const counts: Record<typeof tab, string> = { home: 'Home hero & banner', services: `${services.length} services`, fleet: `${fleet.length} vehicles` };
  const liveUrl = tab === 'home' ? '/' : tab === 'services' ? '/services' : '/fleet';
  const isCustomItem = (item: any, defaults: any[]) => !defaults.some((d) => idOf(d) === idOf(item));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Website Content</h1>
          <p className="max-w-2xl text-sm text-muted">
            Edit the marketing copy, services and fleet the public site renders. Changes go live
            immediately after saving — the code defaults are your backup.
          </p>
        </div>
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 px-4 py-2 text-sm font-medium text-muted hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5"
        >
          <ExternalLink className="h-4 w-4" /> View live
        </a>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(['home', 'services', 'fleet'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t ? 'btn-brand-gradient text-white shadow' : 'border border-accent-200 text-muted hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5'
            }`}
          >
            {t === 'home' ? 'Home' : t === 'services' ? 'Services' : 'Fleet'}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${tab === t ? 'bg-white/20' : 'bg-accent-100 dark:bg-accent-800'}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* ------------- HOME ------------- */}
      {tab === 'home' && (
        <Card className="space-y-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold"><Sparkles className="h-4 w-4 text-brand-600" /> Hero section</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Eyebrow / service area">
                <input value={home.hero?.eyebrow || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, eyebrow: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="Title part 1">
                <input value={home.hero?.title1 || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, title1: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="Title accent (gold)">
                <input value={home.hero?.titleAccent || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, titleAccent: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="Title part 2">
                <input value={home.hero?.title2 || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, title2: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="CTA button label">
                <input value={home.hero?.cta || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, cta: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="Hero subtitle">
                <textarea rows={3} value={home.hero?.subtitle || ''} onChange={(e) => setHome({ ...home, hero: { ...home.hero, subtitle: e.target.value } })} className={INPUT} />
              </Field>
            </div>
          </div>
          <div className="border-t border-accent-100 pt-5 dark:border-accent-800">
            <h3 className="text-base font-bold">Image band</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input value={home.banner?.title || ''} onChange={(e) => setHome({ ...home, banner: { ...home.banner, title: e.target.value } })} className={INPUT} />
              </Field>
              <Field label="Text">
                <textarea rows={2} value={home.banner?.text || ''} onChange={(e) => setHome({ ...home, banner: { ...home.banner, text: e.target.value } })} className={INPUT} />
              </Field>
            </div>
          </div>
        </Card>
      )}

      {/* ------------- SERVICES ------------- */}
      {tab === 'services' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => { setSvcModal({ open: true, editing: null }); setError(''); }}
              className="inline-flex items-center gap-1.5 rounded-full btn-brand-gradient px-4 py-2 text-sm font-medium text-white shadow"
            >
              <Plus className="h-4 w-4" /> Add service
            </button>
          </div>
          {services.map((s: any) => {
            const Icon = resolveServiceIcon(s);
            const open = openKey === `svc:${s.slug}`;
            const custom = isCustomItem(s, SERVICES);
            return (
              <Card key={s.slug} className="p-5">
                <button
                  onClick={() => setOpenKey(open ? '' : `svc:${s.slug}`)}
                  className="flex w-full flex-wrap items-center gap-3 text-left"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient-soft">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-ink dark:text-white">
                      {s.name}
                      {custom ? (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700 dark:bg-amber-900 dark:text-gold-300">Custom</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-accent-800"><Lock className="h-3 w-3" /> Default</span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">/{s.slug} · {s.tagline}</span>
                  </span>
                  <span className="text-xs text-muted">{s.features?.length || 0} features</span>
                </button>

                {open && (
                  <div className="mt-4 grid gap-4 border-t border-accent-100 pt-4 sm:grid-cols-2 dark:border-accent-800">
                    <Field label="Name">
                      <input value={s.name || ''} onChange={(e) => setService(s.slug, { name: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Short label" hint="shown as a badge">
                      <input value={s.short || ''} onChange={(e) => setService(s.slug, { short: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Icon">
                      <select
                        value={s.iconKey || (typeof s.icon === 'string' ? s.icon : '') || s.slug}
                        onChange={(e) => setService(s.slug, { iconKey: e.target.value })}
                        className={INPUT}
                      >
                        {SERVICE_ICON_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Tagline">
                      <input value={s.tagline || ''} onChange={(e) => setService(s.slug, { tagline: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Summary">
                      <textarea rows={4} value={s.summary || ''} onChange={(e) => setService(s.slug, { summary: e.target.value })} className={`${INPUT} sm:col-span-2`} />
                    </Field>
                    <Field label="Features" hint="one per line">
                      <textarea
                        rows={5}
                        value={(s.features || []).join('\n')}
                        onChange={(e) => setService(s.slug, { features: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
                        className={`${INPUT} sm:col-span-2`}
                      />
                    </Field>
                    <div className="flex justify-end sm:col-span-2">
                      <button
                        onClick={() => { setSvcModal({ open: true, editing: s }); setError(''); }}
                        className="rounded-full border border-accent-200 px-4 py-1.5 text-xs font-medium hover:bg-accent-50 dark:border-accent-700 dark:hover:bg-white/5"
                      >
                        Edit in modal…
                      </button>
                      <button
                        onClick={() => removeService(s.slug)}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {services.length === 0 && <p className="text-sm text-muted">No services yet — add your first one.</p>}
        </div>
      )}

      {/* ------------- FLEET ------------- */}
      {tab === 'fleet' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => { setFleetModal({ open: true, editing: null }); setError(''); }}
              className="inline-flex items-center gap-1.5 rounded-full btn-brand-gradient px-4 py-2 text-sm font-medium text-white shadow"
            >
              <Plus className="h-4 w-4" /> Add vehicle
            </button>
          </div>
          {fleet.map((f: any) => {
            const open = openKey === `fleet:${f.id}`;
            const custom = isCustomItem(f, FLEET);
            return (
              <Card key={f.id} className="p-5">
                <button onClick={() => setOpenKey(open ? '' : `fleet:${f.id}`)} className="flex w-full flex-wrap items-center gap-3 text-left">
                  {f.img && <img src={f.img} alt="" className="hidden h-14 w-20 shrink-0 rounded-xl object-cover sm:block" />}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-ink dark:text-white">
                      {f.name}
                      {custom ? (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-semibold text-gold-700 dark:bg-amber-900 dark:text-gold-300">Custom</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-accent-800"><Lock className="h-3 w-3" /> Default</span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted">{f.tagline} · {f.passengers} · {f.luggage}</span>
                  </span>
                  <span className="text-xs text-muted">{f.features?.length || 0} features</span>
                </button>

                {open && (
                  <div className="mt-4 grid gap-4 border-t border-accent-100 pt-4 sm:grid-cols-2 dark:border-accent-800">
                    <Field label="Vehicle name">
                      <input value={f.name || ''} onChange={(e) => setFleetCard(f.id, { name: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Tag / badge">
                      <input value={f.tag || ''} onChange={(e) => setFleetCard(f.id, { tag: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Image URL or path">
                      <input value={f.img || ''} onChange={(e) => setFleetCard(f.id, { img: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Tagline">
                      <input value={f.tagline || ''} onChange={(e) => setFleetCard(f.id, { tagline: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Passengers">
                      <input value={f.passengers || ''} onChange={(e) => setFleetCard(f.id, { passengers: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Luggage">
                      <input value={f.luggage || ''} onChange={(e) => setFleetCard(f.id, { luggage: e.target.value })} className={INPUT} />
                    </Field>
                    <Field label="Perks" hint="comma separated">
                      <input value={(f.perks || []).join(', ')} onChange={(e) => setFleetCard(f.id, { perks: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} className={INPUT} />
                    </Field>
                    <Field label="Features" hint="one per line">
                      <textarea
                        rows={4}
                        value={(f.features || []).join('\n')}
                        onChange={(e) => setFleetCard(f.id, { features: e.target.value.split('\n').map((x: string) => x.trim()).filter(Boolean) })}
                        className={INPUT}
                      />
                    </Field>
                    <div className="flex justify-end sm:col-span-2">
                      <button onClick={() => removeFleet(f.id)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {fleet.length === 0 && <p className="text-sm text-muted">No vehicles yet — add your first one.</p>}
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-3 z-10">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-accent-800 dark:bg-accent-900/95">
          {saved && <p className="text-sm font-medium text-green-600">Saved — live now</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {!saved && !error && <p className="text-sm text-muted">Editing {counts[tab]}</p>}
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={() => { if (confirm(`Reset "${counts[tab]}" back to the code defaults?`)) reset.mutate(); }}
              disabled={reset.isPending}
              className="rounded-full border border-accent-200 px-4 py-2 text-sm text-muted hover:bg-accent-50 disabled:opacity-50 dark:border-accent-700 dark:hover:bg-white/5"
            >
              Reset to defaults
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white shadow disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* -------- Add / edit service modal -------- */}
      <Modal
        open={svcModal.open}
        onClose={() => setSvcModal({ open: false, editing: null })}
        title={svcModal.editing ? `Edit service: ${svcModal.editing.name}` : 'Add a new service'}
        wide
        footer={
          <>
            <button onClick={() => setSvcModal({ open: false, editing: null })} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Cancel</button>
<button
              onClick={submitService}
              disabled={!svcModal.editing?.name?.trim()}
              className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {svcModal.editing?.slug ? 'Save changes' : 'Add service'}
            </button>
          </>
        }
      >
        <ServiceForm
          value={svcModal.editing || emptyService}
          onPatch={(p) => setSvcModal((m) => ({ ...m, editing: { ...(m.editing || emptyService), ...p } }))}
        />
      </Modal>

      {/* -------- Add / edit fleet modal -------- */}
      <Modal
        open={fleetModal.open}
        onClose={() => setFleetModal({ open: false, editing: null })}
        title={fleetModal.editing ? `Edit vehicle: ${fleetModal.editing.name}` : 'Add a new fleet vehicle'}
        wide
        footer={
          <>
            <button onClick={() => setFleetModal({ open: false, editing: null })} className="rounded-full border border-accent-200 px-4 py-2 text-sm dark:border-accent-700">Cancel</button>
            <button
              onClick={submitFleet}
              disabled={!fleetModal.editing?.name?.trim()}
              className="rounded-full btn-brand-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {fleetModal.editing?.id ? 'Save changes' : 'Add vehicle'}
            </button>
          </>
        }
      >
        <FleetForm
          value={fleetModal.editing || emptyFleet}
          onPatch={(p) => setFleetModal((m) => ({ ...m, editing: { ...(m.editing || emptyFleet), ...p } }))}
        />
      </Modal>
    </div>
  );
}

function ServiceForm({ value, onPatch }: { value: any; onPatch: (p: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" hint="* required">
        <input value={value.name || ''} onChange={(e) => onPatch({ name: e.target.value })} className={INPUT} />
      </Field>
      <Field label="Short label" hint="badge on cards">
        <input value={value.short || ''} onChange={(e) => onPatch({ short: e.target.value })} className={INPUT} />
      </Field>
      <Field label="Icon">
        <select value={value.iconKey || 'airport'} onChange={(e) => onPatch({ iconKey: e.target.value })} className={INPUT}>
          {SERVICE_ICON_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Tagline">
        <input value={value.tagline || ''} onChange={(e) => onPatch({ tagline: e.target.value })} className={INPUT} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Summary">
          <textarea rows={4} value={value.summary || ''} onChange={(e) => onPatch({ summary: e.target.value })} className={INPUT} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Features" hint="one per line">
          <textarea
            rows={5}
            value={(value.features || []).join('\n')}
            onChange={(e) => onPatch({ features: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
            className={INPUT}
          />
        </Field>
      </div>
      <p className="text-xs text-muted sm:col-span-2">The URL slug is generated from the name automatically.</p>
    </div>
  );
}

function FleetForm({ value, onPatch }: { value: any; onPatch: (p: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Vehicle name" hint="* required">
        <input value={value.name || ''} onChange={(e) => onPatch({ name: e.target.value })} className={INPUT} />
      </Field>
      <Field label="Tag / badge" hint="e.g. Executive, Premium">
        <input value={value.tag || ''} onChange={(e) => onPatch({ tag: e.target.value })} className={INPUT} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Image URL or path" hint="/images/…, https://…">
          <input value={value.img || ''} onChange={(e) => onPatch({ img: e.target.value })} className={INPUT} />
        </Field>
      </div>
      <Field label="Passengers">
        <input value={value.passengers || ''} onChange={(e) => onPatch({ passengers: e.target.value })} className={INPUT} />
      </Field>
      <Field label="Luggage">
        <input value={value.luggage || ''} onChange={(e) => onPatch({ luggage: e.target.value })} className={INPUT} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Tagline">
          <input value={value.tagline || ''} onChange={(e) => onPatch({ tagline: e.target.value })} className={INPUT} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Perks" hint="comma separated">
          <input value={(value.perks || []).join(', ')} onChange={(e) => onPatch({ perks: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} className={INPUT} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Features" hint="one per line">
          <textarea
            rows={4}
            value={(value.features || []).join('\n')}
            onChange={(e) => onPatch({ features: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
            className={INPUT}
          />
        </Field>
      </div>
    </div>
  );
}