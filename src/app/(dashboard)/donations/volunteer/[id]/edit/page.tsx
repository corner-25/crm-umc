"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { VolunteerDonationForm, VolunteerDonationFormValues } from "@/components/donations/volunteer-donation-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditVolunteerDonationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const { data: donation, isLoading } = useQuery({
    queryKey: ["volunteer-donation", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/donations/volunteer/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: VolunteerDonationFormValues) => {
      const res = await fetch(`/api/donations/volunteer/${params.id}`, {
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
        description: "Đã cập nhật tài trợ tình nguyện",
      });
      router.push("/donations/volunteer");
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
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa tài trợ tình nguyện</h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin hoạt động tình nguyện
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tình nguyện</CardTitle>
          <CardDescription>
            Các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VolunteerDonationForm
            defaultValues={{
              donorId: donation.donorId,
              workType: donation.workType,
              skills: donation.skills || "",
              startDate: new Date(donation.startDate),
              endDate: new Date(donation.endDate),
              hours: donation.hours.toString(),
              hourlyRate: donation.hourlyRate.toString(),
              rating: donation.rating || 0,
              reviewNotes: donation.reviewNotes || "",
            }}
            onSubmit={(values) => updateMutation.mutate(values)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
