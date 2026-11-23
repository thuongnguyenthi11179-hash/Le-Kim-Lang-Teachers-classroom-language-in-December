import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { LESSONS } from '../../data/lessons';
import type { TeacherWorkspaceData } from '../../types/app';
import { api, ApiError } from '../../utils/api';

interface AdminTeacherDetailScreenProps {
  adminToken: string;
  teacherId: string;
  onBack: () => void;
}

export function AdminTeacherDetailScreen({
  adminToken,
  teacherId,
  onBack,
}: AdminTeacherDetailScreenProps) {
  const [data, setData] = useState<
    | (TeacherWorkspaceData & {
        activityLogs: Array<{
          eventId: string;
          eventType: string;
          timestamp: string;
          lessonId: number | null;
          durationSeconds: number;
          eventStatus: string;
        }>;
      })
    | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [speakingScore, setSpeakingScore] = useState('22');
  const [speakingFeedback, setSpeakingFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradeNotice, setGradeNotice] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminTeacherDetail(adminToken, teacherId);
      setData(res);
      if (res.finalAssessment?.speakingScore !== null && res.finalAssessment?.speakingScore !== undefined) {
        setSpeakingScore(String(res.finalAssessment.speakingScore));
      }
      if (res.finalAssessment?.adminSpeakingFeedback) {
        setSpeakingFeedback(res.finalAssessment.adminSpeakingFeedback);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải báo cáo giáo viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const handleGradeSpeaking = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrading(true);
    setError(null);
    setGradeNotice(null);
    try {
      const res = await api.gradeTeacherSpeaking(
        adminToken,
        teacherId,
        Number(speakingScore),
        speakingFeedback
      );
      setGradeNotice(
        `Đã xác nhận điểm Speaking (${res.assessment.speakingScore}/25) và tổng điểm cuối tháng ${res.assessment.totalScore}/100.`
      );
      await loadDetail();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể lưu điểm Speaking.');
    } finally {
      setGrading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteTeacherRecord(adminToken, teacherId);
      onBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể xóa hồ sơ giáo viên.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-slate-600">
        Đang tải báo cáo chi tiết giáo viên...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Admin Dashboard</span>
        </button>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
          {error || 'Không tìm thấy dữ liệu giáo viên.'}
        </div>
      </div>
    );
  }

  const fa = data.finalAssessment;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Admin Dashboard</span>
        </button>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa hồ sơ theo yêu cầu</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs">
            <span className="font-semibold text-rose-900">Xác nhận xóa vĩnh viễn?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDeleteTeacher()}
              className="rounded-lg bg-rose-600 px-3 py-1 font-semibold text-white cursor-pointer"
            >
              {deleting ? 'Đang xóa...' : 'Xóa ngay'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-slate-700 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Teacher Profile Header */}
      <div className="card-3d rounded-3xl p-6 space-y-3">
        <p className="text-sm font-semibold text-sky-700">
          Teacher Progress Report · {data.profile.professionalGroup}
        </p>
        <h1 className="font-display text-3xl font-extrabold text-slate-900">
          {data.profile.fullName}
        </h1>
        <p className="text-sm text-slate-600">
          Mã định danh: <span className="font-mono font-semibold">{data.profile.teacherId}</span> ·
          Email: {data.profile.email || 'Chưa cung cấp'} · Ngày đăng ký:{' '}
          {new Date(data.profile.registrationDate).toLocaleDateString('vi-VN')} · Số ngày học thực tế:{' '}
          <strong className="font-mono tabular-nums">{data.activeDays.length}</strong>
        </p>
      </div>

      {/* Final Assessment & Manual Admin Speaking Grading */}
      <div className="card-3d rounded-3xl p-6 space-y-5">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Kết quả Kiểm tra cuối tháng (Final Assessment)
        </h2>

        {!fa ? (
          <p className="text-sm text-slate-500">Giáo viên chưa nộp bài kiểm tra cuối tháng.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-slate-200 p-3.5">
                <p className="text-xs text-slate-500">Listening</p>
                <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
                  {fa.listeningScore}/25
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5">
                <p className="text-xs text-slate-500">Reading</p>
                <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
                  {fa.readingScore}/25
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3.5">
                <p className="text-xs text-slate-500">Writing</p>
                <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
                  {fa.writingScore}/25
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5">
                <p className="text-xs text-amber-800">Speaking</p>
                <p className="font-mono tabular-nums text-xl font-bold text-amber-950">
                  {fa.speakingScore === null ? 'Chờ đánh giá' : `${fa.speakingScore}/25`}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5 col-span-2 sm:col-span-1">
                <p className="text-xs text-sky-800">Tổng điểm</p>
                <p className="font-mono tabular-nums text-xl font-bold text-sky-950">
                  {fa.totalScore === null ? 'Chờ đánh giá' : `${fa.totalScore}/100`}
                </p>
              </div>
            </div>

            {fa.speakingSelfCheck?.notes && (
              <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <strong>Ghi chú tự nhận xét của giáo viên:</strong> {fa.speakingSelfCheck.notes}
              </p>
            )}

            {/* Admin Speaking Grade Form */}
            <form
              onSubmit={handleGradeSpeaking}
              className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-4"
            >
              <h3 className="font-display text-base font-bold text-sky-950">
                Chấm điểm & Xác nhận kỹ năng Speaking (Giáo viên phụ trách)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="admin-speak-score" className="block text-xs font-semibold text-slate-700 mb-1">
                    Điểm Speaking (0 – 25)
                  </label>
                  <input
                    id="admin-speak-score"
                    type="number"
                    min={0}
                    max={25}
                    required
                    value={speakingScore}
                    onChange={(e) => setSpeakingScore(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono text-base font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="admin-speak-fb" className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhận xét khích lệ của giáo viên phụ trách
                  </label>
                  <input
                    id="admin-speak-fb"
                    type="text"
                    value={speakingFeedback}
                    onChange={(e) => setSpeakingFeedback(e.target.value)}
                    placeholder="Ví dụ: Phát âm rõ ràng, ngữ điệu tự nhiên, tự tin dùng trên lớp."
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={grading}
                className="btn-3d-teal min-h-[44px] rounded-xl px-5 py-2 text-sm font-bold cursor-pointer disabled:opacity-50"
              >
                {grading ? 'Đang lưu điểm...' : 'Xác nhận điểm Speaking & Hoàn tất bảng điểm'}
              </button>

              {gradeNotice && (
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-800">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>{gradeNotice}</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* 10 Lessons Matrix */}
      <div className="card-3d rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Tiến độ từng câu (10 bài học)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Bài</th>
                <th className="py-2.5 px-4 font-semibold">Câu tiếng Anh</th>
                <th className="py-2.5 px-3 font-semibold text-center">Nghe</th>
                <th className="py-2.5 px-3 font-semibold text-center">Nói</th>
                <th className="py-2.5 px-3 font-semibold text-center">Đọc</th>
                <th className="py-2.5 px-3 font-semibold text-center">Viết</th>
                <th className="py-2.5 px-4 font-semibold text-right">Hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LESSONS.map((l) => {
                const p = data.progressByLesson[l.id];
                return (
                  <tr key={l.id}>
                    <td className="py-2.5 px-4 font-mono">{l.id}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{l.english}</td>
                    <td className="py-2.5 px-3 text-center">{p?.listening ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center">{p?.speaking ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center">{p?.reading ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center">{p?.writing ? '✓' : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold">
                      {p?.completionPercentage || 0}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
