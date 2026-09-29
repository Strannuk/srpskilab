import {describe, expect, it} from 'vitest';
import {audioUrl, normalizeAudioText} from '../src/lib/audio';
import {dictionary, toCyr} from '../src/lib/catalog';
import {studyProgram} from '../src/lib/study';

describe('SrpskiLab audio coverage', () => {
  it('normalises Latin and Serbian Cyrillic to the same MP3', () => {
    expect(normalizeAudioText('  Вода  ')).toBe('Voda');
    expect(audioUrl('voda')).toBe(audioUrl('Voda'));
    expect(audioUrl('Вода')).toBe(audioUrl('Voda'));
    expect(audioUrl(toCyr('Dobro jutro'))).toBe(audioUrl('Dobro jutro'));
  });
  it('covers every dictionary word and usage example', () => {
    expect(dictionary).toHaveLength(769);
    for (const word of dictionary) {
      expect(audioUrl(word.sr), `${word.id}: ${word.sr}`).toMatch(/^\/audio\/[0-9a-f]{20}\.mp3$/);
      if (word.usage) expect(audioUrl(word.usage), word.usage).not.toBeNull();
    }
  });
  it('covers all 265 learning dialogue lines and listening prompts', () => {
    expect(studyProgram).toHaveLength(265);
    for (const unit of studyProgram) {
      for (const turn of unit.dialogue.turns) expect(audioUrl(turn.sr), `${unit.id} ${turn.sr}`).not.toBeNull();
      expect(audioUrl(unit.listening.sr), `${unit.id} listening`).not.toBeNull();
    }
  });
});
