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
import { Plus, Star, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { volunteerWorkTypeLabels } from "@/lib/validations/donation";
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

export default function VolunteerDonationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["volunteer-donations", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/donations/volunteer?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/donations/volunteer/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa hoạt động tình nguyện",
      });
      queryClient.invalidateQueries({ queryKey: ["volunteer-donations"] });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa hoạt động tình nguyện",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Công tác tình nguyện</h2>
          <p className="text-muted-foreground">
            Quản lý các hoạt động tình nguyện và đóng góp công sức
          </p>
        </div>
        <Button asChild>
          <Link href="/donations/volunteer/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách công tác tình nguyện</CardTitle>
          <CardDescription>
            Tất cả các hoạt động tình nguyện
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tình nguyện viên</TableHead>
                      <TableHead>Loại công việc</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Số giờ</TableHead>
                      <TableHead>Giá trị quy đổi</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.donations?.map((donation: any) => (
                        <TableRow key={donation.id}>
                          <TableCell>
                            <Link
                              href={`/donors/${donation.donor.id}`}
                              className="font-medium hover:underline"
                            >
                              {donation.donor.fullName}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {volunteerWorkTypeLabels[donation.workType as keyof typeof volunteerWorkTypeLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(donation.startDate)} - {formatDate(donation.endDate)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {donation.hours} giờ
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(donation.totalValue.toString())}
                          </TableCell>
                          <TableCell>
                            {donation.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span>{donation.rating}/5</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Chưa đánh giá</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/donations/volunteer/${donation.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(donation.id)}
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

              {data?.pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Hiển thị {data.donations.length} / {data.pagination.total} kết quả
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa hoạt động tình nguyện này? Hành động này không thể hoàn tác.
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
