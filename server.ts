import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Ephemeral in-memory fallback if SESSION_SECRET is unset (never written to disk)
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const LESSON_SENTENCES: Record<number, string> = {
  1: 'Well done!',
  2: 'Great job!',
  3: 'Nice try!',
  4: "Don't worry. You can do it!",
  5: "I'm proud of you!",
  6: 'Are you ready?',
  7: 'Any ideas?',
  8: 'Good voice and clear!',
  9: 'How do you feel?',
  10: 'Are you happy?',
};

const DEFAULT_GROUPS = [
  'Tổ 1',
  'Tổ 2',
  'Tổ 3',
  'Tổ 4',
  'Tổ 5',
  'Tổ Chuyên biệt',
  'Ban Giám hiệu',
];

interface StoredTeacher {
  teacherId: string;
  fullName: string;
  professionalGroup: string;
  email: string;
  pinHash: string;
  registrationDate: string;
  lastLogin: string;
  accountStatus: 'Active' | 'Inactive';
  lastLessonId: number;
  consentAcceptedAt: string;
  activeDays: string[];
  totalActiveSeconds: number;
}

interface StoredLessonProgress {
  lessonId: number;
  listening: boolean;
  speaking: boolean;
  reading: boolean;
  writing: boolean;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastUpdated: string;
  completionDate: string | null;
}

interface StoredAttempt {
  attemptId: string;
  teacherId: string;
  lessonId: number;
  skill: 'listening' | 'speaking' | 'reading' | 'writing';
  activityId: string;
  score: number;
  maximumScore: number;
  attemptNumber: number;
  submissionTime: string;
  resultStatus: 'Passed' | 'Needs Review' | 'Self-Evaluated' | 'Pending Review';
  userAnswer?: string;
  expectedAnswer?: string;
  feedback?: string;
  syncedToSheets?: boolean;
}

interface StoredMistake {
  id: string;
  teacherId: string;
  lessonId: number;
  skill: 'listening' | 'reading' | 'writing';
  activityId: string;
  prompt: string;
  wrongAnswer: string;
  correctAnswer: string;
  timestamp: string;
  resolved: boolean;
}

interface StoredFinalAssessment {
  teacherId: string;
  fullName: string;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  speakingScore: number | null;
  totalScore: number | null;
  assessmentStatus: 'Chờ đánh giá' | 'Hoàn thành';
  speakingSelfCheck?: {
    listenedModel: boolean;
    recordedVoice: boolean;
    replayedVoice: boolean;
    confidentInClass: boolean;
    recognizedText?: string;
    notes?: string;
  };
  speakingSubmittedSentences?: string[];
  adminSpeakingFeedback?: string;
  gradedByAdminAt?: string | null;
  submittedAt: string;
  completionDate: string | null;
  syncedToSheets?: boolean;
}

interface StoredActivityEvent {
  eventId: string;
  teacherId: string;
  eventType: string;
  timestamp: string;
  lessonId: number | null;
  durationSeconds: number;
  eventStatus: string;
  syncedToSheets?: boolean;
}

interface PendingSyncItem {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
  lastError?: string;
}

interface StoreData {
  adminAuthHash: string | null;
  professionalGroups: string[];
  sheetsConfig: {
    appsScriptUrl: string;
    appsScriptSecret: string;
    verified: boolean;
    lastTestedAt: string | null;
    lastSyncAt: string | null;
    lastSyncError: string | null;
    lastSpreadsheetName?: string | null;
    lastSheetCounts?: {
      teachers: number;
      learningProgress: number;
      practiceResults: number;
      finalAssessment: number;
      activityLog: number;
    } | null;
  };
  teachers: Record<string, StoredTeacher>;
  progress: Record<string, Record<number, StoredLessonProgress>>;
  attempts: StoredAttempt[];
  mistakes: StoredMistake[];
  finalAssessments: Record<string, StoredFinalAssessment>;
  activityLogs: StoredActivityEvent[];
  pendingSyncQueue: PendingSyncItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function createEmptyStore(): StoreData {
  return {
    adminAuthHash: null,
    professionalGroups: [...DEFAULT_GROUPS],
    sheetsConfig: {
      appsScriptUrl: '',
      appsScriptSecret: '',
      verified: false,
      lastTestedAt: null,
      lastSyncAt: null,
      lastSyncError: null,
    },
    teachers: {},
    progress: {},
    attempts: [],
    mistakes: [],
    finalAssessments: {},
    activityLogs: [],
    pendingSyncQueue: [],
  };
}

function loadStore(): StoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return createEmptyStore();
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const base = createEmptyStore();
    return {
      ...base,
      ...parsed,
      professionalGroups:
        Array.isArray(parsed.professionalGroups) && parsed.professionalGroups.length > 0
          ? parsed.professionalGroups
          : base.professionalGroups,
      sheetsConfig: {
        ...base.sheetsConfig,
        ...(parsed.sheetsConfig ?? {}),
      },
      teachers: parsed.teachers ?? {},
      progress: parsed.progress ?? {},
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      finalAssessments: parsed.finalAssessments ?? {},
      activityLogs: Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [],
      pendingSyncQueue: Array.isArray(parsed.pendingSyncQueue) ? parsed.pendingSyncQueue : [],
    };
  } catch {
    return createEmptyStore();
  }
}

let store: StoreData = loadStore();
let persistChain: Promise<void> = Promise.resolve();

