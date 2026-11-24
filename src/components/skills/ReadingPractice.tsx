import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { LessonData } from '../../types/app';
import { IllustratedFrame } from '../IllustratedFrame';

interface ReadingPracticeProps {
  lesson: LessonData;
  completedPreviously?: boolean;
  onSubmitResult: (payload: {
    attemptId: string;
    lessonId: number;
    skill: 'reading';
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

export function ReadingPractice({
  lesson,
  completedPreviously,
  onSubmitResult,
  saving = false,
}: ReadingPracticeProps) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attemptKey, setAttemptKey] = useState(() => `ATT-R-${lesson.id}-0-${Date.now()}`);

  useEffect(() => {
    setQuestionIdx(0);
    setSelectedIndex(null);
    setSubmitted(false);
    setAttemptKey(`ATT-R-${lesson.id}-0-${Date.now()}`);
  }, [lesson.id]);

  const currentQ = lesson.readingQuestions[questionIdx] ?? lesson.readingQuestions[0];
  const isCorrect = selectedIndex === currentQ.correctIndex;

  const handleChoose = async (idx: number) => {
    if (submitted || saving) return;
    setSelectedIndex(idx);
    setSubmitted(true);
    const passed = idx === currentQ.correctIndex;
    await onSubmitResult({
      attemptId: attemptKey,
      lessonId: lesson.id,
      skill: 'reading',
      activityId: currentQ.id,
      score: passed ? 10 : 0,
      maximumScore: 10,
      passed,
      resultStatus: passed ? 'Passed' : 'Needs Review',
      userAnswer: currentQ.options[idx],
      expectedAnswer: currentQ.options[currentQ.correctIndex],
      feedback: currentQ.explanationVi,
      prompt: currentQ.prompt,
    });
  };

  const handleRetry = () => {
    setSelectedIndex(null);
    setSubmitted(false);
    setAttemptKey(`ATT-R-${lesson.id}-${questionIdx}-${Date.now()}`);
  };

  const handleSwitchQuestion = (nextIdx: number) => {
    setQuestionIdx(nextIdx);
    setSelectedIndex(null);
    setSubmitted(false);
    setAttemptKey(`ATT-R-${lesson.id}-${nextIdx}-${Date.now()}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 w-full min-w-0">
          <IllustratedFrame
            src={lesson.image}
            alt={`Minh họa đọc hiểu câu ${lesson.english}`}
            title={lesson.english}
            aspectClass="aspect-[4/3]"
            className="w-full rounded-2xl border border-sky-100 shadow-xs"
          />
        </div>

        <div className="lg:col-span-7 w-full min-w-0 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-sky-700">
                Kỹ năng 3 · Reading Practice – Luyện Đọc
              </p>
              {completedPreviously && (
                <span className="text-sm font-semibold text-teal-700">
                  ✓ Đã hoàn thành kỹ năng Đọc
                </span>
              )}
            </div>
            <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
              {lesson.english}
            </p>
            <p className="font-mono text-sm text-sky-700 mt-1">{lesson.ipa}</p>
          </div>

          {/* Short classroom dialogue */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-2.5">
            <p className="text-sm font-semibold text-amber-900">
              Hội thoại ngắn trong lớp học
            </p>
            {lesson.dialogue.map((line, i) => (
              <div key={i} className="text-sm sm:text-base">
                <span className="font-semibold text-slate-900">{line.speakerVi}: </span>
                <span className="font-medium text-sky-950">&ldquo;{line.english}&rdquo;</span>
                <span className="block text-sm text-slate-600">{line.vietnamese}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Switcher (Rotating Reading Types) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-700">
          Dạng bài: {currentQ.typeLabelVi}
        </p>
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {lesson.readingQuestions.map((rq, idx) => (
            <button
              key={rq.id}
              type="button"
              onClick={() => handleSwitchQuestion(idx)}
              className={`min-h-[38px] rounded-lg px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                idx === questionIdx
                  ? 'bg-white text-sky-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Câu hỏi {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Prompt & Options */}
      <div className="space-y-4">
        <div>
          <h4 className="font-display text-xl font-bold text-slate-900">{currentQ.prompt}</h4>
          <p className="text-sm text-slate-600 mt-1">{currentQ.promptVi}</p>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C'][idx];
            const isSelected = selectedIndex === idx;
            const isOptionCorrect = idx === currentQ.correctIndex;

            let styleClass =
              'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/50';
            if (submitted) {
              if (isOptionCorrect) {
                styleClass = 'border-teal-500 bg-teal-50 text-teal-950 font-semibold';
              } else if (isSelected && !isOptionCorrect) {
                styleClass = 'border-rose-400 bg-rose-50 text-rose-900';
              } else {
                styleClass = 'border-slate-200 bg-slate-50/70 text-slate-500';
              }
            }

            return (
              <button
                key={opt}
                type="button"
                disabled={submitted || saving}
                onClick={() => handleChoose(idx)}
                className={`flex w-full min-h-[58px] items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left text-base transition-colors cursor-pointer disabled:cursor-default ${styleClass}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-display font-bold text-sky-900">
                  {letter}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback & Vietnamese Explanation */}
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
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">
                {isCorrect ? 'Chính xác! Great reading!' : 'Chưa chính xác – Thầy/cô xem giải thích nhé!'}
              </p>
              <p className="text-sm leading-relaxed">
                <strong>Đáp án đúng:</strong> {['A', 'B', 'C'][currentQ.correctIndex]}.{' '}
                {currentQ.options[currentQ.correctIndex]}
              </p>
              <p className="text-sm leading-relaxed">{currentQ.explanationVi}</p>
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
