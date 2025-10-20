"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { DonorForm } from "@/components/donors/donor-form";
import { DonorFormValues } from "@/lib/validations/donor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewDonorPage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (values: DonorFormValues) => {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to create donor");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm nhà tài trợ mới",
      });
      router.push("/donors");
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm nhà tài trợ. Vui lòng thử lại.",
      });
      console.error("Create donor error:", error);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thêm nhà tài trợ mới</h2>
        <p className="text-muted-foreground">
          Điền thông tin nhà tài trợ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhà tài trợ</CardTitle>
          <CardDescription>
            Các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DonorForm
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
