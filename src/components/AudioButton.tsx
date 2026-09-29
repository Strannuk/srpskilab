import {Volume2, Pause, VolumeX} from 'lucide-react';
import {useVoice} from '../lib/voice';
import {normalizeAudioText} from '../lib/audio';

export function AudioButton({text, small = false}: {text: string; small?: boolean}) {
  const {play, current, status, failedText} = useVoice();
  const normalized = normalizeAudioText(text);
  const active = current === normalized;
  const failed = status === 'unavailable' && failedText === normalized;
  const listening = active && status === 'playing';
  return <button
    type="button"
    className={`audio-btn ${small ? 'small' : ''} ${active ? 'playing' : ''}`}
    title={failed ? 'Не удалось воспроизвести запись. Проверь соединение и попробуй ещё раз.' : listening ? 'Остановить запись' : 'Прослушать на сербском'}
    aria-label={`${listening ? 'Остановить' : 'Прослушать'}: ${text}`}
    aria-pressed={listening}
    onClick={() => void play(text)}
  >
    {failed ? <VolumeX size={small ? 15 : 18}/> : listening ? <Pause size={small ? 15 : 18}/> : <Volume2 size={small ? 15 : 18}/>}
  </button>;
}
