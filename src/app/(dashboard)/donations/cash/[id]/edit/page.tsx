"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CashDonationForm, CashDonationFormValues } from "@/components/donations/cash-donation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditCashDonationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const { data: donation, isLoading } = useQuery({
    queryKey: ["cash-donation", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/donations/cash/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: CashDonationFormValues) => {
      const res = await fetch(`/api/donations/cash/${params.id}`, {
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
        description: "Đã cập nhật tài trợ tiền mặt",
      });
      router.push("/donations/cash");
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
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa tài trợ tiền mặt</h2>
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
          <CashDonationForm
            defaultValues={{
              donorId: donation.donorId,
              amount: donation.amount.toString(),
              date: new Date(donation.date),
              method: donation.method,
              transactionId: donation.transactionId || "",
              purpose: donation.purpose || "",
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
