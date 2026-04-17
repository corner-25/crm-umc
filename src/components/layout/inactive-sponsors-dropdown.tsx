"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Check, ChevronDown, ChevronUp, UserX, Clock4, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContactHistory {
  id: string;
  contactNumber: number;
  contactDate: string;
  notes: string | null;
}

interface InactiveSponsorNotification {
  id: string;
  donorId: string;
  lastDonationDate: string | null;
  notifiedAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
  donor: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    tier: string;
  };
  contactHistory: ContactHistory[];
}

const tierLabel = (tier: string) => {
  if (tier === "VIP") return "VIP";
  if (tier === "REGULAR") return "Thường xuyên";
  if (tier === "NEW") return "Mới";
  return "Tiềm năng";
};

const tierColor = (tier: string) => {
  if (tier === "VIP") return "bg-amber-100 text-amber-800 border-amber-300";
  if (tier === "REGULAR") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (tier === "NEW") return "bg-sky-100 text-sky-800 border-sky-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
};

export function InactiveSponsorsDropdown() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["inactive-sponsors-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/inactive-sponsors");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 300000,
  });

  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/inactive-sponsors", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to check inactive sponsors");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inactive-sponsors-notifications"] });
      if (data.newNotifications.length > 0) {
        toast({
          title: "Thông báo mới",
          description: `Phát hiện ${data.newNotifications.length} nhà tài trợ không hoạt động`,
        });
      } else {
        toast({
          title: "Đã cập nhật",
          description: "Không có nhà tài trợ nào mới cần kết nối lại",
        });
      }
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(
        `/api/notifications/inactive-sponsors/${notificationId}/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactDate: new Date().toISOString() }),
        }
      );
      if (!res.ok) throw new Error("Failed to add contact");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inactive-sponsors-notifications"] });
      toast({ title: "Đã ghi nhận", description: "Đã thêm lịch sử liên hệ" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(
        `/api/notifications/inactive-sponsors/${notificationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isResolved: true }),
        }
      );
      if (!res.ok) throw new Error("Failed to resolve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inactive-sponsors-notifications"] });
      toast({ title: "Đã xử lý", description: "Đã đánh dấu thông báo đã xử lý" });
    },
  });

  const notifications: InactiveSponsorNotification[] = data?.notifications || [];
  const unresolved = notifications.filter((n) => !n.isResolved);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Không xác định";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  const daysSince = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 86400000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <UserX className={cn("h-5 w-5", unresolved.length > 0 && "text-orange-600")} />
          {unresolved.length > 0 && (
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-orange-600 text-white text-[10px] flex items-center justify-center font-semibold shadow-sm">
              {unresolved.length > 9 ? "9+" : unresolved.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock4 className="h-4 w-4" />
              <div>
                <p className="text-sm font-semibold leading-tight">Cần kết nối lại</p>
                <p className="text-[11px] opacity-90 leading-tight">
                  NTT lâu chưa tài trợ
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => checkMutation.mutate()}
              disabled={checkMutation.isPending}
              className="h-7 px-2 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw
                className={cn(
                  "h-3 w-3 mr-1",
                  checkMutation.isPending && "animate-spin"
                )}
              />
              {checkMutation.isPending ? "Đang kiểm tra" : "Kiểm tra"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : unresolved.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <UserX className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            Tất cả NTT đang hoạt động
          </div>
        ) : (
          <ScrollArea className="max-h-[460px]">
            <div className="p-2 space-y-1.5">
              {unresolved.map((n) => {
                const days = daysSince(n.lastDonationDate);
                return (
                  <div
                    key={n.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {n.donor.fullName}
                        </p>
                        {n.donor.phone && (
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {n.donor.phone}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          tierColor(n.donor.tier)
                        )}
                      >
                        {tierLabel(n.donor.tier)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600">
                        Tài trợ cuối: {formatDate(n.lastDonationDate)}
                      </span>
                      {days !== null && (
                        <span className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 font-medium">
                          {days} ngày
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(n.id)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                    >
                      {expandedIds.has(n.id) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      Lịch sử liên hệ ({n.contactHistory.length})
                    </button>

                    {expandedIds.has(n.id) && (
                      <div className="space-y-1 pl-2 border-l-2 border-slate-200 ml-1">
                        {n.contactHistory.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            Chưa có liên hệ nào
                          </p>
                        ) : (
                          n.contactHistory.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 text-xs text-slate-700">
                              <Checkbox checked disabled className="h-3 w-3" />
                              <span>
                                Lần {c.contactNumber} — {formatDate(c.contactDate)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-7"
                        onClick={() => addContactMutation.mutate(n.id)}
                        disabled={addContactMutation.isPending}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Đã liên hệ
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => resolveMutation.mutate(n.id)}
                        disabled={resolveMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Hoàn tất
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
