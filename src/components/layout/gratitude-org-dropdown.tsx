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
import { Avatar, TierBadge } from "./alert-item";

interface FoundingAlert {
  donorId: string;
  donorName: string;
  donorType: string;
  tier: string;
  years: number;
  date: string;
  isToday: boolean;
  daysUntil: number;
  businessDaysUntil: number;
}

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
      <DropdownMenuContent align="end" className="w-[420px] p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Ngày thành lập</p>
          <p className="text-xs text-muted-foreground">
            {count > 0 ? `${count} tổ chức trong 5 ngày làm việc tới` : "5 ngày làm việc tới"}
          </p>
        </div>

        {count === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Không có ngày thành lập sắp tới
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {foundings.map((alert) => (
              <Link
                key={alert.donorId}
                href={`/donors/${alert.donorId}`}
                className={cn(
                  "block px-3 py-2.5 border-b last:border-b-0 border-slate-100 hover:bg-slate-50 transition-colors",
                  alert.isToday && "bg-slate-50"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <Avatar name={alert.donorName} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm break-words leading-tight">
                          {alert.donorName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Ngày thành lập {format(new Date(alert.date), "dd/MM")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {alert.years > 0 && (
                          <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800 whitespace-nowrap">
                            {alert.years} năm
                          </span>
                        )}
                        <TierBadge tier={alert.tier} />
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      {alert.isToday ? (
                        <span className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                          Hôm nay
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                          D-{alert.businessDaysUntil} ngày làm việc
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
