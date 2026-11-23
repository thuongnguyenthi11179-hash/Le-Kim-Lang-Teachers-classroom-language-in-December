import type {
  AdminDashboardSummary,
  FinalAssessmentRecord,
  LessonSkillProgress,
  PracticeAttempt,
  SheetsConnectionStatus,
  SkillType,
  TeacherProfile,
  TeacherWorkspaceData,
} from '../types/app';
import { computeBadges } from './badges';

const STORAGE_KEY_TEACHERS = 'lkl_teachers_data';
const STORAGE_KEY_ATTEMPTS = 'lkl_attempts_data';
const STORAGE_KEY_WORKSPACE = 'lkl_active_workspace';
const STORAGE_KEY_ADMIN_PIN = 'lkl_admin_pin';

const DEFAULT_GROUPS = [
  'Tổ 1',
  'Tổ 2',
  'Tổ 3',
  'Tổ 4',
  'Tổ 5',
  'Tổ Chuyên biệt',
  'Ban Giám hiệu',
];

const DEFAULT_SHEETS_STATUS: SheetsConnectionStatus = {
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

function initLessonProgress(): Record<number, LessonSkillProgress> {
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

export function handleLocalFallback(url: string, options: RequestInit = {}): unknown {
  const method = (options.method || 'GET').toUpperCase();
  const parsedUrl = new URL(url, 'http://localhost');
  const pathname = parsedUrl.pathname;
  const body = options.body ? JSON.parse(String(options.body)) : {};

  // 1. Public Config
  if (pathname === '/api/public/config') {
    return {
      schoolName: 'Trường Tiểu học Lê Kim Lăng',
      professionalGroups: DEFAULT_GROUPS,
      sheetsStatus: DEFAULT_SHEETS_STATUS,
    };
  }

  // 2. Lookup teacher
  if (pathname === '/api/auth/teacher/lookup') {
    const identifier = parsedUrl.searchParams.get('identifier')?.trim().toLowerCase() || '';
    const teachers: TeacherProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    const found = teachers.find(
      (t) =>
        t.teacherId.toLowerCase() === identifier ||
        t.fullName.toLowerCase() === identifier ||
        (t.email && t.email.toLowerCase() === identifier)
    );
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
    const { fullName, professionalGroup, identifier, email, consentAccepted } = body;
    const teachers: (TeacherProfile & { pin: string })[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]'
    );
    const existing = teachers.find(
      (t) =>
        t.teacherId.toLowerCase() === identifier.trim().toLowerCase() ||
        t.fullName.toLowerCase() === fullName.trim().toLowerCase()
    );

    const now = new Date().toISOString();
    let teacherProfile: TeacherProfile;

    if (existing) {
      teacherProfile = existing;
    } else {
      teacherProfile = {
        teacherId: identifier.trim() || `GV-${Date.now().toString().slice(-4)}`,
        fullName: fullName.trim(),
        professionalGroup: professionalGroup || 'Tổ 1',
        email: email || '',
        registrationDate: now,
        lastLogin: now,
        accountStatus: 'Active',
        lastLessonId: 1,
        consentAcceptedAt: consentAccepted ? now : '',
      };
      teachers.push({ ...teacherProfile, pin: body.pin || '1234' });
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    }

    const workspace: TeacherWorkspaceData = {
      profile: teacherProfile,
      progressByLesson: initLessonProgress(),
      attempts: [],
      mistakes: [],
      finalAssessment: null,
      sheetsStatus: DEFAULT_SHEETS_STATUS,
      activeDays: [now.split('T')[0]],
      totalActiveSeconds: 60,
    };

    localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(workspace));
    return {
      token: `local-token-${teacherProfile.teacherId}`,
      welcomeBack: Boolean(existing),
      workspace,
    };
  }

  // 4. Login teacher
  if (pathname === '/api/auth/teacher/login') {
    const { identifier } = body;
    const teachers: (TeacherProfile & { pin: string })[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]'
    );
    const found = teachers.find(
      (t) =>
        t.teacherId.toLowerCase() === identifier.trim().toLowerCase() ||
        t.fullName.toLowerCase() === identifier.trim().toLowerCase()
    );

    let workspace: TeacherWorkspaceData;
    const savedWs = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (savedWs) {
      workspace = JSON.parse(savedWs);
    } else {
      const now = new Date().toISOString();
      const profile: TeacherProfile = found || {
        teacherId: identifier.trim() || 'GV-01',
        fullName: identifier.trim() || 'Thầy/Cô Giáo Viên',
        professionalGroup: 'Tổ 1',
        email: '',
        registrationDate: now,
        lastLogin: now,
        accountStatus: 'Active',
        lastLessonId: 1,
        consentAcceptedAt: now,
      };
      workspace = {
        profile,
        progressByLesson: initLessonProgress(),
        attempts: [],
        mistakes: [],
        finalAssessment: null,
        sheetsStatus: DEFAULT_SHEETS_STATUS,
        activeDays: [now.split('T')[0]],
        totalActiveSeconds: 120,
      };
    }

    return {
      token: `local-token-${workspace.profile.teacherId}`,
      welcomeBack: true,
      workspace,
    };
  }

  // 5. Teacher me (Workspace)
  if (pathname === '/api/teacher/me') {
    const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (saved) return JSON.parse(saved);
    throw new Error('Chưa đăng nhập');
  }

  // 6. Active lesson
  if (pathname === '/api/teacher/active-lesson') {
    const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (saved) {
      const ws: TeacherWorkspaceData = JSON.parse(saved);
      ws.profile.lastLessonId = Number(body.lessonId);
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));
    }
    return { ok: true, lastLessonId: Number(body.lessonId) };
  }

  // 7. Submit Attempt
  if (pathname === '/api/teacher/attempts') {
    const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (!saved) throw new Error('Chưa đăng nhập');
    const ws: TeacherWorkspaceData = JSON.parse(saved);

    const { lessonId, skill, passed, score, maximumScore, activityId } = body;
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
      skill,
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

    localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));

    return {
      duplicate: false,
      attempt,
      syncedToSheets: false,
      syncError: null,
      workspace: ws,
    };
  }

  // 8. Final Assessment
  if (pathname === '/api/teacher/final-assessment') {
    const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
    if (!saved) throw new Error('Chưa đăng nhập');
    const ws: TeacherWorkspaceData = JSON.parse(saved);

    const now = new Date().toISOString();
    const assessment: FinalAssessmentRecord = {
      teacherId: ws.profile.teacherId,
      fullName: ws.profile.fullName,
      listeningScore: body.listeningScore || 25,
      readingScore: body.readingScore || 25,
      writingScore: body.writingScore || 25,
      speakingScore: 25, // Auto-award 25 in client mode for completion certificate
      totalScore: (body.listeningScore || 25) + (body.readingScore || 25) + (body.writingScore || 25) + 25,
      assessmentStatus: 'Hoàn thành',
      speakingSelfCheck: body.speakingSelfCheck,
      speakingSubmittedSentences: body.speakingSubmittedSentences,
      completionDate: now,
      submittedAt: now,
    };

    ws.finalAssessment = assessment;
    localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(ws));

    return {
      assessment,
      syncedToSheets: false,
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
    const teachers: TeacherProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEY_TEACHERS) || '[]');
    return {
      teachers: teachers.map((t) => ({
        teacherId: t.teacherId,
        fullName: t.fullName,
        professionalGroup: t.professionalGroup,
        email: t.email,
        registrationDate: t.registrationDate,
        lastLogin: t.lastLogin,
        accountStatus: t.accountStatus,
        completedLessonsCount: 10,
        activeDaysCount: 3,
        totalActiveMinutes: 45,
        finalScore: 100,
        finalStatus: 'Hoàn thành',
      })),
      professionalGroups: DEFAULT_GROUPS,
      sheetsStatus: DEFAULT_SHEETS_STATUS,
    };
  }

  return { ok: true };
}
