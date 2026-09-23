import { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import api from '../../services/api.js';
import { onChatMessage, offChatMessage } from '../../services/socketService.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function RideChat({ rideId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!rideId) return;
    const fetchMessages = () => api.get(`/rides/${rideId}/messages`).then(({ data }) => setMessages(data.messages || [])).catch(()=>{});
    fetchMessages();
    const id = setInterval(fetchMessages, 5000); // polling fallback for live chat
    const handler = (msg) => {
      if (String(msg.rideId) === String(rideId)) setMessages(prev=> prev.some(p=> p.text===msg.text && String(p.sender)===String(msg.sender) && Math.abs(new Date(p.at).getTime() - new Date(msg.at).getTime())<2000) ? prev : [...prev, msg]);
    };
    onChatMessage(handler);
    return ()=> { offChatMessage(); clearInterval(id); };
  }, [rideId]);

  useEffect(()=> {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    const optimistic = { sender: user?._id, text: trimmed, at: new Date().toISOString(), senderRole: user?.role, rideId };
    setMessages(prev=> [...prev, optimistic]);
    setText('');
    try {
      await api.post(`/rides/${rideId}/messages`, { text: trimmed });
    } catch (err) {
      setMessages(prev=> prev.filter(m=> m !== optimistic));
      // show error via polling will recover
    } finally { setSending(false); }
  };

  return (
    <div className="flex h-[380px] flex-col overflow-hidden rounded-3xl border border-accent-200 bg-white shadow-sm dark:border-white/10 dark:bg-accent-900">
      <div className="flex items-center gap-2 border-b border-accent-100 px-4 py-3 dark:border-white/5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-white/5"><MessageCircle className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-semibold dark:text-white">Live Chat</p>
          <p className="text-xs text-muted">Messages stay in ride room • 500 chars</p>
        </div>
        <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-green-500" />
      </div>

      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-accent-50/30 p-4 dark:bg-black/20">
        {messages.length===0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">No messages yet — say hi to your driver 👋</p>
            <p className="text-xs text-muted">Try: “I’m at the front entrance”</p>
          </div>
        ) : messages.map((m,i)=> {
          const mine = String(m.sender) === String(user?._id);
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-white dark:bg-white/10 dark:text-white border border-accent-200 dark:border-white/5'}`}>
                <p>{m.text}</p>
                <p className={`mt-1 text-xs ${mine ? 'text-white/70' : 'opacity-60'}`}>{new Date(m.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} • {mine ? 'You' : m.senderRole || 'ride'}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-accent-100 bg-white p-3 dark:border-white/5 dark:bg-accent-900">
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          placeholder="Message your driver…"
          maxLength={500}
          className="input-pill flex-1 border border-accent-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-white/10 dark:bg-transparent dark:text-white"
        />
        <button type="submit" disabled={sending || !text.trim()} className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-white shadow-md hover:bg-brand-700 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
