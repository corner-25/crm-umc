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
import { Plus, Edit, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { inKindCategoryLabels, distributionStatusLabels } from "@/lib/validations/donation";
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

export default function InKindDonationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUsed, setEditingUsed] = useState<string | null>(null);
  const [editUsedQty, setEditUsedQty] = useState("");
  const [editUsedPurpose, setEditUsedPurpose] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["in-kind-donations", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      const res = await fetch(`/api/donations/in-kind?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/donations/in-kind/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa tài trợ",
      });
      queryClient.invalidateQueries({ queryKey: ["in-kind-donations"] });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa tài trợ",
      });
    },
  });

  const updateUsedMutation = useMutation({
    mutationFn: async ({ id, usedQuantity, usedPurpose }: { id: string; usedQuantity: number; usedPurpose: string }) => {
      const res = await fetch(`/api/donations/in-kind/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usedQuantity, usedPurpose }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Đã cập nhật" });
      queryClient.invalidateQueries({ queryKey: ["in-kind-donations"] });
      setEditingUsed(null);
    },
    onError: () => toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật" }),
  });

  const startEditUsed = (d: any) => {
    setEditingUsed(d.id);
    setEditUsedQty((d.usedQuantity || 0).toString());
    setEditUsedPurpose(d.usedPurpose || "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tài trợ hiện vật</h2>
          <p className="text-muted-foreground">
            Quản lý các khoản tài trợ hiện vật, thiết bị, vật tư
          </p>
        </div>
        <Button asChild>
          <Link href="/donations/in-kind/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tài trợ hiện vật</CardTitle>
          <CardDescription>
            Tất cả các khoản tài trợ bằng hiện vật
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
                      <TableHead>Nhà tài trợ</TableHead>
                      <TableHead>Vật phẩm</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Số lượng</TableHead>
                      <TableHead>Đã sử dụng</TableHead>
                      <TableHead>Mục đích SD</TableHead>
                      <TableHead>Giá trị ước tính</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
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
                          <TableCell className="font-medium">
                            {donation.itemName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {inKindCategoryLabels[donation.category as keyof typeof inKindCategoryLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {donation.quantity} {donation.unit}
                          </TableCell>
                          <TableCell>
                            {editingUsed === donation.id ? (
                              <div className="flex items-center gap-1">
                                <Input type="number" min={0} max={donation.quantity} value={editUsedQty} onChange={(e) => setEditUsedQty(e.target.value)} className="h-7 w-20 text-xs" />
                                <span className="text-xs text-muted-foreground">{donation.unit}</span>
                              </div>
                            ) : (
                              <span className={`cursor-pointer hover:underline ${(donation.usedQuantity || 0) > 0 ? "font-medium" : "text-muted-foreground"}`} onClick={() => startEditUsed(donation)}>
                                {donation.usedQuantity || 0} / {donation.quantity} {donation.unit}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {editingUsed === donation.id ? (
                              <div className="flex items-center gap-1">
                                <Input value={editUsedPurpose} onChange={(e) => setEditUsedPurpose(e.target.value)} placeholder="VD: Phát cho BN..." className="h-7 text-xs" />
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => updateUsedMutation.mutate({ id: donation.id, usedQuantity: parseInt(editUsedQty) || 0, usedPurpose: editUsedPurpose })}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className={`text-sm cursor-pointer hover:underline ${donation.usedPurpose ? "" : "text-muted-foreground italic"}`} onClick={() => startEditUsed(donation)}>
                                {donation.usedPurpose || "Chưa ghi"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {donation.estimatedValue ? formatCurrency(donation.estimatedValue.toString()) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/donations/in-kind/${donation.id}/edit`}>
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
              Bạn có chắc chắn muốn xóa tài trợ hiện vật này? Hành động này không thể hoàn tác.
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
