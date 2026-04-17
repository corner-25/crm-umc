"use client";

import { useQuery } from "@tanstack/react-query";
import { Cake, Gift, Sparkles } from "lucide-react";
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

const tierColor = (tier: string) => {
  if (tier === "VIP") return "bg-amber-100 text-amber-800 border-amber-300";
  if (tier === "REGULAR") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (tier === "NEW") return "bg-sky-100 text-sky-800 border-sky-300";
  return "bg-slate-100 text-slate-700 border-slate-300";
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
          <Cake className={cn("h-5 w-5", count > 0 && "text-pink-600")} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-pink-600 text-white text-[10px] flex items-center justify-center font-semibold shadow-sm">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <div>
              <p className="text-sm font-semibold leading-tight">Tri ân nhà tài trợ cá nhân</p>
              <p className="text-[11px] opacity-90 leading-tight">
                Sinh nhật trong 7 ngày tới
              </p>
            </div>
          </div>
        </div>

        {count === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <Gift className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            Không có sinh nhật sắp tới
          </div>
        ) : (
          <ScrollArea className="max-h-[440px]">
            <div className="p-2 space-y-1.5">
              {birthdays.map((alert) => (
                <Link
                  key={alert.donorId}
                  href={`/donors/${alert.donorId}`}
                  className={cn(
                    "block rounded-lg border px-3 py-2.5 transition-colors hover:bg-slate-50",
                    alert.isToday
                      ? "border-pink-300 bg-pink-50/70"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {alert.isToday && (
                          <span className="inline-flex items-center rounded-full bg-pink-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            HÔM NAY
                          </span>
                        )}
                        <p className="font-medium text-sm text-slate-900 truncate">
                          {alert.donorName}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Cake className="h-3 w-3" />
                          {format(new Date(alert.date), "dd/MM")}
                        </span>
                        {!alert.isToday && (
                          <span className="text-slate-400">•</span>
                        )}
                        {!alert.isToday && (
                          <span className="text-pink-700 font-medium">
                            Còn {alert.daysUntil} ngày
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        tierColor(alert.tier)
                      )}
                    >
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
