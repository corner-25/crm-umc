"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTENT = {
  vi: {
    badge: "Truy cập bị từ chối",
    headline: "CRM-UMC chưa được bàn giao",
    para1:
      "CRM-UMC là hệ thống do cá nhân tôi phát triển, triển khai và duy trì trên tài nguyên riêng. Hiện tại hệ thống chưa được bàn giao cho bất kỳ cá nhân, nhóm, phòng ban hoặc tổ chức nào.",
    para2:
      "Mọi hành vi sử dụng, truy cập tính năng, sao chép dữ liệu, trình bày demo, vận hành, khai thác hoặc đại diện hệ thống dưới bất kỳ hình thức nào đều không được cho phép nếu chưa có hợp đồng/thỏa thuận bàn giao bằng văn bản với chủ sở hữu hệ thống.",
    para3:
      "Vui lòng liên hệ quản trị viên/chủ sở hữu hệ thống để trao đổi về quyền sử dụng hoặc thủ tục bàn giao.",
    signOut: "Đăng xuất",
    switchLang: "English",
  },
  en: {
    badge: "Access denied",
    headline: "CRM-UMC has not been handed over",
    para1:
      "CRM-UMC is a system that I personally developed, deployed, and maintain on my own resources. It has not been handed over to any individual, group, department, or organization.",
    para2:
      "Any use, feature access, data copying, demonstration, operation, exploitation, or representation of the system in any form is not permitted without a written handover agreement/contract with the system owner.",
    para3:
      "Please contact the system administrator/owner to discuss usage rights or handover procedures.",
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
