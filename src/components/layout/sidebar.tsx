"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Heart,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity,
  ScrollText,
  UserPlus,
  Facebook,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Nhà tài trợ",
    href: "/donors",
    icon: Users,
  },
  {
    name: "Tài trợ",
    href: "/donations",
    icon: DollarSign,
    children: [
      { name: "Tiền mặt", href: "/donations/cash" },
      { name: "Hiện vật", href: "/donations/in-kind" },
      { name: "Tình nguyện", href: "/donations/volunteer" },
    ],
  },
  {
    name: "Tri ân",
    href: "/gratitude",
    icon: Heart,
    children: [
      { name: "Gửi email", href: "/gratitude/send-email" },
      { name: "Mẫu email", href: "/gratitude/templates" },
      { name: "Nhắc nhở", href: "/gratitude/reminders" },
    ],
  },
  {
    name: "Chương trình hỗ trợ thuốc",
    href: "/cancer-support",
    icon: Activity,
    children: [
      { name: "Người bệnh", href: "/cancer-support/patients" },
      { name: "Thuốc", href: "/cancer-support/medications" },
      { name: "Theo dõi", href: "/cancer-support/tracking" },
    ],
  },
  {
    name: "Fanpage",
    href: "/fanpage",
    icon: Facebook,
  },
  {
    name: "Lead",
    href: "/leads",
    icon: UserPlus,
  },
  {
    name: "Hợp đồng",
    href: "/contracts",
    icon: ScrollText,
  },
  {
    name: "Báo cáo",
    href: "/reports",
    icon: FileText,
    children: [
      { name: "Báo cáo CRM", href: "/reports/crm" },
      { name: "Báo cáo Hỗ trợ thuốc", href: "/reports/drug-support" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r bg-slate-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Heart className="h-6 w-6 text-primary" />
        {!isCollapsed && <span className="ml-2 text-lg font-bold">CRM UMC</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-700 hover:bg-slate-200",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
              {item.children && isActive && !isCollapsed && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === child.href
                          ? "bg-slate-200 font-medium text-slate-900"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <div className="border-t px-3 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 rounded-full border bg-white shadow-sm hover:bg-slate-100"
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
