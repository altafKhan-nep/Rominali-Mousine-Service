import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRides } from '../../services/rideService.js';
import { vehicleLabel } from '../../data/vehicles.js';
import { Spinner } from '../../components/ui/Spinner.jsx';
import PaymentModal from '../../components/rides/PaymentModal.jsx';
import EditRideModal from '../../components/rides/EditRideModal.jsx';
import RatingModal from '../../components/rides/RatingModal.jsx';
import { requestRefund, listPayments } from '../../services/paymentService.js';

const STATUS_STYLE = {
  pending: 'bg-accent-50 text-accent-700',
  accepted: 'bg-blue-50 text-blue-700',
  arriving: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-brand-50 text-brand-700',
  completed: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const PAY_STYLE = {
  paid: 'bg-green-50 text-green-700',
  cash: 'bg-gold-100 text-gold-700',
  refunded: 'bg-blue-50 text-blue-700',
  pending: 'bg-yellow-50 text-yellow-700',
};

export default function RideHistory() {
  const [rides, setRides] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(null);
  const [editing, setEditing] = useState(null);
  const [refundRide, setRefundRide] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMsg, setRefundMsg] = useState('');
  const [ratingRide, setRatingRide] = useState(null);

  const load = () =>
    listRides()
      .then(({ data }) => setRides(data.rides))
      .catch(() => setError('Could not load ride history'));

  useEffect(() => {
    load();
  }, []);

  if (error) return <p className="px-4 py-16 text-center text-muted">{error}</p>;
  if (!rides)
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner label="Loading rides…" />
      </div>
    );

  const patch = (id, fn) => setRides((prev) => prev.map((r) => (r._id === id ? fn(r) : r)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl bg-brand-gradient-soft p-6 dark:bg-accent-900">
        <h1 className="font-display text-2xl font-bold">Your rides</h1>
        <p className="mt-1 text-sm text-muted">Past and upcoming • Tap to rebook, view receipt, chat</p>
      </div>

      {rides.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-muted">No rides yet.</p>
          <Link
            to="/"
            className="mt-3 inline-block font-semibold text-brand-700 hover:underline"
          >
            Book your first ride
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rides.map((r) => (
            <div
              key={r._id}
              className="card-lift rounded-3xl border border-accent-200 bg-white p-5 shadow-sm dark:bg-accent-900 dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[r.status]}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                    {r.status === 'completed' && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.payment?.status === 'paid' && r.payment?.method === 'cash' ? PAY_STYLE.cash : PAY_STYLE[r.payment?.status] || PAY_STYLE.pending}`}>
                        {r.payment?.status === 'paid' ? r.payment?.method === 'cash' ? 'Cash' : 'Paid' : r.payment?.status === 'refunded' ? 'Refunded' : 'Unpaid'}
                      </span>
                    )}
                    <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()} • {r.fare.distanceKm}km • {r.fare.durationMin}min</span>
                    {r.driver && <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs dark:bg-white/5"><span className="h-6 w-6 rounded-full bg-brand-50 grid place-items-center text-xs font-bold text-brand-700">{r.driver?.name?.[0]}</span>{r.driver?.name}</span>}
                  </div>
                  <p className="mt-2 flex items-center gap-1 truncate text-sm font-medium dark:text-white"><span className="h-2 w-2 rounded-full bg-green-500" />{r.pickup.address}</p>
                  <p className="truncate text-sm text-muted">→ {r.dropoff.address}</p>
                  {r.status === 'completed' && r.rating?.score && <p className="mt-1 text-xs">Rated ★ {r.rating.score} • {r.rating.comment || 'No comment'} • {r.rating.compliments?.join(' • ')}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-display font-bold text-brand-700 dark:text-white">${(r.status === 'completed' ? r.fare.final : r.fare.estimated || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted">{vehicleLabel(r.vehicleType)} • {r.passengerCount} pax</p>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {['pending', 'accepted', 'arriving', 'in_progress'].includes(r.status) && (
                      <Link to={`/rides/track/${r._id}`} className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">Track • Live Chat</Link>
                    )}
                    {r.status === 'pending' && (
                      <button onClick={() => setEditing(r)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">Edit</button>
                    )}
                    {r.status === 'completed' && r.payment?.status === 'pending' && (
                      <button onClick={() => setPaying(r)} className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">Pay</button>
                    )}
                    {r.status === 'completed' && r.payment?.status === 'paid' && r.payment?.method !== 'cash' && !r.rating?.score && (
                      <button onClick={() => { setRefundRide(r); setRefundReason(''); setRefundMsg(''); }} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Request Refund</button>
                    )}
                    {r.status === 'completed' && !r.rating?.score && (
                      <button onClick={() => setRatingRide(r)} className="rounded-full btn-brand-gradient px-3 py-1.5 text-xs font-semibold text-white">Rate ★</button>
                    )}
                    {r.rating?.score && (
                      <span className="rounded-full bg-gold-50 px-3 py-1.5 text-xs font-semibold text-gold-700">★ {r.rating.score}</span>
                    )}
                    <Link to={`/rides/track/${r._id}`} className="rounded-full border border-accent-200 px-3 py-1.5 text-xs font-semibold hover:bg-accent-50 dark:border-white/10">Receipt</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {paying && (
        <PaymentModal
          ride={paying}
          onClose={() => setPaying(null)}
          onPaid={(payment) => {
            patch(paying._id, (r) => ({
              ...r,
              payment: {
                ...r.payment,
                status: 'paid',
                method: payment.method,
                transactionId: payment.transactionId,
              },
            }));
          }}
        />
      )}

      {editing && (
        <EditRideModal
          ride={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => patch(editing._id, () => updated)}
        />
      )}

      {refundRide && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold">Request Refund — ${refundRide.fare.final?.toFixed(2) || refundRide.fare.estimated.toFixed(2)}</h3>
            <p className="mt-1 text-sm text-muted">For ride to {refundRide.dropoff.address.slice(0,40)} • Only admin can approve. You’ll be notified of the decision.</p>
            <textarea
              value={refundReason}
              onChange={e=>setRefundReason(e.target.value)}
              placeholder="Reason — e.g., driver was late, wrong fare, duplicate charge"
              className="mt-4 min-h-24 w-full rounded-2xl border border-accent-200 p-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
            {refundMsg && <p className="mt-2 text-sm text-brand-700">{refundMsg}</p>}
            <div className="mt-4 flex gap-2">
              <button onClick={()=>setRefundRide(null)} className="flex-1 rounded-full border border-accent-200 py-2.5 text-sm font-semibold hover:bg-accent-50">Cancel</button>
              <button
                disabled={refundLoading || !refundReason.trim()}
                onClick={async()=>{
                  setRefundLoading(true); setRefundMsg('');
                  try{
                    const { data: payData } = await listPayments();
                    const payment = (payData.payments||[]).find((p)=> String(p.ride?._id||p.ride)===String(refundRide._id) && p.status==='succeeded');
                    if(!payment){ setRefundMsg('No successful payment found for this ride'); setRefundLoading(false); return; }
                    await requestRefund(payment._id, refundReason);
                    setRefundMsg('Request sent — admin will review in Support → Refunds');
                    setTimeout(()=>setRefundRide(null),1500);
                  }catch(e){ setRefundMsg(e.response?.data?.message || 'Could not request refund'); }
                  finally{ setRefundLoading(false); }
                }}
                className="flex-1 rounded-full btn-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {refundLoading?'Sending...':'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ratingRide && (
        <RatingModal
          ride={ratingRide}
          onClose={()=>setRatingRide(null)}
          onRated={(updatedRide)=> {
            patch(ratingRide._id, ()=> updatedRide);
            setRatingRide(null);
          }}
        />
      )}
    </div>
  );
}
