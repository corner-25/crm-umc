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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { donorTypeLabels, donorTierLabels, donorTierColors } from "@/types/donor";
import { DonorType, DonorTier } from "@prisma/client";

export default function DonorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["donors", page, search, typeFilter, tierFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(typeFilter && typeFilter !== "ALL" && { type: typeFilter }),
        ...(tierFilter && tierFilter !== "ALL" && { tier: tierFilter }),
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
        <Button asChild>
          <Link href="/donors/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm mới
          </Link>
        </Button>
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
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Cấp độ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Số khoản tài trợ</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.donors?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      data?.donors?.map((donor: any) => (
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
                              className={donorTierColors[donor.tier as DonorTier]}
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
                                onClick={() => {
                                  // TODO: Add delete confirmation dialog
                                  alert("Delete functionality coming soon");
                                }}
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
    </div>
  );
}
