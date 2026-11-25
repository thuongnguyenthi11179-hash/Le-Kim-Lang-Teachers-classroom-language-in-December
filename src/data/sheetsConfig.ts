/**
 * Cấu hình kết nối Google Sheets mặc định cho toàn bộ giáo viên Trường TH Lê Kim Lăng.
 * Cấu hình này giúp mọi giáo viên truy cập trên điện thoại/máy tính cá nhân
 * đều tự động gửi thông tin điểm và tiến độ học về đúng Google Sheet của trường.
 */
export const DEFAULT_SHEETS_CONFIG = {
  // Đường link Google Apps Script Web App (kết thúc bằng /exec)
  url: (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) || '',
  // Mã bí mật SHARED_SECRET cài trong Script Properties
  secret: (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_SECRET as string) || '',
  spreadsheetName: 'Le Kim Lang - December English Challenge 2026',
};
