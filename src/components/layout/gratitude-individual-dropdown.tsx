"use client";

import { useQuery } from "@tanstack/react-query";
import { Cake } from "lucide-react";
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

interface BirthdayAlert {
  donorId: string;
  donorName: string;
  tier: string;
  phone: string | null;
  email: string | null;
  date: string;
  isToday: boolean;
  daysUntil: number;
}

const tierLabel = (tier: string) => {
  if (tier === "VIP") return "VIP";
  if (tier === "REGULAR") return "Thường xuyên";
  if (tier === "NEW") return "Mới";
  return "Tiềm năng";
};

export function GratitudeIndividualDropdown() {
  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const birthdays: BirthdayAlert[] = alerts?.birthdays || [];
  const count = birthdays.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Cake className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 h-4 min-w-[16px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold px-1">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="px-4 py-2.5 border-b">
          <p className="text-sm font-semibold">Tri ân nhà tài trợ cá nhân</p>
          <p className="text-xs text-muted-foreground">Sinh nhật trong 7 ngày tới</p>
        </div>

        {count === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Không có sinh nhật sắp tới
          </div>
        ) : (
          <ScrollArea className="max-h-[440px]">
            <div className="p-2 space-y-1">
              {birthdays.map((alert) => (
                <Link
                  key={alert.donorId}
                  href={`/donors/${alert.donorId}`}
                  className={cn(
                    "block rounded-md border px-3 py-2 transition-colors hover:bg-slate-50",
                    alert.isToday ? "border-slate-400 bg-slate-50" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {alert.isToday && (
                          <span className="inline-flex items-center rounded border border-slate-300 bg-white px-1.5 py-0 text-[10px] font-semibold text-slate-700">
                            HÔM NAY
                          </span>
                        )}
                        <p className="font-medium text-sm truncate">{alert.donorName}</p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(alert.date), "dd/MM")}</span>
                        {!alert.isToday && (
                          <>
                            <span>·</span>
                            <span>Còn {alert.daysUntil} ngày</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded border border-slate-200 px-1.5 py-0 text-[10px] text-muted-foreground">
                      {tierLabel(alert.tier)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
