"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FoundingAlert {
  donorId: string;
  donorName: string;
  donorType: string;
  tier: string;
  years: number;
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

export function GratitudeOrgDropdown() {
  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/alerts");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000,
  });

  const foundings: FoundingAlert[] = alerts?.foundingAnniversaries || [];
  const count = foundings.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Building2 className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 h-4 min-w-[16px] rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-semibold px-1">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="px-4 py-2.5 border-b">
          <p className="text-sm font-semibold">Tri ân doanh nghiệp / tổ chức</p>
          <p className="text-xs text-muted-foreground">Ngày thành lập trong 7 ngày tới</p>
        </div>

        {count === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Không có ngày thành lập sắp tới
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-2 space-y-1">
            {foundings.map((alert) => (
              <Link
                key={alert.donorId}
                href={`/donors/${alert.donorId}`}
                className={cn(
                  "block rounded-md border px-3 py-2 transition-colors hover:bg-slate-50",
                  alert.isToday ? "border-red-300 bg-red-50" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {alert.isToday && (
                        <span className="inline-flex items-center rounded bg-red-600 px-1.5 py-0 text-[10px] font-semibold text-white">
                          HÔM NAY
                        </span>
                      )}
                      <p className="font-medium text-sm break-words">{alert.donorName}</p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{format(new Date(alert.date), "dd/MM")}</span>
                      {alert.years > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-foreground">{alert.years} năm</span>
                        </>
                      )}
                      {!alert.isToday && (
                        <>
                          <span>·</span>
                          <span>Còn {alert.daysUntil} ngày</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 rounded border border-slate-200 px-1.5 py-0 text-[10px] text-muted-foreground whitespace-nowrap">
                    {tierLabel(alert.tier)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
