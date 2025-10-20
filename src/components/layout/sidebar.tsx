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
} from "lucide-react";

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
    name: "Báo cáo",
    href: "/reports",
    icon: FileText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-slate-50">
      <div className="flex h-16 items-center border-b px-6">
        <Heart className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-bold">CRM UMC</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
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
                    : "text-slate-700 hover:bg-slate-200"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
              {item.children && isActive && (
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
    </div>
  );
}
