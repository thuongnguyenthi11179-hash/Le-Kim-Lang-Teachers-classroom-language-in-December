import { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Dumbbell,
  PlayCircle,
  Trophy,
  FileText,
  Presentation,
  Download,
  Sparkles,
} from 'lucide-react';
import { DECEMBER_PLAN_WEEKS, LESSONS } from '../../data/lessons';
import type { ScreenId, TeacherWorkspaceData } from '../../types/app';
import { computeWorkspaceStats } from '../../utils/badges';
import { IllustratedFrame } from '../IllustratedFrame';
import {
  exportTeacherHandbookDoc,
  exportPresentationSlides,
} from '../../utils/documentExporter';

interface TeacherDashboardScreenProps {
  workspace: TeacherWorkspaceData;
  welcomeBack: boolean;
  viewMode: 'dashboard' | 'lessons';
  onOpenLesson: (lessonId: number) => void;
  onNavigate: (screen: ScreenId) => void;
}

const MILESTONES = [0, 25, 50, 75, 100];

export function TeacherDashboardScreen({
  workspace,
  welcomeBack,
  viewMode,
  onOpenLesson,
  onNavigate,
}: TeacherDashboardScreenProps) {
  const [filterWeek, setFilterWeek] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  const stats = computeWorkspaceStats(workspace);
  const profile = workspace?.profile || {
    teacherId: 'GV-01',
    fullName: 'Thầy/Cô Giáo Viên',
    professionalGroup: 'Tổ 1',
    email: '',
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    accountStatus: 'Active' as const,
    lastLessonId: 1,
  };
  const progressByLesson = workspace?.progressByLesson || {};
  const sheetsStatus = workspace?.sheetsStatus;

  const continueLessonId = profile.lastLessonId || stats?.nextLessonId || 1;
  const continueLesson = LESSONS.find((l) => l.id === continueLessonId) || LESSONS[0];

  const filteredLessons = LESSONS.filter((lesson) => {
    const prog = progressByLesson[lesson.id];
    if (filterWeek !== 'all' && lesson.week !== filterWeek) return false;
    if (filterStatus !== 'all' && prog?.status !== filterStatus) return false;
    return true;
  });

  const statusMeta = (status: string) => {
    if (status === 'completed') {
      return { text: 'Completed – Hoàn thành', textClass: 'text-teal-700 font-semibold' };
    }
    if (status === 'in_progress') {
      return { text: 'In Progress – Đang học', textClass: 'text-amber-700 font-semibold' };
    }
    return { text: 'Not Started – Chưa học', textClass: 'text-slate-500 font-medium' };
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
      {/* Welcome / Greeting Hero Card */}
      {viewMode === 'dashboard' && (
        <section className="card-3d rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-white via-sky-50/40 to-teal-50/30 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-sky-700">
                {welcomeBack
                  ? `Welcome back, ${profile.fullName}!`
                  : `Xin chào thầy/cô ${profile.fullName}!`}{' '}
                · {profile.professionalGroup} · Mã: {profile.teacherId}
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900">
                Hello, Teacher! Ready to speak English today?
              </h1>
              <p className="text-base text-slate-600">
                Nhiệm vụ tiếp theo: <strong>Bài {continueLesson.id} – &ldquo;{continueLesson.english}&rdquo;</strong> ({continueLesson.vietnamese})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLesson(continueLesson.id)}
                className="btn-3d-primary inline-flex min-h-[50px] items-center gap-2 rounded-2xl px-6 py-3 text-base font-bold whitespace-nowrap cursor-pointer"
              >
                <PlayCircle className="h-5 w-5" aria-hidden="true" />
                <span>Tiếp tục học Bài {continueLesson.id}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="inline-flex min-h-[50px] items-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-900 hover:bg-sky-50 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Dumbbell className="h-4 w-4" aria-hidden="true" />
                <span>Practice Zone</span>
              </button>
            </div>
          </div>

          {/* Progress Bar with 0%, 25%, 50%, 75%, 100% milestones */}
          <div className="space-y-2.5 pt-2 border-t border-sky-100">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Tiến độ hoàn thành Thử thách Tháng 12
              </span>
              <span className="font-mono tabular-nums text-base font-bold text-sky-800">
                {stats.completedLessons}/10 câu hoàn thành ({stats.overallPercent}% tổng kỹ năng)
              </span>
            </div>
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${stats.overallPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-500">
              {MILESTONES.map((m) => (
                <span
                  key={m}
                  className={stats.overallPercent >= m ? 'font-bold text-teal-700' : ''}
                >
                  {m}%
                </span>
              ))}
            </div>
          </div>

          {/* 4-column KPI Strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 pt-1">
            <div className="rounded-2xl border border-sky-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>Bài đã hoàn thành</span>
              </div>
              <p className="mt-1 font-display font-mono tabular-nums text-2xl font-bold text-slate-900">
                {stats.completedLessons}/10
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CalendarDays className="h-4 w-4 text-sky-600" />
                <span>Số ngày học thực tế</span>
              </div>
              <p className="mt-1 font-display font-mono tabular-nums text-2xl font-bold text-slate-900">
                {stats.activeDaysCount} ngày
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span>Điểm luyện tập</span>
              </div>
              <p className="mt-1 font-display font-mono tabular-nums text-2xl font-bold text-slate-900">
                {stats.practicePoints}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Clock className="h-4 w-4 text-rose-500" />
                <span>Trạng thái đồng bộ</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">
                {sheetsStatus?.verified ? 'Đã kết nối Sheets' : 'Chế độ dùng thử'}
              </p>
            </div>
          </div>

          {/* Quick Secondary Links */}
          <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
            <button
              type="button"
              onClick={() => onNavigate('achievements')}
              className="inline-flex items-center gap-1.5 font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
            >
              <Award className="h-4 w-4" />
              <span>Xem Huy hiệu thành tích</span>
            </button>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('mistakes')}
              className="inline-flex items-center gap-1.5 font-semibold text-sky-800 hover:text-sky-950 cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
              <span>Ôn lại lỗi sai ({stats.unresolvedMistakes})</span>
            </button>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onNavigate('final-challenge')}
              className="inline-flex items-center gap-1.5 font-semibold text-teal-800 hover:text-teal-950 cursor-pointer"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Kiểm tra cuối tháng (100 điểm)</span>
            </button>
          </div>

          {/* Teaching Resource Center (docx-official & pptx-official) */}
          <div className="rounded-2xl border border-sky-100 bg-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  Kho Giáo Cụ & Tài Liệu Sư Phạm (Lê Kim Lăng)
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">Mới</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Xuất file Word giáo án in ấn và slide trình chiếu PowerPoint cho lớp học
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => exportTeacherHandbookDoc()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-900 hover:bg-sky-100 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-sky-700" />
                Tải Sổ Tay Word (.doc)
              </button>
              <button
                type="button"
                onClick={() => exportPresentationSlides()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Presentation className="h-3.5 w-3.5 text-indigo-700" />
                Trình Chiếu Slide (.html / PPT)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 10 Lessons Grid + Filter Controls */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {viewMode === 'lessons'
                ? 'Danh sách 10 bài học & Kế hoạch Tháng 12'
                : '10 câu giao tiếp lớp học Tháng 12'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Bài học chỉ được đánh dấu <strong>Hoàn thành</strong> khi thầy/cô đã thực hành đầy đủ 4 kỹ năng Nghe – Nói – Đọc – Viết.
            </p>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(
                [
                  { id: 'all', label: 'Tất cả' },
                  { id: 1, label: 'Tuần 1' },
                  { id: 2, label: 'Tuần 2' },
                  { id: 3, label: 'Tuần 3' },
                  { id: 4, label: 'Tuần 4' },
                ] as const
              ).map((w) => (
                <button
                  key={String(w.id)}
                  type="button"
                  onClick={() => setFilterWeek(w.id)}
                  className={`min-h-[38px] rounded-lg px-3 py-1 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    filterWeek === w.id
                      ? 'bg-white text-sky-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Lọc theo trạng thái bài học"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as 'all' | 'not_started' | 'in_progress' | 'completed'
                )
              }
              className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="not_started">Chưa học</option>
              <option value="in_progress">Đang học</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
        </div>

        {/* 10 Lesson 3D Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
            const prog = progressByLesson[lesson.id];
            const st = statusMeta(prog?.status || 'not_started');
            const pct = prog?.completionPercentage || 0;

            return (
              <article
                key={lesson.id}
                className="card-3d card-3d-interactive rounded-2xl overflow-hidden flex flex-col"
              >
                <IllustratedFrame
                  src={lesson.image}
                  alt={`Bài ${lesson.id}: ${lesson.english}`}
                  title={lesson.english}
                  aspectClass="aspect-[4/3]"
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>Bài {lesson.id} · Tuần {lesson.week}</span>
                      <span className={`font-mono tabular-nums ${st.textClass}`}>{pct}%</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      {lesson.english}
                    </h3>
                    <p className="text-sm font-medium text-slate-600">{lesson.vietnamese}</p>
                    <p className="font-mono text-xs text-sky-700">{lesson.ipa}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* 4-skill mini progress dots with text labels */}
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className={prog?.listening ? 'font-semibold text-teal-700' : ''}>
                        {prog?.listening ? '✓' : '○'} Nghe
                      </span>
                      <span className={prog?.speaking ? 'font-semibold text-teal-700' : ''}>
                        {prog?.speaking ? '✓' : '○'} Nói
                      </span>
                      <span className={prog?.reading ? 'font-semibold text-teal-700' : ''}>
                        {prog?.reading ? '✓' : '○'} Đọc
                      </span>
                      <span className={prog?.writing ? 'font-semibold text-teal-700' : ''}>
                        {prog?.writing ? '✓' : '○'} Viết
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs ${st.textClass}`}>{st.text}</span>
                      <button
                        type="button"
                        onClick={() => onOpenLesson(lesson.id)}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 whitespace-nowrap transition-colors cursor-pointer"
                      >
                        <span>{prog?.status === 'completed' ? 'Ôn lại' : 'Học bài'}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredLessons.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Không có bài học nào khớp bộ lọc hiện tại. Thầy/cô hãy chọn &ldquo;Tất cả&rdquo; để xem đủ 10 bài.
          </div>
        )}
      </section>

      {/* December 4-Week Suggested Plan */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            December Learning Plan – Lịch học gợi ý 4 tuần
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Không khóa bài theo tuần — thầy cô có thể học trước hoặc học bù linh hoạt theo lịch giảng dạy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {DECEMBER_PLAN_WEEKS.map((w) => {
            const doneInWeek = w.lessonIds.filter(
              (id) => progressByLesson[id]?.status === 'completed'
            ).length;
            return (
              <div key={w.week} className="card-3d rounded-2xl p-5 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-base font-bold text-sky-900">Tuần {w.week}</p>
                  <span className="font-mono tabular-nums text-xs font-semibold text-teal-700">
                    {doneInWeek}/{w.lessonIds.length} bài
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500">{w.subtitleVi}</p>
                <div className="space-y-1.5 pt-1">
                  {w.lessonIds.map((id) => {
                    const l = LESSONS.find((item) => item.id === id)!;
                    const done = progressByLesson[id]?.status === 'completed';
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onOpenLesson(id)}
                        className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-sky-50 transition-colors cursor-pointer"
                      >
                        <span className="font-medium text-slate-800 truncate">
                          {done ? '✓ ' : `${id}. `}
                          {l.english}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Challenge Banner Card */}
        <div className="card-3d rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/70 via-white to-sky-50/70">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-800">
              Cuối tháng 12/2026 · Tích hợp 4 kỹ năng (100 điểm)
            </p>
            <h3 className="font-display text-xl font-bold text-slate-900">
              DECEMBER FINAL CHALLENGE – Kiểm tra tổng hợp cuối tháng
            </h3>
            <p className="text-sm text-slate-600">
              Listening (25đ) · Speaking (25đ) · Reading (25đ) · Writing (25đ)
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('final-challenge')}
            className="btn-3d-amber min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Vào bài kiểm tra</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
