"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, FileText, Clock, Facebook, Package, Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AlertLike = Record<string, unknown>;

export function NotificationsDropdown() {
  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const expiringContracts: AlertLike[] = alerts?.expiringContracts || [];
  const upcomingTreatments: AlertLike[] = alerts?.upcomingTreatments || [];
  const overdueReminders: AlertLike[] = alerts?.overdueReminders || [];
  const upcomingFanpostPosts: AlertLike[] = alerts?.upcomingFanpostPosts || [];
  const warehouseExpiry: AlertLike[] = alerts?.warehouseExpiry || [];

  const count =
    expiringContracts.length +
    upcomingTreatments.length +
    overdueReminders.length +
    upcomingFanpostPosts.length +
    warehouseExpiry.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn("h-5 w-5", count > 0 && "text-red-600")} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold shadow-sm">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <div>
              <p className="text-sm font-semibold leading-tight">Thông báo hệ thống</p>
              <p className="text-[11px] opacity-90 leading-tight">
                {count > 0 ? `${count} mục cần chú ý` : "Không có thông báo"}
              </p>
            </div>
          </div>
        </div>

        {count === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            Tất cả đều ổn
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="p-3 space-y-4">
              {overdueReminders.length > 0 && (
                <Section
                  title="Nhắc nhở chưa xử lý"
                  icon={<Clock className="h-3.5 w-3.5" />}
                  tone="red"
                >
                  {overdueReminders.map((alert: any) => (
                    <Link key={alert.reminderId} href={`/donors/${alert.donorId}`}>
                      <Chip tone="red" highlight={alert.isOverdue}>
                        {alert.isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {alert.donorName}: {alert.title}
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {expiringContracts.length > 0 && (
                <Section
                  title="Hợp đồng sắp hết hạn (30 ngày)"
                  icon={<FileText className="h-3.5 w-3.5" />}
                  tone="orange"
                >
                  {expiringContracts.map((alert: any) => (
                    <Link key={alert.contractId} href={`/contracts/${alert.contractId}/edit`}>
                      <Chip tone="orange" highlight={alert.isUrgent}>
                        {alert.isUrgent && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {alert.contractNumber} — {alert.donorName} ({format(new Date(alert.date), "dd/MM/yyyy")})
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {upcomingTreatments.length > 0 && (
                <Section
                  title="Chu kỳ điều trị (7 ngày)"
                  icon={<Stethoscope className="h-3.5 w-3.5" />}
                  tone="blue"
                >
                  {upcomingTreatments.map((alert: any) => (
                    <Link key={alert.treatmentId} href={`/cancer-support/patients/${alert.patientId}`}>
                      <Chip tone="blue" highlight={alert.isToday}>
                        {alert.isToday ? "Hôm nay: " : ""}{alert.patientCode} — {alert.medicationName} ({format(new Date(alert.date), "dd/MM")})
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {upcomingFanpostPosts.length > 0 && (
                <Section
                  title="Lịch đăng Fanpage (7 ngày)"
                  icon={<Facebook className="h-3.5 w-3.5" />}
                  tone="sky"
                >
                  {upcomingFanpostPosts.map((alert: any) => (
                    <Link key={alert.postId} href="/fanpage">
                      <Chip tone="sky" highlight={alert.isToday}>
                        {alert.isToday ? "Hôm nay: " : ""}{format(new Date(alert.date), "dd/MM HH:mm")} — {alert.title}
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {warehouseExpiry.length > 0 && (
                <Section
                  title="Hàng kho sắp/đã hết hạn"
                  icon={<Package className="h-3.5 w-3.5" />}
                  tone="red"
                >
                  {warehouseExpiry.map((alert: any) => (
                    <Link key={`${alert.itemId}-${alert.batchCode || ""}`} href="/warehouse">
                      <Chip tone="red" highlight={alert.isExpired}>
                        {alert.isExpired && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        [{alert.itemCode}] {alert.itemName} — HSD: {format(new Date(alert.date), "dd/MM/yyyy")}
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type Tone = "red" | "orange" | "blue" | "sky";

function Section({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: Tone;
  children: React.ReactNode;
}) {
  const toneClass: Record<Tone, string> = {
    red: "text-red-700",
    orange: "text-orange-700",
    blue: "text-blue-700",
    sky: "text-sky-700",
  };
  return (
    <div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5", toneClass[tone])}>
        {icon}
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  tone,
  highlight,
  children,
}: {
  tone: Tone;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  const base: Record<Tone, string> = {
    red: "border-red-200 text-red-800 bg-red-50 hover:bg-red-100",
    orange: "border-orange-200 text-orange-800 bg-orange-50 hover:bg-orange-100",
    blue: "border-blue-200 text-blue-800 bg-blue-50 hover:bg-blue-100",
    sky: "border-sky-200 text-sky-800 bg-sky-50 hover:bg-sky-100",
  };
  const hl: Record<Tone, string> = {
    red: "bg-red-100 border-red-300 font-semibold",
    orange: "bg-orange-100 border-orange-300 font-semibold",
    blue: "bg-blue-100 border-blue-300 font-semibold",
    sky: "bg-sky-100 border-sky-300 font-semibold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs transition-colors cursor-pointer",
        base[tone],
        highlight && hl[tone]
      )}
    >
      {children}
    </span>
  );
}
