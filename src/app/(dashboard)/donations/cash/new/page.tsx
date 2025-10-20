"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CashDonationForm } from "@/components/donations/cash-donation-form";
import { CashDonationFormValues } from "@/lib/validations/donation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewCashDonationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (values: CashDonationFormValues) => {
      const res = await fetch("/api/donations/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to create donation");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm khoản tài trợ mới",
      });
      router.push("/donations/cash");
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm khoản tài trợ. Vui lòng thử lại.",
      });
      console.error("Create donation error:", error);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thêm tài trợ tiền mặt</h2>
        <p className="text-muted-foreground">
          Ghi nhận khoản tài trợ tiền mặt/chuyển khoản
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
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
