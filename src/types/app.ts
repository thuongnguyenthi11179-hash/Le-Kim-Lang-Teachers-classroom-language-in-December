export type SkillType = 'listening' | 'speaking' | 'reading' | 'writing';

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export type ScreenId =
  | 'welcome'
  | 'login'
  | 'dashboard'
  | 'lessons'
  | 'lesson-detail'
  | 'practice'
  | 'mistakes'
  | 'final-challenge'
  | 'progress'
  | 'achievements'
  | 'admin-login'
  | 'admin-dashboard'
  | 'admin-teacher-detail'
  | 'admin-sheets';

export interface DialogueLine {
  speaker: 'Teacher' | 'Student';
  speakerVi: string;
  english: string;
  vietnamese: string;
}

export interface ListeningQuestion {
  id: string;
  audioText: string;
  options: string[];
  correctIndex: number;
  hintVi: string;
}

export interface ReadingQuestion {
  id: string;
  type: 'match_meaning' | 'choose_meaning' | 'classroom_situation' | 'read_and_answer';
  typeLabelVi: string;
  prompt: string;
  promptVi: string;
  options: string[];
  correctIndex: number;
  explanationVi: string;
}

export interface WritingExercises {
  arrange: {
    id: string;
    tokens: string[];
    correctSentence: string;
  };
  complete: {
    id: string;
    promptTemplate: string;
    missingWord: string;
    acceptedWords: string[];
    fullSentence: string;
    hintVi: string;
  };
  translate: {
    id: string;
    vietnamesePrompt: string;
    referenceAnswer: string;
    acceptedSynonyms: string[];
    tipVi: string;
  };
}

export interface LessonData {
  id: number;
  week: 1 | 2 | 3 | 4;
  weekTitle: string;
  english: string;
  vietnamese: string;
  ipa: string;
  image: string;
  situationTitleVi: string;
  situationDescVi: string;
  dialogue: DialogueLine[];
  pronunciationTipVi: string;
  listening: ListeningQuestion;
  readingQuestions: ReadingQuestion[];
  writing: WritingExercises;
}

export interface TeacherProfile {
  teacherId: string;
  fullName: string;
  professionalGroup: string;
  email: string;
  registrationDate: string;
  lastLogin: string;
  accountStatus: 'Active' | 'Inactive';
  lastLessonId: number;
  consentAcceptedAt: string;
}

export interface LessonSkillProgress {
  lessonId: number;
  listening: boolean;
  speaking: boolean;
  reading: boolean;
  writing: boolean;
  completionPercentage: number;
  status: LessonStatus;
  lastUpdated: string;
  completionDate: string | null;
}

export interface PracticeAttempt {
  attemptId: string;
  teacherId: string;
  lessonId: number;
  skill: SkillType;
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

export interface SpeakingSelfCheck {
  listenedModel: boolean;
  recordedVoice: boolean;
  replayedVoice: boolean;
  confidentInClass: boolean;
  recognizedText?: string;
  notes?: string;
}

export interface FinalAssessmentRecord {
  teacherId: string;
  fullName: string;
  listeningScore: number;
  readingScore: number;
  writingScore: number;
  speakingScore: number | null;
  totalScore: number | null;
  assessmentStatus: 'Chờ đánh giá' | 'Hoàn thành';
  speakingSelfCheck?: SpeakingSelfCheck;
  speakingSubmittedSentences?: string[];
  adminSpeakingFeedback?: string;
  gradedByAdminAt?: string | null;
  submittedAt: string;
  completionDate: string | null;
  syncedToSheets?: boolean;
}

export interface ActivityLogEvent {
  eventId: string;
  teacherId: string;
  eventType: string;
  timestamp: string;
  lessonId: number | null;
  durationSeconds: number;
  eventStatus: string;
}

export interface MistakeItem {
  id: string;
  lessonId: number;
  skill: 'listening' | 'reading' | 'writing';
  activityId: string;
  prompt: string;
  wrongAnswer: string;
  correctAnswer: string;
  timestamp: string;
  resolved: boolean;
}

export interface BadgeInfo {
  id: string;
  title: string;
  titleVi: string;
  descriptionVi: string;
  earned: boolean;
  progressText: string;
}

export interface TeacherWorkspaceData {
  profile: TeacherProfile;
  progressByLesson: Record<number, LessonSkillProgress>;
  attempts: PracticeAttempt[];
  mistakes: MistakeItem[];
  finalAssessment: FinalAssessmentRecord | null;
  activeDays: string[];
  totalActiveSeconds: number;
  sheetsStatus: SheetsConnectionStatus;
}

export interface SheetRowCounts {
  teachers: number;
  learningProgress: number;
  practiceResults: number;
  finalAssessment: number;
  activityLog: number;
}

export interface SheetsConnectionStatus {
  configured: boolean;
  verified: boolean;
  hasSecret: boolean;
  maskedUrl: string;
  lastTestedAt: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  spreadsheetName?: string | null;
  sheetCounts?: SheetRowCounts | null;
  pendingSyncCount: number;
  label: string;
}

export interface AdminTeacherRow {
  teacherId: string;
  fullName: string;
  professionalGroup: string;
  email: string;
  registrationDate: string;
  lastLogin: string;
  completedLessons: number;
  inProgressLessons: number;
  listeningCount: number;
  speakingCount: number;
  readingCount: number;
  writingCount: number;
  overallStatus: 'Hoàn thành 10/10' | 'Đang học' | 'Chưa bắt đầu';
  finalAssessmentStatus: string;
  finalTotalScore: number | null;
  activeDaysCount: number;
  isDemo?: boolean;
}

export interface AdminDashboardSummary {
  totalTeachers: number;
  startedTeachers: number;
  inProgressTeachers: number;
  completedTeachers: number;
  completionRate: number;
  skillAttempts: {
    listening: number;
    speaking: number;
    reading: number;
    writing: number;
  };
  finalAssessmentsSubmitted: number;
  finalAssessmentsPendingSpeaking: number;
  finalAssessmentsCompleted: number;
  groupStats: Array<{
    group: string;
    teacherCount: number;
    avgCompletedLessons: number;
    completedAllCount: number;
  }>;
  teachers: AdminTeacherRow[];
  professionalGroups: string[];
  sheetsStatus: SheetsConnectionStatus;
}
