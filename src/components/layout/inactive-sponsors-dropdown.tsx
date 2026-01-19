"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Phone, Check, ChevronDown, ChevronUp, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

export function InactiveSponsorsDropdown() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Fetch inactive sponsor notifications
  const { data, isLoading } = useQuery({
    queryKey: ["inactive-sponsors-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/inactive-sponsors");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Check for new inactive sponsors
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
      }
    },
  });

  // Add contact history
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
      toast({
        title: "Đã ghi nhận",
        description: "Đã thêm lịch sử liên hệ",
      });
    },
  });

  // Mark as resolved
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
      toast({
        title: "Đã xử lý",
        description: "Đã đánh dấu thông báo đã xử lý",
      });
    },
  });

  const notifications: InactiveSponsorNotification[] = data?.notifications || [];
  const unresolved = notifications.filter((n) => !n.isResolved);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Không xác định";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <UserX className="h-5 w-5" />
          {unresolved.length > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-orange-500">
              {unresolved.length > 9 ? "9+" : unresolved.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[400px]">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Nhà tài trợ cần kết nối lại</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
          >
            {checkMutation.isPending ? "Đang kiểm tra..." : "Kiểm tra"}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : unresolved.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Không có thông báo mới
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-2">
              {unresolved.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        {notification.donor.fullName}
                      </p>
                      {notification.donor.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {notification.donor.phone}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      {notification.donor.tier === "VIP" ? "VIP" :
                       notification.donor.tier === "REGULAR" ? "Thường xuyên" :
                       notification.donor.tier === "NEW" ? "Mới" : "Tiềm năng"}
                    </Badge>
                  </div>

                  {/* Last donation date */}
                  <p className="text-xs text-muted-foreground">
                    Tài trợ cuối: {formatDate(notification.lastDonationDate)}
                  </p>

                  {/* Contact History Toggle */}
                  <button
                    onClick={() => toggleExpand(notification.id)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    {expandedIds.has(notification.id) ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    Trạng thái liên hệ ({notification.contactHistory.length} lần)
                  </button>

                  {/* Expanded Contact History */}
                  {expandedIds.has(notification.id) && (
                    <div className="space-y-2 pl-2 border-l-2 border-slate-200 ml-1">
                      {notification.contactHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          Chưa có lịch sử liên hệ
                        </p>
                      ) : (
                        notification.contactHistory.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Checkbox checked disabled className="h-3 w-3" />
                            <span>
                              Lần {contact.contactNumber} - {formatDate(contact.contactDate)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => addContactMutation.mutate(notification.id)}
                      disabled={addContactMutation.isPending}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Đã liên hệ
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs h-7"
                      onClick={() => resolveMutation.mutate(notification.id)}
                      disabled={resolveMutation.isPending}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Hoàn tất
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
