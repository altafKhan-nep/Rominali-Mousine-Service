import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Banknote, Lock, ShieldCheck } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { payRide, createPaymentIntent } from '../../services/paymentService.js';
import { getPublicSettings } from '../../services/settingsService.js';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Real online payments (Stripe) + cash. When Stripe isn't configured the card
// tab falls back to the sandbox simulator (card ending 0002 declines).
export default function PaymentModal({ ride, onClose, onPaid }) {
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });
  const [clientSecret, setClientSecret] = useState('');
  const [intentLoading, setIntentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [supportPhone, setSupportPhone] = useState('');

  const stripePromise = useMemo(
    () => (STRIPE_PK ? loadStripe(STRIPE_PK) : null),
    []
  );

  useEffect(() => {
    getPublicSettings()
      .then(({ data }) => {
        setDisabled(data.settings?.paymentsEnabled === false);
        setSupportPhone(data.settings?.supportPhone || '');
      })
      .catch(() => {});
  }, []);

  // Fetch a Stripe PaymentIntent the first time the card tab is shown.
  useEffect(() => {
    if (disabled || result || method !== 'card' || clientSecret || !STRIPE_PK) return;
    let cancelled = false;
    (async () => {
      setIntentLoading(true);
      setError('');
      try {
        const { data } = await createPaymentIntent(ride._id);
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not start checkout.');
      } finally {
        if (!cancelled) setIntentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [disabled, result, method, clientSecret, ride._id]);

  const last4 = card.number.replace(/\s/g, '').slice(-4);

  const sandboxSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{13,19}$/.test(card.number.replace(/\s/g, ''))) {
      setError('Enter a valid card number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await payRide(ride._id, {
        method: 'card',
        cardLast4: last4,
        idempotencyKey: `pay-${ride._id}-${Date.now()}`,
      });
      setResult(data.payment);
      if (data.payment.status === 'succeeded') onPaid?.(data.payment);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const payCash = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await payRide(ride._id, { method: 'cash' });
      setResult(data.payment);
      if (data.payment.status === 'cash') onPaid?.(data.payment);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record the cash payment.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const amount =
    ride.status === 'completed' ? ride.fare.final : ride.fare.estimated || 0;

  const METHOD_OPTIONS = [
    {
      id: 'card',
      icon: CreditCard,
      title: 'Card / online',
      desc: STRIPE_PK ? 'Secure card payment' : 'Pay now by card',
    },
    { id: 'cash', icon: Banknote, title: 'Cash', desc: 'Pay the driver at the end' },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-brand-950/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold">Pay for your ride</h2>
        <p className="mt-1 text-sm text-muted">
          ${amount.toFixed(2)} · {ride.pickup.address} → {ride.dropoff.address}
        </p>

        {disabled ? (
          <div className="mt-6">
            <div className="rounded-xl bg-gold-50 p-4 text-sm text-ink">
              <p className="font-semibold">Online payments are currently disabled</p>
              <p className="mt-1">
                Pay by cash at pickup, or call {supportPhone || 'support'} to arrange payment.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : result ? (
          <div className="mt-6">
            {result.status === 'cash' ? (
              <div className="rounded-xl bg-gold-50 p-4 text-sm text-ink">
                <p className="flex items-center gap-2 font-semibold">
                  <Banknote className="h-4 w-4 text-gold-500" /> Cash payment
                </p>
                <p className="mt-1">
                  No card was charged. Please pay <b>${result.amount.toFixed(2)}</b> in cash to
                  your driver at the end of your trip.
                </p>
              </div>
            ) : result.status === 'succeeded' ? (
              <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
                <p className="font-semibold">Payment succeeded</p>
                <p className="mt-1">Reference: {result.transactionId}</p>
                <p className="mt-1">A receipt has been sent to your email.</p>
              </div>
            ) : (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">Payment failed</p>
                <p className="mt-1">{result.failureReason || 'Try a different card.'}</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              {result.status === 'failed' && (
                <Button variant="secondary" onClick={() => setResult(null)}>Try again</Button>
              )}
              <Button className="flex-1" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="mt-5">
            {/* Method picker */}
            <div className="grid grid-cols-2 gap-3">
              {METHOD_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-all ${
                      active
                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'
                    }`}
                  >
                    <span className={`flex items-center gap-1.5 font-semibold ${active ? 'text-brand-700' : 'text-ink'}`}>
                      <Icon className="h-4 w-4" />
                      {opt.title}
                    </span>
                    <span className="text-xs text-muted">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {method === 'cash' ? (
              <div className="mt-5">
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-ink">
                  <p className="font-semibold">Pay in cash</p>
                  <p className="mt-1 text-muted">
                    No card charge now. Keep the exact amount ready and pay your driver in cash
                    when the trip ends.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button loading={loading} onClick={payCash} className="flex-1">
                    Confirm cash payment
                  </Button>
                </div>
              </div>
            ) : STRIPE_PK ? (
              <div className="mx-auto mt-5 w-full max-w-sm">
                {intentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  </div>
                ) : clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#d7332f',
                          colorBackground: '#ffffff',
                          colorText: '#0b0d0f',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          spacingUnit: '3px',
                          borderRadius: '10px',
                          tabBorderRadius: '10px',
                        },
                      },
                    }}
                  >
                    <StripeCardForm
                      amount={amount}
                      onDone={async (paymentIntentId) => {
                        setLoading(true);
                        try {
                          const { data } = await payRide(ride._id, {
                            method: 'card',
                            paymentIntentId,
                          });
                          setResult(data.payment);
                          if (data.payment.status === 'succeeded') onPaid?.(data.payment);
                        } catch (err) {
                          setError(err.response?.data?.message || 'Could not record the payment.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      onError={setError}
                      onCancel={onClose}
                    />
                  </Elements>
                ) : null}
                <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
                  <Lock className="h-3.5 w-3.5 text-brand-600" />
                  Secured by Stripe · test mode — use 4242 4242 4242 4242
                </p>
                <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  Your card details never touch our servers.
                </div>
              </div>
            ) : (
              <form onSubmit={sandboxSubmit} className="mt-5 space-y-4">
                <Input
                  label="Card number"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: formatNumber(e.target.value) })}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Expiry"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    required
                  />
                  <Input
                    label="CVC"
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    required
                  />
                </div>
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">
                  Sandbox checkout — no real charge. Cards ending in <b>0002</b> decline (for testing).
                </p>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Pay ${amount.toFixed(2)}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StripeCardForm({ amount, onDone, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) {
      onError(error.message || 'Payment could not be completed.');
      setProcessing(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      await onDone(paymentIntent.id);
    } else {
      onError('Payment not completed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PaymentElement options={{ layout: { type: 'tabs', defaultCollapsed: true } }} />
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={processing} className="flex-1">
          Pay ${amount.toFixed(2)}
        </Button>
      </div>
    </form>
  );
}