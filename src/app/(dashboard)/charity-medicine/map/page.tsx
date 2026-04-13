"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const VietnamMapWidget = dynamic(
  () => import("@/components/charity-medicine/VietnamMapWidget"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Đang tải bản đồ...
      </div>
    ),
  }
);

export default function VietnamMapPage() {
  return (
    <div className="p-4 space-y-2 h-screen flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 flex-shrink-0">
        <MapPin className="h-5 w-5 text-red-500" />
        <div>
          <h1 className="text-lg font-bold leading-tight">Bản đồ hoạt động từ thiện</h1>
          <p className="text-muted-foreground text-xs">Phân bổ chuyến đi theo tỉnh thành</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <VietnamMapWidget />
      </div>
    </div>
  );
}