function saveStore(): Promise<void> {
  const snapshot = JSON.stringify(store, null, 2);
  persistChain = persistChain
    .then(async () => {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmpPath = `${STORE_PATH}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      await fs.promises.writeFile(tmpPath, snapshot, { encoding: 'utf8', mode: 0o600 });
      await fs.promises.rename(tmpPath, STORE_PATH);
    })
    .catch((err) => {
      console.error('Failed to persist server store:', err);
    });
  return persistChain;
}

// --- Password & Token Cryptography ---

function hashSecret(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyHashedSecret(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

interface SessionPayload {
  role: 'teacher' | 'admin';
  teacherId?: string;
  exp: number;
}

function signToken(payload: Omit<SessionPayload, 'exp'>, ttlHours = 12): string {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + ttlHours * 3600 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    if (parsed.role !== 'teacher' && parsed.role !== 'admin') return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  session?: SessionPayload;
}

function extractBearer(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim();
}

function requireTeacher(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Phiên đăng nhập giáo viên không hợp lệ. Vui lòng đăng nhập lại.' });
    return;
  }
  const session = verifyToken(token);
  if (!session || session.role !== 'teacher' || !session.teacherId || !store.teachers[session.teacherId]) {
    res.status(401).json({ error: 'Phiên đăng nhập giáo viên đã hết hạn. Vui lòng đăng nhập lại.' });
    return;
  }
  req.session = session;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: 'Yêu cầu quyền quản trị viên.' });
    return;
  }
  const session = verifyToken(token);
  if (!session || session.role !== 'admin') {
    res.status(403).json({ error: 'Không có quyền truy cập khu vực quản trị viên.' });
    return;
  }
  req.session = session;
  next();
}

// --- Google Apps Script SSRF-Safe Sync Helpers ---

function validateAppsScriptUrl(rawUrl: string): { valid: boolean; normalized?: string; error?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { valid: false, error: 'URL Google Apps Script không được để trống.' };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Định dạng URL không hợp lệ.' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL kết nối bắt buộc phải sử dụng HTTPS.' };
  }
  const host = parsed.hostname.toLowerCase();
  const allowedHosts = ['script.google.com', 'script.googleusercontent.com'];
  if (!allowedHosts.includes(host)) {
    return {
      valid: false,
      error: 'Chỉ chấp nhận URL Web App chính thức từ script.google.com hoặc script.googleusercontent.com.',
    };
  }
  if (!parsed.pathname.startsWith('/macros/')) {
    return {
      valid: false,
      error: 'URL Google Apps Script Web App phải bắt đầu bằng /macros/s/.../exec.',
    };
  }
  return { valid: true, normalized: parsed.toString() };
}

function getEffectiveSheetsConfig() {
  const envUrl = (process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  const envSecret = (process.env.GOOGLE_APPS_SCRIPT_SECRET || '').trim();
  const url = envUrl || store.sheetsConfig.appsScriptUrl;
  const secret = envSecret || store.sheetsConfig.appsScriptSecret;
  return {
    url,
    secret,
    fromEnv: Boolean(envUrl || envSecret),
    fromEnvUrl: Boolean(envUrl),
    fromEnvSecret: Boolean(envSecret),
    verified: store.sheetsConfig.verified && Boolean(url && secret),
  };
}

function maskUrl(url: string): string {
  if (!url) return '';
  if (url.length <= 42) return url;
  return `${url.slice(0, 34)}...${url.slice(-10)}`;
}

function buildSheetsStatus(teacherId?: string) {
  const eff = getEffectiveSheetsConfig();
  const configured = Boolean(eff.url && eff.secret);
  const pendingCount = teacherId
    ? store.pendingSyncQueue.filter((item) => {
        const p = item.payload as Record<string, { teacherId?: string }>;
        return (
          p.teacher?.teacherId === teacherId ||
          p.progress?.teacherId === teacherId ||
          p.attempt?.teacherId === teacherId ||
          p.assessment?.teacherId === teacherId ||
          p.event?.teacherId === teacherId
        );
      }).length
    : store.pendingSyncQueue.length;

  return {
    configured,
    verified: eff.verified,
    hasSecret: Boolean(eff.secret),
    maskedUrl: maskUrl(eff.url),
    lastTestedAt: store.sheetsConfig.lastTestedAt,
    lastSyncAt: store.sheetsConfig.lastSyncAt,
    lastSyncError: store.sheetsConfig.lastSyncError,
    spreadsheetName: store.sheetsConfig.lastSpreadsheetName || null,
    sheetCounts: store.sheetsConfig.lastSheetCounts || null,
    pendingSyncCount: pendingCount,
    label: eff.verified
      ? 'Đã kết nối & xác thực Google Sheets'
      : 'Chế độ dùng thử – Chưa kết nối Google Sheets',
  };
}

async function postToAppsScript(
  url: string,
  secret: string,
  action: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  const check = validateAppsScriptUrl(url);
  if (!check.valid || !check.normalized) {
    return { ok: false, error: check.error || 'URL Apps Script không hợp lệ.' };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(check.normalized, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action,
        secret,
        ...payload,
      }),
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        error: `Google Apps Script trả về định dạng không phải JSON (HTTP ${response.status}). Kiểm tra quyền triển khai Web App.`,
      };
    }
    if (!response.ok || parsed.ok !== true) {
      return {
        ok: false,
        error: String(parsed.error || `Lỗi đồng bộ Google Sheets (HTTP ${response.status})`),
      };
    }
    return { ok: true, data: parsed };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.name === 'AbortError'
          ? 'Hết thời gian kết nối tới Google Apps Script (12 giây).'
          : 'Không thể kết nối mạng tới Google Apps Script.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function enqueueAndSync(
  action: string,
  payload: Record<string, unknown>
): Promise<{ synced: boolean; error?: string }> {
  const eff = getEffectiveSheetsConfig();
  if (!eff.url || !eff.secret || !eff.verified) {
    return { synced: false };
  }

  const result = await postToAppsScript(eff.url, eff.secret, action, payload);
  if (result.ok) {
    store.sheetsConfig.lastSyncAt = new Date().toISOString();
    store.sheetsConfig.lastSyncError = null;
    await saveStore();
    return { synced: true };
  }

  store.sheetsConfig.lastSyncError = result.error || 'Lỗi đồng bộ Google Sheets';
  store.pendingSyncQueue.push({
    id: `SYNC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
    retries: 1,
    lastError: result.error,
  });
  // Cap queue to prevent unbounded memory growth
  if (store.pendingSyncQueue.length > 500) {
    store.pendingSyncQueue = store.pendingSyncQueue.slice(-500);
  }
  await saveStore();
  return { synced: false, error: result.error };
}

