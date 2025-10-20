"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
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

const templateTypeLabels = {
  THANK_YOU: "Cảm ơn",
  RECEIPT: "Biên nhận",
  BIRTHDAY: "Sinh nhật",
  ANNIVERSARY: "Kỷ niệm",
  REMINDER: "Nhắc nhở",
  NEWSLETTER: "Bản tin",
};

export default function EmailTemplatesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/emails/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/emails/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa mẫu email",
      });
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa mẫu email",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Quản lý mẫu email tri ân
          </p>
        </div>
        <Button asChild>
          <Link href="/gratitude/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo mẫu mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách mẫu email</CardTitle>
          <CardDescription>
            Mẫu email để gửi cho nhà tài trợ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên mẫu</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.templates?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Chưa có mẫu email nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.templates?.map((template: any) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {templateTypeLabels[template.type as keyof typeof templateTypeLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {template.subject}
                        </TableCell>
                        <TableCell>{formatDate(template.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/gratitude/templates/${template.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa mẫu email này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
