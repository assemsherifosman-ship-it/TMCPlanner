'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Live speech-to-text using the browser's Web Speech API (Chrome, Edge,
// Safari on iOS/macOS). Mobile browsers stop listening after a pause, so we
// restart automatically until the user taps stop.

type SR = any;

function getRecognitionCtor(): (new () => SR) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(lang: string) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const wantRef = useRef(false);
  const committedRef = useRef('');

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const startSession = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    // Results within one recognition session are cumulative; text from
    // previous (auto-restarted) sessions is kept in committedRef.
    let sessionFinal = '';
    rec.onresult = (e: any) => {
      let interim = '';
      sessionFinal = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) sessionFinal += r[0].transcript;
        else interim += r[0].transcript;
      }
      setFinalText(join(committedRef.current, sessionFinal));
      setInterimText(interim);
    };
    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access was blocked. Allow the microphone for this site and try again.');
      } else if (e.error === 'network') {
        setError('Speech recognition needs an internet connection.');
      } else {
        setError(`Speech recognition error: ${e.error}`);
      }
      wantRef.current = false;
    };
    rec.onend = () => {
      committedRef.current = join(committedRef.current, sessionFinal);
      setFinalText(committedRef.current);
      setInterimText('');
      if (wantRef.current) {
        try {
          startSession();
          return;
        } catch {
          /* fall through */
        }
      }
      wantRef.current = false;
      setListening(false);
    };
    recRef.current = rec;
    rec.start();
  }, [lang]);

  const start = useCallback(
    (existingText = '') => {
      setError(null);
      committedRef.current = existingText.trim();
      setFinalText(committedRef.current);
      setInterimText('');
      wantRef.current = true;
      setListening(true);
      try {
        startSession();
      } catch (e) {
        wantRef.current = false;
        setListening(false);
        setError('Could not start the microphone.');
      }
    },
    [startSession]
  );

  const stop = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      wantRef.current = false;
      recRef.current?.abort?.();
    },
    []
  );

  return { supported, listening, finalText, interimText, error, start, stop, setError };
}

function join(a: string, b: string) {
  const x = a.trim();
  const y = b.trim();
  return x && y ? `${x} ${y}` : x || y;
}
