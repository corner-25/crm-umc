"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTENT = {
  vi: {
    badge: "Truy cập bị giới hạn",
    headline: "CRM-UMC tạm giới hạn truy cập",
    para1:
      "CRM-UMC là ứng dụng thử nghiệm do cá nhân tôi tự phát triển, triển khai và duy trì bằng tài nguyên riêng nhằm hỗ trợ quy trình làm việc ở phạm vi cá nhân. Đây không phải là dự án chính thức, kế hoạch triển khai chung hoặc hệ thống được bệnh viện phê duyệt/bàn giao.",
    para2:
      "Hiện tại hệ thống chưa có thỏa thuận bằng văn bản về quyền sử dụng, quyền trình bày, quyền vận hành, phạm vi dữ liệu, trách nhiệm bảo trì và chi phí duy trì. Vì vậy, các chức năng của hệ thống được tạm giới hạn cho đến khi các bên liên quan có thỏa thuận chính thức.",
    para3:
      "Dữ liệu đã nhập sẽ được bảo toàn và không bị xóa. Việc tiếp tục sử dụng hoặc bàn giao hệ thống cần được xác nhận bằng văn bản với chủ sở hữu hệ thống.",
    signOut: "Đăng xuất",
    switchLang: "English",
  },
  en: {
    badge: "Access restricted",
    headline: "CRM-UMC access is temporarily restricted",
    para1:
      "CRM-UMC is an experimental application that I personally developed, deployed, and maintain on my own resources to support my individual workflow. It is not an official project, a shared deployment plan, or a hospital-approved/handed-over system.",
    para2:
      "There is currently no written agreement covering usage rights, demonstration rights, operation rights, data scope, maintenance responsibility, or maintenance cost. Therefore, the system's features are temporarily restricted until the parties involved reach a formal agreement.",
    para3:
      "Existing data will be preserved and will not be deleted. Continued use or handover of the system requires written confirmation from the system owner.",
    signOut: "Sign out",
    switchLang: "Tiếng Việt",
  },
};

export default function AccessDeniedPage() {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = CONTENT[lang];

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-wide">
              {t.badge}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {t.switchLang}
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-7 space-y-4">
          <h1 className="text-xl font-bold text-slate-900 leading-snug">
            {t.headline}
          </h1>
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>{t.para1}</p>
            <p>{t.para2}</p>
            <p>{t.para3}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
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
