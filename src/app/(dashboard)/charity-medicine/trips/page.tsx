"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Search, Pencil, Trash2, Truck, MapPin, Users, Gift, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function TripsListPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: tripData, isLoading } = useQuery({
    queryKey: ["charity-trips"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/trips");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/charity-medicine/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["charity-trips"] });
      qc.invalidateQueries({ queryKey: ["donations-cash-available"] });
      toast({ title: "Đã xoá chuyến đi" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const trips: any[] = tripData?.trips || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter((t) =>
      t.tripCode.toLowerCase().includes(q) ||
      (t.tripName || "").toLowerCase().includes(q) ||
      (t.location?.province || "").toLowerCase().includes(q) ||
      (t.location?.ward || "").toLowerCase().includes(q)
    );
  }, [trips, search]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Chuyến đi từ thiện
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách các chuyến đi — bấm "Tạo chuyến mới" để nhập thông tin đầy đủ
          </p>
        </div>
        <Link href="/charity-medicine/trips/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> Tạo chuyến mới
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Danh sách ({filtered.length})</CardTitle>
            <div className="relative w-72">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã, tên, tỉnh, xã..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Chưa có chuyến đi nào</p>
              <Link href="/charity-medicine/trips/new">
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="h-4 w-4 mr-1" /> Tạo chuyến đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên chuyến</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-center">BN</TableHead>
                  <TableHead className="text-center">NVYT</TableHead>
                  <TableHead className="text-center">Quà</TableHead>
                  <TableHead className="text-right">Kinh phí</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t: any) => {
                  const totalFunding = (t.fundings || []).reduce(
                    (s: number, f: any) => s + Number(f.amount),
                    0
                  );
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.tripCode}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.tripName || "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <div>{t.location?.province}</div>
                            {t.location?.ward && (
                              <div className="text-xs text-muted-foreground">{t.location.ward}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{format(new Date(t.startDate), "dd/MM/yyyy")}</div>
                        <div className="text-xs text-muted-foreground">
                          → {format(new Date(t.endDate), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {t.actualPatients ?? t.expectedPatients ?? "—"}
                        {t.expectedPatients && t.actualPatients == null && (
                          <div className="text-xs text-muted-foreground">(dự kiến)</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {(t.staffs || []).length || "—"}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {(t.gifts || []).length || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {totalFunding > 0
                          ? `${totalFunding.toLocaleString("vi-VN")} VND`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/charity-medicine/trips/${t.id}/edit`}>
                            <Button size="icon" variant="ghost">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Xoá chuyến đi này? Các nguồn tài trợ đã trích sẽ được hoàn trả.")) {
                                deleteMutation.mutate(t.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
