import { useEffect, useRef, useState } from 'react';

export const MAP_VIEWS = [
  {
    id: 'streets',
    label: 'Streets',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abc',
    swatch: (
      <span className="block h-9 w-9 rounded-lg bg-[#ecebe6] [background-image:linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff,#ffffff)] [background-size:100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px] [background-position:0_4px,0_16px,0_28px,4px_0,16px_0,28px_0,0_24px,22px_8px] [background-repeat:no-repeat]" />
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    swatch: (
      <span className="block h-9 w-9 rounded-lg bg-[#16181d] [background-image:linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36),linear-gradient(#2a2e36,#2a2e36)] [background-size:100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px,100%_5px] [background-position:0_4px,0_16px,0_28px,4px_0,16px_0,28px_0,0_24px,22px_8px] [background-repeat:no-repeat]" />
    ),
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>',
    subdomains: '',
    swatch: (
      <span className="relative block h-9 w-9 overflow-hidden rounded-lg">
        <span className="absolute inset-0 [background-image:linear-gradient(135deg,#3f6b3a_0%,#5a8a47_45%,#6b9549_60%,#9aa44c_100%)]" />
        <span className="absolute left-0 top-1 h-2 w-full bg-[#6b9c5a]" />
        <span className="absolute left-2 top-4 h-3.5 w-3.5 rounded-sm bg-[#7fb0b8]" />
        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-sm bg-[#aabf68]" />
      </span>
    ),
  },
];

function LayersIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="currentColor" opacity="0.45" />
      <path d="m3 12 9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 16.5 9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MapViewSelector({ view, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="absolute bottom-3 right-3 z-[1000]">
      <button
        type="button"
        aria-label="Map views"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all ${
          open
            ? 'bg-brand-900 text-white ring-4 ring-brand-200'
            : 'bg-white text-brand-900 ring-1 ring-slate-200 hover:bg-brand-50'
        }`}
      >
        <LayersIcon className="h-5.5 w-5.5" />
      </button>

      {open && (
        <div className="absolute bottom-14 right-0 w-44 origin-bottom-right rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200">
          {MAP_VIEWS.map((v) => {
            const active = v.id === view;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors ${
                  active ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200">{v.swatch}</span>
                <span className={`flex-1 text-sm font-medium ${active ? 'text-brand-900' : 'text-ink'}`}>
                  {v.label}
                </span>
                {active && <CheckIcon className="h-4 w-4 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
