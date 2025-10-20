"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { VolunteerDonationForm } from "@/components/donations/volunteer-donation-form";
import { VolunteerDonationFormValues } from "@/lib/validations/donation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewVolunteerDonationPage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (values: VolunteerDonationFormValues) => {
      const res = await fetch("/api/donations/volunteer", {
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
        description: "Đã thêm hoạt động tình nguyện mới",
      });
      router.push("/donations/volunteer");
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm hoạt động tình nguyện. Vui lòng thử lại.",
      });
      console.error("Create donation error:", error);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thêm công tác tình nguyện</h2>
        <p className="text-muted-foreground">
          Ghi nhận hoạt động tình nguyện và đóng góp công sức
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hoạt động</CardTitle>
          <CardDescription>
            Các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerDonationForm
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
