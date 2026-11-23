import { useEffect, useRef, useState } from 'react';
import { Award, Download, Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  professionalGroup: string;
  totalScore: number;
  dateStr?: string;
}

export function CertificateModal({
  isOpen,
  onClose,
  teacherName,
  professionalGroup,
  totalScore,
  dateStr = new Date().toLocaleDateString('vi-VN'),
}: CertificateModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas dimensions for sharp rendering (A4 Landscape ratio ~ 1200x850)
      const w = 1200;
      const h = 850;
      canvas.width = w;
      canvas.height = h;

      // 1. Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#FFFFFF');
      bgGrad.addColorStop(0.5, '#F7FAFC');
      bgGrad.addColorStop(1, '#EDF6FD');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Elegant Border & Frames
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#0284C7'; // sky-600
      ctx.strokeRect(20, 20, w - 40, h - 40);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#F59E0B'; // amber-500 gold inner border
      ctx.strokeRect(36, 36, w - 72, h - 72);

      // Corner flourishes
      const drawCorner = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 40);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(44, 44, 0);
      drawCorner(w - 44, 44, Math.PI / 2);
      drawCorner(w - 44, h - 44, Math.PI);
      drawCorner(44, h - 44, -Math.PI / 2);

      // 3. Header Text
      ctx.textAlign = 'center';

      // School Name
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('TRƯỜNG TIỂU HỌC LÊ KIM LĂNG', w / 2, 95);

      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('English for Primary Teachers – Professional Development Program', w / 2, 125);

      // Certificate Title
      ctx.font = 'bold 44px "Outfit", serif';
      ctx.fillStyle = '#0369A1';
      ctx.fillText('GIẤY CHỨNG NHẬN', w / 2, 205);

      ctx.font = 'italic 600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#D97706';
      ctx.fillText('CERTIFICATE OF ACHIEVEMENT', w / 2, 240);

      // Subtitle
      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Chứng nhận Thầy / Cô:', w / 2, 305);

      // Teacher Name
      ctx.font = 'bold 38px "Outfit", sans-serif';
      ctx.fillStyle = '#0C4A6E';
      ctx.fillText(teacherName || 'Giáo viên Trường TH Lê Kim Lăng', w / 2, 365);

      // Professional Group
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0284C7';
      ctx.fillText(`Đơn vị công tác: ${professionalGroup || 'Tổ Chuyên môn'}`, w / 2, 410);

      // Achievement Description
      ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#334155';
      const desc1 = 'Đã xuất sắc hoàn thành trọn vẹn 10 Bài học Khẩu lệnh Tiếng Anh Lớp học';
      const desc2 = 'và vượt qua Kỳ Đánh giá Tổng kết "December Challenge 2026"';
      ctx.fillText(desc1, w / 2, 470);
      ctx.fillText(desc2, w / 2, 502);

      // Score Badge Box
      const scoreBoxW = 280;
      const scoreBoxH = 75;
      const scoreBoxX = (w - scoreBoxW) / 2;
      const scoreBoxY = 540;

      ctx.fillStyle = '#F0F9FF';
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0369A1';
      ctx.fillText('KẾT QUẢ ĐẠT ĐƯỢC', w / 2, 568);

      ctx.font = 'bold 26px "Outfit", monospace';
      ctx.fillStyle = '#0284C7';
      ctx.fillText(`${totalScore} / 100 ĐIỂM`, w / 2, 600);

      // Signatures & Date
      // Left: Verification Date
      ctx.textAlign = 'left';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`Ngày cấp: ${dateStr}`, 120, 710);
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('BAN TỔ CHỨC CHUYÊN MÔN', 120, 740);

      // Right: School Principal / Representative
      ctx.textAlign = 'right';
      ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('TP. Đà Nẵng, ngày hoàn thành thử thách', w - 120, 710);
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('HIỆU TRƯỞNG / PHÓ HIỆU TRƯỞNG', w - 120, 740);

      // Gold Medal Ribbon in center bottom
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#D97706';
      ctx.fillText('★ EXCELLENT PRIMARY COMMUNICATOR ★', w / 2, 770);
      ctx.restore();

      // Convert to image download URL
      const url = canvas.toDataURL('image/png');
      setDownloadUrl(url);
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, teacherName, professionalGroup, totalScore, dateStr]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (!downloadUrl) return;
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Chứng nhận hoàn thành - ${teacherName}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { width: 100%; max-width: 1100px; height: auto; }
              @media print { body { margin: 0; } img { width: 100%; height: auto; } }
            </style>
          </head>
          <body>
            <img src="${downloadUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Award className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display">Giấy Chứng Nhận Hoàn Thành</h3>
              <p className="text-xs text-sky-100">December Challenge – Trường TH Lê Kim Lăng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-50">
          <canvas
            ref={canvasRef}
            className="w-full max-w-3xl rounded-xl shadow-lg border border-slate-200 bg-white"
          />
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã tạo chứng nhận số độ phân giải cao chuẩn in ấn (1200x850px)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4" />
              In chứng nhận
            </button>
            <a
              href={downloadUrl || '#'}
              download={`ChungNhan_${teacherName.replace(/\s+/g, '_')}_LeKimLang.png`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              Tải hình ảnh (PNG)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
