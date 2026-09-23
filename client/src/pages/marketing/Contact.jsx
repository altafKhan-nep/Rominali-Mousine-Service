import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Phone, Clock, MapPin } from 'lucide-react';
import PageHero from '../../components/marketing/PageHero.jsx';
import Section from '../../components/marketing/Section.jsx';
import { SERVICES } from '../../data/services.js';
import { EMAIL, PHONE_TEL, PHONE_DISPLAY, PHONE_ALT_TEL, PHONE_ALT_DISPLAY, WHATSAPP } from '../../data/site.js';

const inputCls =
  'input-pill w-full border border-accent-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-accent-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Quote request — ${form.service || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nService: ${form.service}\nPreferred date: ${form.date}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div>
      <PageHero
        eyebrow="Get in touch"
        title="Our dispatch team is"
        accent="here for you"
        subtitle="Whether you need immediate executive transportation, a corporate account, or custom event routing — our 24/7 concierge dispatch is ready to assist."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="card-lift rounded-3xl bg-white p-8 ring-1 ring-accent-200/60 sm:p-10">
              <h2 className="text-2xl font-bold text-ink">Get a free quote</h2>
              <p className="mt-2 text-sm text-muted">
                Send us your message and our dispatch team will get right back to you.
              </p>

              {sent ? (
                <div className="mt-8 rounded-2xl bg-brand-gradient-soft p-6 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white">
                    <CheckCircle2 className="h-8 w-8 text-brand-600" />
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-brand-900">Almost there!</h3>
                  <p className="mt-2 text-sm text-brand-950/70">
                    Your email app should have opened with your request. Send it and we will be in
                    touch shortly. Prefer to talk now?
                  </p>
                  <a
                    href={PHONE_TEL}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-sm hover:bg-brand-50"
                  >
                    <Phone className="h-4 w-4" />
                    {PHONE_DISPLAY}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-name">Full name</label>
                      <input id="c-name" required value={form.name} onChange={set('name')} className={inputCls} placeholder="Jane Smith" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-phone">Phone</label>
                      <input id="c-phone" required value={form.phone} onChange={set('phone')} className={inputCls} placeholder="(240) 555-0123" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-email">Email</label>
                    <input id="c-email" type="email" required value={form.email} onChange={set('email')} className={inputCls} placeholder="jane@example.com" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-service">Service needed</label>
                      <select id="c-service" value={form.service} onChange={set('service')} className={inputCls}>
                        <option value="">Select a service…</option>
                        {SERVICES.map((s) => (
                          <option key={s.slug} value={s.name}>{s.name}</option>
                        ))}
                        <option value="Other">Other / not sure</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-date">Preferred date</label>
                      <input id="c-date" type="date" value={form.date} onChange={set('date')} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="c-message">Message</label>
                    <textarea id="c-message" rows={4} value={form.message} onChange={set('message')} className={inputCls} placeholder="Tell us about your trip…" />
                  </div>
                  <button
                    type="submit"
                    className="btn-brand-gradient w-full rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    Request my free quote
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-5 lg:col-span-2">
            <div className="card-lift rounded-3xl bg-white p-8 ring-1 ring-accent-200/60">
              <h3 className="text-base font-bold text-ink">Call or email</h3>
              <a href={PHONE_TEL} className="mt-4 block text-2xl font-extrabold text-brand-900">
                {PHONE_DISPLAY}
              </a>
              <a href={PHONE_ALT_TEL} className="mt-1 block text-lg font-bold text-brand-800">
                {PHONE_ALT_DISPLAY}
              </a>
              <a href={`mailto:${EMAIL}`} className="mt-2 block text-sm text-brand-700 underline-offset-2 hover:underline">
                {EMAIL}
              </a>
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
                Chat on WhatsApp
              </a>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Clock className="h-4 w-4 shrink-0" /> Available 24 hours a day, 7 days a week.
              </p>
            </div>

            <div className="card-lift rounded-3xl bg-white p-8 ring-1 ring-accent-200/60">
              <h3 className="text-base font-bold text-ink">Find us</h3>
              <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                Proudly serving Maryland, Virginia, Washington DC and Baltimore — door-to-door,
                local and long distance. Corporate headquarters in Maryland.
              </p>
              <p className="mt-3 text-sm text-muted">
                Office inquiries: <span className="font-semibold text-ink">8:00 AM – 8:00 PM</span>
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              <h3 className="relative text-base font-bold">Prefer to book online?</h3>
              <p className="relative mt-2 text-sm text-white/80">
                Skip the form — book your ride instantly with live availability and an upfront
                fare.
              </p>
              <Link
                to="/reservations"
                className="relative mt-5 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
              >
                Open the booking portal
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}