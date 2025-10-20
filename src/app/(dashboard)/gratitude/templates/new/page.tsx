"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { EmailTemplateForm, EmailTemplateFormValues } from "@/components/emails/email-template-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (values: EmailTemplateFormValues) => {
      const res = await fetch("/api/emails/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to create template");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo mẫu email mới",
      });
      router.push("/gratitude/templates");
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo mẫu email. Vui lòng thử lại.",
      });
      console.error("Create template error:", error);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tạo mẫu email mới</h2>
        <p className="text-muted-foreground">
          Tạo mẫu email để gửi cho nhà tài trợ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin mẫu email</CardTitle>
          <CardDescription>
            Các trường đánh dấu (*) là bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateForm
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
