import { useState } from 'react';
import { Menu, X, Settings, KeyRound, Sparkles } from 'lucide-react';
import type { ScreenId } from '../types/app';

interface TopBarProps {
  mode: 'guest' | 'teacher' | 'admin';
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onPrimaryAction: () => void;
  onOpenApiKeyModal?: () => void;
  hasApiKey?: boolean;
  isSystemKey?: boolean;
}

interface NavItem {
  id: ScreenId;
  label: string;
}

export function TopBar({
  mode,
  currentScreen,
  onNavigate,
  onPrimaryAction,
  onOpenApiKeyModal,
  hasApiKey = false,
  isSystemKey = false,
}: TopBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] =
    mode === 'teacher'
      ? [
          { id: 'dashboard', label: 'Trang chủ' },
          { id: 'lessons', label: '10 Bài học' },
          { id: 'practice', label: 'Luyện tập' },
          { id: 'final-challenge', label: 'Kiểm tra' },
          { id: 'progress', label: 'Tiến độ' },
        ]
      : mode === 'admin'
        ? [
            { id: 'admin-dashboard', label: 'Tổng quan' },
            { id: 'admin-sheets', label: 'Google Sheets' },
            { id: 'welcome', label: 'Trang chính' },
          ]
        : [
            { id: 'welcome', label: 'Giới thiệu' },
            { id: 'login', label: 'Giáo viên' },
            { id: 'admin-login', label: 'Quản trị' },
          ];

  const primaryLabel =
    mode === 'teacher'
      ? 'Đăng xuất'
      : mode === 'admin'
        ? 'Đăng xuất'
        : 'Bắt đầu học';

  const handleLinkClick = (id: ScreenId) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() =>
            handleLinkClick(
              mode === 'teacher'
                ? 'dashboard'
                : mode === 'admin'
                  ? 'admin-dashboard'
                  : 'welcome'
            )
          }
          className="font-display text-lg font-bold tracking-tight text-sky-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          English every month
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Điều hướng chính"
        >
          {navItems.map((item) => {
            const active =
              currentScreen === item.id ||
              (item.id === 'lessons' && currentScreen === 'lesson-detail') ||
              (item.id === 'practice' && currentScreen === 'mistakes') ||
              (item.id === 'progress' && currentScreen === 'achievements') ||
              (item.id === 'admin-dashboard' && currentScreen === 'admin-teacher-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLinkClick(item.id)}
                className={`relative py-1 text-[15px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-sky-700 font-semibold after:absolute after:inset-x-0 after:-bottom-[18px] after:h-0.5 after:bg-sky-600'
                    : 'text-slate-600 hover:text-sky-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Settings (API Key) + Single Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              title="Cấu hình Gemini API Key"
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs hover:bg-rose-100"
            >
              <KeyRound className="h-4 w-4 text-rose-600 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold tracking-tight text-slate-800 flex items-center gap-1">
                  Settings (API Key)
                  {hasApiKey && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Key đã sẵn sàng" />}
                </span>
                <span className="text-[10px] text-red-600 font-extrabold whitespace-nowrap">
                  Lấy API key để sử dụng app
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onPrimaryAction();
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] ${
              mode === 'guest'
                ? 'btn-3d-primary'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors'
            }`}
          >
            {primaryLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50/70 text-sky-900 hover:bg-sky-100"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sky-100 bg-white px-4 py-3 shadow-lg space-y-2">
          {onOpenApiKeyModal && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenApiKeyModal();
              }}
              className="w-full flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-left font-bold text-slate-800 hover:bg-rose-100"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-900">
                  Settings (API Key)
                  {hasApiKey && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />}
                </span>
              </div>
              <span className="text-xs font-extrabold text-red-600">Lấy API key để sử dụng app</span>
            </button>
          )}

          <nav className="flex flex-col gap-1" aria-label="Điều hướng di động">
            {navItems.map((item) => {
              const active = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLinkClick(item.id)}
                  className={`flex min-h-[44px] items-center rounded-xl px-3 text-left text-base font-medium transition-colors ${
                    active
                      ? 'bg-sky-50 text-sky-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
