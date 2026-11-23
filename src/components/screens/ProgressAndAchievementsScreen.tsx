import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  CloudOff,
  CloudUpload,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { LESSONS } from '../../data/lessons';
import type { TeacherWorkspaceData } from '../../types/app';
import { computeBadges, computeWorkspaceStats } from '../../utils/badges';

interface ProgressAndAchievementsScreenProps {
  workspace: TeacherWorkspaceData;
  initialTab: 'progress' | 'achievements';
  onOpenLesson: (lessonId: number) => void;
  onRetrySync: () => Promise<void>;
}

export function ProgressAndAchievementsScreen({
  workspace,
  initialTab,
  onOpenLesson,
  onRetrySync,
}: ProgressAndAchievementsScreenProps) {
  const [tab, setTab] = useState<'progress' | 'achievements'>(initialTab);
  const [retrying, setRetrying] = useState(false);

  const stats = computeWorkspaceStats(workspace);
  const badges = computeBadges(workspace);
  const earnedCount = badges.filter((b) => b.earned).length;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    if (mins === 0) return `${rem} giây`;
    return `${mins} phút ${rem} giây`;
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetrySync();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Hồ sơ học tập cá nhân · {workspace.profile.fullName} ({workspace.profile.professionalGroup})
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            {tab === 'progress'
              ? 'My Learning Progress – Tiến độ của tôi'
              : 'My Achievements – Huy hiệu động viên'}
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('progress')}
            className={`min-h-[40px] rounded-lg px-4 py-1.5 text-sm font-semibold whitespace-nowrap cursor-pointer ${
              tab === 'progress' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Tiến độ học tập
          </button>
          <button
            type="button"
            onClick={() => setTab('achievements')}
            className={`min-h-[40px] rounded-lg px-4 py-1.5 text-sm font-semibold whitespace-nowrap cursor-pointer ${
              tab === 'achievements' ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Huy hiệu ({earnedCount}/5)
          </button>
        </div>
      </div>

      {/* Honest Sync Status Strip */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          workspace.sheetsStatus?.verified
            ? 'border-teal-200 bg-teal-50/70 text-teal-950'
            : 'border-amber-200 bg-amber-50/70 text-amber-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {workspace.sheetsStatus?.verified ? (
            <CloudUpload className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          ) : (
            <CloudOff className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-semibold">{workspace.sheetsStatus?.label || 'Chế độ hoạt động ngoại tuyến'}</p>
            <p className="text-xs opacity-85 mt-0.5">
              {workspace.sheetsStatus?.verified
                ? (workspace.sheetsStatus.pendingSyncCount > 0
                  ? `Còn ${workspace.sheetsStatus.pendingSyncCount} lượt làm bài đang chờ đồng bộ lại.`
                  : 'Mọi bài tập hoàn thành đều tự động lưu vào máy chủ và đồng bộ Google Sheets.')
                : 'Kết quả học tập của thầy/cô vẫn đang được lưu an toàn trên máy chủ ứng dụng. Nhà trường có thể kết nối Google Sheets trong mục Quản trị.'}
            </p>
          </div>
        </div>

        {workspace.sheetsStatus?.verified && workspace.sheetsStatus.pendingSyncCount > 0 && (
          <button
            type="button"
            disabled={retrying}
            onClick={() => void handleRetry()}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white border border-teal-300 px-4 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Đang thử lại...' : 'Thử đồng bộ lại'}</span>
          </button>
        )}
      </div>

      {tab === 'progress' ? (
        <div className="space-y-8">
          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-3d rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Hoàn thành 4 kỹ năng</p>
              <p className="font-display font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {stats.completedLessons}/10 câu
              </p>
            </div>
            <div className="card-3d rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Ngày học có hoạt động</p>
              <p className="font-display font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {stats.activeDaysCount} ngày
              </p>
            </div>
            <div className="card-3d rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Thời gian tương tác thực tế</p>
              <p className="font-display font-mono tabular-nums text-xl font-bold text-slate-900 mt-1">
                {formatDuration(workspace.totalActiveSeconds)}
              </p>
            </div>
            <div className="card-3d rounded-2xl p-5">
              <p className="text-xs font-medium text-slate-500">Lượt làm bài đã lưu</p>
              <p className="font-display font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {workspace.attempts.length} lượt
              </p>
            </div>
          </div>

          {/* 10-Lesson Matrix */}
          <div className="card-3d rounded-3xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <h2 className="font-display text-xl font-bold text-slate-900">
                Bảng tiến độ chi tiết 10 câu giao tiếp
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Bài</th>
                    <th className="py-3 px-4 font-semibold">Câu tiếng Anh</th>
                    <th className="py-3 px-3 font-semibold text-center">Nghe</th>
                    <th className="py-3 px-3 font-semibold text-center">Nói</th>
                    <th className="py-3 px-3 font-semibold text-center">Đọc</th>
                    <th className="py-3 px-3 font-semibold text-center">Viết</th>
                    <th className="py-3 px-4 font-semibold text-right">Hoàn thành</th>
                    <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LESSONS.map((lesson) => {
                    const p = workspace.progressByLesson[lesson.id];
                    return (
                      <tr key={lesson.id} className="hover:bg-sky-50/40">
                        <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-700">
                          {lesson.id}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{lesson.english}</p>
                          <p className="text-xs text-slate-500">{lesson.vietnamese}</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={p?.listening ? 'text-teal-700 font-bold' : 'text-slate-300'}>
                            {p?.listening ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={p?.speaking ? 'text-teal-700 font-bold' : 'text-slate-300'}>
                            {p?.speaking ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={p?.reading ? 'text-teal-700 font-bold' : 'text-slate-300'}>
                            {p?.reading ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={p?.writing ? 'text-teal-700 font-bold' : 'text-slate-300'}>
                            {p?.writing ? '✓' : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-800">
                          {p?.completionPercentage || 0}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenLesson(lesson.id)}
                            className="text-sm font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            Mở bài
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Saved Attempts History */}
          <div className="card-3d rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Lịch sử bài làm đã lưu gần đây
            </h2>
            {workspace.attempts.length === 0 ? (
              <p className="text-sm text-slate-500">
                Chưa có lượt làm bài nào được ghi nhận. Thầy/cô hãy mở Bài 1 để bắt đầu nhé!
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {workspace.attempts.slice(0, 15).map((att) => (
                  <div
                    key={att.attemptId}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Bài {att.lessonId} ·{' '}
                        {att.skill === 'listening'
                          ? 'Luyện Nghe'
                          : att.skill === 'speaking'
                            ? 'Luyện Nói'
                            : att.skill === 'reading'
                              ? 'Luyện Đọc'
                              : 'Luyện Viết'}{' '}
                        · Lần #{att.attemptNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        Mã bài: <span className="font-mono">{att.attemptId}</span> ·{' '}
                        {new Date(att.submissionTime).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {att.score}/{att.maximumScore}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          att.resultStatus === 'Passed' || att.resultStatus === 'Self-Evaluated'
                            ? 'text-teal-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {att.resultStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Achievements Tab (Screen 14) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`card-3d rounded-3xl p-6 space-y-3 ${
                  b.earned
                    ? 'bg-gradient-to-br from-amber-50/70 via-white to-teal-50/60'
                    : 'bg-white opacity-85'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      b.earned
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {b.earned ? <Award className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      b.earned ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    {b.earned ? '✓ Đã đạt' : b.progressText}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{b.title}</h3>
                  <p className="text-sm font-semibold text-sky-700">{b.titleVi}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{b.descriptionVi}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 flex items-center gap-3 text-sm text-slate-700">
            <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0" />
            <span>
              Tất cả huy hiệu đều mang tính khích lệ tinh thần tự học và chỉ được mở khóa dựa trên kết quả luyện tập đã lưu thực tế của thầy/cô.
            </span>
          </div>
        </div>
      )}

      {/* Privacy reminder */}
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span>
          Thời gian học thực tế tự động tạm dừng khi thầy/cô chuyển tab hoặc không tương tác quá 60 giây.
        </span>
      </p>
    </div>
  );
}
