export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  isUS: boolean;
}

export interface SpeechCapability {
  synthesisSupported: boolean;
  recognitionSupported: boolean;
  recorderSupported: boolean;
}

export function getSpeechCapabilities(): SpeechCapability {
  const hasWindow = typeof window !== 'undefined';
  const synthesisSupported = hasWindow && 'speechSynthesis' in window;
  const SpeechRec =
    hasWindow &&
    ((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition);
  const recorderSupported =
    hasWindow &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  return {
    synthesisSupported,
    recognitionSupported: Boolean(SpeechRec),
    recorderSupported,
  };
}

export function getEnglishVoices(): { voices: VoiceOption[]; hasUSVoice: boolean } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voices: [], hasUSVoice: false };
  }
  const raw = window.speechSynthesis.getVoices();
  const enVoices = raw
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
    .map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      isUS: v.lang.toLowerCase() === 'en-us' || v.lang.toLowerCase().startsWith('en-us'),
    }))
    .sort((a, b) => {
      if (a.isUS !== b.isUS) return a.isUS ? -1 : 1;
      const aPreferred = /google us|samantha|aria|jenny|natural/i.test(a.name) ? 0 : 1;
      const bPreferred = /google us|samantha|aria|jenny|natural/i.test(b.name) ? 0 : 1;
      return aPreferred - bPreferred;
    });

  return {
    voices: enVoices,
    hasUSVoice: enVoices.some((v) => v.isUS),
  };
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakEnglishText(options: {
  text: string;
  rate: number;
  preferredVoiceURI?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.('Trình duyệt hiện tại không hỗ trợ phát giọng nói tự động.');
    return;
  }

  // Always cancel prior utterances to guarantee zero overlapping audio
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  utterance.lang = 'en-US';
  utterance.rate = Math.min(1.5, Math.max(0.5, options.rate));
  utterance.pitch = 1.0;

  const allVoices = window.speechSynthesis.getVoices();
  let chosen = options.preferredVoiceURI
    ? allVoices.find((v) => v.voiceURI === options.preferredVoiceURI)
    : undefined;

  if (!chosen) {
    chosen =
      allVoices.find(
        (v) =>
          v.lang.toLowerCase() === 'en-us' &&
          /google us|samantha|aria|jenny|zira|david|natural/i.test(v.name)
      ) ||
      allVoices.find((v) => v.lang.toLowerCase() === 'en-us') ||
      allVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
  }

  if (chosen) {
    utterance.voice = chosen;
    utterance.lang = chosen.lang;
  }

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (ev) => {
    if (ev.error === 'canceled' || ev.error === 'interrupted') {
      options.onEnd?.();
      return;
    }
    options.onError?.('Không thể phát âm thanh lúc này. Thầy/cô vui lòng kiểm tra loa hoặc chọn giọng đọc khác.');
  };

  window.speechSynthesis.speak(utterance);
}

export function compareRecognizedSpeech(target: string, recognized: string): {
  matched: boolean;
  matchRatio: number;
  feedbackEn: string;
  feedbackVi: string;
} {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[^a-z0-9'\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const targetClean = clean(target);
  const recClean = clean(recognized);

  if (!recClean) {
    return {
      matched: false,
      matchRatio: 0,
      feedbackEn: 'Try again. Listen to the model and speak clearly.',
      feedbackVi: 'Hệ thống chưa nghe rõ lời nói. Thầy/cô hãy nghe mẫu và nói rõ hơn nhé.',
    };
  }

  if (targetClean === recClean) {
    return {
      matched: true,
      matchRatio: 1,
      feedbackEn: 'Great! Your words were recognized correctly.',
      feedbackVi: 'Tuyệt vời! Trình duyệt đã nhận diện đúng các từ trong câu mẫu.',
    };
  }

  const targetWords = targetClean.split(' ');
  const recWords = recClean.split(' ');
  const matchedCount = targetWords.filter((w) => recWords.includes(w)).length;
  const ratio = matchedCount / Math.max(1, targetWords.length);

  if (ratio >= 0.8) {
    return {
      matched: true,
      matchRatio: ratio,
      feedbackEn: 'Great! Your words were recognized correctly.',
      feedbackVi: 'Rất tốt! Hầu hết các từ khóa đều được nhận diện khớp với câu mẫu.',
    };
  }

  return {
    matched: false,
    matchRatio: ratio,
    feedbackEn: 'Try again. Listen to the model and speak clearly.',
    feedbackVi: 'Nhận diện chưa khớp hoàn toàn. Thầy/cô hãy nghe lại câu mẫu và đọc chậm, rõ từng từ nhé.',
  };
}
