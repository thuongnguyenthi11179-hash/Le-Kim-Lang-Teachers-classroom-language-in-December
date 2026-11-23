import type {
  AdminDashboardSummary,
  FinalAssessmentRecord,
  PracticeAttempt,
  SheetsConnectionStatus,
  SkillType,
  SpeakingSelfCheck,
  TeacherWorkspaceData,
} from '../types/app';
import { handleLocalFallback } from './localClientFallback';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response | null = null;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    // Network or server error -> fallback to client-side storage
    try {
      return handleLocalFallback(url, options) as T;
    } catch {
      throw new ApiError(
        'Không thể kết nối tới máy chủ. Kiểm tra mạng Internet — bài làm của thầy/cô vẫn được giữ nguyên trên màn hình.',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  // If server responded with 404/502 (e.g. static Vercel hosting where /api routes do not exist)
  if (response && (response.status === 404 || response.status === 502)) {
    try {
      return handleLocalFallback(url, options) as T;
    } catch {
      // ignore
    }
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    // non-JSON fallback
  }

  if (!response.ok) {
    throw new ApiError(
      String(data.error || `Yêu cầu thất bại (Mã ${response.status})`),
      response.status,
      data.code ? String(data.code) : undefined
    );
  }
  return data as T;
}

export const api = {
  getPublicConfig() {
    return requestJson<{
      schoolName: string;
      professionalGroups: string[];
      sheetsStatus: SheetsConnectionStatus;
    }>('/api/public/config');
  },

  lookupTeacher(identifier: string) {
    return requestJson<{
      exists: boolean;
      teacherId?: string;
      fullName?: string;
      professionalGroup?: string;
    }>(`/api/auth/teacher/lookup?identifier=${encodeURIComponent(identifier)}`);
  },

  registerTeacher(body: {
    fullName: string;
    professionalGroup: string;
    identifier: string;
    email?: string;
    pin: string;
    consentAccepted: boolean;
  }) {
    return requestJson<{
      token: string;
      welcomeBack: boolean;
      workspace: TeacherWorkspaceData;
    }>('/api/auth/teacher/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  loginTeacher(body: { identifier: string; pin: string }) {
    return requestJson<{
      token: string;
      welcomeBack: boolean;
      workspace: TeacherWorkspaceData;
    }>('/api/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getTeacherWorkspace(token: string) {
    return requestJson<TeacherWorkspaceData>('/api/teacher/me', {}, token);
  },

  setActiveLesson(token: string, lessonId: number) {
    return requestJson<{ ok: boolean; lastLessonId: number }>(
      '/api/teacher/active-lesson',
      { method: 'POST', body: JSON.stringify({ lessonId }) },
      token
    );
  },

  submitAttempt(
    token: string,
    payload: {
      attemptId: string;
      lessonId: number;
      skill: SkillType;
      activityId: string;
      score: number;
      maximumScore: number;
      passed: boolean;
      resultStatus: PracticeAttempt['resultStatus'];
      userAnswer?: string;
      expectedAnswer?: string;
      feedback?: string;
      prompt?: string;
    }
  ) {
    return requestJson<{
      duplicate: boolean;
      attempt: PracticeAttempt;
      syncedToSheets: boolean;
      syncError: string | null;
      workspace: TeacherWorkspaceData;
    }>(
      '/api/teacher/attempts',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  logActivity(
    token: string,
    payload: {
      eventId: string;
      eventType: string;
      lessonId?: number | null;
      durationSeconds: number;
    }
  ) {
    return requestJson<{ ok: boolean; syncedToSheets?: boolean }>(
      '/api/teacher/activity',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  submitFinalAssessment(
    token: string,
    payload: {
      listeningScore: number;
      readingScore: number;
      writingScore: number;
      speakingSelfCheck: SpeakingSelfCheck;
      speakingSubmittedSentences: string[];
    }
  ) {
    return requestJson<{
      assessment: FinalAssessmentRecord;
      syncedToSheets: boolean;
      syncError: string | null;
      workspace: TeacherWorkspaceData;
    }>(
      '/api/teacher/final-assessment',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  retryTeacherSync(token: string) {
    return requestJson<{
      flushed: number;
      remaining: number;
      lastError: string | null;
      sheetsStatus: SheetsConnectionStatus;
    }>('/api/teacher/sync-retry', { method: 'POST' }, token);
  },

  // Admin APIs
  getAdminStatus() {
    return requestJson<{ mode: 'bootstrap' | 'login'; configuredViaEnv: boolean }>(
      '/api/auth/admin/status'
    );
  },

  bootstrapAdmin(password: string, confirmPassword: string) {
    return requestJson<{ token: string; mode: string }>('/api/auth/admin/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ password, confirmPassword }),
    });
  },

  loginAdmin(password: string) {
    return requestJson<{ token: string }>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  getAdminDashboard(token: string) {
    return requestJson<AdminDashboardSummary>('/api/admin/dashboard', {}, token);
  },

  getAdminTeacherDetail(token: string, teacherId: string) {
    return requestJson<
      TeacherWorkspaceData & {
        activityLogs: Array<{
          eventId: string;
          eventType: string;
          timestamp: string;
          lessonId: number | null;
          durationSeconds: number;
          eventStatus: string;
        }>;
      }
    >(`/api/admin/teachers/${encodeURIComponent(teacherId)}`, {}, token);
  },

  gradeTeacherSpeaking(
    token: string,
    teacherId: string,
    speakingScore: number,
    feedback: string
  ) {
    return requestJson<{
      assessment: FinalAssessmentRecord;
      syncedToSheets: boolean;
      syncError: string | null;
    }>(
      `/api/admin/teachers/${encodeURIComponent(teacherId)}/grade-speaking`,
      { method: 'POST', body: JSON.stringify({ speakingScore, feedback }) },
      token
    );
  },

  updateProfessionalGroups(token: string, groups: string[]) {
    return requestJson<{ professionalGroups: string[] }>(
      '/api/admin/groups',
      { method: 'PUT', body: JSON.stringify({ groups }) },
      token
    );
  },

  getAdminSheetsStatus(token: string) {
    return requestJson<
      SheetsConnectionStatus & {
        fromEnv: boolean;
        fromEnvUrl?: boolean;
        fromEnvSecret?: boolean;
      }
    >('/api/admin/sheets/status', {}, token);
  },

  saveSheetsConfig(
    token: string,
    body: { appsScriptUrl: string; appsScriptSecret?: string }
  ) {
    return requestJson<SheetsConnectionStatus>(
      '/api/admin/sheets/config',
      { method: 'POST', body: JSON.stringify(body) },
      token
    );
  },

  testSheetsConnection(token: string) {
    return requestJson<{
      ok: boolean;
      spreadsheetName?: string;
      writeVerified?: boolean;
      readVerified?: boolean;
      verifiedEventId?: string;
      sheetCounts?: {
        teachers: number;
        learningProgress: number;
        practiceResults: number;
        finalAssessment: number;
        activityLog: number;
      };
      sheetsStatus: SheetsConnectionStatus;
    }>('/api/admin/sheets/test', { method: 'POST' }, token);
  },

  syncAllSheets(token: string) {
    return requestJson<{
      ok: boolean;
      syncedRecords: number;
      failedRecords: number;
      remainingPending: number;
      lastError: string | null;
      sheetsStatus: SheetsConnectionStatus;
    }>('/api/admin/sheets/sync-all', { method: 'POST' }, token);
  },

  async downloadAdminCsv(token: string, type: 'all' | 'incomplete'): Promise<void> {
    const res = await fetch(`/api/admin/export-csv?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new ApiError('Không thể xuất file báo cáo CSV.', res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      type === 'incomplete'
        ? 'le-kim-lang-chua-hoan-thanh-thang-12.csv'
        : 'le-kim-lang-bao-cao-thang-12.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  deleteTeacherRecord(token: string, teacherId: string) {
    return requestJson<{ ok: boolean }>(
      `/api/admin/teachers/${encodeURIComponent(teacherId)}`,
      { method: 'DELETE' },
      token
    );
  },
};
