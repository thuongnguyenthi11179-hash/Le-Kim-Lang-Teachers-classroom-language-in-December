import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, KeyRound, Shield, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../utils/api';

interface AdminLoginScreenProps {
  onAdminAuthenticated: (token: string) => void;
  onBack: () => void;
}

export function AdminLoginScreen({ onAdminAuthenticated, onBack }: AdminLoginScreenProps) {
  const [mode, setMode] = useState<'loading' | 'bootstrap' | 'login'>('loading');
  const [configuredViaEnv, setConfiguredViaEnv] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getAdminStatus()
      .then((res) => {
        if (!mounted) return;
        setMode(res.mode);
        setConfiguredViaEnv(res.configuredViaEnv);
      })
      .catch(() => {
        if (!mounted) return;
        setMode('login');
        setError('Không thể kiểm tra trạng thái xác thực máy chủ.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'bootstrap') {
        if (password.length < 8) {
          setError('Mật khẩu quản trị viên cần tối thiểu 8 ký tự.');
          setSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          setSubmitting(false);
          return;
        }
        const res = await api.bootstrapAdmin(password, confirmPassword);
        onAdminAuthenticated(res.token);
      } else {
        const res = await api.loginAdmin(password);
        onAdminAuthenticated(res.token);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Xác thực quản trị viên thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-800 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>BACK – Quay lại trang chính</span>
      </button>

      <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-800">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-sky-700">
            Trường Tiểu học Lê Kim Lăng · Khu vực Ban Giám hiệu & Quản lý
          </p>
          <h1 className="font-display text-3xl font-extrabold text-slate-900">
            {mode === 'bootstrap'
              ? 'Thiết lập Quản trị viên lần đầu'
              : 'SCHOOL ADMIN LOGIN'}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {mode === 'bootstrap'
              ? 'Hệ thống chưa có biến môi trường ADMIN_PASSCODE. Vui lòng tạo mật khẩu quản trị viên mạnh (tối thiểu 8 ký tự) để bảo vệ khu vực báo cáo toàn trường.'
              : 'Đăng nhập để xem báo cáo tiến độ toàn trường, chấm điểm Speaking cuối tháng, xuất Excel/CSV và cấu hình Google Sheets.'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'loading' ? (
          <div className="py-6 text-center text-sm text-slate-500">
            Đang kiểm tra cấu hình bảo mật máy chủ...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                {mode === 'bootstrap' ? 'Tạo mật khẩu quản trị viên (≥ 8 ký tự)' : 'Mật khẩu quản trị viên'}
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={mode === 'bootstrap' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                />
              </div>
            </div>

            {mode === 'bootstrap' && (
              <div>
                <label htmlFor="admin-confirm" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nhập lại mật khẩu quản trị viên
                </label>
                <input
                  id="admin-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu..."
                  className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-3d-primary w-full min-h-[50px] rounded-2xl px-6 py-3 text-base font-bold cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? 'Đang xác thực...'
                : mode === 'bootstrap'
                  ? 'Lưu mật khẩu & Mở Admin Dashboard'
                  : 'Đăng nhập Quản trị viên'}
            </button>
          </form>
        )}

        <div className="flex items-start gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            {configuredViaEnv
              ? 'Mật khẩu quản trị đang được bảo vệ bằng biến môi trường ADMIN_PASSCODE trên máy chủ.'
              : 'Mật khẩu được xác thực trực tiếp trên máy chủ bằng thuật toán băm an toàn (scrypt) và cấp phiên làm việc có chữ ký. Khi triển khai thực tế, nhà trường cũng có thể đặt biến ADMIN_PASSCODE trong phần Secrets.'}
          </span>
        </div>
      </div>
    </div>
  );
}
