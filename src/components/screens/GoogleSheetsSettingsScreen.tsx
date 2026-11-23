import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, SHEET_TABS_SPEC } from '../../data/appsScriptTemplate';
import type { SheetRowCounts, SheetsConnectionStatus } from '../../types/app';
import { api, ApiError } from '../../utils/api';

interface GoogleSheetsSettingsScreenProps {
  adminToken: string;
  onStatusUpdated: (status: SheetsConnectionStatus) => void;
  onBack: () => void;
}

function generateSecureSecret(length = 32): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function GoogleSheetsSettingsScreen({
  adminToken,
  onStatusUpdated,
  onBack,
}: GoogleSheetsSettingsScreenProps) {
  const [status, setStatus] = useState<
    | (SheetsConnectionStatus & {
        fromEnv?: boolean;
        fromEnvUrl?: boolean;
        fromEnvSecret?: boolean;
      })
    | null
  >(null);
  const [urlInput, setUrlInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [generatedSecretPreview, setGeneratedSecretPreview] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [lastVerification, setLastVerification] = useState<{
    spreadsheetName: string;
    verifiedEventId: string;
    writeVerified: boolean;
    readVerified: boolean;
    sheetCounts: SheetRowCounts;
  } | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadStatus = async () => {
    try {
      const s = await api.getAdminSheetsStatus(adminToken);
      setStatus(s);
      onStatusUpdated(s);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Không thể tải cấu hình Google Sheets.',
      });
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const handleGenerateSecret = () => {
    const next = generateSecureSecret(32);
    setSecretInput(next);
    setGeneratedSecretPreview(next);
    setCopiedSecret(false);
  };

  const handleCopyGeneratedSecret = async () => {
    if (!generatedSecretPreview) return;
    try {
      await navigator.clipboard.writeText(generatedSecretPreview);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setLastVerification(null);
    try {
      const nextStatus = await api.saveSheetsConfig(adminToken, {
        appsScriptUrl: urlInput.trim(),
        appsScriptSecret: secretInput.trim() || undefined,
      });
      setStatus(nextStatus);
      onStatusUpdated(nextStatus);
      setSecretInput('');
      setGeneratedSecretPreview(null);
      setFeedback({
        type: 'ok',
        text: 'Đã lưu cấu hình an toàn trên máy chủ. Hãy bấm "Test Connection – Kiểm tra ghi & đọc thật" để xác thực Google Sheets.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Không thể lưu cấu hình.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setFeedback(null);
    setLastVerification(null);
    try {
      const res = await api.testSheetsConnection(adminToken);
      setStatus(res.sheetsStatus);
      onStatusUpdated(res.sheetsStatus);
      if (res.ok && res.writeVerified && res.readVerified && res.sheetCounts) {
        setLastVerification({
          spreadsheetName: res.spreadsheetName || 'Google Sheet',
          verifiedEventId: res.verifiedEventId || '',
          writeVerified: res.writeVerified,
          readVerified: res.readVerified,
          sheetCounts: res.sheetCounts,
        });
      }
      setFeedback({
        type: 'ok',
        text: `Xác thực GHI & ĐỌC THẬT thành công với Google Sheet "${res.spreadsheetName}"! Hệ thống đã sẵn sàng đồng bộ tự động.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Kiểm tra kết nối thất bại.',
      });
      await loadStatus();
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setFeedback(null);
    try {
      const res = await api.syncAllSheets(adminToken);
      setStatus(res.sheetsStatus);
      onStatusUpdated(res.sheetsStatus);
      setFeedback({
        type: res.ok ? 'ok' : 'err',
        text: res.ok
          ? `Đã đồng bộ thành công ${res.syncedRecords} bản ghi thật sang Google Sheets!`
          : `Đồng bộ được ${res.syncedRecords} bản ghi, còn ${res.failedRecords} lỗi (${res.lastError || 'kiểm tra lại kết nối'}).`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Đồng bộ toàn bộ thất bại.',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setFeedback({
        type: 'err',
        text: 'Trình duyệt không cho phép copy tự động. Vui lòng bôi đen vùng mã và nhấn Ctrl+C.',
      });
    }
  };

  const activeCounts = lastVerification?.sheetCounts || status?.sheetCounts || null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại Admin Dashboard</span>
      </button>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-sky-700">
          Web App → Backend bảo mật → Google Apps Script → Google Sheets
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
          Google Sheets Connection Settings
        </h1>
      </div>

      {/* Honest Connection Status Card */}
      {status && (
        <div
          className={`rounded-3xl border p-6 space-y-4 ${
            status.verified
              ? 'border-teal-200 bg-teal-50/70 text-teal-950'
              : 'border-amber-200 bg-amber-50/70 text-amber-950'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {status.verified ? (
                <CloudUpload className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
              ) : (
                <CloudOff className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-sm">
                <p className="font-display text-lg font-bold">{status.label}</p>
                <p>
                  URL Web App:{' '}
                  <span className="font-mono">{status.maskedUrl || 'Chưa cấu hình'}</span>
                  {status.fromEnvUrl && ' (đọc từ AI Studio Secrets)'}
                </p>
                <p>
                  Khóa bảo mật:{' '}
                  <strong>
                    {status.hasSecret
                      ? status.fromEnvSecret
                        ? 'Đã nạp an toàn từ AI Studio Secrets'
                        : 'Đã lưu an toàn trên máy chủ'
                      : 'Chưa cấu hình'}
                  </strong>
                </p>
                {status.spreadsheetName && status.verified && (
                  <p>
                    Google Sheet đang kết nối: <strong>{status.spreadsheetName}</strong>
                  </p>
                )}
                {status.lastTestedAt && (
                  <p className="text-xs opacity-85">
                    Kiểm tra gần nhất: {new Date(status.lastTestedAt).toLocaleString('vi-VN')}
                  </p>
                )}
                {status.lastSyncError && (
                  <p className="text-xs font-semibold text-rose-700">
                    Chi tiết lỗi gần nhất: {status.lastSyncError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={testing}
                onClick={() => void handleTestConnection()}
                className="btn-3d-primary min-h-[46px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                <span>
                  {testing ? 'Đang ghi & đọc kiểm chứng...' : 'Test Connection (Ghi & Đọc thật)'}
                </span>
              </button>
              {status.verified && (
                <button
                  type="button"
                  disabled={syncingAll}
                  onClick={() => void handleSyncAll()}
                  className="btn-3d-teal min-h-[46px] inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="h-4 w-4" />
                  <span>{syncingAll ? 'Đang đồng bộ...' : 'Đồng bộ toàn bộ dữ liệu'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Real Write & Read Verification Report */}
          {status.verified && activeCounts && (
            <div className="rounded-2xl border border-teal-200 bg-white/90 p-4 space-y-3 text-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold text-teal-900">
                  Kết quả kiểm chứng GHI & ĐỌC THẬT từ Google Sheets
                </p>
                {lastVerification?.verifiedEventId && (
                  <span className="font-mono text-xs text-teal-800">
                    Mã kiểm chứng đã ghi & đọc khớp: {lastVerification.verifiedEventId}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                {[
                  { label: 'Teachers', val: activeCounts.teachers },
                  { label: 'Learning Progress', val: activeCounts.learningProgress },
                  { label: 'Practice Results', val: activeCounts.practiceResults },
                  { label: 'Final Assessment', val: activeCounts.finalAssessment },
                  { label: 'Activity Log', val: activeCounts.activityLog },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-[11px] font-medium text-slate-500">{c.label}</p>
                    <p className="font-mono tabular-nums text-lg font-bold text-slate-900">
                      {c.val} dòng
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-2xl border p-4 text-sm ${
            feedback.type === 'ok'
              ? 'border-teal-200 bg-teal-50 text-teal-950'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedback.text}</span>
        </div>
      )}

      {/* Secure Server-Side Config Form */}
      <form onSubmit={handleSaveConfig} className="card-3d rounded-3xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">
            Cấu hình kết nối Google Apps Script Web App
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Nhà trường có thể nhập 3 biến môi trường (
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">ADMIN_PASSCODE</code>,{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">GOOGLE_APPS_SCRIPT_URL</code>,{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">GOOGLE_APPS_SCRIPT_SECRET</code>
            ) trong bảng <strong>Secrets của Google AI Studio</strong>, hoặc lưu trực tiếp tại đây trên máy chủ bảo mật. Khóa bí mật không bao giờ hiển thị lại ra trình duyệt.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="gas-url" className="block text-sm font-semibold text-slate-800 mb-1.5">
              URL Google Apps Script Web App (HTTPS, kết thúc bằng /exec)
            </label>
            <input
              id="gas-url"
              type="url"
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full min-h-[46px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-mono text-slate-900 focus:border-sky-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="gas-secret" className="block text-sm font-semibold text-slate-800">
                Khóa xác thực GOOGLE_APPS_SCRIPT_SECRET (trùng với SHARED_SECRET trong Apps Script)
              </label>
              <button
                type="button"
                onClick={handleGenerateSecret}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Tạo nhanh chuỗi bí mật 32 ký tự</span>
              </button>
            </div>

            <input
              id="gas-secret"
              type="password"
              value={secretInput}
              onChange={(e) => {
                setSecretInput(e.target.value);
                setGeneratedSecretPreview(null);
              }}
              placeholder={
                status?.hasSecret
                  ? 'Để trống nếu giữ nguyên khóa đang lưu trên máy chủ'
                  : 'Nhập chuỗi bí mật dài ít nhất 12 ký tự...'
              }
              className="w-full min-h-[46px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-mono text-slate-900 focus:border-sky-500"
            />

            {generatedSecretPreview && (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs text-sky-950 space-y-2">
                <p className="font-semibold">
                  Hãy sao chép chuỗi bí mật vừa tạo này để dán vào cả mục SHARED_SECRET của Apps Script (chỉ hiển thị 1 lần trước khi lưu):
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded-lg bg-white border border-sky-200 px-2.5 py-1.5 font-mono text-xs break-all">
                    {generatedSecretPreview}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyGeneratedSecret()}
                    className="inline-flex items-center gap-1 rounded-lg bg-sky-700 px-3 py-1.5 font-semibold text-white hover:bg-sky-800 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedSecret ? 'Đã sao chép!' : 'Sao chép khóa'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-3d-primary min-h-[46px] rounded-xl px-6 py-2 text-sm font-bold cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình trên máy chủ'}
          </button>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Chỉ cho phép kết nối tới domain chính thức script.google.com</span>
          </span>
        </div>
      </form>

      {/* 5 Sheets Structure Reference */}
      <div className="card-3d rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900">
          Cấu trúc 5 trang tính tự động khởi tạo trong Google Sheets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SHEET_TABS_SPEC.map((tab) => (
            <div
              key={tab.name}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2"
            >
              <p className="font-display font-bold text-sky-900">{tab.labelVi}</p>
              <p className="text-xs font-mono text-slate-700 leading-relaxed">
                {tab.columns.join(' | ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full Copyable Google Apps Script Code */}
      <div className="card-3d rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Mã nguồn Google Apps Script hoàn chỉnh (Code.gs)
            </h2>
            <p className="text-sm text-slate-600">
              Hỗ trợ tự tạo 5 trang tính, xác thực khóa bí mật SHARED_SECRET, kiểm tra GHI & ĐỌC THẬT (Test Connection), chống trùng lặp theo Attempt ID / Event ID.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100 cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép Code.gs'}</span>
          </button>
        </div>

        <pre className="max-h-96 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs font-mono text-sky-100 leading-relaxed">
          <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
        </pre>
      </div>
    </div>
  );
}
