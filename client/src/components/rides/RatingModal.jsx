import { useState } from 'react';
import { Star, Sparkles, Car, Briefcase, Smile, ShieldCheck } from 'lucide-react';
import { rateRide } from '../../services/rideService.js';

const COMPLIMENTS = [
  { id: 'clean', label: 'Clean Car', icon: Sparkles, desc: 'Spotless interior' },
  { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Courteous & on time' },
  { id: 'friendly', label: 'Friendly', icon: Smile, desc: 'Great conversation' },
  { id: 'safe', label: 'Safe Driving', icon: ShieldCheck, desc: 'Smooth & safe' },
];

export default function RatingModal({ ride, onClose, onRated }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [compliments, setCompliments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCompliment = (id) => {
    setCompliments(prev => prev.includes(id) ? prev.filter(c=>c!==id) : [...prev, id]);
  };

  const submit = async () => {
    if (!score) { setError('Please select a rating'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await rateRide(ride._id, { score, comment, compliments });
      onRated?.(data.ride || data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Could not submit rating');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-accent-900 max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-display mt-3 text-xl font-bold">Rate your ride</h3>
          <p className="mt-1 text-sm text-muted">How was your trip with {ride.driver?.name || 'your driver'}?</p>
          <p className="text-xs text-muted">{ride.pickup.address.slice(0,32)} → {ride.dropoff.address.slice(0,22)}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {[1,2,3,4,5].map(n=> (
            <button
              key={n}
              onMouseEnter={()=>setHover(n)}
              onMouseLeave={()=>setHover(0)}
              onClick={()=>setScore(n)}
              className={`grid h-11 w-11 place-items-center rounded-2xl transition-all ${n <= (hover||score) ? 'bg-brand-600 text-white shadow-md scale-105' : 'bg-accent-50 text-accent-400 hover:bg-accent-100 dark:bg-white/5'}`}
              aria-label={`${n} stars`}
            >
              <Star className={`h-6 w-6 ${n <= (hover||score) ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>
        {score >0 && <p className="mt-2 text-center text-sm font-medium text-brand-700">{score===5?'Excellent — 5 stars!':score===4?'Great — 4 stars':score===3?'Good — 3 stars':score===2?'Fair — 2 stars':'Poor — 1 star'}</p>}

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Compliments — tap to highlight</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {COMPLIMENTS.map(c=> {
              const Icon = c.icon;
              const selected = compliments.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={()=>toggleCompliment(c.id)}
                  className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition-all ${selected ? 'bg-brand-50 border-brand-200 shadow-sm dark:bg-brand-950 dark:border-brand-800' : 'bg-white border-accent-200 hover:bg-accent-50 dark:border-white/10 dark:bg-transparent'}`}
                >
                  <span className={`grid h-8 w-8 place-items-center rounded-xl ${selected ? 'bg-brand-600 text-white' : 'bg-accent-100 text-accent-600 dark:bg-white/5'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className={`block text-sm font-semibold ${selected ? 'text-brand-700 dark:text-white' : 'text-ink dark:text-white'}`}>{c.label}</span>
                    <span className="block text-xs text-muted">{c.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={e=>setComment(e.target.value)}
          placeholder="Add a comment (optional) — e.g., driver was very professional and on time"
          className="mt-4 min-h-20 w-full rounded-2xl border border-accent-200 bg-white p-3 text-sm placeholder:text-accent-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-transparent"
          maxLength={500}
        />

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-accent-200 bg-white py-2.5 text-sm font-semibold hover:bg-accent-50 dark:border-white/10 dark:bg-transparent dark:text-white">Skip</button>
          <button onClick={submit} disabled={loading || !score} className="flex-1 rounded-full btn-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit Rating'}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">Your rating updates the driver’s profile</p>
      </div>
    </div>
  );
}
