import { useState } from 'react';
import {
  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Cpu,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  GEMINI_MODELS,
  getStoredApiKey,
  getStoredModel,
  setStoredApiKey,
  setStoredModel,
  generateWithFallback,
  SYSTEM_DEFAULT_API_KEY,
  isUsingSystemApiKey,
} from '../utils/gemini';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (apiKey: string) => void;
  isMandatory?: boolean;
}

export function ApiKeyModal({
  isOpen,
  onClose,
  onKeySaved,
  isMandatory = false,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [selectedModel, setSelectedModel] = useState(() => getStoredModel());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    text: string;
    model?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setStoredModel(selectedModel);
    if (onKeySaved) onKeySaved(apiKey);
    onClose();
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        ok: false,
        text: 'Vui lòng nhập API Key trước khi kiểm tra!',
      });
      return;
    }
    // Temporarily save to test
    setStoredApiKey(apiKey);
    setStoredModel(selectedModel);

    setTesting(true);
    setTestResult(null);

    try {
      const res = await generateWithFallback(
        'Xin chào, hãy trả lời trong 5 từ: Sẵn sàng hỗ trợ giáo viên tiểu học Lê Kim Lăng!'
      );
      setTestResult({
        ok: true,
        text: `Kết nối thành công! Phản hồi từ ${res.modelUsed}: "${res.text.trim()}"`,
        model: res.modelUsed,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        ok: false,
        text: `Kiểm tra thất bại: ${msg}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-sky-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <KeyRound className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display">Thiết lập Model & API Key Gemini</h3>
                <p className="text-xs text-sky-100 mt-0.5">
                  Cấu hình AI cho ứng dụng Giáo viên Lê Kim Lăng
                </p>
              </div>
            </div>
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Automatic System Key Status Banner */}
          {SYSTEM_DEFAULT_API_KEY && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 leading-relaxed space-y-1">
                  <p className="font-bold text-sm text-emerald-900">
                    Đã cấu hình mã Key AI tự động
                  </p>
                  <p>
                    Ứng dụng đã có sẵn API key của trường/hệ thống. Người học và giáo viên có thể vào học và trải nghiệm AI ngay lập tức mà không cần tự nhập mã.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guide Banner */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs text-sky-900 leading-relaxed space-y-1">
                <p className="font-semibold text-sky-950">
                  {SYSTEM_DEFAULT_API_KEY
                    ? 'Tùy chọn: Nhập mã cá nhân nếu muốn hoặc khi hết hạn mức'
                    : 'Hướng dẫn lấy API Key miễn phí từ Google AI Studio:'}
                </p>
                <p>
                  Thầy/cô chỉ cần đăng nhập tài khoản Google (Gmail) cá nhân để tạo key hoàn toàn miễn phí.
                </p>
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-900 underline mt-1"
                >
                  Truy cập https://aistudio.google.com/api-keys để lấy Key
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Model Selection (Cards) */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              1. Chọn Model AI mặc định:
            </label>
            <div className="space-y-2.5">
              {GEMINI_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Cpu className={`h-4 w-4 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-sm text-slate-900">{m.name}</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            m.recommended
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                    <div className="pt-1">
                      <input
                        type="radio"
                        name="selectedModel"
                        checked={isSelected}
                        onChange={() => setSelectedModel(m.id)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * Cơ chế tự động Fallback: Nếu model đang chọn gặp lỗi hoặc hết hạn mức (429), hệ thống sẽ tự động thử lại ngay với các model kế tiếp.
            </p>
          </div>

          {/* API Key Input */}
          <div>
            <label htmlFor="gemini-key-input" className="block text-sm font-bold text-slate-800 mb-1">
              2. Nhập Gemini API Key của thầy/cô:
            </label>
            <div className="relative">
              <input
                id="gemini-key-input"
                type="password"
                placeholder="Dán mã AIzaSy... vào đây"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-hidden focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              API key được bảo mật và lưu trực tiếp trong trình duyệt (localStorage) của thầy/cô.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed break-words">{testResult.text}</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || !apiKey.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            {testing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                Đang thử nghiệm kết nối...
              </>
            ) : (
              'Kiểm tra kết nối'
            )}
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            {!isMandatory && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Đóng
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="w-1/2 sm:w-auto rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer transition-colors"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
