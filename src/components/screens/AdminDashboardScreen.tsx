import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CloudCog,
  Download,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import type { AdminDashboardSummary, AdminTeacherRow } from '../../types/app';
import { api, ApiError } from '../../utils/api';
import { DEMO_ADMIN_PREVIEW_ROWS } from '../../utils/badges';

interface AdminDashboardScreenProps {
  adminToken: string;
  onSelectTeacher: (teacherId: string) => void;
  onOpenSheetsSettings: () => void;
  onGroupsUpdated: (groups: string[]) => void;
}

export function AdminDashboardScreen({
  adminToken,
  onSelectTeacher,
  onOpenSheetsSettings,
  onGroupsUpdated,
}: AdminDashboardScreenProps) {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  const [newGroupName, setNewGroupName] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminDashboard(adminToken);
      setSummary(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu báo cáo quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const handleExport = async (type: 'all' | 'incomplete') => {
    setExporting(true);
    setError(null);
    try {
      await api.downloadAdminCsv(adminToken, type);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xuất file thất bại.');
    } finally {
      setExporting(false);
    }
  };

  const handleAddGroup = async () => {
    if (!summary || !newGroupName.trim()) return;
    setGroupSaving(true);
    try {
      const updated = [...summary.professionalGroups, newGroupName.trim()];
      const res = await api.updateProfessionalGroups(adminToken, updated);
      setSummary({ ...summary, professionalGroups: res.professionalGroups });
      onGroupsUpdated(res.professionalGroups);
      setNewGroupName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể thêm tổ chuyên môn.');
    } finally {
      setGroupSaving(false);
    }
  };

  const handleRemoveGroup = async (group: string) => {
    if (!summary || summary.professionalGroups.length <= 1) return;
    setGroupSaving(true);
    try {
      const updated = summary.professionalGroups.filter((g) => g !== group);
      const res = await api.updateProfessionalGroups(adminToken, updated);
      setSummary({ ...summary, professionalGroups: res.professionalGroups });
      onGroupsUpdated(res.professionalGroups);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể xóa tổ chuyên môn.');
    } finally {
      setGroupSaving(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-slate-600">
        Đang tải dữ liệu SCHOOL ADMIN DASHBOARD...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900 space-y-3">
          <p className="font-semibold">{error || 'Không có dữ liệu quản trị.'}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="rounded-xl bg-white border border-rose-300 px-4 py-2 text-sm font-semibold cursor-pointer"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  const displayedTeachers: AdminTeacherRow[] = showDemoPreview
    ? DEMO_ADMIN_PREVIEW_ROWS
    : summary.teachers;

  const filteredRows = displayedTeachers.filter((row) => {
    if (
      searchQuery.trim() &&
      !row.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
      !row.teacherId.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (groupFilter !== 'all' && row.professionalGroup !== groupFilter) return false;
    if (statusFilter !== 'all' && row.overallStatus !== statusFilter) return false;
    return true;
  });

  const maxSkillAttempts = Math.max(
    1,
    summary.skillAttempts.listening,
    summary.skillAttempts.speaking,
    summary.skillAttempts.reading,
    summary.skillAttempts.writing
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Trường Tiểu học Lê Kim Lăng · Báo cáo nội bộ tháng 12/2026
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            SCHOOL ADMIN DASHBOARD
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Trạng thái Google Sheets:{' '}
            <strong
              className={summary.sheetsStatus?.verified ? 'text-teal-700' : 'text-amber-700'}
            >
              {summary.sheetsStatus?.label || 'Chế độ hoạt động ngoại tuyến'}
            </strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            onClick={onOpenSheetsSettings}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 whitespace-nowrap cursor-pointer"
          >
            <CloudCog className="h-4 w-4" />
            <span>Cài đặt Google Sheets</span>
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport('all')}
            className="btn-3d-primary inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Xuất báo cáo tháng 12</span>
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport('incomplete')}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Xuất DS chưa hoàn thành</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-Data KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-3d rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Tổng GV đã đăng ký</p>
          <p className="font-display font-mono tabular-nums text-3xl font-bold text-slate-900 mt-1">
            {summary.totalTeachers}
          </p>
        </div>
        <div className="card-3d rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">GV đã bắt đầu học</p>
          <p className="font-display font-mono tabular-nums text-3xl font-bold text-sky-800 mt-1">
            {summary.startedTeachers}
          </p>
        </div>
        <div className="card-3d rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">GV đang học</p>
          <p className="font-display font-mono tabular-nums text-3xl font-bold text-amber-700 mt-1">
            {summary.inProgressTeachers}
          </p>
        </div>
        <div className="card-3d rounded-2xl p-5">
          <p className="text-xs font-medium text-slate-500">Hoàn thành 10/10 câu</p>
          <p className="font-display font-mono tabular-nums text-3xl font-bold text-teal-700 mt-1">
            {summary.completedTeachers}
          </p>
        </div>
        <div className="card-3d rounded-2xl p-5 col-span-2 lg:col-span-1">
          <p className="text-xs font-medium text-slate-500">Tỷ lệ hoàn thành</p>
          <p className="font-display font-mono tabular-nums text-3xl font-bold text-slate-900 mt-1">
            {summary.completionRate}%
          </p>
        </div>
      </div>

      {/* Charts Row: Progress by Professional Group + Practice Attempts by Skill */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-3d rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Tiến độ trung bình theo Tổ chuyên môn
            </h2>
            <p className="text-xs text-slate-500">
              Số bài hoàn thành trung bình trên 10 bài (chỉ tính dữ liệu giáo viên thật)
            </p>
          </div>
          <div className="space-y-3">
            {summary.groupStats.map((g) => (
              <div key={g.group} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {g.group} ({g.teacherCount} GV)
                  </span>
                  <span className="font-mono tabular-nums text-xs font-semibold text-sky-800">
                    TB {g.avgCompletedLessons}/10 bài · {g.completedAllCount} xong 10/10
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-600 transition-all"
                    style={{ width: `${Math.min(100, (g.avgCompletedLessons / 10) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-3d rounded-3xl p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Lượt thực hành theo 4 kỹ năng & Kiểm tra cuối tháng
            </h2>
            <p className="text-xs text-slate-500">
              Tổng lượt nộp bài thật đã ghi nhận trên hệ thống
            </p>
          </div>

          <div className="space-y-3">
            {(
              [
                { label: 'Listening (Nghe)', count: summary.skillAttempts.listening, bar: 'bg-sky-500' },
                { label: 'Speaking (Nói)', count: summary.skillAttempts.speaking, bar: 'bg-rose-500' },
                { label: 'Reading (Đọc)', count: summary.skillAttempts.reading, bar: 'bg-teal-500' },
                { label: 'Writing (Viết)', count: summary.skillAttempts.writing, bar: 'bg-amber-500' },
              ] as const
            ).map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{s.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-700">
                    {s.count} lượt
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.bar}`}
                    style={{ width: `${Math.round((s.count / maxSkillAttempts) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Đã nộp Final</p>
              <p className="font-mono tabular-nums text-xl font-bold text-slate-900">
                {summary.finalAssessmentsSubmitted}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs text-amber-800">Chờ chấm Nói</p>
              <p className="font-mono tabular-nums text-xl font-bold text-amber-900">
                {summary.finalAssessmentsPendingSpeaking}
              </p>
            </div>
            <div className="rounded-xl bg-teal-50 p-3">
              <p className="text-xs text-teal-800">Đã có tổng điểm</p>
              <p className="font-mono tabular-nums text-xl font-bold text-teal-900">
                {summary.finalAssessmentsCompleted}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Teacher Progress Table */}
      <div className="card-3d rounded-3xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Danh sách theo dõi tiến độ giáo viên
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu chỉ hiển thị trong khu vực quản trị nội bộ, không công khai cho giáo viên khác.
              </p>
            </div>

            {/* Strictly Isolated DEMO Preview Switch */}
            <button
              type="button"
              onClick={() => setShowDemoPreview((prev) => !prev)}
              className={`min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                showDemoPreview
                  ? 'border-amber-400 bg-amber-100 text-amber-950'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {showDemoPreview
                ? 'Đang xem chế độ DEMO (Bấm để quay về dữ liệu thật)'
                : 'Xem thử giao diện bảng với dữ liệu DEMO'}
            </button>
          </div>

          {showDemoPreview && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950 font-medium">
              NHÃN DEMO: Các dòng [DEMO] bên dưới chỉ dùng để kiểm thử bố cục bảng. Dữ liệu DEMO không lưu trên máy chủ và KHÔNG BAO GIỜ trộn vào báo cáo CSV hay Google Sheets thật.
            </div>
          )}

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo họ tên hoặc mã GV..."
                className="w-full min-h-[42px] rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm"
              />
            </div>

            <select
              aria-label="Lọc theo tổ chuyên môn"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Tất cả tổ chuyên môn</option>
              {summary.professionalGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo trạng thái hoàn thành"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Hoàn thành 10/10">Hoàn thành 10/10</option>
              <option value="Đang học">Đang học</option>
              <option value="Chưa bắt đầu">Chưa bắt đầu</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-semibold text-center">STT</th>
                <th className="py-3 px-4 font-semibold">Họ tên</th>
                <th className="py-3 px-3 font-semibold">Tổ</th>
                <th className="py-3 px-3 font-semibold text-center">Đã học</th>
                <th className="py-3 px-2.5 font-semibold text-center">Nghe</th>
                <th className="py-3 px-2.5 font-semibold text-center">Nói</th>
                <th className="py-3 px-2.5 font-semibold text-center">Đọc</th>
                <th className="py-3 px-2.5 font-semibold text-center">Viết</th>
                <th className="py-3 px-4 font-semibold">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 px-4 text-center text-slate-500">
                    {summary.teachers.length === 0 && !showDemoPreview
                      ? 'Chưa có giáo viên nào đăng ký thật trên hệ thống. Khi giáo viên bắt đầu học, kết quả sẽ xuất hiện ngay tại đây.'
                      : 'Không tìm thấy giáo viên phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.teacherId} className="hover:bg-sky-50/40">
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{row.fullName}</p>
                      <p className="text-xs font-mono text-slate-500">
                        {row.teacherId} · Gần nhất:{' '}
                        {new Date(row.lastLogin).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {row.professionalGroup}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-slate-900">
                      {row.completedLessons}/10
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums text-slate-700">
                      {row.listeningCount}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums text-slate-700">
                      {row.speakingCount}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums text-slate-700">
                      {row.readingCount}
                    </td>
                    <td className="py-3 px-2.5 text-center font-mono tabular-nums text-slate-700">
                      {row.writingCount}
                    </td>
                    <td className="py-3 px-4">
                      <p
                        className={`text-xs font-semibold ${
                          row.overallStatus === 'Hoàn thành 10/10'
                            ? 'text-teal-700'
                            : row.overallStatus === 'Đang học'
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {row.overallStatus}
                      </p>
                      <p className="text-xs text-slate-500">
                        Final: {row.finalAssessmentStatus}
                        {row.finalTotalScore !== null ? ` (${row.finalTotalScore}/100)` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.isDemo ? (
                        <span className="text-xs text-slate-400">DEMO</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectTeacher(row.teacherId)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:text-sky-950 whitespace-nowrap cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Xem & Chấm</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Groups Configuration */}
      <div className="card-3d rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Cấu hình danh sách Tổ chuyên môn
          </h2>
          <p className="text-sm text-slate-600">
            Danh sách này xuất hiện trực tiếp trong ô chọn Tổ chuyên môn khi giáo viên đăng ký tài khoản.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {summary.professionalGroups.map((g) => (
            <div
              key={g}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800"
            >
              <span>{g}</span>
              {summary.professionalGroups.length > 1 && (
                <button
                  type="button"
                  disabled={groupSaving}
                  onClick={() => void handleRemoveGroup(g)}
                  aria-label={`Xóa ${g}`}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 max-w-md">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nhập tên tổ mới (vd: Tổ Tiếng Anh - Tin học)..."
            className="flex-1 min-h-[42px] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm"
          />
          <button
            type="button"
            disabled={groupSaving || !newGroupName.trim()}
            onClick={() => void handleAddGroup()}
            className="btn-3d-teal inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm tổ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
