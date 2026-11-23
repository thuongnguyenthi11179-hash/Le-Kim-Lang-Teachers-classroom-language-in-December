import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AdminDashboardScreen } from './components/screens/AdminDashboardScreen';
import { AdminLoginScreen } from './components/screens/AdminLoginScreen';
import { AdminTeacherDetailScreen } from './components/screens/AdminTeacherDetailScreen';
import { FinalChallengeScreen } from './components/screens/FinalChallengeScreen';
import { GoogleSheetsSettingsScreen } from './components/screens/GoogleSheetsSettingsScreen';
import { LessonDetailScreen } from './components/screens/LessonDetailScreen';
import { PracticeZoneScreen } from './components/screens/PracticeZoneScreen';
import { ProgressAndAchievementsScreen } from './components/screens/ProgressAndAchievementsScreen';
import { TeacherDashboardScreen } from './components/screens/TeacherDashboardScreen';
import { TeacherLoginScreen } from './components/screens/TeacherLoginScreen';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import type {
  ScreenId,
  SheetsConnectionStatus,
  SkillType,
  SpeakingSelfCheck,
  TeacherWorkspaceData,
} from './types/app';
import { api, ApiError } from './utils/api';
import { stopSpeech } from './utils/speech';
import { hasConfiguredApiKey, isUsingSystemApiKey } from './utils/gemini';

const DEFAULT_SHEETS_STATUS: SheetsConnectionStatus = {
  configured: false,
  verified: false,
  hasSecret: false,
  maskedUrl: '',
  lastTestedAt: null,
  lastSyncAt: null,
  lastSyncError: null,
  pendingSyncCount: 0,
  label: 'Chế độ dùng thử – Chưa kết nối Google Sheets',
};

