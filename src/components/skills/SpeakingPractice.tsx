import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Mic,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Volume2,
  Sparkles,
  Loader2,
  MessageSquare,
  Cpu,
} from 'lucide-react';
import type { LessonData } from '../../types/app';
import {
  compareRecognizedSpeech,
  getSpeechCapabilities,
  speakEnglishText,
  stopSpeech,
} from '../../utils/speech';
import {
  generateWithFallback,
  getStoredApiKey,
  type FallbackAttemptStatus,
} from '../../utils/gemini';

interface SpeakingPracticeProps {
  lesson: LessonData;
  completedPreviously?: boolean;
  onSubmitResult: (payload: {
    attemptId: string;
    lessonId: number;
    skill: 'speaking';
    activityId: string;
    score: number;
    maximumScore: number;
    passed: boolean;
    resultStatus: 'Self-Evaluated';
    userAnswer?: string;
    expectedAnswer: string;
    feedback: string;
    prompt: string;
  }) => Promise<void>;
  saving?: boolean;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function SpeakingPractice({
  lesson,
  completedPreviously,
  onSubmitResult,
  saving = false,
}: SpeakingPracticeProps) {
  const [isModelPlaying, setIsModelPlaying] = useState(false);
  const [listenedModel, setListenedModel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMime, setAudioMime] = useState<string>('audio/webm');
  const [hasReplayed, setHasReplayed] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [speechCheck, setSpeechCheck] = useState<{
    matched: boolean;
    feedbackEn: string;
    feedbackVi: string;
  } | null>(null);

  const [selfChecks, setSelfChecks] = useState({
    clearVoice: false,
    matchedRhythm: false,
    readyForClass: false,
  });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(() => `ATT-S-${lesson.id}-${Date.now()}`);

  // AI Gemini Student & Speaking Coach State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStudentResponse, setAiStudentResponse] = useState<string | null>(null);
  const [aiPronunciationTip, setAiPronunciationTip] = useState<string | null>(null);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fallbackStatuses, setFallbackStatuses] = useState<FallbackAttemptStatus[]>([]);

  const handleConsultAiSpeaker = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setAiError('Chưa cấu hình API Key. Thầy/cô vui lòng bấm vào nút "Settings (API Key)" màu đỏ trên thanh điều hướng để nhập key.');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiStudentResponse(null);
    setAiPronunciationTip(null);

    const prompt = `Bạn là Trợ lý AI kiêm Học sinh Tiểu học vui vẻ, lễ phép tại Trường Tiểu học Lê Kim Lăng.
Giáo viên vừa thực hành nói câu khẩu lệnh lớp học:
- Bài học số: ${lesson.id}
- Khẩu lệnh chuẩn: "${lesson.english}" (${lesson.vietnamese})
- Giọng đọc nhận diện được: "${recognizedText || lesson.english}"

Hãy phản hồi theo 2 phần rõ ràng:
1. [HỌC SINH ĐÁP LỜI]: Đóng vai một bạn nhỏ học sinh tiểu học (lớp 1 - lớp 5) lễ phép, hào hứng đáp lại lời thầy/cô (kèm 1 câu tiếng Anh ngắn và nghĩa tiếng Việt vui vẻ, dễ thương).
2. [MẸO SƯ PHẠM]: Góp ý 1 mẹo nhỏ về ngữ điệu, ánh mắt hoặc nụ cười khi giáo viên nói câu này để học sinh cảm thấy ấm áp và có động lực học tập.`;