async function flushPendingSync(teacherIdFilter?: string): Promise<{ flushed: number; remaining: number; lastError: string | null }> {
  const eff = getEffectiveSheetsConfig();
  if (!eff.url || !eff.secret || !eff.verified) {
    return {
      flushed: 0,
      remaining: store.pendingSyncQueue.length,
      lastError: 'Google Sheets chưa được kết nối và xác thực.',
    };
  }

  let flushed = 0;
  let lastError: string | null = null;
  const remainingQueue: PendingSyncItem[] = [];

  for (const item of store.pendingSyncQueue) {
    const p = item.payload as Record<string, { teacherId?: string }>;
    const itemTeacherId =
      p.teacher?.teacherId ||
      p.progress?.teacherId ||
      p.attempt?.teacherId ||
      p.assessment?.teacherId ||
      p.event?.teacherId;

    if (teacherIdFilter && itemTeacherId !== teacherIdFilter) {
      remainingQueue.push(item);
      continue;
    }

    const res = await postToAppsScript(eff.url, eff.secret, item.action, item.payload);
    if (res.ok) {
      flushed += 1;
      store.sheetsConfig.lastSyncAt = new Date().toISOString();
      store.sheetsConfig.lastSyncError = null;
    } else {
      lastError = res.error || 'Lỗi đồng bộ';
      store.sheetsConfig.lastSyncError = lastError;
      remainingQueue.push({
        ...item,
        retries: item.retries + 1,
        lastError,
      });
    }
  }

  store.pendingSyncQueue = remainingQueue;
  await saveStore();
  return { flushed, remaining: remainingQueue.length, lastError };
}

// --- Domain Helpers ---

