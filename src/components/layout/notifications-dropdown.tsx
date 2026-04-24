"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  FileText,
  Clock,
  Facebook,
  Package,
  Stethoscope,
  X,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AlertLike = Record<string, any>;
type AlertType = "REMINDER" | "CONTRACT" | "TREATMENT" | "FANPAGE" | "WAREHOUSE";

interface DismissItem {
  alertType: AlertType;
  alertKey: string;
}

export function NotificationsDropdown() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const dismissMutation = useMutation({
    mutationFn: async ({ alertType, alertKey }: DismissItem) => {
      const res = await fetch("/api/alerts/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertType, alertKey }),
      });
      if (!res.ok) throw new Error("Dismiss thất bại");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-alerts"] });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const dismissAllMutation = useMutation({
    mutationFn: async (items: DismissItem[]) => {
      await Promise.all(
        items.map((it) =>
          fetch("/api/alerts/dismiss", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(it),
          })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard-alerts"] });
      toast({ title: "Đã đánh dấu tất cả đã đọc" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
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

  const handleDismiss = (alertType: AlertType, alertKey: string) =>
    dismissMutation.mutate({ alertType, alertKey });

  const handleMarkAllRead = () => {
    const all: DismissItem[] = [
      ...overdueReminders.map((a: any) => ({ alertType: "REMINDER" as const, alertKey: a.reminderId })),
      ...expiringContracts.map((a: any) => ({ alertType: "CONTRACT" as const, alertKey: a.contractId })),
      ...upcomingTreatments.map((a: any) => ({ alertType: "TREATMENT" as const, alertKey: a.treatmentId })),
      ...upcomingFanpostPosts.map((a: any) => ({ alertType: "FANPAGE" as const, alertKey: a.postId })),
      ...warehouseExpiry.map((a: any) => ({
        alertType: "WAREHOUSE" as const,
        alertKey: `${a.itemId}-${a.batchCode || ""}`,
      })),
    ];
    if (all.length > 0) dismissAllMutation.mutate(all);
  };

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
      <DropdownMenuContent align="end" className="w-[440px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
          <div>
            <p className="text-sm font-semibold">Thông báo hệ thống</p>
            <p className="text-xs text-muted-foreground">
              {count > 0 ? `${count} mục cần chú ý` : "Không có thông báo"}
            </p>
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={dismissAllMutation.isPending}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Đã đọc tất cả
            </Button>
          )}
        </div>

        {count === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Tất cả đều ổn
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto bg-slate-50/40">
            {overdueReminders.length > 0 && (
              <Section title="Nhắc nhở" icon={<Clock className="h-3.5 w-3.5" />} count={overdueReminders.length}>
                {overdueReminders.map((a: any) => (
                  <AlertCard
                    key={a.reminderId}
                    href={`/donors/${a.donorId}`}
                    urgent={a.isOverdue}
                    icon={<Clock className="h-4 w-4" />}
                    iconColor="slate"
                    title={a.title}
                    subtitle={a.donorName}
                    badge={
                      a.isOverdue
                        ? { label: "Quá hạn", variant: "danger" }
                        : { label: format(new Date(a.date), "dd/MM"), variant: "muted" }
                    }
                    onDismiss={() => handleDismiss("REMINDER", a.reminderId)}
                  />
                ))}
              </Section>
            )}

            {expiringContracts.length > 0 && (
              <Section
                title="Hợp đồng"
                icon={<FileText className="h-3.5 w-3.5" />}
                count={expiringContracts.length}
              >
                {expiringContracts.map((a: any) => (
                  <AlertCard
                    key={a.contractId}
                    href={`/contracts/${a.contractId}/edit`}
                    urgent={a.isUrgent}
                    icon={<FileText className="h-4 w-4" />}
                    iconColor="amber"
                    title={a.contractNumber}
                    subtitle={a.donorName}
                    badge={{
                      label: format(new Date(a.date), "dd/MM"),
                      variant: a.isUrgent ? "danger" : "muted",
                    }}
                    onDismiss={() => handleDismiss("CONTRACT", a.contractId)}
                  />
                ))}
              </Section>
            )}

            {upcomingTreatments.length > 0 && (
              <Section
                title="Điều trị"
                icon={<Stethoscope className="h-3.5 w-3.5" />}
                count={upcomingTreatments.length}
              >
                {upcomingTreatments.map((a: any) => (
                  <AlertCard
                    key={a.treatmentId}
                    href={`/cancer-support/patients/${a.patientId}`}
                    urgent={a.isToday}
                    icon={<Stethoscope className="h-4 w-4" />}
                    iconColor="teal"
                    title={a.medicationName}
                    subtitle={`${a.patientCode}${a.patientName ? ` · ${a.patientName}` : ""}`}
                    badge={{
                      label: a.isToday ? "Hôm nay" : format(new Date(a.date), "dd/MM"),
                      variant: a.isToday ? "danger" : "muted",
                    }}
                    onDismiss={() => handleDismiss("TREATMENT", a.treatmentId)}
                  />
                ))}
              </Section>
            )}

            {upcomingFanpostPosts.length > 0 && (
              <Section
                title="Fanpage"
                icon={<Facebook className="h-3.5 w-3.5" />}
                count={upcomingFanpostPosts.length}
              >
                {upcomingFanpostPosts.map((a: any) => (
                  <AlertCard
                    key={a.postId}
                    href="/fanpage"
                    urgent={a.isToday}
                    icon={<Facebook className="h-4 w-4" />}
                    iconColor="blue"
                    title={a.title}
                    badge={{
                      label: a.isToday
                        ? format(new Date(a.date), "HH:mm")
                        : format(new Date(a.date), "dd/MM HH:mm"),
                      variant: a.isToday ? "danger" : "muted",
                    }}
                    onDismiss={() => handleDismiss("FANPAGE", a.postId)}
                  />
                ))}
              </Section>
            )}

            {warehouseExpiry.length > 0 && (
              <Section
                title="Kho"
                icon={<Package className="h-3.5 w-3.5" />}
                count={warehouseExpiry.length}
              >
                {warehouseExpiry.map((a: any) => {
                  const key = `${a.itemId}-${a.batchCode || ""}`;
                  return (
                    <AlertCard
                      key={key}
                      href="/warehouse"
                      urgent={a.isExpired}
                      icon={<Package className="h-4 w-4" />}
                      iconColor="violet"
                      title={a.itemName}
                      subtitle={`${a.itemCode}${a.batchCode ? ` · Lô ${a.batchCode}` : ""}`}
                      badge={{
                        label: a.isExpired
                          ? "Hết hạn"
                          : format(new Date(a.date), "dd/MM/yy"),
                        variant: a.isExpired ? "danger" : "muted",
                      }}
                      onDismiss={() => handleDismiss("WAREHOUSE", key)}
                    />
                  );
                })}
              </Section>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Section
// ────────────────────────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-1.5 bg-slate-100 border-y border-slate-200">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {icon}
          <span>{title}</span>
        </div>
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-white border border-slate-300 text-[10px] font-semibold text-slate-700 px-1">
          {count}
        </span>
      </div>
      <div className="p-2 space-y-1.5">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AlertCard
// ────────────────────────────────────────────────────────────────────────────
const ICON_COLORS: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-100 text-amber-700",
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
};

const BADGE_VARIANTS: Record<string, string> = {
  danger: "bg-red-600 text-white",
  muted: "bg-white border border-slate-300 text-slate-700",
};

function AlertCard({
  href,
  urgent,
  icon,
  iconColor,
  title,
  subtitle,
  badge,
  onDismiss,
}: {
  href: string;
  urgent?: boolean;
  icon: React.ReactNode;
  iconColor: keyof typeof ICON_COLORS;
  title: string;
  subtitle?: string;
  badge: { label: string; variant: "danger" | "muted" };
  onDismiss: () => void;
}) {
  // Click Link → tự mark-as-read (dismiss) rồi mới navigate
  const handleLinkClick = () => {
    onDismiss();
  };

  return (
    <div
      className={cn(
        "relative flex items-stretch rounded-md border bg-white overflow-hidden transition-shadow hover:shadow-sm",
        urgent ? "border-red-200" : "border-slate-200"
      )}
    >
      {/* Viền trái cảnh báo khi urgent */}
      {urgent && <div className="shrink-0 w-1 bg-red-500" />}

      <Link href={href} onClick={handleLinkClick} className="flex-1 min-w-0 block px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          {/* Icon vòng tròn */}
          <div
            className={cn(
              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              ICON_COLORS[iconColor] || ICON_COLORS.slate
            )}
          >
            {urgent ? <AlertTriangle className="h-4 w-4 text-red-600" /> : icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight truncate">{title}</p>
              <span
                className={cn(
                  "shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                  BADGE_VARIANTS[badge.variant]
                )}
              >
                {badge.label}
              </span>
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Nút dismiss — cột riêng bên phải, luôn hiện */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="shrink-0 w-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 border-l border-slate-100 transition-colors"
        title="Đánh dấu đã đọc"
        aria-label="Đánh dấu đã đọc"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
