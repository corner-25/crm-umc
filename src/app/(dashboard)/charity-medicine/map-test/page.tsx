"use client";

import dynamic from "next/dynamic";

const TphcmWardMap = dynamic(() => import("@/components/charity-medicine/TphcmWardMap"), {
  ssr: false,
  loading: () => <div className="p-6">Đang tải...</div>,
});

export default function MapTestPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">TEST: Bản đồ phường xã TPHCM</h1>
      <TphcmWardMap />
    </div>
  );
}
