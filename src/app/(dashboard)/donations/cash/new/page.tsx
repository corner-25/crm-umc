"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CashDonationForm } from "@/components/donations/cash-donation-form";
import { CashDonationFormValues } from "@/lib/validations/donation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
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

export default function NewCashDonationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [duplicateInfo, setDuplicateInfo] = useState<{
    id: string;
    donorName: string;
    amount: number;
    currency: string;
    receivedDate: string;
  } | null>(null);
  const [pendingValues, setPendingValues] = useState<CashDonationFormValues | null>(null);

  const createMutation = useMutation({
    mutationFn: async ({ values, force = false }: { values: CashDonationFormValues; force?: boolean }) => {
      const res = await fetch("/api/donations/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, force }),
      });

      if (res.status === 409) {
        const data = await res.json();
        throw Object.assign(new Error("DUPLICATE"), { duplicate: data.duplicate });
      }

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
    onError: (error: any) => {
      if (error.message === "DUPLICATE" && error.duplicate) {
        setDuplicateInfo(error.duplicate);
        return;
      }
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm khoản tài trợ. Vui lòng thử lại.",
      });
      console.error("Create donation error:", error);
    },
  });

  const handleSubmit = (values: CashDonationFormValues) => {
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
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Popup cảnh báo trùng lắp */}
      <AlertDialog open={!!duplicateInfo} onOpenChange={() => setDuplicateInfo(null)}>
        <AlertDialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Phát hiện khoản tài trợ trùng lắp!</AlertDialogTitle>
            <AlertDialogDescription>
              Đã có khoản tài trợ của <strong>{duplicateInfo?.donorName}</strong> với số tiền{" "}
              <strong>{duplicateInfo ? formatCurrency(duplicateInfo.amount, duplicateInfo.currency) : ""}</strong>{" "}
              {duplicateInfo?.receivedDate && `(ngày ${format(new Date(duplicateInfo.receivedDate), "dd/MM/yyyy")})`} trong hệ thống.
              Bạn muốn xem khoản đó hay vẫn tiếp tục thêm mới?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => router.push(`/donations/cash`)}
            >
              Xem khoản trùng
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
