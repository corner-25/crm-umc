"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DonorForm } from "@/components/donors/donor-form";
import { DonorFormValues } from "@/lib/validations/donor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditDonorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const donorId = params.id as string;

  const { data: donor, isLoading } = useQuery({
    queryKey: ["donor", donorId],
    queryFn: async () => {
      const res = await fetch(`/api/donors/${donorId}`);
      if (!res.ok) throw new Error("Failed to fetch donor");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: DonorFormValues) => {
      const res = await fetch(`/api/donors/${donorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to update donor");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin nhà tài trợ",
      });
      router.push(`/donors/${donorId}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật. Vui lòng thử lại.",
      });
      console.error("Update donor error:", error);
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa nhà tài trợ</h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin {donor?.fullName}
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
            defaultValues={{
              ...donor,
              birthday: donor?.birthday ? new Date(donor.birthday) : null,
              firstDonationDate: donor?.firstDonationDate
                ? new Date(donor.firstDonationDate)
                : null,
            }}
            onSubmit={(values) => updateMutation.mutate(values)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
