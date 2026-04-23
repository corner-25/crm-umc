"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import { TripForm } from "@/components/charity-medicine/trip-form";

export default function EditTripPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/charity-medicine/trips" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Sửa chuyến đi
          </h1>
        </div>
      </div>

      <TripForm tripId={params.id} />
    </div>
  );
}
