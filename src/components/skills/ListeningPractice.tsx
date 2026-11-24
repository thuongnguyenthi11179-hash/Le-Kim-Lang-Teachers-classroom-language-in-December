import { useEffect, useState } from 'react';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import type { LessonData } from '../../types/app';
import { AudioPlayerBar } from '../AudioPlayerBar';
import { IllustratedFrame } from '../IllustratedFrame';

interface ListeningPracticeProps {
  lesson: LessonData;
  completedPreviously?: boolean;
  onSubmitResult: (payload: {
    attemptId: string;
    lessonId: number;
    skill: 'listening';
    activityId: string;
    score: number;
    maximumScore: number;
    passed: boolean;
    resultStatus: 'Passed' | 'Needs Review';
    userAnswer: string;
    expectedAnswer: string;
    feedback: string;
    prompt: string;
  }) => Promise<void>;
  saving?: boolean;
}

export function ListeningPractice({
  lesson,
  completedPreviously,
  onSubmitResult,
  saving = false,
}: ListeningPracticeProps) {
  const [hasListened, setHasListened] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attemptKey, setAttemptKey] = useState(() => `ATT-L-${lesson.id}-${Date.now()}`);

  useEffect(() => {
    setHasListened(false);
    setSelectedIndex(null);
    setSubmitted(false);
    setAttemptKey(`ATT-L-${lesson.id}-${Date.now()}`);
  }, [lesson.id]);

  const q = lesson.listening;
  const isCorrect = selectedIndex === q.correctIndex;
  const canChoose = hasListened || supportMode;

  const handleSelectOption = async (idx: number) => {
    if (submitted || saving) return;
    setSelectedIndex(idx);
    setSubmitted(true);

    const passed = idx === q.correctIndex;
    await onSubmitResult({
      attemptId: attemptKey,
      lessonId: lesson.id,
      skill: 'listening',
      activityId: q.id,
      score: passed ? 10 : 0,
      maximumScore: 10,
      passed,
      resultStatus: passed ? 'Passed' : 'Needs Review',
      userAnswer: q.options[idx],
      expectedAnswer: q.options[q.correctIndex],
      feedback: passed ? 'Excellent listening!' : 'Nice try! Listen again.',
      prompt: `Nghe câu tiếng Anh bài ${lesson.id}`,
    });
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setSubmitted(false);
    setAttemptKey(`ATT-L-${lesson.id}-${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 w-full min-w-0">
          <IllustratedFrame
            src={lesson.image}
            alt={`Tình huống minh họa câu ${lesson.english}`}
            title={lesson.situationTitleVi}
            aspectClass="aspect-[4/3]"
            className="w-full rounded-2xl border border-sky-100 shadow-xs"
          />
        </div>

        <div className="lg:col-span-7 w-full min-w-0 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-sky-700">
              Kỹ năng 1 · Listening Practice – Luyện Nghe
            </p>
            <h3 className="font-display text-2xl font-bold text-slate-900">
              Nghe câu giao tiếp và chọn đáp án đúng
            </h3>
            <p className="text-base text-slate-600 leading-relaxed">
              Tình huống: {lesson.situationDescVi}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 sm:p-5 space-y-4">
            <AudioPlayerBar
              text={q.audioText}
              onPlayed={() => setHasListened(true)}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sky-100 text-sm">
              <span className="text-slate-600">
                {hasListened
                  ? 'Đã phát âm thanh · Thầy/cô hãy chọn đáp án đúng bên dưới.'
                  : 'Vui lòng bấm LISTEN để nghe câu mẫu trước khi chọn đáp án.'}
              </span>
              <button
                type="button"
                onClick={() => setSupportMode((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-sky-700 font-medium hover:text-sky-900 cursor-pointer"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <span>{supportMode ? 'Tắt chế độ hỗ trợ' : 'Bật chế độ hỗ trợ'}</span>
              </button>
            </div>

            {supportMode && (
              <p className="text-sm text-teal-800 bg-teal-50 rounded-xl px-3.5 py-2.5 border border-teal-100">
                Gợi ý: {q.hintVi} · Nghĩa tiếng Việt: &ldquo;{lesson.vietnamese}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3-option multiple choice */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-lg font-semibold text-slate-900">
            Chọn câu thầy/cô vừa nghe được (3 phương án)
          </h4>
          {completedPreviously && (
            <span className="text-sm font-medium text-teal-700">
              ✓ Đã ghi nhận hoàn thành kỹ năng Nghe
            </span>
          )}
        </div>

        {!canChoose ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-6 text-center text-slate-600">
            <p className="text-base font-medium text-slate-800">
              Đáp án đang ẩn để giúp thầy/cô tập trung luyện nghe.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Bấm nút <strong>LISTEN – Nghe</strong> ở trên để mở 3 phương án lựa chọn (hoặc bật Chế độ hỗ trợ).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {q.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C'][idx];
              const isSelected = selectedIndex === idx;
              const isOptionCorrect = idx === q.correctIndex;

              let styleClass =
                'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/60';
              if (submitted) {
                if (isOptionCorrect) {
                  styleClass = 'border-teal-500 bg-teal-50 text-teal-950 font-semibold';
                } else if (isSelected && !isOptionCorrect) {
                  styleClass = 'border-rose-400 bg-rose-50 text-rose-900';
                } else {
                  styleClass = 'border-slate-200 bg-slate-50/60 text-slate-500';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={submitted || saving}
                  onClick={() => handleSelectOption(idx)}
                  className={`flex min-h-[64px] items-center gap-3 rounded-2xl border-2 p-4 text-left text-base transition-colors cursor-pointer disabled:cursor-default ${styleClass}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-display text-base font-bold text-sky-900">
                    {letter}
                  </span>
                  <span className="font-medium leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {submitted && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 ${
            isCorrect
              ? 'border-teal-200 bg-teal-50 text-teal-950'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {isCorrect ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-600 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className="font-display text-lg font-bold">
                {isCorrect ? 'Excellent listening!' : 'Nice try! Listen again.'}
              </p>
              <p className="text-sm mt-0.5">
                {isCorrect
                  ? `Chính xác! Câu vừa nghe là "${q.audioText}" (${lesson.vietnamese}). Kết quả đã được lưu.`
                  : `Đáp án đúng là "${q.options[q.correctIndex]}". Thầy/cô hãy nghe lại câu mẫu và thử lại nhé!`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>TRY AGAIN – Làm lại</span>
          </button>
        </div>
      )}
    </div>
  );
}
