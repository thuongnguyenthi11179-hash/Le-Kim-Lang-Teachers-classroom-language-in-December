import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Undo2,
  XCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import type { LessonData } from '../../types/app';
import {
  checkArrangeSentence,
  checkCompleteWord,
  checkTranslationAnswer,
  type WritingCheckResult,
} from '../../utils/writingGrader';
import {
  generateWithFallback,
  getStoredApiKey,
  type FallbackAttemptStatus,
} from '../../utils/gemini';

type WritingMode = 'arrange' | 'complete' | 'translate';

interface WritingPracticeProps {
  lesson: LessonData;
  completedPreviously?: boolean;
  onSubmitResult: (payload: {
    attemptId: string;
    lessonId: number;
    skill: 'writing';
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

function joinTokensSmart(tokens: string[]): string {
  return tokens.reduce((acc, tok, idx) => {
    if (idx === 0) return tok;
    if (/^[!?.,]$/.test(tok)) return acc + tok;
    return `${acc} ${tok}`;
  }, '');
}

export function WritingPractice({
  lesson,
  completedPreviously,
  onSubmitResult,
  saving = false,
}: WritingPracticeProps) {
  const [mode, setMode] = useState<WritingMode>('arrange');
  const [selectedTokenIndices, setSelectedTokenIndices] = useState<number[]>([]);
  const [completeInput, setCompleteInput] = useState('');
  const [translateInput, setTranslateInput] = useState('');
  const [result, setResult] = useState<WritingCheckResult | null>(null);
  const [attemptKey, setAttemptKey] = useState(() => `ATT-W-${lesson.id}-arrange-${Date.now()}`);

  // AI Gemini Tutor State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fallbackStatuses, setFallbackStatuses] = useState<FallbackAttemptStatus[]>([]);

  useEffect(() => {
    setMode('arrange');
    setSelectedTokenIndices([]);
    setCompleteInput('');
    setTranslateInput('');
    setResult(null);
    setAiFeedback(null);
    setAiError(null);
    setFallbackStatuses([]);
    setAttemptKey(`ATT-W-${lesson.id}-arrange-${Date.now()}`);
  }, [lesson.id]);

  const switchMode = (nextMode: WritingMode) => {
    setMode(nextMode);
    setSelectedTokenIndices([]);
    setCompleteInput('');
    setTranslateInput('');
    setResult(null);
    setAiFeedback(null);
    setAiError(null);
    setFallbackStatuses([]);
    setAttemptKey(`ATT-W-${lesson.id}-${nextMode}-${Date.now()}`);
  };

  const handleRetry = () => {
    setSelectedTokenIndices([]);
    setCompleteInput('');
    setTranslateInput('');
    setResult(null);
    setAiFeedback(null);
    setAiError(null);
    setFallbackStatuses([]);
    setAttemptKey(`ATT-W-${lesson.id}-${mode}-${Date.now()}`);
  };

  const handleConsultAiTutor = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiFeedback(null);

    let currentAnswer = '';
    if (mode === 'arrange') currentAnswer = arrangedSentence;
    else if (mode === 'complete') currentAnswer = completeInput.trim();
    else if (mode === 'translate') currentAnswer = translateInput.trim();

    const prompt = `Bạn là Trợ lý Sư phạm Tiếng Anh Tiểu học thuộc Trường TH Lê Kim Lăng.
Giáo viên vừa thực hiện bài tập viết/nói:
- Bài học số: ${lesson.id}
- Khẩu lệnh chuẩn: "${lesson.english}" (${lesson.vietnamese})
- Ngữ cảnh lớp học: ${lesson.situationDescVi}
- Đáp án của giáo viên: "${currentAnswer || '(Chưa nhập)'}"
- Kết quả kiểm tra hệ thống: ${result?.isCorrect ? 'Đúng' : 'Cần xem lại'}

Hãy nhận xét sư phạm ngắn gọn (3-4 câu) bằng tiếng Việt:
1. Góp ý về cách diễn đạt và độ tự nhiên khi dùng câu này với học sinh tiểu học.
2. Gợi ý cử chỉ hoặc ngữ điệu biểu cảm (VD: mỉm cười, vỗ tay khích lệ).
3. Đưa ra 1 câu mẫu tương đương thường dùng trong lớp học.`;

    try {
      const res = await generateWithFallback(prompt, {
        onStatusChange: (statuses) => setFallbackStatuses(statuses),
      });
      setAiFeedback(res.text);
      setAiModelUsed(res.modelUsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const arrangedSentence = joinTokensSmart(
    selectedTokenIndices.map((idx) => lesson.writing.arrange.tokens[idx])
  );

  const handleCheck = async () => {
    if (saving) return;
    let checkRes: WritingCheckResult;
    let activityId = '';
    let userAnswer = '';
    let expectedAnswer = '';
    let prompt = '';

    if (mode === 'arrange') {
      userAnswer = arrangedSentence;
      expectedAnswer = lesson.writing.arrange.correctSentence;
      activityId = lesson.writing.arrange.id;
      prompt = `Sắp xếp từ thành câu: ${lesson.writing.arrange.tokens.join(' / ')}`;
      checkRes = checkArrangeSentence(userAnswer, expectedAnswer);
    } else if (mode === 'complete') {
      userAnswer = completeInput.trim();
      expectedAnswer = lesson.writing.complete.missingWord;
      activityId = lesson.writing.complete.id;
      prompt = `Điền từ còn thiếu: ${lesson.writing.complete.promptTemplate}`;
      checkRes = checkCompleteWord(
        userAnswer,
        lesson.writing.complete.acceptedWords,
        lesson.writing.complete.missingWord
      );
    } else {
      userAnswer = translateInput.trim();
      expectedAnswer = lesson.writing.translate.referenceAnswer;
      activityId = lesson.writing.translate.id;
      prompt = `Dịch sang tiếng Anh: ${lesson.writing.translate.vietnamesePrompt}`;
      checkRes = checkTranslationAnswer(
        userAnswer,
        lesson.writing.translate.referenceAnswer,
        lesson.writing.translate.acceptedSynonyms
      );
    }

    setResult(checkRes);

    await onSubmitResult({
      attemptId: attemptKey,
      lessonId: lesson.id,
      skill: 'writing',
      activityId,
      score: checkRes.isCorrect ? 10 : 0,
      maximumScore: 10,
      passed: checkRes.isCorrect,
      resultStatus: checkRes.isCorrect ? 'Passed' : 'Needs Review',
      userAnswer,
      expectedAnswer,
      feedback: checkRes.feedbackVi,
      prompt,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm font-medium text-sky-700">
            Kỹ năng 4 · Writing Practice – Luyện Viết
          </p>
          <h3 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Thực hành viết câu theo 3 dạng bài
          </h3>
        </div>
        {completedPreviously && (
          <span className="text-sm font-semibold text-teal-700 whitespace-nowrap">
            ✓ Đã hoàn thành kỹ năng Viết
          </span>
        )}
      </div>

      {/* Mode Tabs */}
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Chọn dạng bài luyện viết"
      >
        {(
          [
            { id: 'arrange', label: '1. Sắp xếp từ' },
            { id: 'complete', label: '2. Điền từ còn thiếu' },
            { id: 'translate', label: '3. Dịch sang tiếng Anh' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => switchMode(tab.id)}
            className={`min-h-[42px] rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              mode === tab.id
                ? 'bg-white text-sky-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode 1: Arrange the Words */}
      {mode === 'arrange' && (
        <div className="space-y-4">
          <p className="text-base text-slate-700">
            Bấm lần lượt các thẻ từ bên dưới để ghép thành câu tiếng Anh có nghĩa là{' '}
            <strong>&ldquo;{lesson.vietnamese}&rdquo;</strong>:
          </p>

          {/* Constructed Sentence Box */}
          <div className="min-h-[72px] rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-4 flex flex-wrap items-center gap-2">
            {selectedTokenIndices.length === 0 ? (
              <span className="text-slate-400 text-base">
                Câu của thầy/cô sẽ hiện ở đây...
              </span>
            ) : (
              selectedTokenIndices.map((tokenIdx, pos) => (
                <button
                  key={`${tokenIdx}-${pos}`}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() =>
                    setSelectedTokenIndices((prev) => prev.filter((_, i) => i !== pos))
                  }
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 font-display text-lg font-semibold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
                >
                  {lesson.writing.arrange.tokens[tokenIdx]}
                </button>
              ))
            )}
          </div>

          {/* Available Word Tiles */}
          <div className="flex flex-wrap gap-2.5">
            {lesson.writing.arrange.tokens.map((token, idx) => {
              const used = selectedTokenIndices.includes(idx);
              return (
                <button
                  key={`${token}-${idx}`}
                  type="button"
                  disabled={used || Boolean(result)}
                  onClick={() => setSelectedTokenIndices((prev) => [...prev, idx])}
                  className={`min-h-[46px] rounded-xl border-2 px-4 py-2 font-display text-lg font-semibold transition-colors cursor-pointer ${
                    used
                      ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'border-sky-200 bg-white text-sky-950 hover:border-sky-500 hover:bg-sky-50 shadow-sm'
                  }`}
                >
                  {token}
                </button>
              );
            })}
          </div>

          {!result && selectedTokenIndices.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTokenIndices((prev) => prev.slice(0, -1))}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Undo2 className="h-4 w-4" />
              <span>Xóa từ cuối cùng</span>
            </button>
          )}
        </div>
      )}

      {/* Mode 2: Complete the Sentence */}
      {mode === 'complete' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-6 text-center space-y-2">
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {lesson.writing.complete.promptTemplate}
            </p>
            <p className="text-base text-slate-600">
              Nghĩa: {lesson.vietnamese}
            </p>
            <p className="text-sm text-sky-800">Gợi ý: {lesson.writing.complete.hintVi}</p>
          </div>

          <div>
            <label
              htmlFor="complete-word-input"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Nhập từ còn thiếu vào chỗ trống:
            </label>
            <input
              id="complete-word-input"
              type="text"
              value={completeInput}
              disabled={Boolean(result)}
              onChange={(e) => setCompleteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && completeInput.trim() && !result) {
                  void handleCheck();
                }
              }}
              placeholder="Ví dụ: done"
              className="w-full max-w-md min-h-[50px] rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* Mode 3: Translate into English */}
      {mode === 'translate' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 text-center space-y-2">
            <p className="text-sm font-medium text-amber-800">
              Viết câu tiếng Anh tương ứng với nghĩa sau:
            </p>
            <p className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              &ldquo;{lesson.writing.translate.vietnamesePrompt}&rdquo;
            </p>
            <p className="text-sm text-slate-600">{lesson.writing.translate.tipVi}</p>
          </div>

          <div>
            <label
              htmlFor="translate-input"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Câu tiếng Anh của thầy/cô:
            </label>
            <input
              id="translate-input"
              type="text"
              value={translateInput}
              disabled={Boolean(result)}
              onChange={(e) => setTranslateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && translateInput.trim() && !result) {
                  void handleCheck();
                }
              }}
              placeholder="Nhập câu tiếng Anh..."
              className="w-full min-h-[52px] rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus:border-sky-500"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={
              saving ||
              (mode === 'arrange' && selectedTokenIndices.length === 0) ||
              (mode === 'complete' && !completeInput.trim()) ||
              (mode === 'translate' && !translateInput.trim())
            }
            onClick={() => void handleCheck()}
            className="btn-3d-primary min-h-[48px] rounded-xl px-6 py-2.5 text-base font-semibold disabled:opacity-45 cursor-pointer"
          >
            {saving ? 'Đang chấm bài...' : 'Kiểm tra đáp án'}
          </button>
        </div>
      )}

      {/* Result Feedback */}
      {result && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 ${
            result.isCorrect
              ? 'border-teal-200 bg-teal-50 text-teal-950'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.isCorrect ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-teal-600 mt-0.5" />
            ) : (
              <XCircle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-display text-lg font-bold">{result.feedbackEn}</p>
              <p className="text-sm leading-relaxed">{result.feedbackVi}</p>
              <p className="text-sm text-slate-700">
                <strong>Câu mẫu chuẩn:</strong> {lesson.english}
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

      {/* AI Gemini Pedagogical Tutor Consultation (ai-agents-architect) */}
      {result && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-sky-50/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-slate-900">
                  AI Gemini – Trợ Lý Sư Phạm Tiếng Anh
                </h4>
                <p className="text-xs text-slate-500">
                  Phân tích ngữ cảnh lớp học, cử chỉ và tình huống giao tiếp với học sinh tiểu học
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleConsultAiTutor()}
              disabled={aiLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phân tích sư phạm...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Hỏi AI nhận xét sư phạm
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

          {/* AI Response Output */}
          {aiFeedback && (
            <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Góp ý sư phạm từ AI ({aiModelUsed})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Gemini AI Studio</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {aiFeedback}
              </p>
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
      )}
    </div>
  );
}
