"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, FileText, Edit, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Hết hạn",
  TERMINATED: "Đã thanh lý",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
  TERMINATED: "bg-slate-100 text-slate-700",
};

export default function ContractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/contracts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Đã xóa hợp đồng" });
    },
  });

  // Cảnh báo hợp đồng sắp hết hạn trong 30 ngày
  const soonExpiring = data?.contracts?.filter((c: any) => {
    if (c.status !== "ACTIVE" || !c.endDate) return false;
    const end = new Date(c.endDate);
    return isWithinInterval(end, { start: new Date(), end: addDays(new Date(), 30) });
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hợp đồng tài trợ</h2>
          <p className="text-muted-foreground">Quản lý hợp đồng và cam kết tài trợ</p>
        </div>
        <Button asChild>
          <Link href="/contracts/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo hợp đồng
          </Link>
        </Button>
      </div>

      {/* Cảnh báo sắp hết hạn */}
      {soonExpiring.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {soonExpiring.length} hợp đồng sắp hết hạn trong 30 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {soonExpiring.map((c: any) => (
                <Link key={c.id} href={`/contracts/${c.id}/edit`}>
                  <Badge variant="outline" className="border-yellow-400 text-yellow-800 cursor-pointer hover:bg-yellow-100">
                    {c.contractNumber} — {c.donor.fullName} ({format(new Date(c.endDate), "dd/MM/yyyy")})
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số HĐ, nhà tài trợ, mục đích..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số HĐ</TableHead>
                    <TableHead>Nhà tài trợ</TableHead>
                    <TableHead>Ngày ký</TableHead>
                    <TableHead>Hết hạn</TableHead>
                    <TableHead>Giá trị cam kết</TableHead>
                    <TableHead>Mục đích</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.contracts?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Chưa có hợp đồng nào
                      </TableCell>
                    </TableRow>
                  )}
                  {data?.contracts?.map((contract: any) => {
                    const isExpiringSoon = contract.status === "ACTIVE" && contract.endDate &&
                      isWithinInterval(new Date(contract.endDate), { start: new Date(), end: addDays(new Date(), 30) });
                    return (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {contract.contractNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/donors/${contract.donorId}`} className="hover:underline font-medium">
                            {contract.donor.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>{format(new Date(contract.signedDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {contract.endDate ? (
                              <>
                                {isExpiringSoon && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
                                <span className={isExpiringSoon ? "text-yellow-600 font-medium" : ""}>
                                  {format(new Date(contract.endDate), "dd/MM/yyyy")}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">Vô thời hạn</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(contract.committedAmount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {contract.purpose}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[contract.status]}>
                            {statusLabels[contract.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {contract.fileUrl && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/contracts/${contract.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa hợp đồng?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hợp đồng {contract.contractNumber} sẽ bị xóa. Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(contract.id)}>
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Tổng {data.pagination.total} hợp đồng
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                      Trước
                    </Button>
                    <span className="text-sm py-2 px-3">
                      {page} / {data.pagination.totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages}>
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
