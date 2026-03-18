"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, Cake, FileText, Clock, Facebook, Package, Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  const totalAlerts = alerts?.totalAlerts || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={cn("h-5 w-5", totalAlerts > 0 && "text-red-600")} />
          {totalAlerts > 0 && (
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-medium">
              {totalAlerts > 9 ? "9+" : totalAlerts}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {totalAlerts > 0 ? `${totalAlerts} nhắc nhở cần chú ý` : "Không có thông báo"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!alerts || totalAlerts === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Không có thông báo nào
          </div>
        ) : (
          <ScrollArea className="h-[480px]">
            <div className="p-2 space-y-4">

              {/* Sinh nhật */}
              {alerts.birthdays?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <Cake className="h-3 w-3" /> Sinh nhật trong 7 ngày tới
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.birthdays.map((alert: any) => (
                      <Link key={alert.donorId} href={`/donors/${alert.donorId}`}>
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-orange-300 text-orange-800 hover:bg-orange-100",
                            alert.isToday && "bg-orange-200 font-semibold"
                          )}
                        >
                          {alert.isToday ? "Hôm nay: " : ""}{alert.donorName} ({format(new Date(alert.date), "dd/MM")})
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Hợp đồng sắp hết hạn */}
              {alerts.expiringContracts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <FileText className="h-3 w-3" /> Hợp đồng sắp hết hạn (30 ngày)
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.expiringContracts.map((alert: any) => (
                      <Link key={alert.contractId} href={`/contracts/${alert.contractId}/edit`}>
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-orange-300 text-orange-800 hover:bg-orange-100",
                            alert.isUrgent && "bg-red-100 border-red-300 text-red-800"
                          )}
                        >
                          {alert.isUrgent && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          {alert.contractNumber} — {alert.donorName} ({format(new Date(alert.date), "dd/MM/yyyy")})
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Chu kỳ điều trị */}
              {alerts.upcomingTreatments?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <Stethoscope className="h-3 w-3" /> Chu kỳ điều trị trong 7 ngày tới
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.upcomingTreatments.map((alert: any) => (
                      <Link key={alert.treatmentId} href={`/cancer-support/patients/${alert.patientId}`}>
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-orange-300 text-orange-800 hover:bg-orange-100",
                            alert.isToday && "bg-orange-200 font-semibold"
                          )}
                        >
                          {alert.isToday ? "Hôm nay: " : ""}{alert.patientCode} — {alert.medicationName} ({format(new Date(alert.date), "dd/MM")})
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Nhắc nhở quá hạn */}
              {alerts.overdueReminders?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <Clock className="h-3 w-3" /> Nhắc nhở chưa xử lý / quá hạn
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.overdueReminders.map((alert: any) => (
                      <Link key={alert.reminderId} href={`/donors/${alert.donorId}`}>
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-red-300 text-red-800 hover:bg-red-50",
                            alert.isOverdue && "bg-red-100"
                          )}
                        >
                          {alert.isOverdue && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          {alert.donorName}: {alert.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Lịch đăng Fanpage */}
              {alerts.upcomingFanpostPosts?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <Facebook className="h-3 w-3" /> Lịch đăng bài Fanpage (7 ngày tới)
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.upcomingFanpostPosts.map((alert: any) => (
                      <Link key={alert.postId} href="/fanpage">
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-blue-300 text-blue-800 hover:bg-blue-50",
                            alert.isToday && "bg-blue-100 font-semibold"
                          )}
                        >
                          {alert.isToday ? "Hôm nay: " : ""}{format(new Date(alert.date), "dd/MM HH:mm")} — {alert.title}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Hàng kho sắp/đã hết hạn */}
              {alerts.warehouseExpiry?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1 px-1">
                    <Package className="h-3 w-3" /> Hàng kho sắp/đã hết hạn
                  </p>
                  <div className="flex flex-wrap gap-2 px-1">
                    {alerts.warehouseExpiry.map((alert: any) => (
                      <Link key={alert.itemId} href="/warehouse">
                        <Badge
                          variant="outline"
                          className={cn(
                            "cursor-pointer border-orange-300 text-orange-800 hover:bg-orange-50",
                            alert.isExpired && "bg-red-100 border-red-300 text-red-800"
                          )}
                        >
                          {alert.isExpired && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                          [{alert.itemCode}] {alert.itemName} — HSD: {format(new Date(alert.date), "dd/MM/yyyy")}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