    try {
      const res = await generateWithFallback(prompt, {
        onStatusChange: (statuses) => setFallbackStatuses(statuses),
      });

      const parts = res.text.split(/\[MẸO SƯ PHẠM\]/i);
      if (parts.length >= 2) {
        setAiStudentResponse(parts[0].replace(/\[HỌC SINH ĐÁP LỜI\]/i, '').trim());
        setAiPronunciationTip(parts[1].trim());
      } else {
        setAiStudentResponse(res.text.trim());
      }
      setAiModelUsed(res.modelUsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const caps = getSpeechCapabilities();

  const stopAllCapture = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    stopAllCapture();
    stopSpeech();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setListenedModel(false);
    setHasReplayed(false);
    setRecordSeconds(0);
    setMicError(null);
    setRecognizedText('');
    setSpeechCheck(null);
    setSavedNotice(null);
    setSelfChecks({ clearVoice: false, matchedRhythm: false, readyForClass: false });
    setAttemptKey(`ATT-S-${lesson.id}-${Date.now()}`);

    return () => {
      stopAllCapture();
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const handleListenModel = () => {
    setMicError(null);
    speakEnglishText({
      text: lesson.english,
      rate: 0.95,
      onStart: () => {
        setIsModelPlaying(true);
        setListenedModel(true);
      },
      onEnd: () => setIsModelPlaying(false),
      onError: (msg) => {
        setIsModelPlaying(false);
        setMicError(msg);
      },
    });
  };

  const handleStartRecording = async () => {
    setMicError(null);
    setSavedNotice(null);
    stopSpeech();

    if (!caps.recorderSupported) {
      setMicError(
        'Trình duyệt hiện tại không hỗ trợ ghi âm micro (MediaRecorder). Thầy/cô vui lòng mở trên Chrome, Edge hoặc Safari mới nhất.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      chunksRef.current = [];
      setRecognizedText('');
      setSpeechCheck(null);
      setHasReplayed(false);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';
      setAudioMime(mimeType || 'audio/webm');

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Always release microphone immediately so red hardware indicator turns off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // Optional browser SpeechRecognition (en-US) — never blocks recording if unsupported
      const SpeechRecCtor =
        (window as unknown as {
          SpeechRecognition?: new () => BrowserSpeechRecognition;
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }).SpeechRecognition ||
        (window as unknown as {
          webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
        }).webkitSpeechRecognition;

      if (SpeechRecCtor) {
        try {
          const rec = new SpeechRecCtor();
          rec.lang = 'en-US';
          rec.interimResults = false;
          rec.maxAlternatives = 1;
          rec.onresult = (event) => {
            const transcript = event.results?.[0]?.[0]?.transcript || '';
            setRecognizedText(transcript);
            setSpeechCheck(compareRecognizedSpeech(lesson.english, transcript));
          };
          rec.onerror = () => {
            // Silently keep MediaRecorder working cleanly
          };
          recognitionRef.current = rec;
          rec.start();
        } catch {
          // Ignore SpeechRecognition startup error; audio recording still works
        }
      }
    } catch (err) {
      stopAllCapture();
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setMicError(
          'Quyền truy cập Micro đang bị từ chối. Cách bật lại: Bấm vào biểu tượng ổ khóa (🔒) bên trái thanh địa chỉ trình duyệt → chọn Quyền Micro → Cho phép (Allow) → tải lại trang và bấm Ghi âm lại.'
        );
      } else {
        setMicError(
          'Không tìm thấy micro hoặc thiết bị đang bận. Vui lòng kiểm tra tai nghe/micro trên điện thoại hoặc máy tính.'
        );
      }
    }
  };

  const handleStopRecording = () => {
    stopAllCapture();
  };

  const handlePlayRecording = () => {
    if (!audioUrl || !audioElRef.current) return;
    stopSpeech();
    audioElRef.current.currentTime = 0;
    void audioElRef.current.play();
    setHasReplayed(true);
  };

  const handleRecordAgain = () => {
    stopAllCapture();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setRecordSeconds(0);
    setHasReplayed(false);
    setRecognizedText('');
    setSpeechCheck(null);
    setSavedNotice(null);
    setAttemptKey(`ATT-S-${lesson.id}-${Date.now()}`);
  };

  const handleDownloadRecording = () => {
    if (!audioUrl) return;
    const ext = audioMime.includes('mp4') ? 'm4a' : 'webm';
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `le-kim-lang-bai-${lesson.id}-speaking.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const canSaveSpeaking =
    Boolean(audioUrl) &&
    hasReplayed &&
    selfChecks.clearVoice &&
    selfChecks.matchedRhythm &&
    selfChecks.readyForClass;

  const handleSaveSpeaking = async () => {
    if (!canSaveSpeaking || saving) return;
    await onSubmitResult({
      attemptId: attemptKey,
      lessonId: lesson.id,
      skill: 'speaking',
      activityId: `L${lesson.id}-speak-1`,
      score: 10,
      maximumScore: 10,
      passed: true,
      resultStatus: 'Self-Evaluated',
      userAnswer: recognizedText
        ? `Tự ghi âm & kiểm tra (${recordSeconds}s) | Nhận diện từ: "${recognizedText}"`
        : `Tự ghi âm & nghe lại (${recordSeconds}s) – Đã tự đánh giá theo bảng kiểm`,
      expectedAnswer: lesson.english,
      feedback:
        'Đã hoàn thành thực hành Nghe mẫu – Ghi âm – Nghe lại – Tự đánh giá (lưu tiến độ Luyện nói).',
      prompt: `Luyện nói câu: ${lesson.english}`,
    });
    setSavedNotice('Đã ghi nhận hoàn thành phần Luyện nói cho bài học này!');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Sentence Focus */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Kỹ năng 2 · Speaking Practice – Luyện Nói
          </p>
          <h3 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Listen – Record – Replay – Improve
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Mẹo phát âm: {lesson.pronunciationTipVi}
          </p>
        </div>
        {completedPreviously && (
          <span className="text-sm font-semibold text-teal-700 whitespace-nowrap">
            ✓ Đã ghi nhận thực hành Luyện nói
          </span>
        )}
      </div>

      {/* Target Sentence Card */}
      <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-6 text-center space-y-2">
        <p className="font-display text-3xl sm:text-4xl font-bold text-sky-950">
          {lesson.english}
        </p>
        <p className="font-mono text-base text-sky-700">{lesson.ipa}</p>
        <p className="text-base text-slate-600">{lesson.vietnamese}</p>
      </div>

      {/* 4 Real Functional Buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={handleListenModel}
          className="btn-3d-primary flex min-h-[54px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer"
        >
          <Volume2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{isModelPlaying ? 'Đang đọc mẫu...' : '1. LISTEN TO THE MODEL'}</span>
        </button>

        <button
          type="button"
          onClick={handleStartRecording}
          disabled={isRecording}
          className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_0_0_#be123c] hover:bg-rose-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>2. START RECORDING</span>
        </button>

        <button
          type="button"
          onClick={handleStopRecording}
          disabled={!isRecording}
          className="flex min-h-[54px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-45 transition-colors cursor-pointer"
        >
          <Square className="h-4 w-4 fill-current shrink-0" aria-hidden="true" />
          <span>3. STOP RECORDING</span>
        </button>

        <button
          type="button"
          onClick={handlePlayRecording}
          disabled={!audioUrl || isRecording}
          className="btn-3d-teal flex min-h-[54px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-45 cursor-pointer"
        >
          <Play className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>4. PLAY MY RECORDING</span>
        </button>
      </div>

      {/* Live Recording Status & Timer */}
      {isRecording && (
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-900"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white">
              <Mic className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-base">Đang ghi âm giọng nói của thầy/cô...</p>
              <p className="text-sm text-rose-700">
                Hãy đọc to, rõ ràng câu &ldquo;{lesson.english}&rdquo; rồi bấm <strong>STOP RECORDING</strong>.
              </p>
            </div>
          </div>
          <span className="font-mono tabular-nums text-2xl font-bold text-rose-700">
            {formatTimer(recordSeconds)}
          </span>
        </div>
      )}

      {/* Playback & Download controls */}
      {audioUrl && !isRecording && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-teal-950">
                Bản ghi âm của thầy/cô (Thời lượng: <span className="font-mono tabular-nums">{formatTimer(recordSeconds)}</span>)
              </p>
              <p className="text-sm text-teal-800">
                Bấm phát để nghe lại giọng của mình và so sánh với câu mẫu.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRecordAgain}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>RECORD AGAIN</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadRecording}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Tải bản ghi cá nhân</span>
              </button>
            </div>
          </div>

          <audio
            ref={audioElRef}
            controls
            src={audioUrl}
            onPlay={() => setHasReplayed(true)}
            className="w-full"
          />
        </div>
      )}

      {/* Optional Speech Recognition Comparison (with explicit honesty disclaimer) */}
      {caps.recognitionSupported ? (
        speechCheck && (
          <div
            className={`rounded-2xl border p-5 space-y-2 ${
              speechCheck.matched
                ? 'border-sky-200 bg-sky-50 text-sky-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            <p className="text-sm font-medium text-slate-600">
              Hỗ trợ nhận diện văn bản từ trình duyệt (tham khảo đối chiếu từ)
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-base">
              <div>
                <span className="text-slate-600">Target: </span>
                <strong className="font-display">{lesson.english}</strong>
              </div>
              <div>
                <span className="text-slate-600">Recognized: </span>
                <strong className="font-display">{recognizedText || '—'}</strong>
              </div>
            </div>
            <p className="font-semibold text-base">{speechCheck.feedbackEn}</p>
            <p className="text-sm">{speechCheck.feedbackVi}</p>
            <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/70">
              Lưu ý chuyên môn: Kết quả nhận diện từ của trình duyệt chỉ giúp thầy/cô tham khảo xem từ khóa có khớp hay không, không thay thế cho đánh giá phát âm chuẩn chuyên sâu.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Trình duyệt này không hỗ trợ nhận diện giọng nói tự động. Thầy/cô vẫn có thể <strong>ghi âm, nghe lại và tự đánh giá</strong> bình thường bên dưới.
        </div>
      )}

      {/* Mic Permission Error Notice */}
      {micError && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <p className="leading-relaxed">{micError}</p>
        </div>
      )}

      {/* AI Gemini Student Response & Intonation Coach */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-sky-50/50 to-white p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                AI Gemini – Học Sinh Tiểu Học Giả Lập & Góp Ý Ngữ Điệu
              </h4>
              <p className="text-xs text-slate-500">
                Thử khẩu lệnh với học sinh giả lập để lắng nghe phản hồi của các em trong lớp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleConsultAiSpeaker()}
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors shrink-0"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Học sinh đang lắng nghe...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Thử khẩu lệnh với Học sinh AI
              </>
            )}
          </button>
        </div>

