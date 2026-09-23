import { useState } from 'react';
import { BadgeDollarSign, Clock, Smartphone, Handshake, Trophy, ShieldCheck, Check, Mail, MailCheck } from 'lucide-react';
import PageHero from '../../components/marketing/PageHero.jsx';
import Section, { SectionHead } from '../../components/marketing/Section.jsx';
import IconTile from '../../components/marketing/IconTile.jsx';
import { EMAIL } from '../../data/site.js';

const PERKS = [
  { icon: BadgeDollarSign, title: 'Competitive earnings', desc: 'Strong per-ride payouts for professional chauffeurs serving MD, VA, and DC.' },
  { icon: Clock, title: 'Flexible hours', desc: 'Drive on your schedule — day, night or weekends.' },
  { icon: Smartphone, title: 'Your own fleet app', desc: 'Accept rides, navigate and track earnings from the driver app.' },
  { icon: Handshake, title: 'Professional support', desc: 'Backed by a 24/7 concierge dispatch and service team that has your back.' },
  { icon: Trophy, title: 'Chauffeur of the Month', desc: 'Top performers are recognized and rewarded for excellence.' },
  { icon: ShieldCheck, title: 'Safety first', desc: 'Vehicle standards, insurance and protocols that protect you and riders.' },
];

const REQUIREMENTS = [
  'Valid Maryland driver’s license',
  'Clean driving record (no major violations)',
  'Eligibility to work in the United States',
  'Background check & drug screening clearance',
  'Insurable personal or company vehicle in good condition',
  'Smartphone with data plan for the driver app',
  'Professional, courteous attitude — passenger satisfaction comes first',
];

const FIELDS = [
  { name: 'name', label: 'Name *', placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone *', placeholder: '(443) 000-0000' },
  { name: 'email', label: 'Email *', placeholder: 'you@example.com' },
  { name: 'subject', label: 'Subject *', placeholder: 'Driver application' },
];

export default function Careers() {
  const [form, setForm] = useState({});
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, phone, email, subject } = form;
    if (!name || !phone || !email || !subject) {
      setError('Please fill in all required fields.');
      return;
    }
    const body = encodeURIComponent(
      `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nSubject: ${form.subject}\n\nMessage:\n${form.message || ''}`
    );
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
      `${subject} — ${name}`
    )}&body=${body}`;
    setSent(true);
    setError('');
  };

  const field =
    'input-pill w-full border border-accent-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-accent-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

  return (
    <div>
      <PageHero
        eyebrow="Careers"
        title="Explore employment at"
        accent="Romina Limousine Service"
        subtitle="Join a growing team of professional chauffeurs who take pride in punctual, courteous and safe luxury service across Maryland, Virginia, and Washington DC."
      />

      {/* ============ PERKS ============ */}
      <Section>
        <SectionHead
          eyebrow="Why drive with us"
          title="Build your career on the road"
          sub="We invest in our chauffeurs because they are the face of Romina Limousine Service."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((p) => (
            <div key={p.title} className="card-lift rounded-3xl bg-white p-7 ring-1 ring-accent-200/60">
              <IconTile size="sm">
                <p.icon className="h-6 w-6 text-brand-700" />
              </IconTile>
              <h3 className="mt-4 text-base font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ REQUIREMENTS + FORM ============ */}
      <Section band>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          {/* Requirements */}
          <div>
            <span className="eyebrow">What we look for</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink">
              Driver requirements
            </h2>
            <p className="mt-4 text-muted">
              If you meet the requirements below, we would love to hear from you.
            </p>

            <ul className="mt-8 space-y-4">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-ink">{r}</span>
                </li>
              ))}
            </ul>

            <div className="card-lift mt-10 rounded-2xl bg-white p-6 ring-1 ring-accent-200/60">
              <h3 className="text-base font-bold text-ink">Prefer a paper application?</h3>
              <p className="mt-1.5 text-sm text-muted">
                Email us directly and we will send you the application form to fill in and return
                to our dispatch team.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`mailto:${EMAIL}?subject=Driver application`}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Mail className="h-4 w-4" />
                  Driver application
                </a>
                <a
                  href={`mailto:${EMAIL}?subject=Driver application`}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-600 px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  Apply now
                </a>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="card-lift rounded-3xl bg-white p-8 ring-1 ring-accent-200/60">
            <h2 className="text-2xl font-bold text-ink">Get in touch</h2>
            <p className="mt-1.5 text-sm text-muted">
              Tell us about yourself — our recruiting team responds within one business day.
            </p>

            {sent ? (
              <div className="mt-8 rounded-2xl bg-brand-50 p-6 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100">
                  <MailCheck className="h-7 w-7 text-brand-700" />
                </div>
                <h3 className="mt-2 text-lg font-bold text-brand-900">Thank you!</h3>
                <p className="mt-1 text-sm text-brand-700">
                  Your email draft has been opened in your mail app. Send it to{' '}
                  <span className="font-semibold">{EMAIL}</span> and we will be in
                  touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.slice(0, 2).map((f) => (
                    <input key={f.name} name={f.name} placeholder={f.placeholder} value={form[f.name] || ''} onChange={set(f.name)} className={field} />
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.slice(2).map((f) => (
                    <input key={f.name} name={f.name} placeholder={f.placeholder} value={form[f.name] || ''} onChange={set(f.name)} className={field} />
                  ))}
                </div>
                <textarea
                  name="message"
                  rows="4"
                  placeholder="Message *"
                  value={form.message || ''}
                  onChange={set('message')}
                  className="w-full rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-accent-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />

                {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

                <button
                  type="submit"
                  className="btn-brand-gradient w-full rounded-full px-6 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Send application
                </button>
                <p className="text-center text-xs text-muted">
                  Opens your email app addressed to {EMAIL}.
                </p>
              </form>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}