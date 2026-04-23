"use client";

import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { TripForm } from "@/components/charity-medicine/trip-form";

export default function NewTripPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/charity-medicine/trips" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Tạo chuyến đi mới
          </h1>
          <p className="text-sm text-muted-foreground">
            Mã chuyến sẽ được tự sinh sau khi lưu (TT-YYYY-XXX)
          </p>
        </div>
      </div>

      <TripForm />
    </div>
  );
}