function normalizeIdentifier(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureTeacherProgressMap(teacherId: string): Record<number, StoredLessonProgress> {
  if (!store.progress[teacherId]) {
    store.progress[teacherId] = {};
  }
  for (let id = 1; id <= 10; id++) {
    if (!store.progress[teacherId][id]) {
      store.progress[teacherId][id] = {
        lessonId: id,
        listening: false,
        speaking: false,
        reading: false,
        writing: false,
        completionPercentage: 0,
        status: 'not_started',
        lastUpdated: '',
        completionDate: null,
      };
    }
  }
  return store.progress[teacherId];
}

function recomputeLessonProgress(lp: StoredLessonProgress, nowIso: string): StoredLessonProgress {
  const doneCount = [lp.listening, lp.speaking, lp.reading, lp.writing].filter(Boolean).length;
  const pct = doneCount * 25;
  lp.completionPercentage = pct;
  lp.lastUpdated = nowIso;
  if (doneCount === 4) {
    lp.status = 'completed';
    if (!lp.completionDate) lp.completionDate = nowIso;
  } else if (doneCount > 0) {
    lp.status = 'in_progress';
    lp.completionDate = null;
  } else {
    lp.status = 'not_started';
    lp.completionDate = null;
  }
  return lp;
}

function recordActiveDay(teacher: StoredTeacher) {
  const today = getTodayDateString();
  if (!teacher.activeDays.includes(today)) {
    teacher.activeDays.push(today);
  }
}

function sanitizeTeacherProfile(t: StoredTeacher) {
  return {
    teacherId: t.teacherId,
    fullName: t.fullName,
    professionalGroup: t.professionalGroup,
    email: t.email,
    registrationDate: t.registrationDate,
    lastLogin: t.lastLogin,
    accountStatus: t.accountStatus,
    lastLessonId: t.lastLessonId || 1,
    consentAcceptedAt: t.consentAcceptedAt,
  };
}

function buildTeacherWorkspace(teacherId: string) {
  const teacher = store.teachers[teacherId];
  const progressByLesson = ensureTeacherProgressMap(teacherId);
  const attempts = store.attempts
    .filter((a) => a.teacherId === teacherId)
    .sort((a, b) => b.submissionTime.localeCompare(a.submissionTime));
  const mistakes = store.mistakes
    .filter((m) => m.teacherId === teacherId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const finalAssessment = store.finalAssessments[teacherId] ?? null;

  return {
    profile: sanitizeTeacherProfile(teacher),
    progressByLesson,
    attempts,
    mistakes,
    finalAssessment,
    activeDays: teacher.activeDays,
    totalActiveSeconds: teacher.totalActiveSeconds,
    sheetsStatus: buildSheetsStatus(teacherId),
  };
}

function escapeCsvCell(value: unknown): string {
  let str = value === null || value === undefined ? '' : String(value);
  // Prevent CSV formula injection when opened in Excel
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildAdminSummary() {
  const teacherList = Object.values(store.teachers);
  let startedTeachers = 0;
  let inProgressTeachers = 0;
  let completedTeachers = 0;

  const groupMap = new Map<string, { count: number; totalCompleted: number; allTen: number }>();
  for (const g of store.professionalGroups) {
    groupMap.set(g, { count: 0, totalCompleted: 0, allTen: 0 });
  }

  const rows = teacherList.map((t) => {
    const pMap = ensureTeacherProgressMap(t.teacherId);
    const lessons = Object.values(pMap);
    const completedLessons = lessons.filter((l) => l.status === 'completed').length;
    const inProgressLessons = lessons.filter((l) => l.status === 'in_progress').length;
    const listeningCount = lessons.filter((l) => l.listening).length;
    const speakingCount = lessons.filter((l) => l.speaking).length;
    const readingCount = lessons.filter((l) => l.reading).length;
    const writingCount = lessons.filter((l) => l.writing).length;

    let overallStatus: 'Hoàn thành 10/10' | 'Đang học' | 'Chưa bắt đầu' = 'Chưa bắt đầu';
    if (completedLessons === 10) {
      overallStatus = 'Hoàn thành 10/10';
      completedTeachers += 1;
      startedTeachers += 1;
    } else if (completedLessons > 0 || inProgressLessons > 0 || listeningCount + speakingCount + readingCount + writingCount > 0) {
      overallStatus = 'Đang học';
      inProgressTeachers += 1;
      startedTeachers += 1;
    }

    const gStats = groupMap.get(t.professionalGroup) ?? { count: 0, totalCompleted: 0, allTen: 0 };
    gStats.count += 1;
    gStats.totalCompleted += completedLessons;
    if (completedLessons === 10) gStats.allTen += 1;
    groupMap.set(t.professionalGroup, gStats);

    const fa = store.finalAssessments[t.teacherId];
    return {
      teacherId: t.teacherId,
      fullName: t.fullName,
      professionalGroup: t.professionalGroup,
      email: t.email,
      registrationDate: t.registrationDate,
      lastLogin: t.lastLogin,
      completedLessons,
      inProgressLessons,
      listeningCount,
      speakingCount,
      readingCount,
      writingCount,
      overallStatus,
      finalAssessmentStatus: fa ? fa.assessmentStatus : 'Chưa làm bài',
      finalTotalScore: fa ? fa.totalScore : null,
      activeDaysCount: t.activeDays.length,
    };
  });

  const skillAttempts = { listening: 0, speaking: 0, reading: 0, writing: 0 };
  for (const a of store.attempts) {
    if (a.skill in skillAttempts) {
      skillAttempts[a.skill] += 1;
    }
  }

  const finalList = Object.values(store.finalAssessments);
  const groupStats = Array.from(groupMap.entries()).map(([group, data]) => ({
    group,
    teacherCount: data.count,
    avgCompletedLessons: data.count > 0 ? Number((data.totalCompleted / data.count).toFixed(1)) : 0,
    completedAllCount: data.allTen,
  }));

  return {
    totalTeachers: teacherList.length,
    startedTeachers,
    inProgressTeachers,
    completedTeachers,
    completionRate:
      teacherList.length > 0 ? Math.round((completedTeachers / teacherList.length) * 100) : 0,
    skillAttempts,
    finalAssessmentsSubmitted: finalList.length,
    finalAssessmentsPendingSpeaking: finalList.filter((f) => f.assessmentStatus === 'Chờ đánh giá')
      .length,
    finalAssessmentsCompleted: finalList.filter((f) => f.assessmentStatus === 'Hoàn thành').length,
    groupStats,
    teachers: rows.sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi')),
    professionalGroups: store.professionalGroups,
    sheetsStatus: buildSheetsStatus(),
  };
}

// --- Express App ---

const app = express();
app.use(express.json({ limit: '512kb' }));

// Public config (professional groups & honest sheets connection banner)
app.get('/api/public/config', (_req, res) => {
  res.json({
    schoolName: 'Trường Tiểu học Lê Kim Lăng',
    professionalGroups: store.professionalGroups,
    sheetsStatus: buildSheetsStatus(),
  });
});

// Teacher lookup (only returns existence + group, never leaks private progress or PIN)
app.get('/api/auth/teacher/lookup', (req, res) => {
  const raw = String(req.query.identifier || '');
  const id = normalizeIdentifier(raw);
  if (!id || id.length < 3) {
    res.json({ exists: false });
    return;
  }
  const existing = store.teachers[id];
  if (!existing) {
    res.json({ exists: false });
    return;
  }
  res.json({
    exists: true,
    teacherId: existing.teacherId,
    fullName: existing.fullName,
    professionalGroup: existing.professionalGroup,
  });
});

// Teacher register (new unique Teacher ID / school email + PIN)
app.post('/api/auth/teacher/register', async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim();
  const professionalGroup = String(req.body?.professionalGroup || '').trim();
  const rawIdentifier = String(req.body?.identifier || '').trim();
  const email = String(req.body?.email || '').trim();
  const pin = String(req.body?.pin || '').trim();
  const consentAccepted = Boolean(req.body?.consentAccepted);

  if (fullName.length < 2 || fullName.length > 100) {
    res.status(400).json({ error: 'Vui lòng nhập đầy đủ họ và tên giáo viên.' });
    return;
  }
  if (!store.professionalGroups.includes(professionalGroup)) {
    res.status(400).json({ error: 'Vui lòng chọn tổ chuyên môn hợp lệ.' });
    return;
  }
  const teacherId = normalizeIdentifier(rawIdentifier || email);
  if (teacherId.length < 3 || teacherId.length > 80) {
    res.status(400).json({ error: 'Vui lòng nhập Mã giáo viên hoặc Email trường hợp lệ (tối thiểu 3 ký tự).' });
    return;
  }
  if (pin.length < 4 || pin.length > 32) {
    res.status(400).json({ error: 'Mã PIN cá nhân phải từ 4 đến 32 ký tự để bảo vệ tài khoản học tập của thầy/cô.' });
    return;
  }
  if (!consentAccepted) {
    res.status(400).json({ error: 'Vui lòng xác nhận đồng ý sử dụng kết quả học tập cho báo cáo nội bộ nhà trường.' });
    return;
  }
  if (store.teachers[teacherId]) {
    res.status(409).json({
      error: 'Mã giáo viên hoặc Email này đã tồn tại. Vui lòng chọn chế độ đăng nhập để tiếp tục bài học cũ.',
      code: 'ALREADY_EXISTS',
    });
    return;
  }

  const nowIso = new Date().toISOString();
  const newTeacher: StoredTeacher = {
    teacherId,
    fullName,
    professionalGroup,
    email: email || (rawIdentifier.includes('@') ? rawIdentifier : ''),
    pinHash: hashSecret(pin),
    registrationDate: nowIso,
    lastLogin: nowIso,
    accountStatus: 'Active',
    lastLessonId: 1,
    consentAcceptedAt: nowIso,
    activeDays: [getTodayDateString()],
    totalActiveSeconds: 0,
  };

  store.teachers[teacherId] = newTeacher;
  ensureTeacherProgressMap(teacherId);

  const loginEvent: StoredActivityEvent = {
    eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    teacherId,
    eventType: 'REGISTER_AND_LOGIN',
    timestamp: nowIso,
    lessonId: 1,
    durationSeconds: 0,
    eventStatus: 'Recorded',
  };
  store.activityLogs.push(loginEvent);
  await saveStore();

  void enqueueAndSync('sync_teacher', { teacher: sanitizeTeacherProfile(newTeacher) });
  void enqueueAndSync('sync_activity', { event: loginEvent });

  const token = signToken({ role: 'teacher', teacherId });
  res.status(201).json({
    token,
    welcomeBack: false,
    workspace: buildTeacherWorkspace(teacherId),
  });
});

// Teacher returning login
app.post('/api/auth/teacher/login', async (req, res) => {
  const teacherId = normalizeIdentifier(String(req.body?.identifier || ''));
  const pin = String(req.body?.pin || '').trim();

  if (!teacherId || !pin) {
    res.status(400).json({ error: 'Vui lòng nhập Mã giáo viên / Email và mã PIN cá nhân.' });
    return;
  }
  const existing = store.teachers[teacherId];
  if (!existing || !verifyHashedSecret(pin, existing.pinHash)) {
    res.status(401).json({ error: 'Mã giáo viên/Email hoặc mã PIN không đúng. Vui lòng kiểm tra lại.' });
    return;
  }

  const nowIso = new Date().toISOString();
  existing.lastLogin = nowIso;
  recordActiveDay(existing);

  const loginEvent: StoredActivityEvent = {
    eventId: `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    teacherId,
    eventType: 'LOGIN',
    timestamp: nowIso,
    lessonId: existing.lastLessonId || 1,
    durationSeconds: 0,
    eventStatus: 'Recorded',
  };
  store.activityLogs.push(loginEvent);
  await saveStore();

  void enqueueAndSync('sync_teacher', { teacher: sanitizeTeacherProfile(existing) });
  void enqueueAndSync('sync_activity', { event: loginEvent });

  const token = signToken({ role: 'teacher', teacherId });
  res.json({
    token,
    welcomeBack: true,
    workspace: buildTeacherWorkspace(teacherId),
  });
});

// Teacher workspace fetch (strictly scoped to verified token's teacherId)
app.get('/api/teacher/me', requireTeacher, (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  res.json(buildTeacherWorkspace(teacherId));
});

// Update teacher's last visited lesson (does NOT mark lesson completed)
app.post('/api/teacher/active-lesson', requireTeacher, async (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  const lessonId = Number(req.body?.lessonId);
  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 10) {
    res.status(400).json({ error: 'Mã bài học không hợp lệ.' });
    return;
  }
  const teacher = store.teachers[teacherId];
  teacher.lastLessonId = lessonId;
  await saveStore();
  res.json({ ok: true, lastLessonId: lessonId });
});

// Record genuine practice attempt (idempotent by attemptId)
app.post('/api/teacher/attempts', requireTeacher, async (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  const teacher = store.teachers[teacherId];

  const attemptId = String(req.body?.attemptId || '').trim();
  const lessonId = Number(req.body?.lessonId);
  const skill = String(req.body?.skill || '') as 'listening' | 'speaking' | 'reading' | 'writing';
  const activityId = String(req.body?.activityId || '').trim();
  const score = Number(req.body?.score);
  const maximumScore = Number(req.body?.maximumScore);
  const passed = Boolean(req.body?.passed);
  const resultStatus = String(req.body?.resultStatus || (passed ? 'Passed' : 'Needs Review')) as StoredAttempt['resultStatus'];
  const userAnswer = req.body?.userAnswer !== undefined ? String(req.body.userAnswer).slice(0, 300) : undefined;
  const expectedAnswer = req.body?.expectedAnswer !== undefined ? String(req.body.expectedAnswer).slice(0, 300) : undefined;
  const feedback = req.body?.feedback !== undefined ? String(req.body.feedback).slice(0, 400) : undefined;
  const promptText = req.body?.prompt !== undefined ? String(req.body.prompt).slice(0, 300) : '';

  if (!attemptId || attemptId.length > 100) {
    res.status(400).json({ error: 'Thiếu mã định danh bài làm (Attempt ID).' });
    return;
  }
  if (!Number.isInteger(lessonId) || lessonId < 1 || lessonId > 10) {
    res.status(400).json({ error: 'Mã bài học không hợp lệ.' });
    return;
  }
  if (!['listening', 'speaking', 'reading', 'writing'].includes(skill)) {
    res.status(400).json({ error: 'Kỹ năng không hợp lệ.' });
    return;
  }
  if (!Number.isFinite(score) || !Number.isFinite(maximumScore) || maximumScore <= 0 || score < 0 || score > maximumScore) {
    res.status(400).json({ error: 'Điểm số không hợp lệ.' });
    return;
  }

  // Deduplicate repeated clicks using attemptId
  const duplicate = store.attempts.find((a) => a.attemptId === attemptId && a.teacherId === teacherId);
  if (duplicate) {
    res.json({
      duplicate: true,
      attempt: duplicate,
      workspace: buildTeacherWorkspace(teacherId),
    });
    return;
  }

  const priorCount = store.attempts.filter(
    (a) => a.teacherId === teacherId && a.lessonId === lessonId && a.skill === skill && a.activityId === activityId
  ).length;

  const nowIso = new Date().toISOString();
  const attempt: StoredAttempt = {
    attemptId,
    teacherId,
    lessonId,
    skill,
    activityId: activityId || `L${lessonId}-${skill}`,
    score,
    maximumScore,
    attemptNumber: priorCount + 1,
    submissionTime: nowIso,
    resultStatus,
    userAnswer,
    expectedAnswer,
    feedback,
    syncedToSheets: false,
  };

  store.attempts.push(attempt);
  teacher.lastLessonId = lessonId;
  recordActiveDay(teacher);

  // Update lesson skill progress only when passed / self-evaluated genuinely
  const pMap = ensureTeacherProgressMap(teacherId);
  const lp = pMap[lessonId];
  if (passed || (skill === 'speaking' && resultStatus === 'Self-Evaluated')) {
    lp[skill] = true;
  }
  recomputeLessonProgress(lp, nowIso);

  // Track or resolve mistakes for Review Mistakes mode
  if (skill !== 'speaking') {
    if (!passed && expectedAnswer) {
      const existingUnresolved = store.mistakes.find(
        (m) => m.teacherId === teacherId && m.activityId === attempt.activityId && !m.resolved
      );
      if (existingUnresolved) {
        existingUnresolved.wrongAnswer = userAnswer || '';
        existingUnresolved.timestamp = nowIso;
      } else {
        store.mistakes.push({
          id: `MST-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          teacherId,
          lessonId,
          skill,
          activityId: attempt.activityId,
          prompt: promptText || LESSON_SENTENCES[lessonId],
          wrongAnswer: userAnswer || '',
          correctAnswer: expectedAnswer,
          timestamp: nowIso,
          resolved: false,
        });
      }
    } else if (passed) {
      for (const m of store.mistakes) {
        if (m.teacherId === teacherId && m.lessonId === lessonId && m.skill === skill && !m.resolved) {
          m.resolved = true;
        }
      }
    }
  }

  await saveStore();

  // Attempt live Google Sheets sync if verified
  const syncAttempt = await enqueueAndSync('sync_attempt', { attempt });
  const syncProgress = await enqueueAndSync('sync_progress', {
    progress: {
      teacherId,
      fullName: teacher.fullName,
      englishSentence: LESSON_SENTENCES[lessonId],
      ...lp,
    },
  });

  if (syncAttempt.synced) {
    attempt.syncedToSheets = true;
    await saveStore();
  }

  res.status(201).json({
    duplicate: false,
    attempt,
    syncedToSheets: syncAttempt.synced && syncProgress.synced,
    syncError: syncAttempt.error || syncProgress.error || null,
    workspace: buildTeacherWorkspace(teacherId),
  });
});

