"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports/crm");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Đang chuyển hướng...</p>
    </div>
  );
}
