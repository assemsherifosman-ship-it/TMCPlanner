'use client';

import { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Attachment } from '@/lib/directline';

marked.setOptions({ gfm: true, breaks: true });

let hooked = false;
function sanitize(html: string) {
  if (!hooked && typeof window !== 'undefined') {
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(html);
}

export function Markdown({ text }: { text: string }) {
  const html = useMemo(() => sanitize(marked.parse(text, { async: false }) as string), [text]);
  return <div className='tmc-md' dangerouslySetInnerHTML={{ __html: html }} />;
}

export type CardSubmit = { data: any; title?: string };

export function AdaptiveCard({
  card,
  onSubmit,
  disabled,
}: {
  card: any;
  onSubmit: (s: CardSubmit) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const AC = await import('adaptivecards');
      if (cancelled || !ref.current) return;
      AC.GlobalSettings.setTabIndexAtCardRoot = false;
      const ac = new AC.AdaptiveCard();
      ac.hostConfig = new AC.HostConfig({
        fontFamily: 'inherit',
        spacing: { small: 4, default: 8, medium: 16, large: 20, extraLarge: 24, padding: 12 },
        containerStyles: {
          default: {
            backgroundColor: '#00000000',
            foregroundColors: {
              default: { default: '#1f2937', subtle: '#6b7280' },
              accent: { default: '#c2410c', subtle: '#ea580c' },
              attention: { default: '#b91c1c', subtle: '#dc2626' },
              good: { default: '#15803d', subtle: '#16a34a' },
              warning: { default: '#a16207', subtle: '#ca8a04' },
            },
          },
        },
        actions: { actionsOrientation: 'vertical', buttonSpacing: 8, showCard: { actionMode: 'inline' } },
      });
      ac.onExecuteAction = (action: any) => {
        if (action instanceof AC.OpenUrlAction) {
          window.open(action.url, '_blank', 'noopener,noreferrer');
        } else if (action instanceof AC.SubmitAction || action instanceof AC.ExecuteAction) {
          submitRef.current({ data: action.data ?? {}, title: action.title });
        }
      };
      ac.parse(card);
      const el = ac.render();
      ref.current.innerHTML = '';
      if (el) ref.current.appendChild(el);
    })().catch(() => {
      if (ref.current) ref.current.textContent = 'This card could not be displayed.';
    });
    return () => {
      cancelled = true;
    };
  }, [card]);

  return (
    <div
      ref={ref}
      className={`tmc-card ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      aria-disabled={disabled}
    />
  );
}

export function Attachments({
  attachments,
  onSubmit,
  disabled,
}: {
  attachments: Attachment[];
  onSubmit: (s: CardSubmit) => void;
  disabled?: boolean;
}) {
  return (
    <>
      {attachments.map((a, i) => {
        if (a.contentType === 'application/vnd.microsoft.card.adaptive') {
          return <AdaptiveCard key={i} card={a.content} onSubmit={onSubmit} disabled={disabled} />;
        }
        if (a.contentType?.startsWith('image/') && a.contentUrl) {
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={i} src={a.contentUrl} alt={a.name ?? ''} className='mt-2 max-w-full rounded-lg' />;
        }
        if (a.contentType === 'application/vnd.microsoft.card.hero' && a.content) {
          const c = a.content;
          return (
            <div key={i} className='mt-2 rounded-lg border border-slate-200 p-3'>
              {c.title && <div className='font-semibold'>{c.title}</div>}
              {c.subtitle && <div className='text-sm text-slate-500'>{c.subtitle}</div>}
              {c.text && <Markdown text={c.text} />}
              {(c.buttons ?? []).map((b: any, j: number) => (
                <button
                  key={j}
                  disabled={disabled}
                  onClick={() =>
                    b.type === 'openUrl'
                      ? window.open(b.value, '_blank', 'noopener,noreferrer')
                      : onSubmit({ data: b.value, title: b.title })
                  }
                  className='mt-2 block w-full rounded-lg border border-orange-300 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-50'
                >
                  {b.title}
                </button>
              ))}
            </div>
          );
        }
        if (a.contentUrl) {
          return (
            <a key={i} href={a.contentUrl} target='_blank' rel='noopener noreferrer' className='mt-2 block text-sm text-orange-700 underline'>
              {a.name || 'Open attachment'}
            </a>
          );
        }
        return null;
      })}
    </>
  );
}
