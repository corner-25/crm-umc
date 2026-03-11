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
import { Plus, Edit, Trash2, FilterX, Zap, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { donationStatusLabels, paymentMethodLabels } from "@/lib/validations/donation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SortableTableHead } from "@/components/ui/sortable-table-head";

export default function CashDonationsPage() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasRemaining, setHasRemaining] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorSearchDebounced, setDonorSearchDebounced] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" | null }>({ key: "", dir: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDonorSearchDebounced(donorSearch), 400);
    return () => clearTimeout(t);
  }, [donorSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["cash-donations", page, fromDate, toDate, hasRemaining, donorSearchDebounced, sort],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (hasRemaining) params.set("hasRemaining", "true");
      if (donorSearchDebounced) params.set("donorName", donorSearchDebounced);
      if (sort.key && sort.dir) {
        params.set("sortBy", sort.key);
        params.set("sortDir", sort.dir);
      }
      const res = await fetch(`/api/donations/cash?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/donations/cash/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Đã xóa tài trợ" });
      queryClient.invalidateQueries({ queryKey: ["cash-donations"] });
      setDeleteId(null);
    },
    onError: () => toast({ variant: "destructive", title: "Không thể xóa tài trợ" }),
  });

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: "", dir: null };
    });
  };


  const hasFilter = fromDate || toDate || hasRemaining || donorSearch;

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setHasRemaining(false);
    setDonorSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tài trợ tiền mặt</h2>
          <p className="text-muted-foreground">Quản lý các khoản tài trợ tiền mặt, chuyển khoản</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/donations/cash/quick">
              <Zap className="mr-2 h-4 w-4 text-amber-500" />
              Nhập nhanh
            </Link>
          </Button>
          <Button asChild>
            <Link href="/donations/cash/new">
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
            <div className="space-y-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                className="w-40 h-8 text-sm"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                className="w-40 h-8 text-sm"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              />
            </div>
            <button
              onClick={() => { setHasRemaining(!hasRemaining); setPage(1); }}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                hasRemaining
                  ? "border-amber-400 bg-amber-50 text-amber-700"
                  : "border-input bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <span className={cn(
                "inline-block h-2 w-2 rounded-full",
                hasRemaining ? "bg-amber-500" : "bg-muted-foreground/40"
              )} />
              Còn số dư
            </button>
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
                      <SortableTableHead sortKey="donor" currentSort={sort} onSort={handleSort} className="min-w-[160px]">
                        Nhà tài trợ
                      </SortableTableHead>
                      <SortableTableHead sortKey="amount" currentSort={sort} onSort={handleSort} className="min-w-[120px]">
                        Số tiền
                      </SortableTableHead>
                      <TableHead className="min-w-[150px]">Sử dụng</TableHead>
                      <SortableTableHead sortKey="remaining" currentSort={sort} onSort={handleSort} className="min-w-[100px]">
                        Còn lại
                      </SortableTableHead>
                      <SortableTableHead sortKey="receivedDate" currentSort={sort} onSort={handleSort} className="min-w-[90px]">
                        Ngày nhận
                      </SortableTableHead>
                      <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                      <TableHead className="text-right min-w-[80px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.donations.map((donation: any) => {
                        const amount = Number(donation.amount);
                        const used = Number(donation.usedAmount || 0);
                        const remaining = amount - used;
                        return (
                          <TableRow key={donation.id}>
                            <TableCell>
                              <Link href={`/donors/${donation.donor.id}`} className="font-medium hover:underline">
                                {donation.donor.fullName}
                              </Link>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                                {donation.purpose}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold whitespace-nowrap">
                              {formatCurrency(donation.amount.toString(), donation.currency)}
                            </TableCell>
                            <TableCell className="min-w-[160px]">
                              <div className="space-y-1">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      used >= amount ? "bg-green-500" : used > 0 ? "bg-amber-400" : "bg-muted-foreground/20"
                                    )}
                                    style={{ width: `${Math.min((used / amount) * 100, 100)}%` }}
                                  />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(used.toString(), donation.currency)} / {formatCurrency(amount.toString(), donation.currency)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap font-medium">
                              {remaining > 0 ? formatCurrency(remaining.toString(), donation.currency) : "—"}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{formatDate(donation.receivedDate)}</TableCell>
                            <TableCell>
                              {used <= 0 ? (
                                <Badge variant="outline" className="whitespace-nowrap">Đã nhận</Badge>
                              ) : used < amount ? (
                                <Badge variant="outline" className="border-amber-400 text-amber-700 whitespace-nowrap">Dùng một phần</Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-700 whitespace-nowrap">Đã dùng hết</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/donations/cash/${donation.id}/edit`}>
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
              Bạn có chắc chắn muốn xóa tài trợ này? Hành động này không thể hoàn tác.
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
