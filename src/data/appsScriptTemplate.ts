export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * English for Le Kim Lang's Primary Teachers – December Challenge
 * Google Apps Script Web App (Nhận, Ghi & Đọc kiểm chứng dữ liệu thật)
 * ============================================================================
 *
 * HƯỚNG DẪN CÀI ĐẶT NHANH (KHÔNG CẦN BIẾT LẬP TRÌNH):
 * 1. Tạo 1 Google Sheet mới, đặt tên: "Le Kim Lang - December English Challenge 2026".
 * 2. Trên thanh menu chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa mã mặc định và dán TOÀN BỘ đoạn mã này vào tệp Code.gs -> bấm Lưu (Ctrl + S).
 * 4. Ở cột trái, bấm biểu tượng Bánh răng (Cài đặt dự án / Project Settings)
 *    -> kéo xuống mục "Thuộc tính tập lệnh" (Script Properties) -> Thêm thuộc tính:
 *       - Thuộc tính (Property): SHARED_SECRET
 *       - Giá trị (Value): <dán đúng chuỗi GOOGLE_APPS_SCRIPT_SECRET bạn đã tạo>
 * 5. Quay lại mục Trình chỉnh sửa (<>), chọn hàm "setupSheets" ở thanh trên rồi bấm "Chạy" (Run)
 *    để cấp quyền và tự động tạo đủ 5 trang tính.
 * 6. Bấm nút xanh "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi với tư cách: Tôi (Me)
 *    - Người có quyền truy cập: Bất kỳ ai (Anyone)
 *    (Mọi yêu cầu đều BẮT BUỘC có khóa SHARED_SECRET mới được ghi/đọc!)
 * 7. Sao chép URL kết thúc bằng "/exec" để dán vào biến GOOGLE_APPS_SCRIPT_URL.
 */

const SHEET_SCHEMAS = {
  'Teachers': [
    'Teacher ID',
    'Full Name',
    'Professional Group',
    'Email',
    'Registration Date',
    'Last Login',
    'Account Status'
  ],
  'Learning Progress': [
    'Teacher ID',
    'Full Name',
    'Lesson ID',
    'English Sentence',
    'Listening Status',
    'Speaking Status',
    'Reading Status',
    'Writing Status',
    'Completion Percentage',
    'Last Updated',
    'Completion Date'
  ],
  'Practice Results': [
    'Attempt ID',
    'Teacher ID',
    'Lesson ID',
    'Skill',
    'Activity ID',
    'Score',
    'Maximum Score',
    'Attempt Number',
    'Submission Time',
    'Result Status'
  ],
  'Final Assessment': [
    'Teacher ID',
    'Full Name',
    'Listening Score',
    'Speaking Score',
    'Reading Score',
    'Writing Score',
    'Total Score',
    'Assessment Status',
    'Completion Date'
  ],
  'Activity Log': [
    'Event ID',
    'Teacher ID',
    'Event Type',
    'Timestamp',
    'Lesson ID',
    'Duration',
    'Event Status'
  ]
};

