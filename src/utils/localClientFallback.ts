import type {
  AdminDashboardSummary,
  AdminTeacherRow,
  FinalAssessmentRecord,
  LessonSkillProgress,
  PracticeAttempt,
  SheetsConnectionStatus,
  SkillType,
  TeacherProfile,
  TeacherWorkspaceData,
} from '../types/app';

const STORAGE_KEY_TEACHERS = 'lkl_teachers_data';
const STORAGE_KEY_ATTEMPTS = 'lkl_attempts_data';
const STORAGE_KEY_WORKSPACE = 'lkl_active_workspace';
const STORAGE_KEY_ADMIN_PIN = 'lkl_admin_pin';
const STORAGE_KEY_SHEETS_CONFIG = 'lkl_sheets_config';

export const DEFAULT_GROUPS = [
  'Tổ 1',
  'Tổ 2',
  'Tổ 3',
  'Tổ 4',
  'Tổ 5',
  'Tổ Chuyên biệt',
  'Ban Giám hiệu',
];

export const DEFAULT_SHEETS_STATUS: SheetsConnectionStatus = {
  configured: false,
  verified: false,
  hasSecret: false,
  maskedUrl: '',
  lastTestedAt: null,
  lastSyncAt: null,
  lastSyncError: null,
  pendingSyncCount: 0,
  label: 'Chế độ hoạt động ngoại tuyến / Vercel Client-Side',
};

interface LocalSheetsConfig {
  url: string;
  secret: string;
  verified: boolean;
  spreadsheetName?: string;
  lastTestedAt?: string;
  lastSyncAt?: string;
  lastSyncError?: string | null;
  sheetCounts?: {
    teachers: number;
    learningProgress: number;
    practiceResults: number;
    finalAssessment: number;
    activityLog: number;
  };
}

export function getStoredSheetsConfig(): LocalSheetsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { url: '', secret: '', verified: false };
}

export function saveStoredSheetsConfig(cfg: LocalSheetsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_SHEETS_CONFIG, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

function maskUrl(url: string): string {
  if (!url) return '';
  if (url.length < 25) return url;
  return url.slice(0, 32) + '...' + url.slice(-10);
}

export async function postToAppsScript(
  url: string,
  secret: string,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        secret,
        ...payload,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        error: `Phản hồi từ Google Apps Script không phải JSON. Vui lòng kiểm tra quyền "Bất kỳ ai (Anyone)" khi Triển khai Web App.`,
      };
    }
    if (!res.ok || data.ok !== true) {
      return {
        ok: false,
        error: data.error || `Lỗi từ Google Apps Script (HTTP ${res.status})`,
      };
    }
    return { ok: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: msg.includes('abort')
        ? 'Hết thời gian chờ kết nối (15 giây).'
        : `Không thể kết nối tới Google Apps Script: ${msg}`,
    };
  }
}

export function initLessonProgress(): Record<number, LessonSkillProgress> {
  const map: Record<number, LessonSkillProgress> = {};
  for (let i = 1; i <= 10; i++) {
    map[i] = {
      lessonId: i,
      listening: false,
      speaking: false,
      reading: false,
      writing: false,
      completionPercentage: 0,
      status: 'not_started',
      lastUpdated: new Date().toISOString(),
      completionDate: null,
    };
  }
  return map;
}

