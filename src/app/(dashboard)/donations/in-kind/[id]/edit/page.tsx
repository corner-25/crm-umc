"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { InKindDonationForm, InKindDonationFormValues } from "@/components/donations/in-kind-donation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditInKindDonationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const { data: donation, isLoading } = useQuery({
    queryKey: ["in-kind-donation", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/donations/in-kind/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: InKindDonationFormValues) => {
      const res = await fetch(`/api/donations/in-kind/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật tài trợ hiện vật",
      });
      router.push("/donations/in-kind");
      router.refresh();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật tài trợ",
      });
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa tài trợ hiện vật</h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin tài trợ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài trợ</CardTitle>
          <CardDescription>
            Các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InKindDonationForm
            defaultValues={{
              donorId: donation.donorId,
              itemName: donation.itemName,
              category: donation.category,
              quantity: donation.quantity.toString(),
              unit: donation.unit,
              condition: donation.condition,
              estimatedValue: donation.estimatedValue.toString(),
              date: new Date(donation.date),
              expiryDate: donation.expiryDate ? new Date(donation.expiryDate) : undefined,
              storageLocation: donation.storageLocation || "",
              distributionStatus: donation.distributionStatus,
              notes: donation.notes || "",
            }}
            onSubmit={(values) => updateMutation.mutate(values)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
