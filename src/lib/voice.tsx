import {createContext, useContext, useEffect, useRef, useState, type ReactNode} from 'react';
import {audioUrl, normalizeAudioText, serbianVoice} from './audio';

type AudioStatus = 'ready' | 'loading' | 'playing' | 'unavailable';
export type AudioContextValue = {
  play: (text: string) => Promise<void>;
  stop: () => void;
  current: string | null;
  status: AudioStatus;
  failedText: string | null;
  rate: number;
  setRate: (n: number) => void;
};

const Context = createContext<AudioContextValue | null>(null);

export function VoiceProvider({children}: {children: ReactNode}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestId = useRef(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [status, setStatus] = useState<AudioStatus>('ready');
  const [failedText, setFailedText] = useState<string | null>(null);
  const [rate, setRateState] = useState(1);
  const rateRef = useRef(1);

  // Invalidates any unfinished HTMLAudioElement.play() or error callback.
  const stop = () => {
    requestId.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
    setCurrent(null);
    setStatus('ready');
  };

  useEffect(() => () => {
    requestId.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const setRate = (next: number) => {
    const safeRate = Number.isFinite(next) ? Math.min(1.5, Math.max(0.5, next)) : 1;
    rateRef.current = safeRate;
    setRateState(safeRate);
    if (audioRef.current) audioRef.current.playbackRate = safeRate;
  };

  const play = async (text: string) => {
    const target = normalizeAudioText(text);
    if (!target) return;
    if (current === target && (status === 'playing' || status === 'loading')) {
      stop();
      return;
    }
    stop();
    const id = requestId.current;
    const isCurrent = () => requestId.current === id;
    setCurrent(target);
    setFailedText(null);
    setStatus('loading');

    let fallbackStarted = false;
    const fallback = () => {
      if (!isCurrent() || fallbackStarted) return;
      fallbackStarted = true;
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.pause();
        audioRef.current = null;
      }
      const voice = serbianVoice();
      if (!voice) {
        setCurrent(null);
        setFailedText(target);
        setStatus('unavailable');
        return;
      }
      const utterance = new SpeechSynthesisUtterance(target);
      utterance.lang = 'sr-RS';
      utterance.voice = voice;
      utterance.rate = rateRef.current;
      utterance.onend = () => {
        if (isCurrent()) { setCurrent(null); setStatus('ready'); }
      };
      utterance.onerror = () => {
        if (isCurrent()) { setCurrent(null); setFailedText(target); setStatus('unavailable'); }
      };
      speechRef.current = utterance;
      try {
        window.speechSynthesis.speak(utterance);
        if (isCurrent()) setStatus('playing');
      } catch {
        if (isCurrent()) { setCurrent(null); setFailedText(target); setStatus('unavailable'); }
      }
    };

    const url = audioUrl(target);
    if (!url) { fallback(); return; }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.playbackRate = rateRef.current;
    audio.onended = () => {
      if (isCurrent()) { audioRef.current = null; setCurrent(null); setStatus('ready'); }
    };
    audio.onerror = fallback;
    try {
      await audio.play();
      if (isCurrent() && !fallbackStarted) setStatus('playing');
    } catch {
      fallback();
    }
  };

  return <Context.Provider value={{play, stop, current, status, failedText, rate, setRate}}>{children}</Context.Provider>;
}

export function useVoice() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing VoiceProvider');
  return value;
}
