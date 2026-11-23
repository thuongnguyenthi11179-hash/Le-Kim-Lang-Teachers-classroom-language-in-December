import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mic,
  Play,
  ShieldCheck,
  Square,
  Volume2,
  Award,
} from 'lucide-react';
import { FINAL_EXAM_DATA, getLessonById } from '../../data/lessons';
import type { FinalAssessmentRecord, SpeakingSelfCheck } from '../../types/app';
import { AudioPlayerBar } from '../AudioPlayerBar';
import { CertificateModal } from '../CertificateModal';
import { speakEnglishText, stopSpeech } from '../../utils/speech';
import { checkTranslationAnswer } from '../../utils/writingGrader';

interface FinalChallengeScreenProps {
  existingAssessment: FinalAssessmentRecord | null;
  saving: boolean;
  onSubmitAssessment: (payload: {
    listeningScore: number;
    readingScore: number;
    writingScore: number;
    speakingSelfCheck: SpeakingSelfCheck;
    speakingSubmittedSentences: string[];
  }) => Promise<void>;
  teacherName?: string;
  professionalGroup?: string;
}

export function FinalChallengeScreen({
  existingAssessment,
  saving,
  onSubmitAssessment,
  teacherName = '',
  professionalGroup = '',
}: FinalChallengeScreenProps) {
  const [step, setStep] = useState<'intro' | 'listening' | 'reading' | 'writing' | 'speaking' | 'done'>(
    existingAssessment ? 'done' : 'intro'
  );
  const [showCertificate, setShowCertificate] = useState(false);

  // Answers state
  const [listenAns, setListenAns] = useState<Record<string, number>>({});
  const [readAns, setReadAns] = useState<Record<string, number>>({});
  const [writeAns, setWriteAns] = useState<Record<string, string>>({});

  // Speaking assessment recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [hasListenedModel, setHasListenedModel] = useState(false);
  const [hasReplayed, setHasReplayed] = useState(false);
  const [confidentInClass, setConfidentInClass] = useState(false);
  const [speakingNotes, setSpeakingNotes] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const speakingSentences = FINAL_EXAM_DATA.speakingLessonIds.map((id) => getLessonById(id));

  const stopRecording = () => {
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
    setIsRecording(false);
  };

  const startSpeakingRecording = async () => {
    setMicError(null);
    stopSpeech();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMicError('Trình duyệt chưa hỗ trợ ghi âm micro. Vui lòng dùng Chrome/Edge/Safari mới nhất.');
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
      setHasReplayed(false);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      stopRecording();
      setMicError(
        'Không thể mở Micro. Thầy/cô vui lòng bấm biểu tượng ổ khóa trên thanh địa chỉ trình duyệt và chọn Cho phép Micro.'
      );
    }
  };

  const computeListeningScore = () => {
    let correct = 0;
    for (const item of FINAL_EXAM_DATA.listening) {
      if (listenAns[item.id] === item.correctIndex) correct += 1;
    }
    return correct * 5; // 5 items * 5 = 25
  };

  const computeReadingScore = () => {
    let correct = 0;
    for (const item of FINAL_EXAM_DATA.reading) {
      if (readAns[item.id] === item.correctIndex) correct += 1;
    }
    return correct * 5; // 5 items * 5 = 25
  };

  const computeWritingScore = () => {
    let correct = 0;
    for (const item of FINAL_EXAM_DATA.writing) {
      const res = checkTranslationAnswer(
        writeAns[item.id] || '',
        item.referenceAnswer,
        item.acceptedSynonyms
      );
      if (res.isCorrect) correct += 1;
    }
    return correct * 5; // 5 items * 5 = 25
  };

  const handleFinalSubmit = async () => {
    setSubmitError(null);
    stopRecording();
    if (!hasListenedModel || !audioUrl || !hasReplayed) {
      setSubmitError(
        'Để nộp phần Luyện nói trung thực, thầy/cô cần bấm Nghe mẫu, Ghi âm đọc 5 câu và bấm Nghe lại bản ghi trước khi nộp bài.'
      );
      return;
    }
    try {
      await onSubmitAssessment({
        listeningScore: computeListeningScore(),
        readingScore: computeReadingScore(),
        writingScore: computeWritingScore(),
        speakingSelfCheck: {
          listenedModel: hasListenedModel,
          recordedVoice: Boolean(audioUrl),
          replayedVoice: hasReplayed,
          confidentInClass,
          notes: speakingNotes.trim() || undefined,
        },
        speakingSubmittedSentences: speakingSentences.map((s) => s.english),
      });
      setStep('done');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể nộp bài kiểm tra.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-800">
          Tháng 12/2026 · Thang điểm 100 (4 kỹ năng × 25 điểm)
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
          DECEMBER FINAL CHALLENGE
        </h1>
        <p className="text-base text-slate-600">
          Bài kiểm tra tổng hợp 4 kỹ năng cuối tháng. Điểm Nghe, Đọc, Viết được chấm tự động theo đáp án chuẩn; điểm Nói được chuyển sang trạng thái <strong>Chờ đánh giá</strong> để giáo viên phụ trách xác nhận minh bạch.
        </p>
      </div>

      {/* Stepper indicator */}
      {step !== 'intro' && step !== 'done' && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs sm:text-sm font-semibold">
          {(
            [
              { id: 'listening', label: '1. Nghe (25đ)' },
              { id: 'reading', label: '2. Đọc (25đ)' },
              { id: 'writing', label: '3. Viết (25đ)' },
              { id: 'speaking', label: '4. Nói (25đ)' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`min-h-[42px] rounded-xl border px-2 py-2 cursor-pointer transition-colors ${
                step === s.id
                  ? 'border-sky-500 bg-sky-50 text-sky-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* INTRO */}
      {step === 'intro' && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
              <p className="font-display font-bold text-slate-900">Listening · 25 điểm</p>
              <p className="text-sm text-slate-600 mt-1">5 câu nghe và chọn phương án đúng (chấm tự động).</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
              <p className="font-display font-bold text-slate-900">Reading · 25 điểm</p>
              <p className="text-sm text-slate-600 mt-1">5 câu hiểu nghĩa & tình huống lớp học (chấm tự động).</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="font-display font-bold text-slate-900">Writing · 25 điểm</p>
              <p className="text-sm text-slate-600 mt-1">5 câu viết tiếng Anh theo gợi ý (chấp nhận câu đồng nghĩa tự nhiên).</p>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
              <p className="font-display font-bold text-slate-900">Speaking · 25 điểm</p>
              <p className="text-sm text-slate-600 mt-1">
                Đọc 5 câu mẫu, ghi âm, nghe lại và nộp bảng kiểm để giáo viên phụ trách chấm điểm chính thức.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('listening')}
            className="btn-3d-primary min-h-[52px] rounded-2xl px-7 py-3 text-base font-bold cursor-pointer"
          >
            Bắt đầu làm bài kiểm tra cuối tháng
          </button>
        </div>
      )}

      {/* PART 1: LISTENING */}
      {step === 'listening' && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Phần 1: Listening (25 điểm · 5 câu)
          </h2>

          <div className="space-y-6">
            {FINAL_EXAM_DATA.listening.map((item, idx) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-5 space-y-4">
                <p className="font-semibold text-slate-900">Câu {idx + 1}: Nghe và chọn câu đúng</p>
                <AudioPlayerBar text={item.audioText} compact />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {item.options.map((opt, optIdx) => {
                    const selected = listenAns[item.id] === optIdx;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setListenAns((prev) => ({ ...prev, [item.id]: optIdx }))}
                        className={`min-h-[48px] rounded-xl border-2 px-3.5 py-2.5 text-left text-sm font-medium cursor-pointer transition-colors ${
                          selected
                            ? 'border-sky-600 bg-sky-50 text-sky-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300'
                        }`}
                      >
                        {['A', 'B', 'C'][optIdx]}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep('reading')}
              className="btn-3d-primary min-h-[48px] rounded-xl px-6 py-2.5 text-base font-semibold cursor-pointer"
            >
              Tiếp tục Phần 2: Reading →
            </button>
          </div>
        </div>
      )}

      {/* PART 2: READING */}
      {step === 'reading' && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Phần 2: Reading (25 điểm · 5 câu)
          </h2>

          <div className="space-y-5">
            {FINAL_EXAM_DATA.reading.map((item, idx) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-5 space-y-3">
                <p className="font-semibold text-slate-900">
                  Câu {idx + 1}: {item.prompt}
                </p>
                <p className="text-sm text-slate-600">{item.promptVi}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {item.options.map((opt, optIdx) => {
                    const selected = readAns[item.id] === optIdx;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setReadAns((prev) => ({ ...prev, [item.id]: optIdx }))}
                        className={`min-h-[48px] rounded-xl border-2 px-3.5 py-2.5 text-left text-sm font-medium cursor-pointer transition-colors ${
                          selected
                            ? 'border-teal-600 bg-teal-50 text-teal-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300'
                        }`}
                      >
                        {['A', 'B', 'C'][optIdx]}. {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('listening')}
              className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer"
            >
              ← Phần 1
            </button>
            <button
              type="button"
              onClick={() => setStep('writing')}
              className="btn-3d-primary min-h-[48px] rounded-xl px-6 py-2.5 text-base font-semibold cursor-pointer"
            >
              Tiếp tục Phần 3: Writing →
            </button>
          </div>
        </div>
      )}

      {/* PART 3: WRITING */}
      {step === 'writing' && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Phần 3: Writing (25 điểm · 5 câu)
          </h2>
          <p className="text-sm text-slate-600">
            Viết câu tiếng Anh tương ứng với nghĩa tiếng Việt. Hệ thống chấp nhận khác biệt chữ hoa/thường và cách diễn đạt tự nhiên tương đương.
          </p>

          <div className="space-y-4">
            {FINAL_EXAM_DATA.writing.map((item, idx) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <label htmlFor={`fe-w-${item.id}`} className="block font-semibold text-slate-900">
                  Câu {idx + 1}: &ldquo;{item.vietnamesePrompt}&rdquo;
                </label>
                <input
                  id={`fe-w-${item.id}`}
                  type="text"
                  value={writeAns[item.id] || ''}
                  onChange={(e) => setWriteAns((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Nhập câu tiếng Anh..."
                  className="w-full min-h-[46px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:border-sky-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('reading')}
              className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer"
            >
              ← Phần 2
            </button>
            <button
              type="button"
              onClick={() => setStep('speaking')}
              className="btn-3d-primary min-h-[48px] rounded-xl px-6 py-2.5 text-base font-semibold cursor-pointer"
            >
              Tiếp tục Phần 4: Speaking →
            </button>
          </div>
        </div>
      )}

      {/* PART 4: SPEAKING (Honest Self-Check + Pending Admin Verification) */}
      {step === 'speaking' && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Phần 4: Speaking (25 điểm · Đọc 5 câu tiêu biểu)
            </h2>
            <p className="text-sm text-slate-600">
              Hệ thống không tự chấm điểm phát âm giả lập. Thầy/cô nghe mẫu, ghi âm đọc 5 câu sau, nghe lại để tự kiểm tra và gửi bảng kiểm để giáo viên phụ trách chấm điểm Speaking chính thức.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5 space-y-3">
            {speakingSentences.map((l, idx) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 last:border-0 pb-2.5 last:pb-0"
              >
                <div>
                  <span className="font-display text-lg font-bold text-slate-900">
                    {idx + 1}. {l.english}
                  </span>
                  <span className="ml-2 font-mono text-xs text-sky-700">{l.ipa}</span>
                  <p className="text-xs text-slate-600">{l.vietnamese}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasListenedModel(true);
                    speakEnglishText({ text: l.english, rate: 0.95 });
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-50 cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Nghe mẫu</span>
                </button>
              </div>
            ))}
          </div>

          {/* Recording buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void startSpeakingRecording()}
              disabled={isRecording}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
            >
              <Mic className="h-4 w-4" />
              <span>{isRecording ? `Đang ghi âm (${recordSeconds}s)...` : 'Bắt đầu ghi âm đọc 5 câu'}</span>
            </button>

            <button
              type="button"
              onClick={stopRecording}
              disabled={!isRecording}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-45 cursor-pointer"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Dừng ghi âm</span>
            </button>

            {audioUrl && !isRecording && (
              <button
                type="button"
                onClick={() => {
                  audioElRef.current?.play();
                  setHasReplayed(true);
                }}
                className="btn-3d-teal inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>Nghe lại bản ghi</span>
              </button>
            )}
          </div>

          {audioUrl && !isRecording && (
            <audio
              ref={audioElRef}
              controls
              src={audioUrl}
              onPlay={() => setHasReplayed(true)}
              className="w-full"
            />
          )}

          {micError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{micError}</span>
            </div>
          )}

          {/* Self check */}
          <div className="space-y-3 rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="font-semibold text-slate-900">Bảng kiểm nộp bài Luyện nói:</p>
            <p className={hasListenedModel ? 'text-teal-700 font-medium' : 'text-slate-500'}>
              {hasListenedModel ? '✓' : '○'} Đã nghe ít nhất 1 câu mẫu
            </p>
            <p className={audioUrl ? 'text-teal-700 font-medium' : 'text-slate-500'}>
              {audioUrl ? '✓' : '○'} Đã ghi âm giọng đọc của mình (lưu cục bộ trên thiết bị)
            </p>
            <p className={hasReplayed ? 'text-teal-700 font-medium' : 'text-slate-500'}>
              {hasReplayed ? '✓' : '○'} Đã nghe lại bản ghi của mình
            </p>
            <label className="flex items-center gap-2.5 pt-2 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={confidentInClass}
                onChange={(e) => setConfidentInClass(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-sky-600"
              />
              <span>Tôi đã đọc rõ ràng, tự tin và sẵn sàng sử dụng 5 câu trên trong lớp học.</span>
            </label>
            <textarea
              value={speakingNotes}
              onChange={(e) => setSpeakingNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú tự nhận xét của thầy/cô (tùy chọn, ví dụ: câu nào còn cần luyện thêm)..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800"
            />
          </div>

          {submitError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('writing')}
              className="min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer"
            >
              ← Phần 3
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleFinalSubmit()}
              className="btn-3d-teal min-h-[50px] rounded-xl px-6 py-2.5 text-base font-bold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Đang lưu bài kiểm tra...' : 'Nộp bài kiểm tra cuối tháng'}
            </button>
          </div>
        </div>
      )}

      {/* RESULT / PENDING SPEAKING EVALUATION */}
      {step === 'done' && existingAssessment && (
        <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-sky-700">
                Kết quả December Final Challenge
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Trạng thái: {existingAssessment.assessmentStatus}
              </h2>
              <p className="text-sm text-slate-600">
                Nộp lúc: {new Date(existingAssessment.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-3 text-right">
              <p className="text-xs font-medium text-slate-600">Tổng điểm (100)</p>
              <p className="font-display font-mono tabular-nums text-2xl font-extrabold text-sky-900">
                {existingAssessment.totalScore === null
                  ? 'Chờ đánh giá'
                  : `${existingAssessment.totalScore}/100`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Listening</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {existingAssessment.listeningScore}/25
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Reading</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {existingAssessment.readingScore}/25
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Writing</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {existingAssessment.writingScore}/25
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs text-amber-800">Speaking</p>
              <p className="font-mono tabular-nums text-xl font-bold text-amber-950 mt-1">
                {existingAssessment.speakingScore === null
                  ? 'Chờ đánh giá'
                  : `${existingAssessment.speakingScore}/25`}
              </p>
            </div>
          </div>

          {existingAssessment.assessmentStatus === 'Chờ đánh giá' ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Phần Luyện nói đang ở trạng thái &ldquo;Chờ đánh giá&rdquo;
                </p>
                <p>
                  Điểm Nghe – Đọc – Viết của thầy/cô đã được ghi nhận chính thức ({existingAssessment.listeningScore + existingAssessment.readingScore + existingAssessment.writingScore}/75 điểm). Giáo viên phụ trách chuyên môn sẽ xem bảng kiểm/nghe trực tiếp và nhập điểm Luyện nói (0–25) trong Admin Dashboard để hoàn tất tổng điểm 100.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Chúc mừng thầy/cô đã hoàn thành đánh giá cả 4 kỹ năng!
                </p>
                {existingAssessment.adminSpeakingFeedback && (
                  <p>Nhận xét phần Nói: {existingAssessment.adminSpeakingFeedback}</p>
                )}
              </div>
            </div>
          )}

          {/* Certificate Generation Action */}
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-amber-950">
                  Giấy Chứng Nhận Hoàn Thành Thử Thách Tháng 12
                </h4>
                <p className="text-xs text-amber-800">
                  Vinh danh giáo viên hoàn thành kỳ đánh giá tiếng Anh giao tiếp Trường TH Lê Kim Lăng
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCertificate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 shadow-sm cursor-pointer transition-colors whitespace-nowrap"
            >
              <Award className="h-4 w-4" />
              Xem & Tải Giấy Chứng Nhận (PNG)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Không báo tổng điểm 100 giả trước khi có đánh giá Speaking hợp lệ.</span>
            </p>
            <button
              type="button"
              onClick={() => setStep('listening')}
              className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Làm lại bài kiểm tra
            </button>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {existingAssessment && (
        <CertificateModal
          isOpen={showCertificate}
          onClose={() => setShowCertificate(false)}
          teacherName={teacherName || existingAssessment.fullName || 'Giáo viên Trường TH Lê Kim Lăng'}
          professionalGroup={professionalGroup || 'Tổ Chuyên Môn'}
          totalScore={
            existingAssessment.totalScore !== null
              ? existingAssessment.totalScore
              : existingAssessment.listeningScore +
                existingAssessment.readingScore +
                existingAssessment.writingScore
          }
          dateStr={new Date(existingAssessment.submittedAt).toLocaleDateString('vi-VN')}
        />
      )}
    </div>
  );
}
