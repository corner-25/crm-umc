"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────────────────────────────────────────
// Highlight type: { text, mark? } — đoạn nào có mark=true sẽ hiện vàng
// ────────────────────────────────────────────────────────────────────────────
type Span = { text: string; mark?: boolean };

const CONTENT: Record<"vi" | "en", {
  badge: string;
  headline: string;
  paragraphs: Span[][];
  signOut: string;
  switchLang: string;
}> = {
  vi: {
    badge: "Truy cập bị giới hạn",
    headline: "CRM-UMC tạm giới hạn truy cập",
    paragraphs: [
      [
        { text: "CRM-UMC là " },
        { text: "ứng dụng thử nghiệm do cá nhân tôi tự phát triển, triển khai và duy trì bằng tài nguyên riêng", mark: true },
        { text: " nhằm hỗ trợ quy trình làm việc ở phạm vi cá nhân. Đây " },
        { text: "không phải là dự án chính thức, kế hoạch triển khai chung hoặc hệ thống được bệnh viện phê duyệt/bàn giao", mark: true },
        { text: "." },
      ],
      [
        { text: "Hiện tại hệ thống " },
        { text: "chưa có thỏa thuận bằng văn bản", mark: true },
        { text: " về quyền sử dụng, quyền trình bày, quyền vận hành, phạm vi dữ liệu, trách nhiệm bảo trì và chi phí duy trì. Vì vậy, " },
        { text: "các chức năng của hệ thống được tạm giới hạn cho đến khi các bên liên quan có thỏa thuận chính thức", mark: true },
        { text: "." },
      ],
      [
        { text: "Dữ liệu đã nhập sẽ được " },
        { text: "bảo toàn và không bị xóa", mark: true },
        { text: ". Việc tiếp tục sử dụng hoặc bàn giao hệ thống cần được " },
        { text: "xác nhận bằng văn bản với chủ sở hữu hệ thống", mark: true },
        { text: "." },
      ],
    ],
    signOut: "Đăng xuất",
    switchLang: "English",
  },
  en: {
    badge: "Access restricted",
    headline: "CRM-UMC access is temporarily restricted",
    paragraphs: [
      [
        { text: "CRM-UMC is an " },
        { text: "experimental application that I personally developed, deployed, and maintain on my own resources", mark: true },
        { text: " to support my individual workflow. It is " },
        { text: "not an official project, a shared deployment plan, or a hospital-approved/handed-over system", mark: true },
        { text: "." },
      ],
      [
        { text: "There is currently " },
        { text: "no written agreement", mark: true },
        { text: " covering usage rights, demonstration rights, operation rights, data scope, maintenance responsibility, or maintenance cost. Therefore, " },
        { text: "the system's features are temporarily restricted until the parties involved reach a formal agreement", mark: true },
        { text: "." },
      ],
      [
        { text: "Existing data will be " },
        { text: "preserved and will not be deleted", mark: true },
        { text: ". Continued use or handover of the system requires " },
        { text: "written confirmation from the system owner", mark: true },
        { text: "." },
      ],
    ],
    signOut: "Sign out",
    switchLang: "Tiếng Việt",
  },
};

export default function AccessDeniedPage() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span className="text-base font-semibold uppercase tracking-wide">
              {t.badge}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Globe className="h-4 w-4" />
            {t.switchLang}
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-5">
          <h1 className="text-2xl font-bold text-slate-900 leading-snug">
            {t.headline}
          </h1>
          <div className="space-y-4 text-base text-slate-700 leading-relaxed text-justify">
            {t.paragraphs.map((spans, idx) => (
              <p key={idx}>
                {spans.map((span, i) =>
                  span.mark ? (
                    <mark
                      key={i}
                      className="bg-amber-100 text-amber-900 px-0.5 rounded"
                    >
                      {span.text}
                    </mark>
                  ) : (
                    <span key={i}>{span.text}</span>
                  )
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">CRM-UMC © {new Date().getFullYear()}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          >
            {t.signOut}
          </Button>
        </div>
      </div>
    </div>
  );
}