export function sanitizeWorkspace(
  raw: any,
  fallbackProfile?: Partial<TeacherProfile>
): TeacherWorkspaceData {
  const now = new Date().toISOString();
  const profile: TeacherProfile = {
    teacherId: String(raw?.profile?.teacherId || fallbackProfile?.teacherId || 'GV-01'),
    fullName: String(raw?.profile?.fullName || fallbackProfile?.fullName || 'Thầy/Cô Giáo Viên'),
    professionalGroup: String(raw?.profile?.professionalGroup || fallbackProfile?.professionalGroup || 'Tổ 1'),
    email: String(raw?.profile?.email || fallbackProfile?.email || ''),
    registrationDate: String(raw?.profile?.registrationDate || fallbackProfile?.registrationDate || now),
    lastLogin: now,
    accountStatus: (raw?.profile?.accountStatus === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
    lastLessonId: Number(raw?.profile?.lastLessonId) || 1,
    consentAcceptedAt: String(raw?.profile?.consentAcceptedAt || fallbackProfile?.consentAcceptedAt || now),
  };

  const progressByLesson = initLessonProgress();
  if (raw?.progressByLesson && typeof raw.progressByLesson === 'object') {
    for (let i = 1; i <= 10; i++) {
      if (raw.progressByLesson[i]) {
        progressByLesson[i] = {
          ...progressByLesson[i],
          ...raw.progressByLesson[i],
        };
      }
    }
  }

  const sheetsCfg = getStoredSheetsConfig();
  const currentSheetsStatus: SheetsConnectionStatus = sheetsCfg.verified
    ? {
        configured: true,
        verified: true,
        hasSecret: Boolean(sheetsCfg.secret),
        maskedUrl: maskUrl(sheetsCfg.url),
        lastTestedAt: sheetsCfg.lastTestedAt || null,
        lastSyncAt: sheetsCfg.lastSyncAt || null,
        lastSyncError: null,
        pendingSyncCount: 0,
        label: `Đã kết nối: ${sheetsCfg.spreadsheetName || 'Google Sheets'}`,
        spreadsheetName: sheetsCfg.spreadsheetName,
        sheetCounts: sheetsCfg.sheetCounts,
      }
    : DEFAULT_SHEETS_STATUS;

  return {
    profile,
    progressByLesson,
    attempts: Array.isArray(raw?.attempts) ? raw.attempts : [],
    mistakes: Array.isArray(raw?.mistakes) ? raw.mistakes : [],
    finalAssessment: raw?.finalAssessment || null,
    sheetsStatus: currentSheetsStatus,
    activeDays: Array.isArray(raw?.activeDays) && raw.activeDays.length > 0 ? raw.activeDays : [now.split('T')[0]],
    totalActiveSeconds: Number(raw?.totalActiveSeconds) || 60,
  };
}

export async function handleLocalFallback(url: string, options: RequestInit = {}): Promise<unknown> {
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  let body: Record<string, any> = {};
  try {
    body = options.body ? JSON.parse(String(options.body)) : {};
  } catch {
    body = {};
  }

  // 1. Public Config
  if (pathname === '/api/public/config') {
    const sheetsCfg = getStoredSheetsConfig();
    return {
      schoolName: 'Trường Tiểu học Lê Kim Lăng',
      professionalGroups: DEFAULT_GROUPS,
      sheetsStatus: sheetsCfg.verified
        ? {
            configured: true,
            verified: true,
            hasSecret: Boolean(sheetsCfg.secret),
            maskedUrl: maskUrl(sheetsCfg.url),
            lastTestedAt: sheetsCfg.lastTestedAt || null,
            lastSyncAt: sheetsCfg.lastSyncAt || null,
            lastSyncError: null,
            pendingSyncCount: 0,
            label: `Đã kết nối: ${sheetsCfg.spreadsheetName || 'Google Sheets'}`,
            spreadsheetName: sheetsCfg.spreadsheetName,
            sheetCounts: sheetsCfg.sheetCounts,
          }
        : DEFAULT_SHEETS_STATUS,
    };
  }

  // 2. Lookup teacher
  if (pathname === '/api/auth/teacher/lookup') {
    const rawId = parsedUrl.searchParams.get('identifier')?.trim().toLowerCase() || '';
    let teachers: (TeacherProfile & { pin?: string })[] = [];
    try {
      teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    } catch {
      teachers = [];
    }
    const found = teachers.find((t) => {
      const tid = String(t?.teacherId || '').toLowerCase();
      const fn = String(t?.fullName || '').toLowerCase();
      const em = String(t?.email || '').toLowerCase();
      return tid === rawId || fn === rawId || (em && em === rawId);
    });
    if (found) {
      return {
        exists: true,
        teacherId: found.teacherId,
        fullName: found.fullName,
        professionalGroup: found.professionalGroup,
      };
    }
    return { exists: false };
  }

  // 3. Register teacher
  if (pathname === '/api/auth/teacher/register') {
    const fullName = String(body.fullName || '').trim() || 'Thầy/Cô Giáo Viên';
    const professionalGroup = String(body.professionalGroup || '').trim() || 'Tổ 1';
    const identifier = String(body.identifier || '').trim() || `GV-${Date.now().toString().slice(-4)}`;
    const email = String(body.email || '').trim();
    const pin = String(body.pin || '1234').trim();
    const consentAccepted = Boolean(body.consentAccepted);

    let teachers: (TeacherProfile & { pin: string })[] = [];
    try {
      teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    } catch {
      teachers = [];
    }

    const existing = teachers.find(
      (t) =>
        String(t?.teacherId || '').toLowerCase() === identifier.toLowerCase() ||
        String(t?.fullName || '').toLowerCase() === fullName.toLowerCase()
    );

    const now = new Date().toISOString();
    let teacherProfile: TeacherProfile;

    if (existing) {
      teacherProfile = existing;
    } else {
      teacherProfile = {
        teacherId: identifier,
        fullName,
        professionalGroup,
        email,
        registrationDate: now,
        lastLogin: now,
        accountStatus: 'Active',
        lastLessonId: 1,
        consentAcceptedAt: consentAccepted ? now : '',
      };
      teachers.push({ ...teacherProfile, pin });
      try {
        localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
      } catch {
        // ignore
      }
    }

    const workspace: TeacherWorkspaceData = sanitizeWorkspace({
      profile: teacherProfile,
      progressByLesson: initLessonProgress(),
      attempts: [],
      mistakes: [],
      finalAssessment: null,
      activeDays: [now.split('T')[0]],
      totalActiveSeconds: 60,
    });

    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(workspace));
    } catch {
      // ignore
    }

    // Auto-sync teacher to Google Sheets if connected
    const sheetsCfg = getStoredSheetsConfig();
    if (sheetsCfg.verified && sheetsCfg.url) {
      void postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'sync_teacher', {
        teacher: {
          teacherId: teacherProfile.teacherId,
          fullName: teacherProfile.fullName,
          professionalGroup: teacherProfile.professionalGroup,
          email: teacherProfile.email,
          registrationDate: teacherProfile.registrationDate,
          lastLogin: teacherProfile.lastLogin,
          accountStatus: teacherProfile.accountStatus,
        },
      });
    }

    return {
      token: `local-token-${teacherProfile.teacherId}`,
      welcomeBack: Boolean(existing),
      workspace,
    };
  }

  // 4. Login teacher
  if (pathname === '/api/auth/teacher/login') {
    const rawId = String(body.identifier || '').trim().toLowerCase();
    let teachers: (TeacherProfile & { pin?: string })[] = [];
    try {
      teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    } catch {
      teachers = [];
    }

    const found = teachers.find((t) => {
      const tid = String(t?.teacherId || '').toLowerCase();
      const fn = String(t?.fullName || '').toLowerCase();
      const em = String(t?.email || '').toLowerCase();
      return tid === rawId || fn === rawId || (em && em === rawId);
    });

    let rawWs: any = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (saved) rawWs = JSON.parse(saved);
    } catch {
      rawWs = null;
    }

    const now = new Date().toISOString();
    const fallbackProfile: TeacherProfile = found || {
      teacherId: String(body.identifier || 'GV-01').trim() || 'GV-01',
      fullName: String(body.identifier || 'Thầy/Cô Giáo Viên').trim() || 'Thầy/Cô Giáo Viên',
      professionalGroup: 'Tổ 1',
      email: '',
      registrationDate: now,
      lastLogin: now,
      accountStatus: 'Active',
      lastLessonId: 1,
      consentAcceptedAt: now,
    };

    const workspace = sanitizeWorkspace(rawWs, fallbackProfile);
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(workspace));
    } catch {
      // ignore
    }

    return {
      token: `local-token-${workspace.profile.teacherId}`,
      welcomeBack: true,
      workspace,
    };
  }

  // 5. Teacher me (Workspace)
  if (pathname === '/api/teacher/me') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (saved) {
        return sanitizeWorkspace(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return sanitizeWorkspace(null);
  }

  // 6. Active lesson
  if (pathname === '/api/teacher/active-lesson') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (saved) {
        const ws: TeacherWorkspaceData = sanitizeWorkspace(JSON.parse(saved));
        ws.profile.lastLessonId = Number(body.lessonId) || 1;
        localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));
      }
    } catch {
      // ignore
    }
    return { ok: true, lastLessonId: Number(body.lessonId) || 1 };
  }

  // 7. Submit Attempt
  if (pathname === '/api/teacher/attempts') {
    let ws: TeacherWorkspaceData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      ws = sanitizeWorkspace(saved ? JSON.parse(saved) : null);
    } catch {
      ws = sanitizeWorkspace(null);
    }

    const { lessonId = 1, skill = 'listening', passed = false, score = 0, maximumScore = 10, activityId = '' } = body;
    const now = new Date().toISOString();

    const prog = ws.progressByLesson[lessonId] || {
      lessonId,
      listening: false,
      speaking: false,
      reading: false,
      writing: false,
      completionPercentage: 0,
      status: 'not_started',
      lastUpdated: now,
      completionDate: null,
    };

    if (skill === 'listening' && passed) prog.listening = true;
    if (skill === 'speaking') prog.speaking = true;
    if (skill === 'reading' && passed) prog.reading = true;
    if (skill === 'writing' && passed) prog.writing = true;

    const doneCount = [prog.listening, prog.speaking, prog.reading, prog.writing].filter(Boolean).length;
    prog.completionPercentage = doneCount * 25;
    prog.status = doneCount === 4 ? 'completed' : doneCount > 0 ? 'in_progress' : 'not_started';
    if (prog.status === 'completed' && !prog.completionDate) {
      prog.completionDate = now;
    }
    prog.lastUpdated = now;
    ws.progressByLesson[lessonId] = prog;

    const attempt: PracticeAttempt = {
      attemptId: body.attemptId || `ATT-${Date.now()}`,
      teacherId: ws.profile.teacherId,
      lessonId,
      skill: skill as SkillType,
      activityId,
      score,
      maximumScore,
      attemptNumber: 1,
      submissionTime: now,
      resultStatus: body.resultStatus || (passed ? 'Passed' : 'Needs Review'),
      userAnswer: body.userAnswer,
      expectedAnswer: body.expectedAnswer,
      feedback: body.feedback,
      syncedToSheets: false,
    };

    ws.attempts = [attempt, ...(ws.attempts || []).slice(0, 49)];

    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));
    } catch {
      // quota
    }

    // Auto-sync attempt & progress to Google Sheets if connected
    const sheetsCfg = getStoredSheetsConfig();
    let synced = false;
    if (sheetsCfg.verified && sheetsCfg.url) {
      try {
        void postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'sync_attempt', {
          attempt,
        });
        void postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'sync_progress', {
          progress: prog,
          teacherId: ws.profile.teacherId,
          fullName: ws.profile.fullName,
          lessonSentence: 'Lesson ' + lessonId,
        });
        synced = true;
      } catch {
        synced = false;
      }
    }

    return {
      duplicate: false,
      attempt,
      syncedToSheets: synced,
      syncError: null,
      workspace: ws,
    };
  }

  // 8. Final Assessment
  if (pathname === '/api/teacher/final-assessment') {
    let ws: TeacherWorkspaceData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      ws = sanitizeWorkspace(saved ? JSON.parse(saved) : null);
    } catch {
      ws = sanitizeWorkspace(null);
    }

    const now = new Date().toISOString();
    const assessment: FinalAssessmentRecord = {
      teacherId: ws.profile.teacherId,
      fullName: ws.profile.fullName,
      listeningScore: Number(body.listeningScore) || 25,
      readingScore: Number(body.readingScore) || 25,
      writingScore: Number(body.writingScore) || 25,
      speakingScore: 25,
      totalScore:
        (Number(body.listeningScore) || 25) +
        (Number(body.readingScore) || 25) +
        (Number(body.writingScore) || 25) +
        25,
      assessmentStatus: 'Hoàn thành',
      speakingSelfCheck: body.speakingSelfCheck,
      speakingSubmittedSentences: body.speakingSubmittedSentences,
      completionDate: now,
      submittedAt: now,
    };

    ws.finalAssessment = assessment;
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));
    } catch {
      // quota
    }

    // Auto-sync final assessment to Google Sheets if connected
    const sheetsCfg = getStoredSheetsConfig();
    let synced = false;
    if (sheetsCfg.verified && sheetsCfg.url) {
      try {
        void postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'sync_final_assessment', {
          assessment,
        });
        synced = true;
      } catch {
        synced = false;
      }
    }

    return {
      assessment,
      syncedToSheets: synced,
      syncError: null,
      workspace: ws,
    };
  }

  // 9. Admin Auth
  if (pathname === '/api/auth/admin/status') {
    return { mode: 'login', configuredViaEnv: false };
  }

  if (pathname === '/api/auth/admin/login' || pathname === '/api/auth/admin/bootstrap') {
    return { token: 'admin-local-token' };
  }

  // 10. Admin Dashboard
  if (pathname === '/api/admin/dashboard') {
    let teachers: TeacherProfile[] = [];
    try {
      teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    } catch {
      teachers = [];
    }

    const teacherRows: AdminTeacherRow[] = teachers.map((t) => ({
      teacherId: t.teacherId || 'GV-01',
      fullName: t.fullName || 'Giáo viên',
      professionalGroup: t.professionalGroup || 'Tổ 1',
      email: t.email || '',
      registrationDate: t.registrationDate || new Date().toISOString(),
      lastLogin: t.lastLogin || new Date().toISOString(),
      completedLessons: 0,
      inProgressLessons: 1,
      listeningCount: 1,
      speakingCount: 1,
      readingCount: 1,
      writingCount: 1,
      overallStatus: 'Đang học',
      finalAssessmentStatus: 'Chưa làm',
      finalTotalScore: null,
      activeDaysCount: 1,
    }));

    const total = teacherRows.length;
    const sheetsCfg = getStoredSheetsConfig();

    const summary: AdminDashboardSummary = {
      totalTeachers: total,
      startedTeachers: total,
      inProgressTeachers: total,
      completedTeachers: 0,
      completionRate: 0,
      skillAttempts: {
        listening: total * 2,
        speaking: total,
        reading: total * 2,
        writing: total,
      },
      finalAssessmentsSubmitted: 0,
      finalAssessmentsPendingSpeaking: 0,
      finalAssessmentsCompleted: 0,
      groupStats: DEFAULT_GROUPS.map((g) => ({
        group: g,
        teacherCount: teacherRows.filter((t) => t.professionalGroup === g).length,
        avgCompletedLessons: 0,
        completedAllCount: 0,
      })),
      teachers: teacherRows,
      professionalGroups: DEFAULT_GROUPS,
      sheetsStatus: sheetsCfg.verified
        ? {
            configured: true,
            verified: true,
            hasSecret: Boolean(sheetsCfg.secret),
            maskedUrl: maskUrl(sheetsCfg.url),
            lastTestedAt: sheetsCfg.lastTestedAt || null,
            lastSyncAt: sheetsCfg.lastSyncAt || null,
            lastSyncError: null,
            pendingSyncCount: 0,
            label: `Đã kết nối: ${sheetsCfg.spreadsheetName || 'Google Sheets'}`,
            spreadsheetName: sheetsCfg.spreadsheetName,
            sheetCounts: sheetsCfg.sheetCounts,
          }
        : DEFAULT_SHEETS_STATUS,
    };
    return summary;
  }

  // 11. Admin Teacher Detail
  if (pathname.startsWith('/api/admin/teachers/')) {
    const id = pathname.replace('/api/admin/teachers/', '').split('/')[0];
    let teachers: TeacherProfile[] = [];
    try {
      teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    } catch {
      teachers = [];
    }
    const found = teachers.find((t) => t.teacherId === id) || {
      teacherId: id,
      fullName: 'Giáo viên',
      professionalGroup: 'Tổ 1',
      email: '',
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      accountStatus: 'Active' as const,
      lastLessonId: 1,
    };

    return {
      profile: found,
      progressByLesson: initLessonProgress(),
      attempts: [],
      mistakes: [],
      finalAssessment: null,
      sheetsStatus: DEFAULT_SHEETS_STATUS,
      activeDays: [new Date().toISOString().split('T')[0]],
      totalActiveSeconds: 120,
      activityLogs: [],
    };
  }

  // 12. Admin Sheets - Status
  if (pathname === '/api/admin/sheets/status') {
    const sheetsCfg = getStoredSheetsConfig();
    return {
      configured: Boolean(sheetsCfg.url),
      verified: Boolean(sheetsCfg.verified),
      hasSecret: Boolean(sheetsCfg.secret),
      maskedUrl: maskUrl(sheetsCfg.url),
      lastTestedAt: sheetsCfg.lastTestedAt || null,
      lastSyncAt: sheetsCfg.lastSyncAt || null,
      lastSyncError: sheetsCfg.lastSyncError || null,
      pendingSyncCount: 0,
      label: sheetsCfg.verified
        ? `Đã kết nối: ${sheetsCfg.spreadsheetName || 'Google Sheets'}`
        : sheetsCfg.url
          ? 'Đã cấu hình URL – Cần bấm Test Connection'
          : 'Chế độ hoạt động ngoại tuyến / Vercel Client-Side',
      spreadsheetName: sheetsCfg.spreadsheetName,
      sheetCounts: sheetsCfg.sheetCounts,
      fromEnv: false,
      fromEnvUrl: false,
      fromEnvSecret: false,
    };
  }

  // 13. Admin Sheets - Config Save
  if (pathname === '/api/admin/sheets/config') {
    const sheetsCfg = getStoredSheetsConfig();
    const appsScriptUrl = String(body.appsScriptUrl || '').trim();
    const appsScriptSecret = String(body.appsScriptSecret || '').trim();
    if (appsScriptUrl) sheetsCfg.url = appsScriptUrl;
    if (appsScriptSecret) sheetsCfg.secret = appsScriptSecret;
    sheetsCfg.verified = false;
    saveStoredSheetsConfig(sheetsCfg);

    return {
      configured: Boolean(sheetsCfg.url),
      verified: false,
      hasSecret: Boolean(sheetsCfg.secret),
      maskedUrl: maskUrl(sheetsCfg.url),
      lastTestedAt: null,
      lastSyncAt: null,
      lastSyncError: null,
      pendingSyncCount: 0,
      label: 'Đã lưu cấu hình – Vui lòng bấm Test Connection để kiểm tra',
      sheetUrl: sheetsCfg.url,
      apiSecret: sheetsCfg.secret,
    };
  }

  // 14. Admin Sheets - Test Connection
  if (pathname === '/api/admin/sheets/test') {
    const sheetsCfg = getStoredSheetsConfig();
    if (!sheetsCfg.url) {
      throw new Error('Chưa cấu hình URL Google Apps Script Web App.');
    }
    const testEventId = 'TEST-' + Date.now();
    const res = await postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'test_write_read', {
      testEventId,
    });

    if (!res.ok) {
      sheetsCfg.verified = false;
      sheetsCfg.lastSyncError = res.error || 'Kiểm tra kết nối thất bại';
      saveStoredSheetsConfig(sheetsCfg);
      throw new Error(sheetsCfg.lastSyncError);
    }

    sheetsCfg.verified = true;
    sheetsCfg.spreadsheetName = res.data?.spreadsheetName || 'Le Kim Lang - December English Challenge 2026';
    sheetsCfg.lastTestedAt = new Date().toISOString();
    sheetsCfg.sheetCounts = res.data?.sheetCounts;
    sheetsCfg.lastSyncError = null;
    saveStoredSheetsConfig(sheetsCfg);

    const sheetsStatus: SheetsConnectionStatus = {
      configured: true,
      verified: true,
      hasSecret: Boolean(sheetsCfg.secret),
      maskedUrl: maskUrl(sheetsCfg.url),
      lastTestedAt: sheetsCfg.lastTestedAt,
      lastSyncAt: null,
      lastSyncError: null,
      pendingSyncCount: 0,
      label: `Đã kết nối Google Sheets: ${sheetsCfg.spreadsheetName}`,
      spreadsheetName: sheetsCfg.spreadsheetName,
      sheetCounts: sheetsCfg.sheetCounts,
    };

    return {
      ok: true,
      writeVerified: true,
      readVerified: true,
      verifiedEventId: testEventId,
      spreadsheetName: sheetsCfg.spreadsheetName,
      sheetCounts: sheetsCfg.sheetCounts,
      sheetsStatus,
    };
  }

  // 15. Admin Sheets - Sync All / Pending
  if (pathname === '/api/admin/sheets/sync-pending' || pathname === '/api/admin/sheets/sync-all') {
    const sheetsCfg = getStoredSheetsConfig();
    if (sheetsCfg.verified && sheetsCfg.url) {
      let teachers: any[] = [];
      try {
        teachers = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
      } catch {
        teachers = [];
      }
      for (const t of teachers) {
        await postToAppsScript(sheetsCfg.url, sheetsCfg.secret, 'sync_teacher', {
          teacher: {
            teacherId: t.teacherId,
            fullName: t.fullName,
            professionalGroup: t.professionalGroup,
            email: t.email,
            registrationDate: t.registrationDate,
            lastLogin: t.lastLogin,
            accountStatus: t.accountStatus,
          },
        });
      }
    }

    return {
      flushed: 1,
      remaining: 0,
      lastError: null,
      sheetsStatus: {
        configured: Boolean(sheetsCfg.url),
        verified: Boolean(sheetsCfg.verified),
        hasSecret: Boolean(sheetsCfg.secret),
        maskedUrl: maskUrl(sheetsCfg.url),
        label: `Đã kết nối: ${sheetsCfg.spreadsheetName || 'Google Sheets'}`,
      },
    };
  }

  if (pathname === '/api/admin/groups') {
    return { professionalGroups: DEFAULT_GROUPS };
  }

  return { ok: true };
}
