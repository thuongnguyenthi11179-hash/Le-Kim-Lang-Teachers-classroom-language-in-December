import { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type { TeacherWorkspaceData } from '../../types/app';
import { api, ApiError } from '../../utils/api';

interface TeacherLoginScreenProps {
  professionalGroups: string[];
  onAuthenticated: (data: {
    token: string;
    welcomeBack: boolean;
    workspace: TeacherWorkspaceData;
  }) => void;
  onBack: () => void;
}

export function TeacherLoginScreen({
  professionalGroups,
  onAuthenticated,
  onBack,
}: TeacherLoginScreenProps) {
  const [authTab, setAuthTab] = useState<'register' | 'returning'>('register');
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  const [fullName, setFullName] = useState('');
  const [professionalGroup, setProfessionalGroup] = useState(professionalGroups[0] || 'Tổ 1');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [lookupInfo, setLookupInfo] = useState<{
    exists: boolean;
    fullName?: string;
    professionalGroup?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentifierBlur = async () => {
    const clean = identifier.trim();
    if (clean.length < 3) {
      setLookupInfo(null);
      return;
    }
    try {
      const res = await api.lookupTeacher(clean);
      setLookupInfo(res);
      if (res.exists && authTab === 'register') {
        setAuthTab('returning');
      }
    } catch {
      // Ignore silent lookup failures
    }
  };

  const handlePrepareConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authTab === 'returning') {
      if (!identifier.trim() || !pin.trim()) {
        setError('Vui lòng nhập Mã giáo viên (hoặc Email trường) và mã PIN cá nhân.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.loginTeacher({
          identifier: identifier.trim(),
          pin: pin.trim(),
        });
        onAuthenticated(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Đăng nhập không thành công.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate new registration before confirmation screen
    if (fullName.trim().length < 2) {
      setError('Vui lòng nhập đầy đủ Họ và tên giáo viên (không để trống).');
      return;
    }
    if (!professionalGroup) {
      setError('Vui lòng chọn Tổ chuyên môn.');
      return;
    }
    if (identifier.trim().length < 3) {
      setError('Vui lòng nhập Mã giáo viên hoặc Email trường (tối thiểu 3 ký tự) để định danh duy nhất.');
      return;
    }
    if (pin.trim().length < 4) {
      setError('Vui lòng đặt mã PIN cá nhân từ 4 ký tự trở lên để bảo vệ tiến độ học tập của thầy/cô.');
      return;
    }
    if (!consentAccepted) {
      setError('Vui lòng đánh dấu đồng ý thông báo bảo mật và sử dụng dữ liệu nội bộ nhà trường.');
      return;
    }

    // Check if ID already exists
    setLoading(true);
    try {
      const res = await api.lookupTeacher(identifier.trim());
      if (res.exists) {
        setLookupInfo(res);
        setAuthTab('returning');
        setError(
          `Mã "${identifier.trim().toUpperCase()}" đã đăng ký trước đó (${res.fullName} – ${res.professionalGroup}). Hệ thống đã chuyển sang chế độ Giáo viên quay lại — vui lòng nhập mã PIN của thầy/cô để tiếp tục bài học.`
        );
        return;
      }
      setStep('confirm');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể kiểm tra thông tin lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.registerTeacher({
        fullName: fullName.trim(),
        professionalGroup,
        identifier: identifier.trim(),
        email: email.trim(),
        pin: pin.trim(),
        consentAccepted,
      });
      onAuthenticated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể khởi tạo tài khoản học tập.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-800 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>BACK – Quay lại trang giới thiệu</span>
      </button>

      <div className="card-3d rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-sky-700">
            Trường Tiểu học Lê Kim Lăng · December English Challenge
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
            WELCOME, TEACHERS!
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            Welcome to your December English Challenge!
          </p>
        </div>

        {/* Mode Switcher: First Time vs Returning */}
        {step === 'form' && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setError(null);
              }}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                authTab === 'register'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bắt đầu lần đầu
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('returning');
                setError(null);
              }}
              className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                authTab === 'returning'
                  ? 'bg-white text-sky-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiếp tục bài đang học
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handlePrepareConfirm} className="space-y-5">
            {authTab === 'register' ? (
              <>
                <div>
                  <label htmlFor="teacher-fullname" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Họ và tên giáo viên <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="teacher-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Thị Minh Hương"
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="teacher-group" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Tổ chuyên môn <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="teacher-group"
                    value={professionalGroup}
                    onChange={(e) => setProfessionalGroup(e.target.value)}
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  >
                    {(professionalGroups || []).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="teacher-id" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Mã giáo viên hoặc Email trường <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="teacher-id"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => void handleIdentifierBlur()}
                    placeholder="Ví dụ: GV001 hoặc huong.ntm@lekimlang.edu.vn"
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Dùng để định danh duy nhất, tránh trùng lặp khi hai giáo viên cùng họ tên và giúp khôi phục tiến độ ở các lần sau.
                  </p>
                </div>

                <div>
                  <label htmlFor="teacher-email-opt" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Email trường (nếu mã ở trên là Mã giáo viên)
                  </label>
                  <input
                    id="teacher-email-opt"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tengiaovien@lekimlang.edu.vn (không bắt buộc)"
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="teacher-pin" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Tạo mã PIN cá nhân (tối thiểu 4 ký tự) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="teacher-pin"
                      type="password"
                      required
                      minLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Nhập 4–8 số hoặc chữ dễ nhớ (vd: 1234)"
                      className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Mã PIN giúp bảo vệ dữ liệu cá nhân, ngăn người khác nhập nhầm Mã giáo viên của thầy/cô.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-sky-600 shrink-0"
                  />
                  <span className="leading-relaxed">
                    Tôi đồng ý cung cấp họ tên, tổ chuyên môn và kết quả luyện tập phục vụ mục đích tự học và báo cáo nội bộ của Trường Tiểu học Lê Kim Lăng. Dữ liệu cá nhân của tôi không công khai cho giáo viên khác.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-3d-primary w-full min-h-[54px] inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-bold cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Đang kiểm tra...' : 'Tiếp tục xác nhận thông tin'}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                {lookupInfo?.exists && (
                  <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950">
                    <UserCheck className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">Welcome back, {lookupInfo.fullName}!</p>
                      <p className="text-teal-800">
                        Tổ chuyên môn: {lookupInfo.professionalGroup} · Nhập mã PIN để tiếp tục bài đang học.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="return-id" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Mã giáo viên hoặc Email trường <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="return-id"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => void handleIdentifierBlur()}
                    placeholder="Nhập mã giáo viên hoặc email đã đăng ký"
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="return-pin" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Mã PIN cá nhân <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="return-pin"
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Nhập mã PIN của thầy/cô"
                    className="w-full min-h-[48px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-3d-primary w-full min-h-[54px] inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-bold cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Đang mở tiến độ học tập...' : 'START LEARNING – TIẾP TỤC HỌC'}</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </form>
        ) : (
          /* Step 2: Explicit Confirmation Screen before starting */
          <div className="space-y-6">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-display text-lg font-bold">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <span>Xác nhận thông tin giáo viên trước khi bắt đầu</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-2">
                <div>
                  <dt className="text-slate-500">Họ và tên</dt>
                  <dd className="font-semibold text-slate-900 text-base">{fullName.trim()}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tổ chuyên môn</dt>
                  <dd className="font-semibold text-slate-900 text-base">{professionalGroup}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Mã giáo viên / Email định danh</dt>
                  <dd className="font-mono font-semibold text-sky-900 text-base">
                    {identifier.trim().toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email liên hệ</dt>
                  <dd className="font-medium text-slate-800 text-base">
                    {email.trim() || (identifier.includes('@') ? identifier.trim() : 'Chưa cung cấp')}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                disabled={loading}
                className="min-h-[50px] flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Chỉnh sửa lại
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRegister()}
                disabled={loading}
                className="btn-3d-primary min-h-[50px] flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-base font-bold cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Đang khởi tạo...' : 'START LEARNING – BẮT ĐẦU HỌC'}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
          <span>
            Mỗi giáo viên có không gian học tập riêng biệt. Mã PIN được băm bảo mật trên máy chủ.
          </span>
        </div>
      </div>
    </div>
  );
}
