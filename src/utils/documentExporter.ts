import { LESSONS } from '../data/lessons';

/**
 * Exports a Microsoft Word (.doc / .docx compatible) Teacher Handout & Worksheet
 * formatted for primary school teachers of Le Kim Lang Primary School.
 */
export function exportTeacherHandbookDoc(): void {
  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Sổ Tay Khẩu Lệnh Tiếng Anh Tiểu Học - Lê Kim Lăng</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111; margin: 40px; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .header-table td { border: none; vertical-align: top; }
          .school-title { font-weight: bold; font-size: 11pt; text-align: center; }
          .doc-title { text-align: center; font-size: 18pt; font-weight: bold; color: #003366; margin-top: 15px; margin-bottom: 5px; }
          .doc-subtitle { text-align: center; font-size: 12pt; font-style: italic; color: #555; margin-bottom: 25px; }
          h2 { color: #003366; font-size: 14pt; border-bottom: 2px solid #003366; padding-bottom: 4px; margin-top: 25px; }
          table.lessons-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          table.lessons-table th { background-color: #f2f7fa; border: 1px solid #999; padding: 8px; text-align: left; font-weight: bold; }
          table.lessons-table td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
          .sentence-en { font-size: 14pt; font-weight: bold; color: #004085; }
          .ipa { font-family: Arial, sans-serif; color: #666; font-size: 11pt; }
          .badge-box { background: #e8f4fd; border: 1px solid #bee5eb; padding: 12px; border-radius: 6px; margin: 15px 0; }
          .worksheet-item { margin-bottom: 12px; }
          .blank { border-bottom: 1px solid #000; display: inline-block; width: 120px; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 50%;" class="school-title">
              UBND QUẬN CẨM LỆ<br>
              <b>TRƯỜNG TIỂU HỌC LÊ KIM LĂNG</b><br>
              <i>Ban Chuyên Môn</i>
            </td>
            <td style="width: 50%; text-align: center; font-size: 11pt;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>
              Độc lập – Tự do – Hạnh phúc<br>
              <i>Đà Nẵng, tháng 12 năm 2026</i>
            </td>
          </tr>
        </table>

        <div class="doc-title">SỔ TAY KHẨU LỆNH TIẾNG ANH LỚP HỌC TIỂU HỌC</div>
        <div class="doc-subtitle">10 Bài Học Giao Tiếp Tích Cực – Thử Thách Tháng 12 (December Challenge)</div>

        <div class="badge-box">
          <b>MỤC TIÊU SƯ PHẠM:</b> Trang bị cho toàn thể cán bộ, giáo viên Trường TH Lê Kim Lăng các câu khen ngợi, khích lệ và điều hành lớp học bằng tiếng Anh tự nhiên, chuẩn xác, tạo môi trường học tập thân thiện và tích cực.
        </div>

        <h2>PHẦN 1: BẢNG TỔNG HỢP 10 KHẨU LỆNH CHUẨN</h2>
        <table class="lessons-table">
          <thead>
            <tr>
              <th style="width: 8%;">Bài</th>
              <th style="width: 32%;">Khẩu lệnh Tiếng Anh</th>
              <th style="width: 25%;">Phiên âm quốc tế (IPA)</th>
              <th style="width: 35%;">Ý nghĩa & Tình huống sư phạm</th>
            </tr>
          </thead>
          <tbody>
            ${LESSONS.map(
              (l) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${l.id}</td>
                <td>
                  <span class="sentence-en">${l.english}</span><br>
                  <i>${l.situationTitleVi}</i>
                </td>
                <td class="ipa">${l.ipa}</td>
                <td>
                  <b>Nghĩa:</b> ${l.vietnamese}<br>
                  <span style="font-size: 11pt; color: #444;">${l.situationDescVi}</span>
                </td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>

        <div style="page-break-before: always;"></div>

        <h2>PHẦN 2: CHI TIẾT TỪNG BÀI & HỘI THOẠI MẪU LỚP HỌC</h2>
        ${LESSONS.map(
          (l) => `
          <div style="margin-bottom: 20px; border-bottom: 1px dashed #bbb; padding-bottom: 15px;">
            <h3 style="color: #0369A1; margin-bottom: 4px;">Bài ${l.id}: ${l.english} – ${l.situationTitleVi}</h3>
            <p><b>Phiên âm:</b> ${l.ipa} | <b>Mẹo phát âm:</b> ${l.pronunciationTipVi}</p>
            <p><b>Hội thoại mẫu giữa Giáo viên và Học sinh:</b></p>
            <ul>
              ${l.dialogue
                .map(
                  (d) => `
                <li><b>${d.speaker === 'Teacher' ? 'Giáo viên' : 'Học sinh'}:</b> "${d.english}" (<i>${d.vietnamese}</i>)</li>
              `
                )
                .join('')}
            </ul>
          </div>
        `
        ).join('')}

        <div style="page-break-before: always;"></div>

        <h2>PHẦN 3: PHIẾU BÀI TẬP THỰC HÀNH TẠI LỚP (WORKSHEET)</h2>
        <p><i>Thầy/cô có thể in phần này phát cho học sinh hoặc dùng ôn luyện chuyên môn:</i></p>

        <h4 style="color: #003366;">Bài tập 1: Điền từ còn thiếu vào câu khẩu lệnh</h4>
        ${LESSONS.map(
          (l, idx) => `
          <div class="worksheet-item">
            ${idx + 1}. ${l.english.replace(l.writing.complete.missingWord, '..........')} (${l.vietnamese})
          </div>
        `
        ).join('')}

        <h4 style="color: #003366; margin-top: 20px;">Bài tập 2: Nối tình huống phù hợp</h4>
        <p>Ghép câu khẩu lệnh tiếng Anh bên trái với ngữ cảnh dùng trong lớp học bên phải:</p>
        <table class="lessons-table">
          <thead>
            <tr>
              <th style="width: 50%;">Khẩu lệnh</th>
              <th style="width: 50%;">Tình huống sử dụng</th>
            </tr>
          </thead>
          <tbody>
            ${LESSONS.map(
              (l) => `
              <tr>
                <td><b>[ ] ${l.english}</b></td>
                <td>${l.situationDescVi}</td>
              </tr>
            `
            ).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: right;">
          <b>TỔ TRƯỞNG CHUYÊN MÔN / BAN GIÁM HIỆU DUYỆT</b><br>
          <i>(Ký và ghi rõ họ tên)</i>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SoTay_KhauLenh_TiengAnh_TH_LeKimLang.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports an HTML-based interactive presentation deck for PowerPoint/Web projection
 */
export function exportPresentationSlides(): void {
  const slidesHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Bài Giảng Khẩu Lệnh Tiếng Anh Tiểu Học - Lê Kim Lăng</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #0f172a; color: white; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .slide { display: none; width: 90vw; max-width: 1100px; height: 80vh; max-height: 650px; background: white; color: #1e293b; border-radius: 28px; padding: 50px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); flex-direction: column; justify-content: space-between; position: relative; }
        .slide.active { display: flex; }
        .slide-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .slide-school { font-size: 16px; font-weight: 700; color: #0284c7; text-transform: uppercase; }
        .slide-num { font-size: 14px; font-weight: 600; color: #64748b; }
        .slide-body { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; flex: 1; padding: 20px 0; }
        .sentence { font-size: 56px; font-weight: 800; color: #0369a1; margin-bottom: 12px; }
        .ipa { font-size: 26px; color: #64748b; font-family: monospace; margin-bottom: 16px; }
        .meaning { font-size: 28px; font-weight: 600; color: #0f172a; margin-bottom: 20px; }
        .context-box { background: #f0f9ff; border-left: 6px solid #0284c7; padding: 16px 24px; border-radius: 12px; font-size: 20px; color: #0369a1; max-width: 800px; text-align: left; }
        .dialogue-box { margin-top: 18px; font-size: 18px; color: #475569; }
        .controls { position: fixed; bottom: 20px; display: flex; gap: 16px; z-index: 100; }
        button { background: #0284c7; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
        button:hover { background: #0369a1; }
      </style>
    </head>
    <body>
      <!-- Cover Slide -->
      <div class="slide active">
        <div class="slide-header">
          <div class="slide-school">Trường Tiểu Học Lê Kim Lăng</div>
          <div class="slide-num">Trình chiếu Lớp Học</div>
        </div>
        <div class="slide-body">
          <h1 style="font-size: 48px; color: #0369a1; margin-bottom: 20px;">10 KHẨU LỆNH TIẾNG ANH GIAO TIẾP TÍCH CỰC</h1>
          <p style="font-size: 24px; color: #475569; margin-bottom: 30px;">Positive Communication in Primary Classroom</p>
          <div style="background: #e0f2fe; padding: 16px 32px; border-radius: 16px; font-size: 20px; color: #0369a1; font-weight: bold;">
            Thử thách tháng 12 dành cho Giáo viên & Học sinh
          </div>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">Bấm nút &rarr; hoặc nút Next bên dưới để chuyển slide</div>
      </div>

      <!-- 10 Lesson Slides -->
      ${LESSONS.map(
        (l, i) => `
        <div class="slide">
          <div class="slide-header">
            <div class="slide-school">Khẩu lệnh Lớp học – Bài ${l.id} / 10</div>
            <div class="slide-num">Slide ${i + 2} / ${LESSONS.length + 1}</div>
          </div>
          <div class="slide-body">
            <div class="sentence">"${l.english}"</div>
            <div class="ipa">${l.ipa}</div>
            <div class="meaning">${l.vietnamese}</div>
            <div class="context-box">
              <b>Ngữ cảnh sử dụng:</b> ${l.situationDescVi}
            </div>
            <div class="dialogue-box">
              <b>Hội thoại mẫu:</b> Giáo viên: <i>"${l.dialogue[0]?.english}"</i> &rarr; Học sinh: <i>"${l.dialogue[1]?.english}"</i>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 14px;">
            <span>Mẹo: ${l.pronunciationTipVi}</span>
            <span>English for Primary Teachers</span>
          </div>
        </div>
      `
      ).join('')}

      <div class="controls">
        <button onclick="prevSlide()">&#8592; Slide Trước</button>
        <button onclick="nextSlide()">Slide Kế Tiếp &#8594;</button>
        <button onclick="window.print()">In / Lưu PDF</button>
      </div>

      <script>
        let current = 0;
        const slides = document.querySelectorAll('.slide');
        function showSlide(index) {
          slides.forEach((s, idx) => {
            s.classList.toggle('active', idx === index);
          });
        }
        function nextSlide() {
          if (current < slides.length - 1) { current++; showSlide(current); }
        }
        function prevSlide() {
          if (current > 0) { current--; showSlide(current); }
        }
        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
          if (e.key === 'ArrowLeft') prevSlide();
        });
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([slidesHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BaiGiang_KhauLenh_TH_LeKimLang_Slides.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
