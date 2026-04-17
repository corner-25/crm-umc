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
            <span className="absolute -right-1 -top-1 h-4 min-w-[16px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold px-1">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="px-4 py-2.5 border-b">
          <p className="text-sm font-semibold">Thông báo hệ thống</p>
          <p className="text-xs text-muted-foreground">
            {count > 0 ? `${count} mục cần chú ý` : "Không có thông báo"}
          </p>
        </div>

        {count === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Tất cả đều ổn
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="p-3 space-y-4">
              {overdueReminders.length > 0 && (
                <Section title="Nhắc nhở chưa xử lý" icon={<Clock className="h-3.5 w-3.5" />}>
                  {overdueReminders.map((alert: any) => (
                    <Link key={alert.reminderId} href={`/donors/${alert.donorId}`}>
                      <Chip highlight={alert.isOverdue}>
                        {alert.isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {alert.donorName}: {alert.title}
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {expiringContracts.length > 0 && (
                <Section title="Hợp đồng sắp hết hạn (30 ngày)" icon={<FileText className="h-3.5 w-3.5" />}>
                  {expiringContracts.map((alert: any) => (
                    <Link key={alert.contractId} href={`/contracts/${alert.contractId}/edit`}>
                      <Chip highlight={alert.isUrgent}>
                        {alert.isUrgent && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {alert.contractNumber} — {alert.donorName} ({format(new Date(alert.date), "dd/MM/yyyy")})
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {upcomingTreatments.length > 0 && (
                <Section title="Chu kỳ điều trị (7 ngày)" icon={<Stethoscope className="h-3.5 w-3.5" />}>
                  {upcomingTreatments.map((alert: any) => (
                    <Link key={alert.treatmentId} href={`/cancer-support/patients/${alert.patientId}`}>
                      <Chip highlight={alert.isToday}>
                        {alert.isToday ? "Hôm nay: " : ""}{alert.patientCode} — {alert.medicationName} ({format(new Date(alert.date), "dd/MM")})
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {upcomingFanpostPosts.length > 0 && (
                <Section title="Lịch đăng Fanpage (7 ngày)" icon={<Facebook className="h-3.5 w-3.5" />}>
                  {upcomingFanpostPosts.map((alert: any) => (
                    <Link key={alert.postId} href="/fanpage">
                      <Chip highlight={alert.isToday}>
                        {alert.isToday ? "Hôm nay: " : ""}{format(new Date(alert.date), "dd/MM HH:mm")} — {alert.title}
                      </Chip>
                    </Link>
                  ))}
                </Section>
              )}

              {warehouseExpiry.length > 0 && (
                <Section title="Hàng kho sắp/đã hết hạn" icon={<Package className="h-3.5 w-3.5" />}>
                  {warehouseExpiry.map((alert: any) => (
                    <Link key={`${alert.itemId}-${alert.batchCode || ""}`} href="/warehouse">
                      <Chip highlight={alert.isExpired}>
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

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  highlight,
  children,
}: {
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-slate-200 px-2 py-0.5 text-xs text-foreground hover:bg-slate-50 cursor-pointer transition-colors",
        highlight && "border-slate-400 bg-slate-50 font-medium"
      )}
    >
      {children}
    </span>
  );
}