/**
 * Chạy hàm này 1 lần đầu tiên để tự tạo đủ 5 trang tính và dòng tiêu đề.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_SCHEMAS).forEach(function (sheetName) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    const headers = SHEET_SCHEMAS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet
        .getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#E0F2FE')
        .setFontColor('#0C4A6E');
      sheet.setFrozenRows(1);
    }
  });
  return true;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function verifySecret(providedSecret) {
  const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected || expected.length < 12) {
    return {
      ok: false,
      error:
        'Chưa cấu hình SHARED_SECRET (tối thiểu 12 ký tự) trong Project Settings -> Script Properties của Apps Script.'
    };
  }
  if (!providedSecret || providedSecret !== expected) {
    return {
      ok: false,
      error:
        'Sai khóa xác thực (SHARED_SECRET). Vui lòng kiểm tra GOOGLE_APPS_SCRIPT_SECRET phải khớp từng ký tự với Script Properties.'
    };
  }
  return { ok: true };
}

function getSheetRowCounts(ss) {
  function countRows(name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return 0;
    return Math.max(0, sh.getLastRow() - 1);
  }
  return {
    teachers: countRows('Teachers'),
    learningProgress: countRows('Learning Progress'),
    practiceResults: countRows('Practice Results'),
    finalAssessment: countRows('Final Assessment'),
    activityLog: countRows('Activity Log')
  };
}

function upsertRowByKeys(sheet, keyColumns, keyValues, rowData) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    for (let i = 0; i < data.length; i++) {
      let match = true;
      for (let k = 0; k < keyColumns.length; k++) {
        if (String(data[i][keyColumns[k]]) !== String(keyValues[k])) {
          match = false;
          break;
        }
      }
      if (match) {
        sheet.getRange(i + 2, 1, 1, rowData.length).setValues([rowData]);
        return 'updated';
      }
    }
  }
  sheet.appendRow(rowData);
  return 'inserted';
}

function appendIfUnique(sheet, idColumnIndex, uniqueId, rowData) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existingIds = sheet.getRange(2, idColumnIndex + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < existingIds.length; i++) {
      if (String(existingIds[i][0]) === String(uniqueId)) {
        return 'duplicate_skipped';
      }
    }
  }
  sheet.appendRow(rowData);
  return 'inserted';
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'Le Kim Lang December English Challenge – Google Sheets Receiver',
    message: 'Endpoint đang hoạt động. Mọi thao tác ghi/đọc dữ liệu đều yêu cầu POST kèm SHARED_SECRET hợp lệ.'
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const auth = verifySecret(body.secret);
    if (!auth.ok) {
      return jsonResponse({ ok: false, error: auth.error });
    }

    setupSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = body.action;

    // 1. Kiểm tra GHI & ĐỌC THẬT (Test Connection)
    if (action === 'test_write_read' || action === 'ping') {
      const testEventId = String(body.testEventId || 'TEST-' + new Date().getTime());
      const nowIso = new Date().toISOString();
      const logSheet = ss.getSheetByName('Activity Log');

      // Ghi 1 dòng kiểm chứng thật vào Activity Log
      logSheet.appendRow([
        testEventId,
        'SYSTEM_ADMIN',
        'CONNECTION_TEST',
        nowIso,
        '',
        0,
        'Verified'
      ]);
      SpreadsheetApp.flush();

      // Đọc ngược lại chính dòng vừa ghi để xác nhận quyền ĐỌC & GHI thật
      const lastRow = logSheet.getLastRow();
      const readBackRow = logSheet.getRange(lastRow, 1, 1, 7).getValues()[0];
      const verifiedEventId = String(readBackRow[0] || '');
      const readVerified = verifiedEventId === testEventId;

      return jsonResponse({
        ok: readVerified,
        sheetsReady: true,
        writeVerified: true,
        readVerified: readVerified,
        verifiedEventId: verifiedEventId,
        spreadsheetName: ss.getName(),
        sheetCounts: getSheetRowCounts(ss),
        serverTime: nowIso
      });
    }

    // 2. Đọc thống kê số dòng thật hiện có trong 5 trang tính
    if (action === 'read_summary') {
      return jsonResponse({
        ok: true,
        spreadsheetName: ss.getName(),
        sheetCounts: getSheetRowCounts(ss),
        serverTime: new Date().toISOString()
      });
    }

    // 3. Đồng bộ hồ sơ giáo viên (Sheet 1 – Teachers)
    if (action === 'sync_teacher' && body.teacher) {
      const t = body.teacher;
      const sheet = ss.getSheetByName('Teachers');
      const status = upsertRowByKeys(sheet, [0], [t.teacherId], [
        t.teacherId,
        t.fullName,
        t.professionalGroup,
        t.email || '',
        t.registrationDate,
        t.lastLogin,
        t.accountStatus || 'Active'
      ]);
      return jsonResponse({ ok: true, status: status });
    }

    // 4. Đồng bộ tiến độ 10 bài học (Sheet 2 – Learning Progress)
    if (action === 'sync_progress' && body.progress) {
      const p = body.progress;
      const sheet = ss.getSheetByName('Learning Progress');
      const status = upsertRowByKeys(sheet, [0, 2], [p.teacherId, p.lessonId], [
        p.teacherId,
        p.fullName,
        p.lessonId,
        p.englishSentence,
        p.listening ? 'Completed' : 'Pending',
        p.speaking ? 'Completed' : 'Pending',
        p.reading ? 'Completed' : 'Pending',
        p.writing ? 'Completed' : 'Pending',
        p.completionPercentage + '%',
        p.lastUpdated,
        p.completionDate || ''
      ]);
      return jsonResponse({ ok: true, status: status });
    }

    // 5. Đồng bộ kết quả từng lượt luyện 4 kỹ năng (Sheet 3 – Practice Results)
    if (action === 'sync_attempt' && body.attempt) {
      const a = body.attempt;
      const sheet = ss.getSheetByName('Practice Results');
      const status = appendIfUnique(sheet, 0, a.attemptId, [
        a.attemptId,
        a.teacherId,
        a.lessonId,
        a.skill,
        a.activityId,
        a.score,
        a.maximumScore,
        a.attemptNumber,
        a.submissionTime,
        a.resultStatus
      ]);
      return jsonResponse({ ok: true, status: status });
    }

    // 6. Đồng bộ kết quả kiểm tra cuối tháng (Sheet 4 – Final Assessment)
    if (action === 'sync_final_assessment' && body.assessment) {
      const f = body.assessment;
      const sheet = ss.getSheetByName('Final Assessment');
      const status = upsertRowByKeys(sheet, [0], [f.teacherId], [
        f.teacherId,
        f.fullName,
        f.listeningScore,
        f.speakingScore === null || f.speakingScore === undefined
          ? 'Chờ đánh giá'
          : f.speakingScore,
        f.readingScore,
        f.writingScore,
        f.totalScore === null || f.totalScore === undefined ? 'Chờ đánh giá' : f.totalScore,
        f.assessmentStatus,
        f.completionDate || ''
      ]);
      return jsonResponse({ ok: true, status: status });
    }

    // 7. Đồng bộ nhật ký hoạt động học tập (Sheet 5 – Activity Log)
    if (action === 'sync_activity' && body.event) {
      const ev = body.event;
      const sheet = ss.getSheetByName('Activity Log');
      const status = appendIfUnique(sheet, 0, ev.eventId, [
        ev.eventId,
        ev.teacherId,
        ev.eventType,
        ev.timestamp,
        ev.lessonId || '',
        ev.durationSeconds || 0,
        ev.eventStatus || 'Recorded'
      ]);
      return jsonResponse({ ok: true, status: status });
    }

    return jsonResponse({ ok: false, error: 'Hành động không được hỗ trợ: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Lỗi Apps Script: ' + String(err) });
  } finally {
    lock.releaseLock();
  }
}
`;

export const SHEET_TABS_SPEC = [
  {
    name: 'Teachers',
    labelVi: 'Sheet 1 – Teachers (Danh sách giáo viên)',
    columns: [
      'Teacher ID',
      'Full Name',
      'Professional Group',
      'Email',
      'Registration Date',
      'Last Login',
      'Account Status',
    ],
  },
  {
    name: 'Learning Progress',
    labelVi: 'Sheet 2 – Learning Progress (Tiến độ 10 bài học)',
    columns: [
      'Teacher ID',
      'Full Name',
      'Lesson ID',
      'English Sentence',
      'Listening Status',
      'Speaking Status',
      'Reading Status',
      'Writing Status',
      'Completion Percentage',
      'Last Updated',
      'Completion Date',
    ],
  },
  {
    name: 'Practice Results',
    labelVi: 'Sheet 3 – Practice Results (Kết quả luyện Nghe – Nói – Đọc – Viết)',
    columns: [
      'Attempt ID',
      'Teacher ID',
      'Lesson ID',
      'Skill',
      'Activity ID',
      'Score',
      'Maximum Score',
      'Attempt Number',
      'Submission Time',
      'Result Status',
    ],
  },
  {
    name: 'Final Assessment',
    labelVi: 'Sheet 4 – Final Assessment (Kiểm tra cuối tháng 100 điểm)',
    columns: [
      'Teacher ID',
      'Full Name',
      'Listening Score',
      'Speaking Score',
      'Reading Score',
      'Writing Score',
      'Total Score',
      'Assessment Status',
      'Completion Date',
    ],
  },
  {
    name: 'Activity Log',
    labelVi: 'Sheet 5 – Activity Log (Nhật ký đăng nhập & kiểm tra kết nối)',
    columns: [
      'Event ID',
      'Teacher ID',
      'Event Type',
      'Timestamp',
      'Lesson ID',
      'Duration',
      'Event Status',
    ],
  },
];
