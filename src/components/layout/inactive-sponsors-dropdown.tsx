"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Check, ChevronDown, ChevronUp, UserX, RefreshCw } from "lucide-react";
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
          <UserX className="h-5 w-5" />
          {unresolved.length > 0 && (
            <span className="absolute -right-1 -top-1 h-4 min-w-[16px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold px-1">
              {unresolved.length > 9 ? "9+" : unresolved.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b">
          <div>
            <p className="text-sm font-semibold">Cần kết nối lại</p>
            <p className="text-xs text-muted-foreground">NTT lâu chưa tài trợ</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw
              className={cn("h-3 w-3 mr-1", checkMutation.isPending && "animate-spin")}
            />
            {checkMutation.isPending ? "Đang kiểm tra" : "Kiểm tra"}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : unresolved.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Tất cả NTT đang hoạt động
          </div>
        ) : (
          <ScrollArea className="max-h-[460px]">
            <div className="p-2 space-y-1.5">
              {unresolved.map((n) => {
                const days = daysSince(n.lastDonationDate);
                return (
                  <div key={n.id} className="rounded-md border border-slate-200 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{n.donor.fullName}</p>
                        {n.donor.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {n.donor.phone}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded border border-slate-200 px-1.5 py-0 text-[10px] text-muted-foreground">
                        {tierLabel(n.donor.tier)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Tài trợ cuối: {formatDate(n.lastDonationDate)}</span>
                      {days !== null && (
                        <span>· {days} ngày trước</span>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpand(n.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expandedIds.has(n.id) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      Lịch sử liên hệ ({n.contactHistory.length})
                    </button>

                    {expandedIds.has(n.id) && (
                      <div className="space-y-1 pl-2 border-l border-slate-200 ml-1">
                        {n.contactHistory.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">Chưa có liên hệ nào</p>
                        ) : (
                          n.contactHistory.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 text-xs">
                              <Checkbox checked disabled className="h-3 w-3" />
                              <span>Lần {c.contactNumber} — {formatDate(c.contactDate)}</span>
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
                        className="flex-1 text-xs h-7"
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
