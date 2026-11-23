import { useEffect, useState } from 'react';
import { Volume2, RotateCcw, Square, AlertCircle } from 'lucide-react';
import {
  getEnglishVoices,
  getSpeechCapabilities,
  speakEnglishText,
  stopSpeech,
  type VoiceOption,
} from '../utils/speech';

interface AudioPlayerBarProps {
  text: string;
  onPlayed?: () => void;
  compact?: boolean;
  labelListen?: string;
  labelAgain?: string;
}

const SPEEDS = [0.75, 1.0, 1.25] as const;

export function AudioPlayerBar({
  text,
  onPlayed,
  compact = false,
  labelListen = 'LISTEN – Nghe',
  labelAgain = 'LISTEN AGAIN – Nghe lại',
}: AudioPlayerBarProps) {
  const [rate, setRate] = useState<number>(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [hasUSVoice, setHasUSVoice] = useState(true);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [audioError, setAudioError] = useState<string | null>(null);

  const caps = getSpeechCapabilities();

  useEffect(() => {
    const loadVoices = () => {
      const info = getEnglishVoices();
      setVoices(info.voices);
      setHasUSVoice(info.hasUSVoice);
      if (info.voices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(info.voices[0].voiceURI);
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      stopSpeech();
    };
  }, [selectedVoiceURI]);

  // Reset play state when sentence changes
  useEffect(() => {
    stopSpeech();
    setIsSpeaking(false);
    setHasPlayed(false);
    setAudioError(null);
  }, [text]);

  const handlePlay = () => {
    setAudioError(null);
    speakEnglishText({
      text,
      rate,
      preferredVoiceURI: selectedVoiceURI || undefined,
      onStart: () => {
        setIsSpeaking(true);
        setHasPlayed(true);
        onPlayed?.();
      },
      onEnd: () => {
        setIsSpeaking(false);
      },
      onError: (msg) => {
        setIsSpeaking(false);
        setAudioError(msg);
      },
    });
  };

  const handleStop = () => {
    stopSpeech();
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handlePlay}
          disabled={!caps.synthesisSupported}
          className="btn-3d-primary inline-flex min-h-[46px] items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Volume2 className="h-5 w-5" aria-hidden="true" />
          <span>{isSpeaking ? 'Đang phát...' : labelListen}</span>
        </button>

        {hasPlayed && (
          <button
            type="button"
            onClick={handlePlay}
            disabled={!caps.synthesisSupported}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-900 hover:bg-sky-100 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{labelAgain}</span>
          </button>
        )}

        {isSpeaking && (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>Dừng âm thanh</span>
          </button>
        )}

        {/* Speed segmented buttons */}
        <div
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1"
          role="group"
          aria-label="Tốc độ đọc"
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRate(s)}
              className={`min-h-[38px] rounded-lg px-3 py-1 text-sm font-mono tabular-nums font-medium whitespace-nowrap transition-colors cursor-pointer ${
                rate === s
                  ? 'bg-white text-sky-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s.toFixed(s === 1 ? 1 : 2).replace(/\.00$/, '.0')}x
            </button>
          ))}
        </div>
      </div>

      {/* Optional Voice selector / fallback notice */}
      {!compact && caps.synthesisSupported && voices.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <label htmlFor="voice-select" className="font-medium text-slate-700 whitespace-nowrap">
            Giọng đọc:
          </label>
          <select
            id="voice-select"
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {!hasUSVoice && (
            <span className="text-amber-700">
              Thiết bị chưa cài giọng Anh–Mỹ (en-US); đang dùng giọng tiếng Anh sẵn có.
            </span>
          )}
        </div>
      )}

      {!caps.synthesisSupported && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <p>
            Trình duyệt này chưa hỗ trợ đọc giọng nói tự động. Thầy/cô có thể mở ứng dụng trên Chrome, Edge hoặc Safari mới nhất để nghe giọng Anh–Mỹ.
          </p>
        </div>
      )}

      {audioError && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <p>{audioError}</p>
        </div>
      )}
    </div>
  );
}
