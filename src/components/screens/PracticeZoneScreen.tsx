import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  Mic,
  PenTool,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { getLessonById, LESSONS } from '../../data/lessons';
import type { ScreenId, SkillType, TeacherWorkspaceData } from '../../types/app';
import { ListeningPractice } from '../skills/ListeningPractice';
import { ReadingPractice } from '../skills/ReadingPractice';
import { SpeakingPractice } from '../skills/SpeakingPractice';
import { WritingPractice } from '../skills/WritingPractice';

interface PracticeZoneScreenProps {
  workspace: TeacherWorkspaceData;
  initialMode?: 'hub' | 'mistakes';
  saving: boolean;
  onSubmitAttempt: (payload: {
    attemptId: string;
    lessonId: number;
    skill: SkillType;
    activityId: string;
    score: number;
    maximumScore: number;
    passed: boolean;
    resultStatus: 'Passed' | 'Needs Review' | 'Self-Evaluated' | 'Pending Review';
    userAnswer?: string;
    expectedAnswer?: string;
    feedback?: string;
    prompt?: string;
  }) => Promise<void>;
  onNavigate: (screen: ScreenId) => void;
}

export function PracticeZoneScreen({
  workspace,
  initialMode = 'hub',
  saving,
  onSubmitAttempt,
  onNavigate,
}: PracticeZoneScreenProps) {
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [activeMode, setActiveMode] = useState<'hub' | 'by-lesson' | 'random' | 'mistakes'>(
    initialMode === 'mistakes' ? 'mistakes' : 'hub'
  );
  const [activeLessonId, setActiveLessonId] = useState<number>(1);
  const [randomSeed, setRandomSeed] = useState(0);

  const unresolvedMistakes = (workspace?.mistakes || []).filter((m) => !m.resolved);

  const startByLesson = (skill: SkillType, lessonId = 1) => {
    setSelectedSkill(skill);
    setActiveLessonId(lessonId);
    setActiveMode('by-lesson');
  };

  const startRandom = (skill: SkillType) => {
    const nextId = Math.floor(Math.random() * LESSONS.length) + 1;
    setSelectedSkill(skill);
    setActiveLessonId(nextId);
    setRandomSeed((s) => s + 1);
    setActiveMode('random');
  };

  const pickNextRandom = () => {
    const candidates = LESSONS.map((l) => l.id).filter((id) => id !== activeLessonId);
    const nextId = candidates[Math.floor(Math.random() * candidates.length)] || 1;
    setActiveLessonId(nextId);
    setRandomSeed((s) => s + 1);
  };

  const skillCards: Array<{
    id: SkillType;
    title: string;
    titleVi: string;
    descVi: string;
    icon: typeof Headphones;
    accent: string;
  }> = [
    {
      id: 'listening',
      title: 'Listening Practice',
      titleVi: 'Luyện Nghe',
      descVi: 'Nghe giọng đọc Anh–Mỹ chuẩn, luyện tốc độ và chọn đáp án đúng theo tình huống.',
      icon: Headphones,
      accent: 'text-sky-700 bg-sky-50',
    },
    {
      id: 'speaking',
      title: 'Speaking Practice',
      titleVi: 'Luyện Nói',
      descVi: 'Nghe mẫu – Ghi âm thật – Nghe lại giọng mình – Tự đánh giá tự tin nói trên lớp.',
      icon: Mic,
      accent: 'text-rose-700 bg-rose-50',
    },
    {
      id: 'reading',
      title: 'Reading Practice',
      titleVi: 'Luyện Đọc',
      descVi: 'Đọc câu tiếng Anh chữ lớn, hiểu nghĩa và chọn cách dùng đúng trong lớp học.',
      icon: BookOpen,
      accent: 'text-teal-700 bg-teal-50',
    },
    {
      id: 'writing',
      title: 'Writing Practice',
      titleVi: 'Luyện Viết',
      descVi: 'Thực hành 3 dạng bài: Sắp xếp từ, Điền từ còn thiếu và Dịch sang tiếng Anh.',
      icon: PenTool,
      accent: 'text-amber-700 bg-amber-50',
    },
  ];

  // Active Skill Exercise Screen (By Lesson or Random)
  if ((activeMode === 'by-lesson' || activeMode === 'random') && selectedSkill) {
    const lesson = getLessonById(activeLessonId);
    const prog = workspace.progressByLesson[activeLessonId];

    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveMode('hub')}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Practice Zone</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {activeMode === 'by-lesson' ? (
              <select
                aria-label="Chọn bài học để luyện tập"
                value={activeLessonId}
                onChange={(e) => setActiveLessonId(Number(e.target.value))}
                className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800"
              >
                {LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    Bài {l.id}: {l.english}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={pickNextRandom}
                className="btn-3d-amber inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold cursor-pointer"
              >
                <Shuffle className="h-4 w-4" />
                <span>Đổi câu ngẫu nhiên khác</span>
              </button>
            )}
          </div>
        </div>

        <div className="card-3d rounded-3xl p-5 sm:p-8" key={`${selectedSkill}-${activeLessonId}-${randomSeed}`}>
          {selectedSkill === 'listening' && (
            <ListeningPractice
              lesson={lesson}
              completedPreviously={prog?.listening}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}
          {selectedSkill === 'speaking' && (
            <SpeakingPractice
              lesson={lesson}
              completedPreviously={prog?.speaking}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}
          {selectedSkill === 'reading' && (
            <ReadingPractice
              lesson={lesson}
              completedPreviously={prog?.reading}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}
          {selectedSkill === 'writing' && (
            <WritingPractice
              lesson={lesson}
              completedPreviously={prog?.writing}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}
        </div>
      </div>
    );
  }

  // Review Mistakes Screen (Screen 11)
  if (activeMode === 'mistakes') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveMode('hub')}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Practice Zone</span>
          </button>
          <span className="text-sm font-mono tabular-nums text-slate-600">
            Cần ôn lại: {unresolvedMistakes.length} câu
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            Review Mistakes – Ôn lại các câu đã làm sai
          </h1>
          <p className="text-base text-slate-600">
            Chọn bất kỳ câu nào bên dưới để luyện lại ngay. Khi thầy/cô trả lời đúng, câu đó sẽ tự động được đánh dấu đã khắc phục.
          </p>
        </div>

        {unresolvedMistakes.length === 0 ? (
          <div className="card-3d rounded-3xl p-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-teal-600 mx-auto" />
            <h2 className="font-display text-xl font-bold text-slate-900">
              Tuyệt vời! Hiện chưa có câu sai nào cần ôn lại.
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Thầy/cô có thể luyện tập ngẫu nhiên hoặc làm bài Kiểm tra cuối tháng để củng cố kiến thức nhé!
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => startRandom('listening')}
                className="btn-3d-primary min-h-[44px] rounded-xl px-5 py-2 text-sm font-semibold cursor-pointer"
              >
                Luyện nghe ngẫu nhiên
              </button>
              <button
                type="button"
                onClick={() => onNavigate('final-challenge')}
                className="btn-3d-amber min-h-[44px] rounded-xl px-5 py-2 text-sm font-bold cursor-pointer"
              >
                Vào Kiểm tra cuối tháng
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {unresolvedMistakes.map((m) => {
              const lesson = getLessonById(m.lessonId);
              return (
                <div
                  key={m.id}
                  className="card-3d rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-sky-700">
                      Bài {m.lessonId}: {lesson.english} · Kỹ năng:{' '}
                      {m.skill === 'listening'
                        ? 'Luyện Nghe'
                        : m.skill === 'reading'
                          ? 'Luyện Đọc'
                          : 'Luyện Viết'}
                    </p>
                    <p className="font-semibold text-slate-900">{m.prompt}</p>
                    <p className="text-sm text-slate-600">
                      Đã chọn/viết: <span className="text-rose-700 font-medium">{m.wrongAnswer || '(trống)'}</span>{' '}
                      · Đáp án đúng: <span className="text-teal-700 font-semibold">{m.correctAnswer}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startByLesson(m.skill, m.lessonId)}
                    className="btn-3d-primary min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Luyện lại ngay</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Practice Zone Hub (Screen 10)
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Luyện tập tổng hợp · Hoạt động thực tế có chấm điểm & lưu kết quả
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            PRACTICE ZONE – LUYỆN TẬP
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Chọn kỹ năng muốn rèn luyện theo từng câu, luyện ngẫu nhiên, ôn lại lỗi sai hoặc vào Kiểm tra cuối tháng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveMode('mistakes')}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Review Mistakes ({unresolvedMistakes.length} câu cần ôn)</span>
        </button>
      </div>

      {/* 4 Big Skill Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {skillCards.map((card) => {
          const Icon = card.icon;
          const completedCount = Object.values(workspace.progressByLesson).filter(
            (p) => p[card.id]
          ).length;

          return (
            <div key={card.id} className="card-3d rounded-3xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="font-mono tabular-nums text-sm font-semibold text-teal-700">
                    {completedCount}/10 bài đã đạt
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">
                    {card.title}
                  </h2>
                  <p className="text-sm font-semibold text-sky-700">{card.titleVi}</p>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{card.descVi}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => startByLesson(card.id, workspace.profile.lastLessonId || 1)}
                  className="btn-3d-primary min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
                >
                  <span>Practice by Lesson</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => startRandom(card.id)}
                  className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 cursor-pointer"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Random Practice</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('mistakes')}
                  className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Review Mistakes ({unresolvedMistakes.filter((m) => m.skill === card.id).length})
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('final-challenge')}
                  className="min-h-[42px] inline-flex items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  <span>Final Challenge</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