// Active study time logger (only records interactive, visible-tab chunks)
app.post('/api/teacher/activity', requireTeacher, async (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  const teacher = store.teachers[teacherId];

  const eventId = String(req.body?.eventId || `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`);
  const eventType = String(req.body?.eventType || 'ACTIVE_STUDY_SESSION').slice(0, 60);
  const lessonId = req.body?.lessonId ? Number(req.body.lessonId) : null;
  const durationSeconds = Math.max(0, Math.min(600, Math.round(Number(req.body?.durationSeconds || 0))));

  if (store.activityLogs.some((e) => e.eventId === eventId)) {
    res.json({ ok: true, duplicate: true });
    return;
  }

  const nowIso = new Date().toISOString();
  const ev: StoredActivityEvent = {
    eventId,
    teacherId,
    eventType,
    timestamp: nowIso,
    lessonId: lessonId && lessonId >= 1 && lessonId <= 10 ? lessonId : null,
    durationSeconds,
    eventStatus: 'Recorded',
    syncedToSheets: false,
  };

  store.activityLogs.push(ev);
  if (durationSeconds > 0) {
    teacher.totalActiveSeconds += durationSeconds;
    recordActiveDay(teacher);
  }
  await saveStore();

  const syncRes = await enqueueAndSync('sync_activity', { event: ev });
  if (syncRes.synced) {
    ev.syncedToSheets = true;
    await saveStore();
  }

  res.json({ ok: true, syncedToSheets: syncRes.synced });
});

