import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  Home,
  Mic,
  PenTool,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getLessonById, LESSONS } from '../../data/lessons';
import type { LessonSkillProgress, SkillType } from '../../types/app';
import { AudioPlayerBar } from '../AudioPlayerBar';
import { IllustratedFrame } from '../IllustratedFrame';
import { ListeningPractice } from '../skills/ListeningPractice';
import { ReadingPractice } from '../skills/ReadingPractice';
import { SpeakingPractice } from '../skills/SpeakingPractice';
import { WritingPractice } from '../skills/WritingPractice';

type DetailTab = 'overview' | SkillType;

interface LessonDetailScreenProps {
  lessonId: number;
  initialTab?: DetailTab;
  progress: LessonSkillProgress;
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
  onSelectLesson: (id: number) => void;
  onBack: () => void;
  onHome: () => void;
}

export function LessonDetailScreen({
  lessonId,
  initialTab = 'overview',
  progress,
  saving,
  onSubmitAttempt,
  onSelectLesson,
  onBack,
  onHome,
}: LessonDetailScreenProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [resetSeed, setResetSeed] = useState(0);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  const lesson = getLessonById(lessonId);

  useEffect(() => {
    setActiveTab(initialTab);
    setCompletionBanner(null);
  }, [lessonId, initialTab]);

  const allFourDone =
    progress.listening && progress.speaking && progress.reading && progress.writing;

  const missingSkills: string[] = [];
  if (!progress.listening) missingSkills.push('Luyện nghe');
  if (!progress.speaking) missingSkills.push('Luyện nói');
  if (!progress.reading) missingSkills.push('Luyện đọc');
  if (!progress.writing) missingSkills.push('Luyện viết');

  const handleCompleteClick = () => {
    if (!allFourDone) {
      setCompletionBanner(
        `Bài học chưa thể đánh dấu hoàn thành vì thầy/cô còn thiếu: ${missingSkills.join(', ')}. Hãy hoàn thành hoạt động ở từng kỹ năng nhé!`
      );
      return;
    }
    setCompletionBanner(
      `Chúc mừng thầy/cô đã hoàn thành 100% Bài ${lesson.id} ("${lesson.english}")! Kết quả đã được lưu.`
    );
  };

  const handleStudyAgain = () => {
    setResetSeed((s) => s + 1);
    setActiveTab('overview');
    setCompletionBanner(null);
  };

  const tabs: Array<{ id: DetailTab; label: string; done?: boolean }> = [
    { id: 'overview', label: 'Giới thiệu bài' },
    { id: 'listening', label: '1. Luyện Nghe', done: progress.listening },
    { id: 'speaking', label: '2. Luyện Nói', done: progress.speaking },
    { id: 'reading', label: '3. Luyện Đọc', done: progress.reading },
    { id: 'writing', label: '4. Luyện Viết', done: progress.writing },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* Top Action Bar: BACK, HOME, NEXT LESSON */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>BACK</span>
          </button>
          <button
            type="button"
            onClick={onHome}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>HOME</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-mono tabular-nums text-slate-600">
            Bài {lesson.id}/10 · Tiến độ {progress.completionPercentage}%
          </span>
          {lesson.id < LESSONS.length && (
            <button
              type="button"
              onClick={() => onSelectLesson(lesson.id + 1)}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap cursor-pointer"
            >
              <span>NEXT LESSON</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lesson Title Strip + Skill Tabs */}
      <div className="card-3d rounded-3xl p-5 sm:p-7 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-sm font-semibold text-sky-700">
              Bài {lesson.id} · {lesson.weekTitle}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
              {lesson.english}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 mt-1">
              {lesson.vietnamese} · <span className="font-mono text-sky-700">{lesson.ipa}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleStudyAgain}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Học lại</span>
            </button>
            <button
              type="button"
              onClick={handleCompleteClick}
              className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer ${
                allFourDone
                  ? 'btn-3d-teal'
                  : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{allFourDone ? 'Đã hoàn thành bài học' : 'Hoàn thành bài học'}</span>
            </button>
          </div>
        </div>

        {/* 5 Segmented Tabs */}
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5"
          role="tablist"
          aria-label="Các phần trong bài học"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-sky-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.done ? '✓ ' : ''}
                {tab.label}
              </button>
            );
          })}
        </div>

        {completionBanner && (
          <div
            className={`rounded-2xl border p-4 text-sm font-medium ${
              allFourDone
                ? 'border-teal-200 bg-teal-50 text-teal-950'
                : 'border-amber-200 bg-amber-50 text-amber-950'
            }`}
          >
            {completionBanner}
          </div>
        )}

        {/* Active Tab Content */}
        <div key={`${lesson.id}-${activeTab}-${resetSeed}`}>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-5">
                  <IllustratedFrame
                    src={lesson.image}
                    alt={`Hình minh họa 3D cho câu ${lesson.english}`}
                    title={lesson.english}
                    aspectClass="aspect-[4/3] lg:h-full"
                    className="rounded-2xl border border-sky-100"
                  />
                </div>

                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        Tình huống sử dụng trong lớp học
                      </h2>
                      <p className="text-base text-slate-700 mt-1 leading-relaxed">
                        <strong>{lesson.situationTitleVi}:</strong> {lesson.situationDescVi}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-sky-900">
                        Nghe phát âm mẫu (ưu tiên giọng Anh–Mỹ)
                      </p>
                      <AudioPlayerBar text={lesson.english} />
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
                      <p className="text-sm font-semibold text-amber-900">
                        Hội thoại lớp học ngắn cho người mới bắt đầu
                      </p>
                      {lesson.dialogue.map((line, i) => (
                        <div key={i} className="text-sm sm:text-base">
                          <span className="font-semibold text-slate-900">{line.speakerVi}: </span>
                          <span className="font-semibold text-sky-950">&ldquo;{line.english}&rdquo;</span>
                          <span className="block text-sm text-slate-600">{line.vietnamese}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Jump into 4 Skills */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Bắt đầu thực hành 4 kỹ năng cho câu này
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      id: 'listening' as const,
                      title: '1. Luyện Nghe',
                      desc: 'Nghe câu và chọn đáp án đúng',
                      done: progress.listening,
                      icon: Headphones,
                    },
                    {
                      id: 'speaking' as const,
                      title: '2. Luyện Nói',
                      desc: 'Ghi âm, nghe lại và tự đánh giá',
                      done: progress.speaking,
                      icon: Mic,
                    },
                    {
                      id: 'reading' as const,
                      title: '3. Luyện Đọc',
                      desc: 'Hiểu nghĩa & tình huống lớp học',
                      done: progress.reading,
                      icon: BookOpen,
                    },
                    {
                      id: 'writing' as const,
                      title: '4. Luyện Viết',
                      desc: 'Sắp xếp, điền từ và dịch câu',
                      done: progress.writing,
                      icon: PenTool,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-colors cursor-pointer ${
                          item.done
                            ? 'border-teal-200 bg-teal-50/50 hover:border-teal-400'
                            : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="h-5 w-5 text-sky-700" />
                          <span
                            className={`text-xs font-semibold ${
                              item.done ? 'text-teal-700' : 'text-slate-500'
                            }`}
                          >
                            {item.done ? '✓ Đã đạt' : 'Chưa làm'}
                          </span>
                        </div>
                        <p className="font-display text-base font-bold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listening' && (
            <ListeningPractice
              lesson={lesson}
              completedPreviously={progress.listening}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}

          {activeTab === 'speaking' && (
            <SpeakingPractice
              lesson={lesson}
              completedPreviously={progress.speaking}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}

          {activeTab === 'reading' && (
            <ReadingPractice
              lesson={lesson}
              completedPreviously={progress.reading}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}

          {activeTab === 'writing' && (
            <WritingPractice
              lesson={lesson}
              completedPreviously={progress.writing}
              onSubmitResult={onSubmitAttempt}
              saving={saving}
            />
          )}
        </div>

        {/* Bottom Step Flow Helper */}
        {activeTab !== 'overview' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="text-sm font-semibold text-slate-600 hover:text-sky-800 cursor-pointer"
            >
              ← Quay lại Giới thiệu bài {lesson.id}
            </button>

            <div className="flex items-center gap-2">
              {activeTab === 'listening' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('speaking')}
                  className="btn-3d-primary min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
                >
                  <span>Sang bước 2: Luyện Nói</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {activeTab === 'speaking' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reading')}
                  className="btn-3d-primary min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
                >
                  <span>Sang bước 3: Luyện Đọc</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {activeTab === 'reading' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('writing')}
                  className="btn-3d-primary min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
                >
                  <span>Sang bước 4: Luyện Viết</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {activeTab === 'writing' && lesson.id < 10 && (
                <button
                  type="button"
                  onClick={() => onSelectLesson(lesson.id + 1)}
                  className="btn-3d-teal min-h-[42px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Học tiếp Bài {lesson.id + 1}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
