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
import { Plus, Edit, Trash2, ArrowRight, FilterX, Search, Download, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

export default function InKindDonationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorSearchDebounced, setDonorSearchDebounced] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Add usage dialog
  const [addUsageId, setAddUsageId] = useState<string | null>(null);
  const [addUsageQty, setAddUsageQty] = useState("");
  const [addUsagePurpose, setAddUsagePurpose] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDonorSearchDebounced(donorSearch), 400);
    return () => clearTimeout(t);
  }, [donorSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["in-kind-donations", page, donorSearchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
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

  const addUsageMutation = useMutation({
    mutationFn: async ({ id, newEntry }: { id: string; newEntry: any }) => {
      // Lấy donation hiện tại để đọc usageItems cũ
      const getRes = await fetch(`/api/donations/in-kind/${id}`);
      if (!getRes.ok) throw new Error("Failed to get");
      const donation = await getRes.json();

      const existingItems = Array.isArray(donation.usageItems) ? donation.usageItems : [];
      const updatedItems = [...existingItems, newEntry];

      const res = await fetch(`/api/donations/in-kind/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageItems: updatedItems }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Đã thêm lần sử dụng" });
      queryClient.invalidateQueries({ queryKey: ["in-kind-donations"] });
      setAddUsageId(null);
      setAddUsageQty("");
      setAddUsagePurpose("");
    },
    onError: () => toast({ variant: "destructive", title: "Lỗi", description: "Không thể cập nhật" }),
  });

  const deleteUsageMutation = useMutation({
    mutationFn: async ({ id, usageIdx }: { id: string; usageIdx: number }) => {
      const getRes = await fetch(`/api/donations/in-kind/${id}`);
      if (!getRes.ok) throw new Error("Failed to get");
      const donation = await getRes.json();

      const existingItems = Array.isArray(donation.usageItems) ? donation.usageItems : [];
      const updatedItems = existingItems.filter((_: any, i: number) => i !== usageIdx);

      const res = await fetch(`/api/donations/in-kind/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usageItems: updatedItems }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast({ title: "Đã xoá lần sử dụng" });
      queryClient.invalidateQueries({ queryKey: ["in-kind-donations"] });
    },
    onError: () => toast({ variant: "destructive", title: "Lỗi" }),
  });

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

  const openAddUsage = (donation: any) => {
    setAddUsageId(donation.id);
    setAddUsageQty("");
    setAddUsagePurpose("");
  };

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
                      <TableHead className="min-w-[150px]">Vật phẩm</TableHead>
                      <TableHead className="min-w-[100px]">Giá trị</TableHead>
                      <TableHead className="min-w-[200px]">Sử dụng</TableHead>
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
                        const usageItems: any[] = Array.isArray(donation.usageItems) ? donation.usageItems : [];
                        const allItems: any[] = Array.isArray(donation.items) ? donation.items : [];
                        const isExpanded = expandedId === donation.id;

                        return (
                          <TableRow key={donation.id}>
                            <TableCell>
                              <Link href={`/donors/${donation.donor.id}`} className="font-medium hover:underline">
                                {donation.donor.fullName}
                              </Link>
                              <div className="mt-0.5">
                                <Badge variant="secondary" className="text-[10px]">
                                  {inKindCategoryLabels[donation.category as keyof typeof inKindCategoryLabels]}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              {allItems.length > 0 ? (
                                <div className="space-y-0.5">
                                  {allItems.map((item: any, i: number) => (
                                    <div key={i} className={`text-sm ${i === 0 ? "font-medium" : ""}`}>
                                      {item.name} <span className="text-muted-foreground">x{item.quantity} {item.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <div className="font-medium">{donation.itemName}</div>
                                  <div className="text-xs text-muted-foreground">{donation.quantity} {donation.unit}</div>
                                </>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              {donation.estimatedValue ? formatCurrency(donation.estimatedValue.toString()) : "—"}
                            </TableCell>
                            <TableCell className="min-w-[200px]">
                              <div className="space-y-1">
                                {/* Progress bar */}
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      used >= total ? "bg-green-500" : used > 0 ? "bg-amber-400" : "bg-muted-foreground/20"
                                    )}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {used} / {total} {donation.unit}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-700"
                                      onClick={() => openAddUsage(donation)}
                                    >
                                      <Plus className="h-3 w-3 mr-0.5" />Ghi SD
                                    </Button>
                                    {usageItems.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-muted-foreground"
                                        onClick={() => setExpandedId(isExpanded ? null : donation.id)}
                                      >
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {/* Usage history (expanded) */}
                                {isExpanded && usageItems.length > 0 && (
                                  <div className="mt-1 border rounded p-2 bg-muted/30 space-y-1">
                                    {usageItems.map((u: any, i: number) => (
                                      <div key={i} className="flex items-center justify-between text-xs">
                                        <div>
                                          <span className="font-medium">{u.quantity} {donation.unit}</span>
                                          <span className="text-muted-foreground ml-1">· {u.purpose}</span>
                                          {u.date && <span className="text-muted-foreground ml-1">· {new Date(u.date).toLocaleDateString("vi-VN")}</span>}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                                          onClick={() => deleteUsageMutation.mutate({ id: donation.id, usageIdx: i })}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {used <= 0 ? (
                                <Badge variant="outline" className="whitespace-nowrap">Đã nhận</Badge>
                              ) : used < total ? (
                                <Badge variant="outline" className="border-amber-400 text-amber-700 whitespace-nowrap">Đang SD</Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700 whitespace-nowrap">Đã SD hết</Badge>
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

      {/* Dialog thêm lần sử dụng */}
      <Dialog open={!!addUsageId} onOpenChange={() => setAddUsageId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ghi nhận sử dụng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Số lượng sử dụng</Label>
              <Input
                type="number"
                min={1}
                value={addUsageQty}
                onChange={(e) => setAddUsageQty(e.target.value)}
                placeholder="VD: 50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Mục đích</Label>
              <CustomOptionSelect
                type="inkind_purpose"
                value={addUsagePurpose}
                onChange={(v) => setAddUsagePurpose(v as string)}
                placeholder="Chọn hoặc nhập mục đích..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUsageId(null)}>Huỷ</Button>
            <Button
              disabled={!addUsageQty || !addUsagePurpose || addUsageMutation.isPending}
              onClick={() => {
                if (!addUsageId) return;
                addUsageMutation.mutate({
                  id: addUsageId,
                  newEntry: {
                    quantity: parseInt(addUsageQty) || 0,
                    purpose: addUsagePurpose,
                    date: new Date().toISOString(),
                  },
                });
              }}
            >
              {addUsageMutation.isPending ? "Đang lưu..." : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