// Submit December Final Assessment (Listening 25, Reading 25, Writing 25, Speaking pending review!)
app.post('/api/teacher/final-assessment', requireTeacher, async (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  const teacher = store.teachers[teacherId];

  const listeningScore = Math.max(0, Math.min(25, Math.round(Number(req.body?.listeningScore || 0))));
  const readingScore = Math.max(0, Math.min(25, Math.round(Number(req.body?.readingScore || 0))));
  const writingScore = Math.max(0, Math.min(25, Math.round(Number(req.body?.writingScore || 0))));
  const speakingSelfCheck = req.body?.speakingSelfCheck;
  const speakingSubmittedSentences = Array.isArray(req.body?.speakingSubmittedSentences)
    ? req.body.speakingSubmittedSentences.map((s: unknown) => String(s).slice(0, 120)).slice(0, 10)
    : [];

  if (
    !speakingSelfCheck ||
    !speakingSelfCheck.listenedModel ||
    !speakingSelfCheck.recordedVoice ||
    !speakingSelfCheck.replayedVoice
  ) {
    res.status(400).json({
      error: 'Vui lòng hoàn thành bước nghe mẫu, ghi âm và nghe lại bảng kiểm Luyện nói trước khi nộp bài kiểm tra cuối tháng.',
    });
    return;
  }

  const nowIso = new Date().toISOString();
  // Strictly NEVER fabricate Speaking score or fake 100 total before real admin evaluation
  const record: StoredFinalAssessment = {
    teacherId,
    fullName: teacher.fullName,
    listeningScore,
    readingScore,
    writingScore,
    speakingScore: null,
    totalScore: null,
    assessmentStatus: 'Chờ đánh giá',
    speakingSelfCheck: {
      listenedModel: Boolean(speakingSelfCheck.listenedModel),
      recordedVoice: Boolean(speakingSelfCheck.recordedVoice),
      replayedVoice: Boolean(speakingSelfCheck.replayedVoice),
      confidentInClass: Boolean(speakingSelfCheck.confidentInClass),
      recognizedText: speakingSelfCheck.recognizedText
        ? String(speakingSelfCheck.recognizedText).slice(0, 300)
        : undefined,
      notes: speakingSelfCheck.notes ? String(speakingSelfCheck.notes).slice(0, 400) : undefined,
    },
    speakingSubmittedSentences,
    adminSpeakingFeedback: '',
    gradedByAdminAt: null,
    submittedAt: nowIso,
    completionDate: null,
    syncedToSheets: false,
  };

  store.finalAssessments[teacherId] = record;
  recordActiveDay(teacher);
  await saveStore();

  const syncRes = await enqueueAndSync('sync_final_assessment', { assessment: record });
  if (syncRes.synced) {
    record.syncedToSheets = true;
    await saveStore();
  }

  res.status(201).json({
    assessment: record,
    syncedToSheets: syncRes.synced,
    syncError: syncRes.error || null,
    workspace: buildTeacherWorkspace(teacherId),
  });
});

// Retry pending Google Sheets sync for current teacher
app.post('/api/teacher/sync-retry', requireTeacher, async (req: AuthedRequest, res) => {
  const teacherId = req.session!.teacherId!;
  const result = await flushPendingSync(teacherId);
  res.json({
    ...result,
    sheetsStatus: buildSheetsStatus(teacherId),
  });
});

// --- Admin Authentication (First-run claim OR process.env.ADMIN_PASSCODE) ---

app.get('/api/auth/admin/status', (_req, res) => {
  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPass.length > 0) {
    res.json({ mode: 'login', configuredViaEnv: true });
    return;
  }
  if (store.adminAuthHash) {
    res.json({ mode: 'login', configuredViaEnv: false });
    return;
  }
  res.json({ mode: 'bootstrap', configuredViaEnv: false });
});

app.post('/api/auth/admin/bootstrap', async (req, res) => {
  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPass.length > 0 || store.adminAuthHash) {
    res.status(409).json({
      error: 'Tài khoản quản trị viên đã được thiết lập trước đó. Vui lòng đăng nhập.',
    });
    return;
  }
  const password = String(req.body?.password || '').trim();
  const confirmPassword = String(req.body?.confirmPassword || '').trim();
  if (password.length < 8 || password.length > 64) {
    res.status(400).json({ error: 'Mật khẩu quản trị viên phải từ 8 đến 64 ký tự.' });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Mật khẩu xác nhận không khớp.' });
    return;
  }

  store.adminAuthHash = hashSecret(password);
  await saveStore();

  const token = signToken({ role: 'admin' }, 12);
  res.status(201).json({ token, mode: 'claimed' });
});

