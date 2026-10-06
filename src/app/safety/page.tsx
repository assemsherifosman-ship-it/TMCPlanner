'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DirectLineClient, type Activity, type CardAction } from '@/lib/directline';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { Attachments, Markdown, type CardSubmit } from '@/components/safety/AgentContent';

type Msg = {
  key: string;
  role: 'user' | 'agent';
  text?: string;
  attachments?: Activity['attachments'];
  suggestedActions?: CardAction[];
  speak?: string;
  time: Date;
  status?: 'sending' | 'sent' | 'failed';
  value?: any;
};

type Status = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline' | 'error';

const LANGS = [
  { code: 'en-US', label: 'English' },
  { code: 'es-US', label: 'Español' },
  { code: 'pt-BR', label: 'Português' },
  { code: 'fr-CA', label: 'Français' },
];

function load(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
function userIdFor() {
  let id = load('tmc.userId', '');
  if (!/^dl_[\w-]+$/.test(id)) {
    id = `dl_${crypto.randomUUID()}`;
    save('tmc.userId', id);
  }
  return id;
}
function plain(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>`|]/g, '')
    .replace(/\[\d+\]/g, '');
}
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function SafetyPlanningPage() {
  const [name, setName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [lang, setLang] = useState('en-US');
  const [readAloud, setReadAloud] = useState(false);
  const [ready, setReady] = useState(false);

  const [status, setStatus] = useState<Status>('idle');
  const [banner, setBanner] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [agentTyping, setAgentTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const clientRef = useRef<DirectLineClient | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const readAloudRef = useRef(readAloud);
  readAloudRef.current = readAloud;
  const langRef = useRef(lang);
  langRef.current = lang;

  const speech = useSpeechRecognition(lang);
  const hasName = !!name;

  // ── preferences ───────────────────────────────────────────────────────────
  useEffect(() => {
    setName(load('tmc.name', ''));
    setNameDraft(load('tmc.name', ''));
    setLang(load('tmc.lang', 'en-US'));
    setReadAloud(load('tmc.readAloud', '0') === '1');
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    save('tmc.lang', lang);
    save('tmc.readAloud', readAloud ? '1' : '0');
  }, [lang, readAloud, ready]);

  // ── agent connection ──────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!readAloudRef.current || typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(plain(text));
    u.lang = langRef.current;
    window.speechSynthesis.speak(u);
  }, []);

  const onActivity = useCallback(
    (a: Activity) => {
      const client = clientRef.current;
      if (!client || a.from?.id === client.userId) return; // our own echo
      if (a.type === 'typing') {
        setAgentTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setAgentTyping(false), 8000);
        return;
      }
      if (a.type !== 'message') return;
      if (!a.text && !a.attachments?.length && !a.suggestedActions?.actions?.length) return;
      setAgentTyping(false);
      setMessages((m) => [
        ...m,
        {
          key: a.id ?? crypto.randomUUID(),
          role: 'agent',
          text: a.text,
          attachments: a.attachments,
          suggestedActions: a.suggestedActions?.actions,
          time: a.timestamp ? new Date(a.timestamp) : new Date(),
        },
      ]);
      if (a.text) speak(a.text);
    },
    [speak]
  );

  const connect = useCallback(async () => {
    clientRef.current?.end();
    setMessages([]);
    setBanner(null);
    setAgentTyping(false);
    setStatus('connecting');
    const client = new DirectLineClient(
      {
        onActivity,
        onStatus: (s) => setStatus(s),
        onError: (msg) => setBanner(msg),
      },
      userIdFor(),
      load('tmc.name', '') || undefined
    );
    clientRef.current = client;
    try {
      await client.start(langRef.current);
      setAgentTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setAgentTyping(false), 8000);
    } catch (e) {
      if (clientRef.current !== client) return;
      setStatus('error');
      setBanner((e as Error).message);
    }
  }, [onActivity]);

  useEffect(() => {
    if (ready && hasName) connect();
    return () => clientRef.current?.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hasName]);

  // ── voice → draft ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (speech.listening) setDraft(speech.finalText);
  }, [speech.finalText, speech.listening]);

  useEffect(() => {
    if (!speech.listening) {
      setElapsed(0);
      return;
    }
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(iv);
  }, [speech.listening]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, agentTyping, speech.interimText]);

  // ── sending ───────────────────────────────────────────────────────────────
  const send = useCallback(async (text: string, value?: any, label?: string) => {
    const client = clientRef.current;
    const body = text.trim();
    if (!client || (!body && value === undefined)) return;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    const key = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      { key, role: 'user', text: body || label || 'Submitted form', time: new Date(), status: 'sending', value },
    ]);
    try {
      await client.sendText(body, langRef.current, value);
      setMessages((m) => m.map((x) => (x.key === key ? { ...x, status: 'sent' } : x)));
      setAgentTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setAgentTyping(false), 15000);
    } catch (e) {
      setMessages((m) => m.map((x) => (x.key === key ? { ...x, status: 'failed' } : x)));
      setBanner((e as Error).message);
    }
  }, []);

  const retry = (msg: Msg) => {
    setMessages((m) => m.filter((x) => x.key !== msg.key));
    send(msg.value !== undefined ? '' : msg.text ?? '', msg.value, msg.text);
  };

  const submitDraft = () => {
    if (speech.listening) speech.stop();
    const text = draft;
    setDraft('');
    send(text);
  };

  const toggleMic = () => {
    if (speech.listening) speech.stop();
    else {
      window.speechSynthesis?.cancel();
      speech.start(draft);
    }
  };

  const onCardSubmit = (s: CardSubmit) => {
    if (typeof s.data === 'string') send(s.data);
    else send('', s.data, s.title);
  };

  const onSuggested = (a: CardAction) => {
    if (a.type === 'openUrl') window.open(a.value, '_blank', 'noopener,noreferrer');
    else if (a.type === 'postBack' || a.type === 'messageBack')
      send(a.text ?? (typeof a.value === 'string' ? a.value : ''), typeof a.value === 'string' ? undefined : a.value, a.displayText ?? a.title);
    else send(typeof a.value === 'string' ? a.value : a.title ?? '');
  };

  const exportTranscript = () => {
    const lines = [
      `TMC Pre-Task Planning — ${new Date().toLocaleString()}`,
      `Team member: ${name}`,
      '',
      ...messages.map(
        (m) => `[${fmtTime(m.time)}] ${m.role === 'user' ? name || 'Team member' : 'Safety Agent'}: ${m.text ?? '(card)'}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre-task-plan-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveName = () => {
    const n = nameDraft.trim();
    if (!n) return;
    save('tmc.name', n);
    if (n !== name) setName(n);
    setShowSettings(false);
  };

  const lastAgentIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'agent') return i;
    return -1;
  })();
  const canSend = status === 'online' || status === 'reconnecting';
  const mm = String(Math.floor(elapsed / 60)).padStart(1, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  // ── first run: ask for name ───────────────────────────────────────────────
  if (ready && !name) {
    return (
      <main className='tmc-shell flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
          className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg'
        >
          <div className='mb-4 flex items-center gap-3'>
            <Logo />
            <div>
              <h1 className='text-lg font-bold text-slate-900'>Pre-Task Planning</h1>
              <p className='text-sm text-slate-500'>TMC Safety Agent</p>
            </div>
          </div>
          <label className='mb-1 block text-sm font-medium text-slate-700' htmlFor='name'>
            Your name
          </label>
          <input
            id='name'
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder='e.g. Jordan Smith'
            className='mb-4 w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
          />
          <label className='mb-1 block text-sm font-medium text-slate-700' htmlFor='lang'>
            Speaking language
          </label>
          <select
            id='lang'
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className='mb-6 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base'
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            type='submit'
            disabled={!nameDraft.trim()}
            className='w-full rounded-xl bg-orange-600 py-3 text-base font-semibold text-white disabled:opacity-40'
          >
            Start pre-task plan
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className='tmc-shell flex h-[100dvh] flex-col bg-slate-100'>
      {/* Header */}
      <header className='flex items-center gap-3 bg-slate-900 px-4 py-3 text-white shadow'>
        <Logo />
        <div className='min-w-0 flex-1'>
          <h1 className='truncate text-base font-bold leading-tight'>Pre-Task Planning</h1>
          <div className='flex items-center gap-1.5 text-xs text-slate-300'>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                status === 'online'
                  ? 'bg-emerald-400'
                  : status === 'connecting' || status === 'reconnecting'
                    ? 'animate-pulse bg-amber-400'
                    : 'bg-red-400'
              }`}
            />
            {status === 'online'
              ? 'Safety Agent connected'
              : status === 'connecting'
                ? 'Connecting…'
                : status === 'reconnecting'
                  ? 'Reconnecting…'
                  : 'Not connected'}
          </div>
        </div>
        <IconButton label='Download transcript' onClick={exportTranscript} disabled={!messages.length}>
          <path d='M12 3v12m0 0l-4-4m4 4l4-4M4 19h16' />
        </IconButton>
        <IconButton
          label='New pre-task plan'
          onClick={() => {
            if (!messages.length || confirm('Start a new pre-task plan? The current conversation will be cleared.')) connect();
          }}
        >
          <path d='M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0011.9 2.5M18.5 9A7 7 0 006.6 6.5' />
        </IconButton>
        <IconButton label='Settings' onClick={() => setShowSettings((s) => !s)}>
          <path d='M12 15a3 3 0 100-6 3 3 0 000 6z' />
          <path d='M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z' />
        </IconButton>
      </header>

      {showSettings && (
        <div className='border-b border-slate-200 bg-white px-4 py-3 text-sm shadow-sm'>
          <div className='mx-auto grid max-w-2xl gap-3 sm:grid-cols-3 sm:items-end'>
            <label className='block'>
              <span className='mb-1 block font-medium text-slate-700'>Name</span>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className='w-full rounded-lg border border-slate-300 px-3 py-2'
              />
            </label>
            <label className='block'>
              <span className='mb-1 block font-medium text-slate-700'>Speaking language</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2'
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
            <label className='flex items-center gap-2 py-2'>
              <input
                type='checkbox'
                checked={readAloud}
                onChange={(e) => setReadAloud(e.target.checked)}
                className='h-5 w-5 accent-orange-600'
              />
              <span className='font-medium text-slate-700'>Read replies aloud</span>
            </label>
          </div>
        </div>
      )}

      {banner && (
        <div className='flex items-start gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800'>
          <span className='flex-1'>{banner}</span>
          {status === 'error' && (
            <button onClick={connect} className='font-semibold underline'>
              Retry
            </button>
          )}
          <button onClick={() => setBanner(null)} aria-label='Dismiss' className='font-bold'>
            ×
          </button>
        </div>
      )}

      {/* Conversation */}
      <div ref={scrollRef} className='flex-1 overflow-y-auto px-4 py-4'>
        <div className='mx-auto flex max-w-2xl flex-col gap-3'>
          {messages.length === 0 && status !== 'error' && (
            <div className='mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center text-sm text-slate-600'>
              <p className='mb-1 font-semibold text-slate-800'>How it works</p>
              <p>
                Tap the <b>microphone</b> and describe today&apos;s task — the work, location, crew, equipment and
                hazards. Review the transcript, then send it to the Safety Agent. Answer its follow-up questions the
                same way.
              </p>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={m.key} className='flex flex-col items-end'>
                <div className='max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-orange-600 px-4 py-2.5 text-[15px] text-white shadow-sm'>
                  {m.text}
                </div>
                <div className='mt-1 text-[11px] text-slate-500'>
                  {m.status === 'sending' ? (
                    'Sending…'
                  ) : m.status === 'failed' ? (
                    <button onClick={() => retry(m)} className='font-semibold text-red-600 underline'>
                      Not sent — tap to retry
                    </button>
                  ) : (
                    fmtTime(m.time)
                  )}
                </div>
              </div>
            ) : (
              <div key={m.key} className='flex flex-col items-start'>
                <div className='mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
                  Safety Agent · {fmtTime(m.time)}
                  {m.text && typeof window !== 'undefined' && 'speechSynthesis' in window && (
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance(plain(m.text!));
                        u.lang = lang;
                        window.speechSynthesis.speak(u);
                      }}
                      className='ml-1 rounded px-1 text-slate-400 hover:text-slate-700'
                      aria-label='Read aloud'
                      title='Read aloud'
                    >
                      🔊
                    </button>
                  )}
                </div>
                <div className='w-full max-w-[92%] break-words rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 shadow-sm'>
                  {m.text && <Markdown text={m.text} />}
                  {!!m.attachments?.length && (
                    <Attachments attachments={m.attachments} onSubmit={onCardSubmit} disabled={!canSend} />
                  )}
                </div>
                {i === lastAgentIdx && !!m.suggestedActions?.length && (
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {m.suggestedActions.map((a, j) => (
                      <button
                        key={j}
                        disabled={!canSend}
                        onClick={() => onSuggested(a)}
                        className='rounded-full border border-orange-300 bg-white px-3 py-1.5 text-sm font-medium text-orange-800 shadow-sm hover:bg-orange-50 disabled:opacity-50'
                      >
                        {a.title ?? a.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {agentTyping && (
            <div className='flex items-center gap-1 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
              <span className='tmc-dot' />
              <span className='tmc-dot [animation-delay:150ms]' />
              <span className='tmc-dot [animation-delay:300ms]' />
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <footer className='border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3'>
        <div className='mx-auto max-w-2xl'>
          {speech.error && (
            <div className='mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900'>{speech.error}</div>
          )}
          {!speech.supported && (
            <div className='mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900'>
              Voice recording isn&apos;t supported in this browser. Use Chrome, Edge or Safari, or type below.
            </div>
          )}
          {speech.listening && (
            <div className='mb-2 flex items-center gap-2 text-sm font-medium text-red-600'>
              <span className='inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-600' />
              Recording {mm}:{ss} — tap the mic again when you&apos;re done
            </div>
          )}
          <div className='flex items-end gap-2'>
            <button
              onClick={toggleMic}
              disabled={!speech.supported || !canSend}
              aria-label={speech.listening ? 'Stop recording' : 'Start recording'}
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition disabled:opacity-40 ${
                speech.listening ? 'tmc-rec bg-red-600' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {speech.listening ? (
                <svg viewBox='0 0 24 24' className='h-6 w-6' fill='currentColor'>
                  <rect x='6' y='6' width='12' height='12' rx='2' />
                </svg>
              ) : (
                <svg viewBox='0 0 24 24' className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
                  <rect x='9' y='3' width='6' height='11' rx='3' />
                  <path d='M5 11a7 7 0 0014 0M12 18v3' />
                </svg>
              )}
            </button>
            <div className='relative flex-1'>
              <textarea
                value={speech.listening && speech.interimText ? `${draft} ${speech.interimText}`.trim() : draft}
                onChange={(e) => setDraft(e.target.value)}
                readOnly={speech.listening}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
                    e.preventDefault();
                    if (draft.trim() && canSend) submitDraft();
                  }
                }}
                rows={draft.length > 80 || speech.listening ? 4 : 2}
                placeholder={speech.listening ? 'Listening…' : 'Tap the mic and speak, or type here…'}
                className={`block w-full resize-none rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 ${
                  speech.listening ? 'border-red-300 bg-red-50/40' : 'border-slate-300'
                }`}
              />
            </div>
            <button
              onClick={submitDraft}
              disabled={!draft.trim() || !canSend}
              aria-label='Send to Safety Agent'
              className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-md transition hover:bg-orange-700 disabled:opacity-40'
            >
              <svg viewBox='0 0 24 24' className='h-6 w-6' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M5 12h14M13 6l6 6-6 6' />
              </svg>
            </button>
          </div>
          {!speech.listening && draft.trim() && (
            <div className='mt-1.5 flex justify-between px-1 text-xs text-slate-500'>
              <span>Review or edit the transcript, then send.</span>
              <button onClick={() => setDraft('')} className='font-medium underline'>
                Clear
              </button>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white'>
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z' />
        <path d='M8.5 12l2.5 2.5 4.5-5' />
      </svg>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className='flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 disabled:opacity-30'
    >
      <svg viewBox='0 0 24 24' className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        {children}
      </svg>
    </button>
  );
}
