"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { DonorForm } from "@/components/donors/donor-form";
import { DonorFormValues } from "@/lib/validations/donor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NewDonorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [duplicateInfo, setDuplicateInfo] = useState<{ id: string; fullName: string; phone?: string } | null>(null);
  const [pendingValues, setPendingValues] = useState<DonorFormValues | null>(null);

  const createMutation = useMutation({
    mutationFn: async ({ values, force = false }: { values: DonorFormValues; force?: boolean }) => {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, force }),
      });

      if (res.status === 409) {
        const data = await res.json();
        throw Object.assign(new Error("DUPLICATE"), { duplicate: data.duplicate });
      }

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
    onError: (error: any) => {
      if (error.message === "DUPLICATE" && error.duplicate) {
        setDuplicateInfo(error.duplicate);
        return;
      }
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm nhà tài trợ. Vui lòng thử lại.",
      });
      console.error("Create donor error:", error);
    },
  });

  const handleSubmit = (values: DonorFormValues) => {
    setPendingValues(values);
    createMutation.mutate({ values });
  };

  const handleForceCreate = () => {
    if (!pendingValues) return;
    setDuplicateInfo(null);
    createMutation.mutate({ values: pendingValues, force: true });
  };

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
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Popup cảnh báo trùng lắp */}
      <AlertDialog open={!!duplicateInfo} onOpenChange={() => setDuplicateInfo(null)}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Phát hiện trùng lắp!</AlertDialogTitle>
            <AlertDialogDescription>
              Đã tồn tại nhà tài trợ <strong>{duplicateInfo?.fullName}</strong>
              {duplicateInfo?.phone && ` (SĐT: ${duplicateInfo.phone})`} trong hệ thống.
              Bạn muốn xem hồ sơ đó hay vẫn tiếp tục thêm mới?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => router.push(`/donors/${duplicateInfo?.id}`)}
            >
              Xem hồ sơ trùng
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleForceCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Đang lưu..." : "Vẫn thêm mới"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
