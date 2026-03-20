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
import { Plus, Edit, Trash2, Check, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CustomOptionSelect } from "@/components/ui/custom-option-select";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { inKindCategoryLabels } from "@/lib/validations/donation";
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

  const getAutoStatus = (donation: any) => {
    const used = donation.usedQuantity || 0;
    const total = donation.quantity || 0;
    if (used <= 0) return { label: "Đã nhận", color: "bg-blue-100 text-blue-800" };
    if (used < total) return { label: "Đang sử dụng", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Đã sử dụng", color: "bg-green-100 text-green-800" };
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
            Thêm m��i
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
              <div className="rounded-md border overflow-x-auto">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Nhà tài trợ</TableHead>
                      <TableHead className="w-[130px]">Vật phẩm</TableHead>
                      <TableHead className="w-[100px]">Danh mục</TableHead>
                      <TableHead className="w-[100px]">Giá trị</TableHead>
                      <TableHead className="w-[200px]">Sử dụng</TableHead>
                      <TableHead className="w-[80px]">Trạng thái</TableHead>
                      <TableHead className="w-[110px] text-right">Thao tác</TableHead>
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
                      data?.donations?.map((donation: any) => {
                        const status = getAutoStatus(donation);
                        return (
                        <TableRow key={donation.id} className="h-[44px]">
                          <TableCell className="py-1">
                            <Link
                              href={`/donors/${donation.donor.id}`}
                              className="font-medium hover:underline text-sm"
                            >
                              {donation.donor.fullName}
                            </Link>
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="text-sm font-medium truncate">{donation.itemName}</div>
                            <div className="text-xs text-muted-foreground">{donation.quantity} {donation.unit}</div>
                          </TableCell>
                          <TableCell className="py-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {inKindCategoryLabels[donation.category as keyof typeof inKindCategoryLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 text-sm font-semibold">
                            {donation.estimatedValue ? formatCurrency(donation.estimatedValue.toString()) : "—"}
                          </TableCell>
                          <TableCell className="py-1">
                            {editingUsed === donation.id ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Input type="number" min={0} max={donation.quantity} value={editUsedQty} onChange={(e) => setEditUsedQty(e.target.value)} className="h-7 w-16 text-xs" />
                                  <span className="text-[10px] text-muted-foreground">/ {donation.quantity} {donation.unit}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="flex-1">
                                    <CustomOptionSelect
                                      type="inkind_purpose"
                                      value={editUsedPurpose}
                                      onChange={setEditUsedPurpose}
                                      placeholder="Mục đích..."
                                    />
                                  </div>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 shrink-0" onClick={() => updateUsedMutation.mutate({ id: donation.id, usedQuantity: parseInt(editUsedQty) || 0, usedPurpose: editUsedPurpose })}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 -mx-1" onClick={() => startEditUsed(donation)}>
                                <div className="text-sm">
                                  <span className={`${(donation.usedQuantity || 0) > 0 ? "font-medium" : "text-muted-foreground"}`}>
                                    {donation.usedQuantity || 0} / {donation.quantity} {donation.unit}
                                  </span>
                                </div>
                                {donation.usedPurpose && (
                                  <div className="text-xs text-muted-foreground truncate">{donation.usedPurpose}</div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-1">
                            <Badge className={`${status.color} border-0 text-[10px] whitespace-nowrap`}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right py-1">
                            <div className="flex justify-end gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Nhập kho">
                                <Link href={`/warehouse?import_from=inkind&donation_id=${donation.id}&item_name=${encodeURIComponent(donation.itemName)}&quantity=${donation.quantity}&unit=${encodeURIComponent(donation.unit)}&donor=${encodeURIComponent(donation.donor.fullName)}&category=${donation.category}`}>
                                  <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                <Link href={`/donations/in-kind/${donation.id}/edit`}>
                                  <Edit className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setDeleteId(donation.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
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
