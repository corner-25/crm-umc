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
  Facebook,
  Warehouse,
  Pill,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    children: [
      { name: "Tổng quan", href: "/dashboard" },
      { name: "Bản đồ từ thiện", href: "/charity-medicine/map" },
    ],
  },
  {
    name: "Nhà tài trợ",
    href: "/donors",
    icon: Users,
    children: [
      { name: "Danh sách", href: "/donors" },
      { name: "Lead", href: "/leads" },
      { name: "Hợp đồng", href: "/contracts" },
    ],
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
      { name: "In thư cảm ơn", href: "/gratitude/thank-you-letter" },
      { name: "Mẫu thư cảm ơn", href: "/gratitude/templates" },
      { name: "Nhắc nhở", href: "/gratitude/reminders" },
    ],
  },
  {
    name: "Quản lý kho",
    href: "/warehouse",
    icon: Warehouse,
    children: [
      { name: "Tồn kho", href: "/warehouse" },
      { name: "Lịch sử xuất nhập", href: "/warehouse?tab=history" },
    ],
  },
  {
    name: "Hỗ trợ thuốc",
    href: "/cancer-support",
    icon: Activity,
    children: [
      { name: "Người bệnh", href: "/cancer-support/patients" },
      { name: "Thuốc", href: "/cancer-support/medications" },
      { name: "Theo dõi chu kỳ", href: "/cancer-support/tracking" },
    ],
  },
  {
    name: "Thuốc từ thiện",
    href: "/charity-medicine",
    icon: Pill,
    children: [
      { name: "Theo dõi đơn giản", href: "/charity-medicine/simple" },
      { name: "Quản lý chi tiết", href: "/charity-medicine" },
    ],
  },
  {
    name: "Fanpage",
    href: "/fanpage",
    icon: Facebook,
    children: [
      { name: "Tổng quan", href: "/fanpage" },
      { name: "Hội thoại", href: "/inbox" },
    ],
  },
  {
    name: "Báo cáo",
    href: "/reports",
    icon: FileText,
    children: [
      { name: "Tiền mặt & Huy động", href: "/reports/crm" },
      { name: "Hỗ trợ thuốc", href: "/reports/drug-support" },
      { name: "Kho", href: "/reports/warehouse" },
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
          // isActive: true nếu đang ở route của item HOẶC bất kỳ child nào
          const childHrefs = item.children?.map((c) => c.href.split("?")[0]) || [];
          const isActive =
            pathname.startsWith(item.href) ||
            childHrefs.some((h) => pathname === h || pathname.startsWith(h + "/"));
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
                        pathname === child.href.split("?")[0]
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
