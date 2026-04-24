"use client";

import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Helpers cho avatar ký tự
// ────────────────────────────────────────────────────────────────────────────
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Màu avatar tự động deterministic từ tên (giữ pastel, không chói)
const AVATAR_PALETTE = [
  "bg-slate-100 text-slate-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
];

export function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// ────────────────────────────────────────────────────────────────────────────
// Avatar ký tự vòng tròn
// ────────────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className={cn(
        "shrink-0 rounded-full flex items-center justify-center font-medium",
        colorOf(name)
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initialsOf(name)}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Badge D-X (3 ngày nữa, HÔM NAY) — màu slate, không đỏ
// ────────────────────────────────────────────────────────────────────────────
export function DayBadge({
  isToday,
  daysUntil,
  unit = "ngày",
}: {
  isToday: boolean;
  daysUntil: number;
  unit?: string;
}) {
  if (isToday) {
    return (
      <span className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
        Hôm nay
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
      D-{daysUntil}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tier badge (VIP, Thường xuyên, Mới, Tiềm năng)
// ────────────────────────────────────────────────────────────────────────────
export function TierBadge({ tier }: { tier: string }) {
  const label =
    tier === "VIP"
      ? "VIP"
      : tier === "REGULAR"
      ? "Thường xuyên"
      : tier === "NEW"
      ? "Mới"
      : "Tiềm năng";
  const className =
    tier === "VIP"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-white text-muted-foreground";
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] whitespace-nowrap font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}
