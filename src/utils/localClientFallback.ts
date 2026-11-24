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

  return {
    profile,
    progressByLesson,
    attempts: Array.isArray(raw?.attempts) ? raw.attempts : [],
    mistakes: Array.isArray(raw?.mistakes) ? raw.mistakes : [],
    finalAssessment: raw?.finalAssessment || null,
    sheetsStatus: raw?.sheetsStatus || DEFAULT_SHEETS_STATUS,
    activeDays: Array.isArray(raw?.activeDays) && raw.activeDays.length > 0 ? raw.activeDays : [now.split('T')[0]],
    totalActiveSeconds: Number(raw?.totalActiveSeconds) || 60,
  };
}

export function handleLocalFallback(url: string, options: RequestInit = {}): unknown {
  const method = (options.method || 'GET').toUpperCase();
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
    return {
      schoolName: 'Trường Tiểu học Lê Kim Lăng',
      professionalGroups: DEFAULT_GROUPS,
      sheetsStatus: DEFAULT_SHEETS_STATUS,
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
        // storage quota
      }
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

    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(workspace));
    } catch {
      // storage quota
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
      // storage quota
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
      totalScore: (Number(body.listeningScore) || 25) + (Number(body.readingScore) || 25) + (Number(body.writingScore) || 25) + 25,
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
      sheetsStatus: DEFAULT_SHEETS_STATUS,
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

  // 12. Admin Sheets
  if (pathname === '/api/admin/sheets/status') {
    return {
      ...DEFAULT_SHEETS_STATUS,
      fromEnv: false,
      fromEnvUrl: false,
      fromEnvSecret: false,
    };
  }

  if (pathname === '/api/admin/sheets/config') {
    return {
      configured: false,
      verified: false,
      maskedUrl: '',
      hasSecret: false,
      sheetUrl: '',
      apiSecret: '',
    };
  }

  if (pathname === '/api/admin/sheets/test' || pathname === '/api/admin/sheets/sync-pending') {
    return {
      success: true,
      message: 'Kết nối chế độ ngoại tuyến thành công.',
      sheetsStatus: DEFAULT_SHEETS_STATUS,
      rowCounts: { teachers: 0, attempts: 0, finalAssessments: 0 },
    };
  }

  if (pathname === '/api/admin/groups') {
    return { professionalGroups: DEFAULT_GROUPS };
  }

  return { ok: true };
}
