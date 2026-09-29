import ids from '../content/audio-index.json';
import {toLatin} from './catalog';

export const audioIds = ids as Record<string, string>;

/** Normalise whitespace, Unicode width, and the writing system for audio lookup. */
export function normalizeAudioText(text: string): string {
  return toLatin(text.normalize('NFKC')).replace(/\s+/g, ' ').trim();
}

const indexByCase = new Map<string, string>(
  Object.entries(audioIds).map(([text, id]) => [normalizeAudioText(text).toLocaleLowerCase('sr'), id]),
);

export function audioUrl(text: string): string | null {
  const clean = normalizeAudioText(text);
  const id = audioIds[clean] ?? indexByCase.get(clean.toLocaleLowerCase('sr'));
  return id ? `/audio/${id}.mp3` : null;
}

export function serbianVoice(): SpeechSynthesisVoice | undefined {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.getVoices().find(voice => /^sr(?:[_-]|$)/i.test(voice.lang))
    : undefined;
}
