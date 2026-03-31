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
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-red-500" />
        <div>
          <h1 className="text-xl font-bold">Bản đồ hoạt động từ thiện</h1>
          <p className="text-muted-foreground text-sm">Phân bổ chuyến đi theo tỉnh thành</p>
        </div>
      </div>
      <VietnamMapWidget />
    </div>
  );
}
