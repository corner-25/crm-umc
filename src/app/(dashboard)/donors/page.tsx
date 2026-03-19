"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, Zap } from "lucide-react";
import Link from "next/link";
import { donorTypeLabels, donorTierLabels, donorTierColors } from "@/types/donor";
import { DonorType, DonorTier } from "@prisma/client";
import { useQueryClient } from "@tanstack/react-query";
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
import { SortableTableHead } from "@/components/ui/sortable-table-head";

export default function DonorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [deletingDonor, setDeletingDonor] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" | null }>({ key: "", dir: null });
  const queryClient = useQueryClient();

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/donors/${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["donors"] });
      }
    } finally {
      setIsDeleting(false);
      setDeletingDonor(null);
    }
  }

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: "", dir: null };
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ["donors", page, search, typeFilter, tierFilter, sort],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(typeFilter && typeFilter !== "ALL" && { type: typeFilter }),
        ...(tierFilter && tierFilter !== "ALL" && { tier: tierFilter }),
        ...(sort.key && sort.dir ? { sortBy: sort.key, sortDir: sort.dir } : {}),
      });
      const res = await fetch(`/api/donors?${params}`);
      if (!res.ok) throw new Error("Failed to fetch donors");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nhà tài trợ</h2>
          <p className="text-muted-foreground">
            Quản lý danh sách nhà tài trợ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/donations/cash/quick">
              <Zap className="mr-2 h-4 w-4 text-amber-500" />
              Nhập nhanh tài trợ
            </Link>
          </Button>
          <Button asChild>
            <Link href="/donors/new">
              <Plus className="mr-2 h-4 w-4" />
              Thêm mới
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc nhà tài trợ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Loại nhà tài trợ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả loại</SelectItem>
                {Object.entries(donorTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Cấp độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả cấp độ</SelectItem>
                {Object.entries(donorTierLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">Đang tải...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead sortKey="fullName" currentSort={sort} onSort={handleSort}>
                        Họ tên
                      </SortableTableHead>
                      <SortableTableHead sortKey="type" currentSort={sort} onSort={handleSort}>
                        Loại
                      </SortableTableHead>
                      <SortableTableHead sortKey="tier" currentSort={sort} onSort={handleSort} className="min-w-[120px]">
                        Cấp độ
                      </SortableTableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <SortableTableHead sortKey="donations" currentSort={sort} onSort={handleSort}>
                        Số khoản tài trợ
                      </SortableTableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.donors.map((donor: any) => (
                        <TableRow key={donor.id}>
                          <TableCell className="font-medium">
                            {donor.fullName}
                          </TableCell>
                          <TableCell>
                            {donorTypeLabels[donor.type as DonorType]}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`whitespace-nowrap ${donorTierColors[donor.tier as DonorTier]}`}
                            >
                              {donorTierLabels[donor.tier as DonorTier]}
                            </Badge>
                          </TableCell>
                          <TableCell>{donor.email || "—"}</TableCell>
                          <TableCell>{donor.phone || "—"}</TableCell>
                          <TableCell>
                            {donor._count.cashDonations +
                              donor._count.inKindDonations +
                              donor._count.volunteerDonations}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/donors/${donor.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/donors/${donor.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingDonor({ id: donor.id, name: donor.fullName })}
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
                    Hiển thị {data.donors.length} / {data.pagination.total} kết quả
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
      <AlertDialog open={!!deletingDonor} onOpenChange={(open) => !open && setDeletingDonor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá nhà tài trợ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá <strong>{deletingDonor?.name}</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingDonor && handleDelete(deletingDonor.id)}
            >
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