        {/* Fallback steps & Model status indicator */}
        {aiLoading && fallbackStatuses.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-white/80 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-600" />
              Tiến trình xử lý Fallback (AI Model Chain):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {fallbackStatuses.map((s) => (
                <div
                  key={s.model}
                  className={`rounded-lg p-2 text-[11px] border flex items-center justify-between ${
                    s.status === 'success'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : s.status === 'failed'
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-indigo-300 bg-indigo-50/70 text-indigo-800 animate-pulse'
                  }`}
                >
                  <span className="font-mono font-medium truncate">{s.model}</span>
                  <span className="font-bold uppercase text-[10px]">
                    {s.status === 'success'
                      ? '✓ Thành công'
                      : s.status === 'failed'
                        ? '✗ Đã chuyển tiếp'
                        : 'Đang gọi...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Student Response */}
        {aiStudentResponse && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                🎒 Tiếng học sinh đáp lời ({aiModelUsed})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Gemini AI Studio</span>
            </div>
            <p className="text-sm font-medium text-slate-800 whitespace-pre-line leading-relaxed">
              {aiStudentResponse}
            </p>
            {aiPronunciationTip && (
              <div className="rounded-lg bg-white/80 p-2.5 text-xs text-indigo-900 border border-indigo-100">
                <span className="font-bold text-indigo-950">Mẹo sư phạm: </span>
                {aiPronunciationTip}
              </div>
            )}
          </div>
        )}

        {/* Raw Error Display if all models failed */}
        {aiError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Quy trình xử lý: Đã dừng do lỗi</span>
            </div>
            <p className="text-xs text-rose-900 font-mono bg-white/70 p-2.5 rounded-lg border border-rose-200 break-words">
              {aiError}
            </p>
            <p className="text-[11px] text-rose-700">
              Thầy/cô vui lòng kiểm tra lại quota hoặc đổi API key tại nút <strong>Settings (API Key)</strong> màu đỏ trên thanh điều hướng.
            </p>
          </div>
        )}
      </div>

      {/* Teacher Self-Evaluation Rubric to honestly record Speaking progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h4 className="font-display text-lg font-bold text-slate-900">
            Bảng kiểm tự đánh giá Luyện nói
          </h4>
          <p className="text-sm text-slate-600 mt-0.5">
            Sau khi ghi âm và nghe lại giọng của mình, thầy/cô đánh dấu vào các tiêu chí đã đạt để ghi nhận hoàn thành kỹ năng Nói:
          </p>
        </div>

        <div className="space-y-2.5 text-sm sm:text-base text-slate-800">
          <div className="flex items-center gap-2.5 text-slate-600">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${listenedModel ? 'text-teal-600' : 'text-slate-300'}`}
            />
            <span>Đã nghe câu mẫu (khuyến khích nghe ít nhất 1 lần)</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${audioUrl ? 'text-teal-600' : 'text-slate-300'}`}
            />
            <span>Đã ghi âm giọng nói của chính mình (bắt buộc)</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-600">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${hasReplayed ? 'text-teal-600' : 'text-slate-300'}`}
            />
            <span>Đã bấm nghe lại bản ghi của mình (bắt buộc)</span>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selfChecks.clearVoice}
                onChange={(e) =>
                  setSelfChecks((prev) => ({ ...prev, clearVoice: e.target.checked }))
                }
                className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600"
              />
              <span>Tôi đã đọc rõ tiếng, đủ âm lượng để học sinh tiểu học dễ nghe.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selfChecks.matchedRhythm}
                onChange={(e) =>
                  setSelfChecks((prev) => ({ ...prev, matchedRhythm: e.target.checked }))
                }
                className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600"
              />
              <span>Tôi đã so sánh bản ghi với giọng mẫu và chú ý ngữ điệu thân thiện.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selfChecks.readyForClass}
                onChange={(e) =>
                  setSelfChecks((prev) => ({ ...prev, readyForClass: e.target.checked }))
                }
                className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-600"
              />
              <span>Tôi tự tin có thể sử dụng câu &ldquo;{lesson.english}&rdquo; trên lớp học.</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            disabled={!canSaveSpeaking || saving}
            onClick={handleSaveSpeaking}
            className="btn-3d-teal min-h-[48px] rounded-xl px-6 py-2.5 text-base font-semibold disabled:opacity-45 cursor-pointer"
          >
            {saving ? 'Đang lưu kết quả...' : 'Xác nhận hoàn thành Luyện nói'}
          </button>

          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
            <span>Tệp ghi âm chỉ lưu tạm trên thiết bị, không tự động tải lên máy chủ hay Google Drive.</span>
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
            <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
}
