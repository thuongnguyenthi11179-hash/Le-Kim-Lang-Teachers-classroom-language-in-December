import type { AdminTeacherRow, BadgeInfo, TeacherWorkspaceData } from '../types/app';

export function computeBadges(workspace: TeacherWorkspaceData): BadgeInfo[] {
  const lessons = Object.values(workspace.progressByLesson);
  const completedLessons = lessons.filter((l) => l.status === 'completed').length;
  const listeningDone = lessons.filter((l) => l.listening).length;
  const speakingDone = lessons.filter((l) => l.speaking).length;
  const finalCompleted =
    workspace.finalAssessment !== null &&
    workspace.finalAssessment.assessmentStatus === 'Hoàn thành';

  return [
    {
      id: 'completed-5',
      title: 'Completed 5 Lessons',
      titleVi: 'Hoàn thành 5 bài học',
      descriptionVi: 'Hoàn thành đầy đủ 4 kỹ năng cho ít nhất 5/10 câu giao tiếp lớp học.',
      earned: completedLessons >= 5,
      progressText: `${Math.min(completedLessons, 5)}/5 bài`,
    },
    {
      id: 'completed-10',
      title: 'Completed 10 Lessons',
      titleVi: 'Chinh phục 10/10 bài học',
      descriptionVi: 'Hoàn thành đầy đủ cả 4 kỹ năng cho toàn bộ 10 câu thử thách tháng 12.',
      earned: completedLessons >= 10,
      progressText: `${completedLessons}/10 bài`,
    },
    {
      id: 'listening-star',
      title: 'Listening Star',
      titleVi: 'Ngôi sao Luyện Nghe',
      descriptionVi: 'Đạt kết quả đúng bài tập Luyện nghe ở tất cả 10 bài học.',
      earned: listeningDone >= 10,
      progressText: `${listeningDone}/10 bài nghe`,
    },
    {
      id: 'speaking-star',
      title: 'Speaking Star',
      titleVi: 'Ngôi sao Luyện Nói',
      descriptionVi: 'Hoàn thành thực hành ghi âm và tự đánh giá Luyện nói ở tất cả 10 bài học.',
      earned: speakingDone >= 10,
      progressText: `${speakingDone}/10 bài nói`,
    },
    {
      id: 'december-completed',
      title: 'December Challenge Completed',
      titleVi: 'Hoàn thành Thử thách Tháng 12',
      descriptionVi:
        'Hoàn thành 10/10 bài học và có kết quả Bài kiểm tra cuối tháng được xác nhận đầy đủ 4 kỹ năng.',
      earned: completedLessons >= 10 && finalCompleted,
      progressText: finalCompleted
        ? 'Đã xác nhận bài kiểm tra'
        : workspace.finalAssessment
          ? 'Bài kiểm tra đang chờ đánh giá Nói'
          : 'Chưa hoàn thành bài kiểm tra cuối tháng',
    },
  ];
}

export function computeWorkspaceStats(workspace: TeacherWorkspaceData) {
  const lessons = Object.values(workspace.progressByLesson);
  const completedLessons = lessons.filter((l) => l.status === 'completed').length;
  const inProgressLessons = lessons.filter((l) => l.status === 'in_progress').length;
  const totalSkillUnits = lessons.reduce(
    (sum, l) => sum + [l.listening, l.speaking, l.reading, l.writing].filter(Boolean).length,
    0
  );
  const overallPercent = Math.round((totalSkillUnits / 40) * 100);
  const practicePoints = workspace.attempts.reduce((sum, a) => sum + a.score, 0);
  const unresolvedMistakes = workspace.mistakes.filter((m) => !m.resolved).length;
  const nextIncompleteLesson =
    lessons.find((l) => l.status === 'in_progress') ||
    lessons.find((l) => l.status === 'not_started') ||
    lessons[0];

  return {
    completedLessons,
    inProgressLessons,
    overallPercent,
    practicePoints,
    activeDaysCount: workspace.activeDays.length,
    unresolvedMistakes,
    nextLessonId: nextIncompleteLesson ? nextIncompleteLesson.lessonId : 1,
  };
}

// Clearly labeled DEMO-only preview rows for Admin to inspect table layout before real teachers register.
// NEVER mixed into real data or CSV exports.
export const DEMO_ADMIN_PREVIEW_ROWS: AdminTeacherRow[] = [
  {
    teacherId: 'DEMO-GV01',
    fullName: '[DEMO] Nguyễn Thị Lan Anh',
    professionalGroup: 'Tổ 1',
    email: 'demo.lananh@lekimlang.edu.vn',
    registrationDate: '2026-12-01T08:00:00.000Z',
    lastLogin: '2026-12-18T19:30:00.000Z',
    completedLessons: 10,
    inProgressLessons: 0,
    listeningCount: 10,
    speakingCount: 10,
    readingCount: 10,
    writingCount: 10,
    overallStatus: 'Hoàn thành 10/10',
    finalAssessmentStatus: 'Hoàn thành',
    finalTotalScore: 95,
    activeDaysCount: 12,
    isDemo: true,
  },
  {
    teacherId: 'DEMO-GV02',
    fullName: '[DEMO] Trần Minh Tuấn',
    professionalGroup: 'Tổ 3',
    email: 'demo.minhtuan@lekimlang.edu.vn',
    registrationDate: '2026-12-02T09:15:00.000Z',
    lastLogin: '2026-12-17T20:10:00.000Z',
    completedLessons: 6,
    inProgressLessons: 2,
    listeningCount: 8,
    speakingCount: 6,
    readingCount: 7,
    writingCount: 6,
    overallStatus: 'Đang học',
    finalAssessmentStatus: 'Chờ đánh giá',
    finalTotalScore: null,
    activeDaysCount: 7,
    isDemo: true,
  },
  {
    teacherId: 'DEMO-GV03',
    fullName: '[DEMO] Lê Thị Thu Hà',
    professionalGroup: 'Tổ 5',
    email: 'demo.thuha@lekimlang.edu.vn',
    registrationDate: '2026-12-05T14:20:00.000Z',
    lastLogin: '2026-12-05T14:25:00.000Z',
    completedLessons: 0,
    inProgressLessons: 0,
    listeningCount: 0,
    speakingCount: 0,
    readingCount: 0,
    writingCount: 0,
    overallStatus: 'Chưa bắt đầu',
    finalAssessmentStatus: 'Chưa làm bài',
    finalTotalScore: null,
    activeDaysCount: 1,
    isDemo: true,
  },
];
