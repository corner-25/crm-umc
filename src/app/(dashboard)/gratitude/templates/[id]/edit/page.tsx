"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EmailTemplateForm, EmailTemplateFormValues } from "@/components/emails/email-template-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function EditEmailTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();

  const { data: template, isLoading } = useQuery({
    queryKey: ["email-template", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/emails/templates/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: EmailTemplateFormValues) => {
      const res = await fetch(`/api/emails/templates/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Failed to update template");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã cập nhật mẫu email",
      });
      router.push("/gratitude/templates");
      router.refresh();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật mẫu email. Vui lòng thử lại.",
      });
      console.error("Update template error:", error);
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa mẫu email</h2>
        <p className="text-muted-foreground">
          Cập nhật thông tin mẫu email
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
            defaultValues={template}
            onSubmit={(values) => updateMutation.mutate(values)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
