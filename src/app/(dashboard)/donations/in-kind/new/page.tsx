"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { InKindDonationForm } from "@/components/donations/in-kind-donation-form";
import { InKindDonationFormValues } from "@/lib/validations/donation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewInKindDonationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (values: InKindDonationFormValues) => {
      const res = await fetch("/api/donations/in-kind", {
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
        description: "Đã thêm khoản tài trợ hiện vật mới",
      });
      router.push("/donations/in-kind");
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
        <h2 className="text-3xl font-bold tracking-tight">Thêm tài trợ hiện vật</h2>
        <p className="text-muted-foreground">
          Ghi nhận khoản tài trợ thiết bị, vật tư, hàng hóa
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
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
