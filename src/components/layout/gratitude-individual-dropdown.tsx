"use client";

import { useQuery } from "@tanstack/react-query";
import { Cake, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, DayBadge, TierBadge } from "./alert-item";

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
      <DropdownMenuContent align="end" className="w-[400px] p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Sinh nhật</p>
          <p className="text-xs text-muted-foreground">
            {count > 0 ? `${count} người trong 7 ngày tới` : "7 ngày tới"}
          </p>
        </div>

        {count === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Cake className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Không có sinh nhật sắp tới
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {birthdays.map((alert) => (
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
                        {alert.phone && (
                          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {alert.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <DayBadge isToday={alert.isToday} daysUntil={alert.daysUntil} />
                        <TierBadge tier={alert.tier} />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sinh nhật {format(new Date(alert.date), "dd/MM")}
                    </p>
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