app.post('/api/auth/admin/login', (req, res) => {
  const password = String(req.body?.password || '').trim();
  if (!password) {
    res.status(400).json({ error: 'Vui lòng nhập mật khẩu quản trị viên.' });
    return;
  }

  const envPass = (process.env.ADMIN_PASSCODE || '').trim();
  let isValid = false;
  if (envPass.length > 0) {
    isValid = constantTimeStringEqual(password, envPass);
  } else if (store.adminAuthHash) {
    isValid = verifyHashedSecret(password, store.adminAuthHash);
  } else {
    res.status(400).json({ error: 'Chưa thiết lập mật khẩu quản trị viên. Vui lòng thiết lập lần đầu.' });
    return;
  }

  if (!isValid) {
    res.status(401).json({ error: 'Mật khẩu quản trị viên không chính xác.' });
    return;
  }

  const token = signToken({ role: 'admin' }, 12);
  res.json({ token });
});

// --- Admin Protected Endpoints ---

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  res.json(buildAdminSummary());
});

app.get('/api/admin/teachers/:teacherId', requireAdmin, (req, res) => {
  const teacherId = normalizeIdentifier(String(req.params.teacherId || ''));
  if (!store.teachers[teacherId]) {
    res.status(404).json({ error: 'Không tìm thấy giáo viên.' });
    return;
  }
  const workspace = buildTeacherWorkspace(teacherId);
  const logs = store.activityLogs
    .filter((e) => e.teacherId === teacherId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 50);
  res.json({ ...workspace, activityLogs: logs });
});

// Admin manual grading of Final Assessment Speaking score (0-25)
app.post('/api/admin/teachers/:teacherId/grade-speaking', requireAdmin, async (req, res) => {
  const teacherId = normalizeIdentifier(String(req.params.teacherId || ''));
  const fa = store.finalAssessments[teacherId];
  if (!fa) {
    res.status(404).json({ error: 'Giáo viên chưa nộp bài kiểm tra cuối tháng.' });
    return;
  }
  const speakingScore = Number(req.body?.speakingScore);
  const feedback = String(req.body?.feedback || '').trim().slice(0, 500);
  if (!Number.isFinite(speakingScore) || speakingScore < 0 || speakingScore > 25) {
    res.status(400).json({ error: 'Điểm Luyện nói phải nằm trong thang 0 đến 25.' });
    return;
  }

  const rounded = Math.round(speakingScore);
  const nowIso = new Date().toISOString();
  fa.speakingScore = rounded;
  fa.totalScore = fa.listeningScore + fa.readingScore + fa.writingScore + rounded;
  fa.assessmentStatus = 'Hoàn thành';
  fa.adminSpeakingFeedback = feedback;
  fa.gradedByAdminAt = nowIso;
  fa.completionDate = nowIso;
  fa.syncedToSheets = false;

  await saveStore();
  const syncRes = await enqueueAndSync('sync_final_assessment', { assessment: fa });
  if (syncRes.synced) {
    fa.syncedToSheets = true;
    await saveStore();
  }

  res.json({
    assessment: fa,
    syncedToSheets: syncRes.synced,
    syncError: syncRes.error || null,
  });
});

// Manage Professional Groups
app.put('/api/admin/groups', requireAdmin, async (req, res) => {
  const groups: string[] = Array.isArray(req.body?.groups)
    ? (req.body.groups as unknown[])
        .map((g) => String(g).trim())
        .filter((g) => g.length >= 2 && g.length <= 60)
    : [];
  const unique: string[] = Array.from(new Set(groups));
  if (unique.length === 0) {
    res.status(400).json({ error: 'Danh sách tổ chuyên môn phải có ít nhất 1 tổ.' });
    return;
  }
  store.professionalGroups = unique;
  await saveStore();
  res.json({ professionalGroups: store.professionalGroups });
});

// Admin Google Sheets Configuration (Secret is write-only, never returned in plaintext)
app.get('/api/admin/sheets/status', requireAdmin, (_req, res) => {
  const eff = getEffectiveSheetsConfig();
  res.json({
    ...buildSheetsStatus(),
    fromEnv: eff.fromEnv,
    fromEnvUrl: eff.fromEnvUrl,
    fromEnvSecret: eff.fromEnvSecret,
  });
});

app.post('/api/admin/sheets/config', requireAdmin, async (req, res) => {
  const appsScriptUrl = String(req.body?.appsScriptUrl || '').trim();
  const appsScriptSecret = String(req.body?.appsScriptSecret || '').trim();

  if (appsScriptUrl) {
    const check = validateAppsScriptUrl(appsScriptUrl);
    if (!check.valid || !check.normalized) {
      res.status(400).json({ error: check.error });
      return;
    }
    store.sheetsConfig.appsScriptUrl = check.normalized;
  } else {
    store.sheetsConfig.appsScriptUrl = '';
  }

  if (appsScriptSecret) {
    if (appsScriptSecret.length < 12) {
      res.status(400).json({ error: 'Khóa bảo mật (SHARED_SECRET) cần tối thiểu 12 ký tự.' });
      return;
    }
    store.sheetsConfig.appsScriptSecret = appsScriptSecret;
  }

  // Must re-verify with a real write-and-read test after config change
  store.sheetsConfig.verified = false;
  store.sheetsConfig.lastSyncError = null;
  await saveStore();
  res.json(buildSheetsStatus());
});