interface QueuedAttempt {
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
}

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('welcome');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('dashboard');

  // Public school config
  const [professionalGroups, setProfessionalGroups] = useState<string[]>([
    'Tổ 1',
    'Tổ 2',
    'Tổ 3',
    'Tổ 4',
    'Tổ 5',
    'Tổ Chuyên biệt',
    'Ban Giám hiệu',
  ]);
  const [sheetsStatus, setSheetsStatus] = useState<SheetsConnectionStatus>(DEFAULT_SHEETS_STATUS);

  // In-memory session tokens (never persisted in localStorage/sessionStorage)
  const [teacherToken, setTeacherToken] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<TeacherWorkspaceData | null>(null);
  const [welcomeBack, setWelcomeBack] = useState(false);

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [selectedAdminTeacherId, setSelectedAdminTeacherId] = useState<string>('');

  // Active lesson state
  const [activeLessonId, setActiveLessonId] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Gemini API Key Modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Offline / Network resilience state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueue, setOfflineQueue] = useState<QueuedAttempt[]>([]);

  // Feedback Toast
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const lastInteractionRef = useRef<number>(Date.now());
  const activeSecondsBufferRef = useRef<number>(0);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Fetch initial public config (professional groups + honest Google Sheets status)
  useEffect(() => {
    api
      .getPublicConfig()
      .then((cfg) => {
        if (cfg?.professionalGroups && Array.isArray(cfg.professionalGroups)) {
          setProfessionalGroups(cfg.professionalGroups);
        }
        if (cfg?.sheetsStatus) {
          setSheetsStatus(cfg.sheetsStatus);
        }
      })
      .catch(() => {
        // Keep safe defaults
      });

    // Enforce API key setup on initial app launch if not yet configured
    if (!hasConfiguredApiKey()) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Online / Offline listener + auto-flush queued attempts when network restores
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('ok', 'Đã khôi phục kết nối Internet.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        'err',
        'Mất kết nối Internet. Bài tập thầy/cô đang làm sẽ được giữ tạm và tự đồng bộ khi có mạng lại.'
      );
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Flush offline queue automatically when back online
  useEffect(() => {
    if (!isOnline || !teacherToken || offlineQueue.length === 0) return;
    const flush = async () => {
      const remaining: QueuedAttempt[] = [];
      let flushedCount = 0;
      for (const item of offlineQueue) {
        try {
          const res = await api.submitAttempt(teacherToken, item);
          setWorkspace(res.workspace);
          setSheetsStatus(res.workspace.sheetsStatus);
          flushedCount += 1;
        } catch {
          remaining.push(item);
        }
      }
      setOfflineQueue(remaining);
      if (flushedCount > 0) {
        showToast('ok', `Đã tự động lưu ${flushedCount} bài làm bị gián đoạn mạng!`);
      }
    };
    void flush();
  }, [isOnline, teacherToken, offlineQueue]);

  // Interactive-only Active Study Time tracker (pauses when tab hidden or idle > 60s)
  useEffect(() => {
    if (!teacherToken) return;

    const markActive = () => {
      lastInteractionRef.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));

    const interval = window.setInterval(() => {
      const isVisible = document.visibilityState === 'visible';
      const recentlyActive = Date.now() - lastInteractionRef.current < 60_000;
      if (isVisible && recentlyActive && navigator.onLine) {
        activeSecondsBufferRef.current += 5;
        if (activeSecondsBufferRef.current >= 30) {
          const chunk = activeSecondsBufferRef.current;
          activeSecondsBufferRef.current = 0;
          void api
            .logActivity(teacherToken, {
              eventId: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              eventType: 'ACTIVE_STUDY_SESSION',
              lessonId: screen === 'lesson-detail' ? activeLessonId : null,
              durationSeconds: chunk,
            })
            .catch(() => {
              // Ignore silent background telemetry errors
            });
        }
      }
    }, 5000);

    return () => {
      window.clearInterval(interval);
      events.forEach((ev) => window.removeEventListener(ev, markActive));
    };
  }, [teacherToken, screen, activeLessonId]);

  const navigate = (next: ScreenId) => {
    stopSpeech();
    setPreviousScreen(screen);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLesson = (lessonId: number) => {
    setActiveLessonId(lessonId);
    if (teacherToken) {
      void api.setActiveLesson(teacherToken, lessonId).catch(() => {
        // non-blocking
      });
    }
    navigate('lesson-detail');
  };

  const handleTeacherAuthenticated = (data: {
    token: string;
    welcomeBack: boolean;
    workspace: TeacherWorkspaceData;
  }) => {
    setTeacherToken(data.token);
    setWorkspace(data.workspace);
    setSheetsStatus(data.workspace.sheetsStatus);
    setWelcomeBack(data.welcomeBack);
    setActiveLessonId(data.workspace.profile.lastLessonId || 1);
    showToast(
      'ok',
      data.welcomeBack
        ? `Welcome back, ${data.workspace.profile.fullName}! Đã khôi phục tiến độ học tập.`
        : `Chào mừng thầy/cô ${data.workspace.profile.fullName} tham gia Thử thách Tháng 12!`
    );
    navigate('dashboard');
  };

  const handleTeacherLogout = () => {
    stopSpeech();
    setTeacherToken(null);
    setWorkspace(null);
    setOfflineQueue([]);
    setWelcomeBack(false);
    navigate('welcome');
    showToast('ok', 'Đã đăng xuất tài khoản giáo viên.');
  };

  const handleAdminAuthenticated = (token: string) => {
    setAdminToken(token);
    navigate('admin-dashboard');
    showToast('ok', 'Đăng nhập Quản trị viên thành công.');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setSelectedAdminTeacherId('');
    navigate('welcome');
    showToast('ok', 'Đã đăng xuất khu vực Quản trị viên.');
  };

  const handleSubmitAttempt = async (payload: QueuedAttempt) => {
    if (!teacherToken) return;
    setSaving(true);
    try {
      const res = await api.submitAttempt(teacherToken, payload);
      setWorkspace(res.workspace);
      setSheetsStatus(res.workspace.sheetsStatus);
      if (res.workspace.sheetsStatus.verified) {
        if (res.syncedToSheets) {
          showToast('ok', 'Đã lưu kết quả bài làm và đồng bộ thành công lên Google Sheets!');
        } else {
          showToast(
            'err',
            'Đã lưu bài làm trên máy chủ, nhưng chưa đồng bộ được Google Sheets (sẽ thử lại tự động).'
          );
        }
      } else {
        showToast('ok', 'Đã lưu kết quả thực hành vào hồ sơ học tập của thầy/cô!');
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NETWORK_ERROR') {
        setOfflineQueue((prev) => [...prev, payload]);
        showToast(
          'err',
          'Mất kết nối mạng! Bài làm đã được giữ trong hàng chờ và sẽ tự lưu khi có mạng lại.'
        );
      } else {
        showToast('err', err instanceof Error ? err.message : 'Không thể lưu kết quả lúc này.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinalAssessment = async (payload: {
    listeningScore: number;
    readingScore: number;
    writingScore: number;
    speakingSelfCheck: SpeakingSelfCheck;
    speakingSubmittedSentences: string[];
  }) => {
    if (!teacherToken) return;
    setSaving(true);
    try {
      const res = await api.submitFinalAssessment(teacherToken, payload);
      setWorkspace(res.workspace);
      setSheetsStatus(res.workspace.sheetsStatus);
      showToast(
        'ok',
        'Đã nộp bài Kiểm tra cuối tháng! Phần Speaking đang chờ giáo viên phụ trách xác nhận điểm.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRetryTeacherSync = async () => {
    if (!teacherToken) return;
    try {
      const res = await api.retryTeacherSync(teacherToken);
      setSheetsStatus(res.sheetsStatus);
      if (workspace) {
        setWorkspace({ ...workspace, sheetsStatus: res.sheetsStatus });
      }
      if (res.flushed > 0) {
        showToast('ok', `Đã đồng bộ lại thành công ${res.flushed} bản ghi lên Google Sheets!`);
      } else if (res.lastError) {
        showToast('err', res.lastError);
      }
    } catch (err) {
      showToast('err', err instanceof Error ? err.message : 'Không thể thử đồng bộ lại.');
    }
  };

  const topBarMode: 'guest' | 'teacher' | 'admin' =
    adminToken &&
    (screen === 'admin-dashboard' ||
      screen === 'admin-teacher-detail' ||
      screen === 'admin-sheets')
      ? 'admin'
      : teacherToken && workspace
        ? 'teacher'
        : 'guest';

  const handlePrimaryTopBarAction = () => {
    if (topBarMode === 'teacher') {
      handleTeacherLogout();
    } else if (topBarMode === 'admin') {
      handleAdminLogout();
    } else {
      navigate('login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFD] text-slate-800">
      <TopBar
        mode={topBarMode}
        currentScreen={screen}
        onNavigate={(next) => {
          if (
            !teacherToken &&
            ['dashboard', 'lessons', 'lesson-detail', 'practice', 'mistakes', 'final-challenge', 'progress', 'achievements'].includes(
              next
            )
          ) {
            navigate('login');
            return;
          }
          if (
            !adminToken &&
            ['admin-dashboard', 'admin-teacher-detail', 'admin-sheets'].includes(next)
          ) {
            navigate('admin-login');
            return;
          }
          navigate(next);
        }}
        onPrimaryAction={handlePrimaryTopBarAction}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={hasConfiguredApiKey()}
        isSystemKey={isUsingSystemApiKey()}
      />

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2.5 text-center text-sm font-semibold text-amber-950 flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>
            Đang mất kết nối Internet · Bài tập thầy/cô làm ({offlineQueue.length} chờ lưu) sẽ tự động đồng bộ khi có mạng lại.
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-50 max-w-md rounded-2xl border shadow-lg px-4 py-3.5 text-sm font-medium flex items-start gap-2.5 bg-white ${
            toast.type === 'ok'
              ? 'border-teal-200 text-teal-900'
              : 'border-rose-200 text-rose-900'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {screen === 'welcome' && (
          <WelcomeScreen
            sheetsStatus={sheetsStatus}
            onStartTeacher={() => navigate(teacherToken ? 'dashboard' : 'login')}
            onOpenAdmin={() => navigate(adminToken ? 'admin-dashboard' : 'admin-login')}
          />
        )}

        {screen === 'login' && (
          <TeacherLoginScreen
            professionalGroups={professionalGroups}
            onAuthenticated={handleTeacherAuthenticated}
            onBack={() => navigate('welcome')}
          />
        )}

        {(screen === 'dashboard' || screen === 'lessons') && workspace && (
          <TeacherDashboardScreen
            workspace={workspace}
            welcomeBack={welcomeBack}
            viewMode={screen === 'lessons' ? 'lessons' : 'dashboard'}
            onOpenLesson={handleOpenLesson}
            onNavigate={navigate}
          />
        )}

        {screen === 'lesson-detail' && workspace && (
          <LessonDetailScreen
            lessonId={activeLessonId}
            progress={workspace.progressByLesson[activeLessonId]}
            saving={saving}
            onSubmitAttempt={handleSubmitAttempt}
            onSelectLesson={handleOpenLesson}
            onBack={() =>
              navigate(previousScreen === 'lessons' ? 'lessons' : 'dashboard')
            }
            onHome={() => navigate('dashboard')}
          />
        )}

        {(screen === 'practice' || screen === 'mistakes') && workspace && (
          <PracticeZoneScreen
            workspace={workspace}
            initialMode={screen === 'mistakes' ? 'mistakes' : 'hub'}
            saving={saving}
            onSubmitAttempt={handleSubmitAttempt}
            onNavigate={navigate}
          />
        )}

        {screen === 'final-challenge' && workspace && (
          <FinalChallengeScreen
            existingAssessment={workspace.finalAssessment}
            saving={saving}
            onSubmitAssessment={handleSubmitFinalAssessment}
            teacherName={workspace.profile.fullName}
            professionalGroup={workspace.profile.professionalGroup}
          />
        )}

        {(screen === 'progress' || screen === 'achievements') && workspace && (
          <ProgressAndAchievementsScreen
            workspace={workspace}
            initialTab={screen === 'achievements' ? 'achievements' : 'progress'}
            onOpenLesson={handleOpenLesson}
            onRetrySync={handleRetryTeacherSync}
          />
        )}

        {screen === 'admin-login' && (
          <AdminLoginScreen
            onAdminAuthenticated={handleAdminAuthenticated}
            onBack={() => navigate(teacherToken ? 'dashboard' : 'welcome')}
          />
        )}

        {screen === 'admin-dashboard' && adminToken && (
          <AdminDashboardScreen
            adminToken={adminToken}
            onSelectTeacher={(id) => {
              setSelectedAdminTeacherId(id);
              navigate('admin-teacher-detail');
            }}
            onOpenSheetsSettings={() => navigate('admin-sheets')}
            onGroupsUpdated={setProfessionalGroups}
          />
        )}

        {screen === 'admin-teacher-detail' && adminToken && selectedAdminTeacherId && (
          <AdminTeacherDetailScreen
            adminToken={adminToken}
            teacherId={selectedAdminTeacherId}
            onBack={() => navigate('admin-dashboard')}
          />
        )}

        {screen === 'admin-sheets' && adminToken && (
          <GoogleSheetsSettingsScreen
            adminToken={adminToken}
            onStatusUpdated={setSheetsStatus}
            onBack={() => navigate('admin-dashboard')}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-sky-100 bg-white mt-12">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            Trường Tiểu học Lê Kim Lăng · English for Primary Teachers – December Challenge (12/2026)
          </p>
          <div className="flex items-center gap-4">
            {teacherToken && (
              <button
                type="button"
                onClick={() => navigate('login')}
                className="hover:text-sky-800 cursor-pointer"
              >
                Đổi tài khoản giáo viên
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate(adminToken ? 'admin-dashboard' : 'admin-login')}
              className="hover:text-sky-800 cursor-pointer"
            >
              Quản trị nhà trường
            </button>
          </div>
        </div>
      </footer>

      {/* Gemini API Key & Model Configuration Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        isMandatory={!hasConfiguredApiKey()}
        onKeySaved={() => {
          showToast('ok', 'Đã lưu cấu hình Model & API Key Gemini thành công!');
        }}
      />
    </div>
  );
}
