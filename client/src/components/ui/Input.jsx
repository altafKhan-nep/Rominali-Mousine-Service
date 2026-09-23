import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Input({ label, icon, error, showToggle = false, className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === 'password';
  const type = showToggle && isPassword && visible ? 'text' : props.type;

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          className={`input-pill w-full border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            icon ? 'pl-10' : ''
          } ${showToggle && isPassword ? 'pr-11' : ''} ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
          {...props}
          type={type}
        />
        {showToggle && isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-brand-600"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}