app.post('/api/admin/sheets/test', requireAdmin, async (_req, res) => {
  const eff = getEffectiveSheetsConfig();
  if (!eff.url || !eff.secret) {
    res.status(400).json({
      ok: false,
      error:
        'Chưa đủ thông tin kết nối. Vui lòng nhập URL Web App Google Apps Script (/exec) và Khóa bảo mật (GOOGLE_APPS_SCRIPT_SECRET) trong AI Studio Secrets hoặc biểu mẫu bên dưới trước khi kiểm tra.',
      sheetsStatus: buildSheetsStatus(),
    });
    return;
  }

  const testEventId = `TEST-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const roundTrip = await postToAppsScript(eff.url, eff.secret, 'test_write_read', {
    testEventId,
  });
  const nowIso = new Date().toISOString();
  store.sheetsConfig.lastTestedAt = nowIso;

  const data = roundTrip.data;
  const writeVerified = Boolean(data?.writeVerified);
  const readVerified =
    Boolean(data?.readVerified) && String(data?.verifiedEventId || '') === testEventId;

  if (roundTrip.ok && data?.sheetsReady && writeVerified && readVerified) {
    const spreadsheetName = String(data.spreadsheetName || 'Google Sheet');
    const rawCounts = (data.sheetCounts || {}) as Record<string, unknown>;
    const sheetCounts = {
      teachers: Number(rawCounts.teachers || 0),
      learningProgress: Number(rawCounts.learningProgress || 0),
      practiceResults: Number(rawCounts.practiceResults || 0),
      finalAssessment: Number(rawCounts.finalAssessment || 0),
      activityLog: Number(rawCounts.activityLog || 0),
    };

    store.sheetsConfig.verified = true;
    store.sheetsConfig.lastSyncError = null;
    store.sheetsConfig.lastSpreadsheetName = spreadsheetName;
    store.sheetsConfig.lastSheetCounts = sheetCounts;
    await saveStore();

    res.json({
      ok: true,
      spreadsheetName,
      writeVerified: true,
      readVerified: true,
      verifiedEventId: testEventId,
      sheetCounts,
      sheetsStatus: buildSheetsStatus(),
    });
    return;
  }

  store.sheetsConfig.verified = false;
  store.sheetsConfig.lastSyncError =
    roundTrip.error ||
    'Đã kết nối tới Apps Script nhưng chưa xác nhận được thao tác ghi và đọc ngược dữ liệu thật. Vui lòng cập nhật Code.gs bản mới nhất và triển khai lại (New deployment).';
  await saveStore();
  res.status(400).json({
    ok: false,
    writeVerified,
    readVerified,
    error: store.sheetsConfig.lastSyncError,
    sheetsStatus: buildSheetsStatus(),
  });
});

app.post('/api/admin/sheets/sync-all', requireAdmin, async (_req, res) => {
  const eff = getEffectiveSheetsConfig();
  if (!eff.url || !eff.secret || !eff.verified) {
    res.status(400).json({
      ok: false,
      error: 'Vui lòng kiểm tra và xác thực kết nối Google Sheets thành công trước khi đồng bộ toàn bộ.',
    });
    return;
  }

  let syncedRecords = 0;
  let failedRecords = 0;
  let lastError: string | null = null;

  for (const teacher of Object.values(store.teachers)) {
    const r = await postToAppsScript(eff.url, eff.secret, 'sync_teacher', {
      teacher: sanitizeTeacherProfile(teacher),
    });
    if (r.ok) syncedRecords += 1;
    else {
      failedRecords += 1;
      lastError = r.error || 'Sync error';
    }

    const pMap = ensureTeacherProgressMap(teacher.teacherId);
    for (const lp of Object.values(pMap)) {
      if (lp.status === 'not_started') continue;
      const pr = await postToAppsScript(eff.url, eff.secret, 'sync_progress', {
        progress: {
          teacherId: teacher.teacherId,
          fullName: teacher.fullName,
          englishSentence: LESSON_SENTENCES[lp.lessonId],
          ...lp,
        },
      });
      if (pr.ok) syncedRecords += 1;
      else {
        failedRecords += 1;
        lastError = pr.error || 'Sync error';
      }
    }
  }

  for (const fa of Object.values(store.finalAssessments)) {
    const fr = await postToAppsScript(eff.url, eff.secret, 'sync_final_assessment', {
      assessment: fa,
    });
    if (fr.ok) {
      fa.syncedToSheets = true;
      syncedRecords += 1;
    } else {
      failedRecords += 1;
      lastError = fr.error || 'Sync error';
    }
  }

  const flush = await flushPendingSync();
  syncedRecords += flush.flushed;
  if (flush.lastError) lastError = flush.lastError;

  store.sheetsConfig.lastSyncAt = new Date().toISOString();
  store.sheetsConfig.lastSyncError = lastError;
  await saveStore();

  res.json({
    ok: failedRecords === 0 && flush.remaining === 0,
    syncedRecords,
    failedRecords,
    remainingPending: flush.remaining,
    lastError,
    sheetsStatus: buildSheetsStatus(),
  });
});

// Admin CSV Export (Real data ONLY — UTF-8 BOM for Excel)
app.get('/api/admin/export-csv', requireAdmin, (req, res) => {
  const type = String(req.query.type || 'all');
  const summary = buildAdminSummary();
  const rows =
    type === 'incomplete'
      ? summary.teachers.filter((t) => t.completedLessons < 10)
      : summary.teachers;

  const headers = [
    'STT',
    'Teacher ID',
    'Họ tên',
    'Tổ chuyên môn',
    'Email',
    'Số bài hoàn thành (/10)',
    'Nghe (/10)',
    'Nói (/10)',
    'Đọc (/10)',
    'Viết (/10)',
    'Số ngày học thực tế',
    'Trạng thái',
    'Kiểm tra cuối tháng',
    'Tổng điểm (/100)',
    'Lần học gần nhất',
  ];

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((r, idx) =>
      [
        idx + 1,
        r.teacherId,
        r.fullName,
        r.professionalGroup,
        r.email,
        `${r.completedLessons}/10`,
        `${r.listeningCount}/10`,
        `${r.speakingCount}/10`,
        `${r.readingCount}/10`,
        `${r.writingCount}/10`,
        r.activeDaysCount,
        r.overallStatus,
        r.finalAssessmentStatus,
        r.finalTotalScore === null ? 'Chờ đánh giá' : r.finalTotalScore,
        r.lastLogin,
      ]
        .map(escapeCsvCell)
        .join(',')
    ),
  ];

  const filename =
    type === 'incomplete'
      ? 'le-kim-lang-chua-hoan-thanh-thang-12.csv'
      : 'le-kim-lang-bao-cao-thang-12.csv';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + lines.join('\r\n'));
});

// Privacy: Admin delete a teacher's records upon school policy request
app.delete('/api/admin/teachers/:teacherId', requireAdmin, async (req, res) => {
  const teacherId = normalizeIdentifier(String(req.params.teacherId || ''));
  if (!store.teachers[teacherId]) {
    res.status(404).json({ error: 'Không tìm thấy giáo viên.' });
    return;
  }
  delete store.teachers[teacherId];
  delete store.progress[teacherId];
  delete store.finalAssessments[teacherId];
  store.attempts = store.attempts.filter((a) => a.teacherId !== teacherId);
  store.mistakes = store.mistakes.filter((m) => m.teacherId !== teacherId);
  store.activityLogs = store.activityLogs.filter((e) => e.teacherId !== teacherId);
  await saveStore();
  res.json({ ok: true });
});

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Le Kim Lang English Challenge server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
