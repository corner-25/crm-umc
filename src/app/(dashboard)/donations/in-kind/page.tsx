"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Check, ArrowRight, FilterX, Search, Download } from "lucide-react";
import { CustomOptionSelect } from "@/components/ui/custom-option-select";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { inKindCategoryLabels } from "@/lib/validations/donation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

export default function InKindDonationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingUsed, setEditingUsed] = useState<string | null>(null);
  const [editUsedQty, setEditUsedQty] = useState("");
  const [editUsedPurpose, setEditUsedPurpose] = useState("");
  const [donorSearch, setDonorSearch] = useState("");
  const [donorSearchDebounced, setDonorSearchDebounced] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDonorSearchDebounced(donorSearch), 400);
    return () => clearTimeout(t);
  }, [donorSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["in-kind-donations", page, donorSearchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (donorSearchDebounced) params.set("donorName", donorSearchDebounced);
      const res = await fetch(`/api/donations/in-kind?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/donations/in-kind/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Đã xóa tài trợ" });
      queryClient.invalidateQueries({ queryKey: ["in-kind-donations"] });
      setDeleteId(null);
    },
    onError: () => toast({ variant: "destructive", title: "Không thể xóa tài trợ" }),
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

  const handleExportExcel = async () => {
    const params = new URLSearchParams({ page: "1", limit: "9999" });
    if (donorSearchDebounced) params.set("donorName", donorSearchDebounced);
    const res = await fetch(`/api/donations/in-kind?${params}`);
    const result = await res.json();
    const rows = result.donations.map((d: any, i: number) => {
      const used = d.usedQuantity || 0;
      const total = d.quantity || 0;
      const status = used <= 0 ? "Đã nhận" : used < total ? "Đang sử dụng" : "Đã sử dụng";
      return {
        "STT": i + 1,
        "Nhà tài trợ": d.donor?.fullName || "",
        "Vật phẩm": d.itemName || "",
        "Danh mục": inKindCategoryLabels[d.category as keyof typeof inKindCategoryLabels] || d.category,
        "Số lượng": total,
        "Đơn vị": d.unit || "",
        "Đã sử dụng": used,
        "Mục đích SD": d.usedPurpose || "",
        "Giá trị ước tính": d.estimatedValue || 0,
        "Trạng thái": status,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tài trợ hiện vật");
    XLSX.writeFile(wb, `tai-tro-hien-vat-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const hasFilter = donorSearch;
  const clearFilters = () => { setDonorSearch(""); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tài trợ hiện vật</h2>
          <p className="text-muted-foreground">Quản lý các khoản tài trợ hiện vật, thiết bị, vật tư</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button asChild>
            <Link href="/donations/in-kind/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Nhà tài trợ</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên..."
                  className="w-48 h-8 text-sm pl-7"
                  value={donorSearch}
                  onChange={(e) => { setDonorSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-8">
                <FilterX className="h-3.5 w-3.5 mr-1" />
                Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Danh sách
            {data?.pagination && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({data.pagination.total} kết quả)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Nhà tài trợ</TableHead>
                      <TableHead className="min-w-[120px]">Vật phẩm</TableHead>
                      <TableHead className="min-w-[100px]">Giá trị</TableHead>
                      <TableHead className="min-w-[180px]">Sử dụng</TableHead>
                      <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="text-right min-w-[100px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.donations?.map((donation: any) => {
                        const used = donation.usedQuantity || 0;
                        const total = donation.quantity || 0;
                        const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                        return (
                          <TableRow key={donation.id}>
                            <TableCell>
                              <Link href={`/donors/${donation.donor.id}`} className="font-medium hover:underline">
                                {donation.donor.fullName}
                              </Link>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                                <Badge variant="secondary" className="text-[10px] mr-1">
                                  {inKindCategoryLabels[donation.category as keyof typeof inKindCategoryLabels]}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{donation.itemName}</div>
                              <div className="text-xs text-muted-foreground">{donation.quantity} {donation.unit}</div>
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              {donation.estimatedValue ? formatCurrency(donation.estimatedValue.toString()) : "—"}
                            </TableCell>
                            <TableCell className="min-w-[180px]">
                              {editingUsed === donation.id ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Input type="number" min={0} max={total} value={editUsedQty} onChange={(e) => setEditUsedQty(e.target.value)} className="h-7 w-20 text-xs" />
                                    <span className="text-xs text-muted-foreground">/ {total} {donation.unit}</span>
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
                                  <div className="space-y-1">
                                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all",
                                          used >= total ? "bg-green-500" : used > 0 ? "bg-amber-400" : "bg-muted-foreground/20"
                                        )}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {used} / {total} {donation.unit}
                                      {donation.usedPurpose && <span className="ml-1">· {donation.usedPurpose}</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {used <= 0 ? (
                                <Badge variant="outline" className="whitespace-nowrap">Đã nhận</Badge>
                              ) : used < total ? (
                                <Badge variant="outline" className="border-amber-400 text-amber-700 whitespace-nowrap">Đang sử dụng</Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700 whitespace-nowrap">Đã sử dụng</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" asChild title="Nhập kho">
                                  <Link href={`/warehouse?import_from=inkind&donation_id=${donation.id}&item_name=${encodeURIComponent(donation.itemName)}&quantity=${donation.quantity}&unit=${encodeURIComponent(donation.unit)}&donor=${encodeURIComponent(donation.donor.fullName)}&category=${donation.category}`}>
                                    <ArrowRight className="h-4 w-4 text-blue-600" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/donations/in-kind/${donation.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(donation.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Trước
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
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
