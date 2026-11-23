import { ArrowRight, BookOpen, CheckCircle2, Headphones, Mic, ShieldCheck, Shield } from 'lucide-react';
import { DECEMBER_PLAN_WEEKS, HERO_BANNER_IMAGE, LESSONS } from '../../data/lessons';
import type { SheetsConnectionStatus } from '../../types/app';
import { IllustratedFrame } from '../IllustratedFrame';

interface WelcomeScreenProps {
  sheetsStatus: SheetsConnectionStatus;
  onStartTeacher: () => void;
  onOpenAdmin: () => void;
}

export function WelcomeScreen({
  sheetsStatus,
  onStartTeacher,
  onOpenAdmin,
}: WelcomeScreenProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-14">
      {/* Hero Banner Split — Dominant Focal Anchor */}
      <section className="card-3d rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6 bg-gradient-to-br from-white via-sky-50/40 to-teal-50/40">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-sky-700">
                Trường Tiểu học Lê Kim Lăng · Tháng 12/2026 · Happy Classroom – Positive Communication
              </p>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold leading-[1.15] tracking-tight text-slate-900">
                ENGLISH FOR LE KIM LANG&apos;S PRIMARY TEACHERS
              </h1>

              <p className="font-display text-xl sm:text-2xl font-bold text-teal-700">
                DECEMBER CHALLENGE · Happy Classroom – Happy Teachers!
              </p>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Thử thách tiếng Anh dành cho giáo viên tháng 12 — giúp thầy cô tự tin sử dụng 10 câu giao tiếp tích cực trong lớp học thông qua luyện Nghe – Nói – Đọc – Viết và ghi âm trực tiếp tại nhà.
              </p>

              <p className="text-sm font-semibold text-amber-800">
                Learn a Little Every Day – Speak English with Confidence!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartTeacher}
                className="btn-3d-primary inline-flex min-h-[52px] items-center gap-2 rounded-2xl px-6 py-3 text-base font-bold whitespace-nowrap cursor-pointer"
              >
                <span>START LEARNING – BẮT ĐẦU HỌC</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Shield className="h-4 w-4 text-sky-700" aria-hidden="true" />
                <span>Khu vực Quản trị nhà trường</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <IllustratedFrame
              src={HERO_BANNER_IMAGE}
              alt="Nhóm giáo viên tiểu học Trường Tiểu học Lê Kim Lăng vui vẻ học tiếng Anh cùng robot AI với micro, tai nghe, sách và bảng tương tác"
              title="English for Le Kim Lang's Primary Teachers"
              aspectClass="aspect-[16/9] lg:h-full"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* 4 Core Skill Highlights */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
              Học thật mỗi ngày với đầy đủ 4 kỹ năng
            </h2>
            <p className="text-base text-slate-600 mt-1">
              Thiết kế thân thiện cho cả thầy cô mới bắt đầu, thao tác dễ dàng trên điện thoại và máy tính.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Trạng thái đồng bộ: <strong className="text-slate-700">{sheetsStatus.label}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Headphones,
              title: 'Luyện Nghe chuẩn Anh–Mỹ',
              desc: 'Nghe giọng đọc rõ ràng, điều chỉnh tốc độ 0.75x – 1.0x – 1.25x và làm bài tập chọn đáp án.',
              color: 'text-sky-700 bg-sky-50',
            },
            {
              icon: Mic,
              title: 'Ghi âm & Nghe lại tại chỗ',
              desc: 'Ghi âm giọng nói thật, nghe lại ngay trên thiết bị, đối chiếu từ khóa và tự đánh giá.',
              color: 'text-rose-700 bg-rose-50',
            },
            {
              icon: BookOpen,
              title: 'Luyện Đọc qua tình huống lớp',
              desc: 'Hội thoại tiểu học ngắn gọn, gần gũi với tranh minh họa 3D và giải thích tiếng Việt dễ hiểu.',
              color: 'text-teal-700 bg-teal-50',
            },
            {
              icon: CheckCircle2,
              title: 'Luyện Viết & Báo cáo tiến độ',
              desc: 'Sắp xếp từ, điền khuyết, dịch câu có chấm lỗi chính tả, dấu câu và tự động lưu kết quả.',
              color: 'text-amber-700 bg-amber-50',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-3d rounded-2xl p-6 space-y-3">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Preview of 10 Official Sentences grouped by 4 weeks */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
            Lộ trình 10 câu giao tiếp Tháng 12 (4 tuần gợi ý)
          </h2>
          <p className="text-base text-slate-600 mt-1">
            Thầy cô có thể học theo từng tuần, học trước hoặc học bù bất cứ lúc nào — không khóa bài theo tuần.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {DECEMBER_PLAN_WEEKS.map((w) => (
            <div key={w.week} className="card-3d rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-sky-700">{w.title}</p>
                <p className="text-sm text-slate-500">{w.subtitleVi}</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {w.lessonIds.map((id) => {
                  const lesson = LESSONS.find((l) => l.id === id)!;
                  return (
                    <li key={id} className="py-2.5 flex items-baseline justify-between gap-4">
                      <span className="font-display text-base font-bold text-slate-900">
                        Bài {lesson.id}. {lesson.english}
                      </span>
                      <span className="text-sm text-slate-600 text-right">{lesson.vietnamese}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy & School Policy Note */}
      <section className="rounded-2xl border border-sky-100 bg-sky-50/50 p-6 flex flex-col sm:flex-row items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900">
            Cam kết bảo mật và quyền riêng tư của Trường Tiểu học Lê Kim Lăng
          </p>
          <p>
            Thông tin cá nhân và kết quả học tập chỉ phục vụ mục đích tự học của giáo viên và tổng hợp báo cáo nội bộ nhà trường. Giáo viên chỉ xem được tiến độ của riêng mình, không công khai danh sách điểm cá nhân cho đồng nghiệp khác. Bản ghi âm luyện nói được xử lý cục bộ trên thiết bị của thầy cô.
          </p>
        </div>
      </section>
    </div>
  );
}
