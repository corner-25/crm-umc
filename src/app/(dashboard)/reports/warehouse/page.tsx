"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { FileSpreadsheet, Package, PackagePlus, PackageMinus, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const CATEGORIES: Record<string, string> = {
  FOOD: "Thực phẩm",
  MEDICINE: "Thuốc / Vật tư y tế",
  GIFT: "Quà tặng",
  EQUIPMENT: "Thiết bị",
  OTHER: "Khác",
};

function isExpired(item: any) {
  if (!item.expiryDate) return false;
  return new Date(item.expiryDate) < new Date();
}

function isExpiringSoon(item: any) {
  if (!item.expiryDate) return false;
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  return new Date(item.expiryDate) <= in30 && !isExpired(item);
}

function isLowStock(item: any) {
  return item.minQuantity > 0 && item.currentQuantity <= item.minQuantity;
}

export default function WarehouseReportPage() {
  const { toast } = useToast();

  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txType, setTxType] = useState("all");

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["warehouse-report-items"],
    queryFn: async () => {
      const res = await fetch("/api/warehouse/items");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["warehouse-report-tx", txFrom, txTo, txType],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "1000" });
      if (txFrom) params.set("from", txFrom);
      if (txTo) params.set("to", txTo);
      if (txType !== "all") params.set("type", txType);
      const res = await fetch(`/api/warehouse/transactions?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const items: any[] = itemsData?.items || [];
  const transactions: any[] = txData?.transactions || [];

  // Tổng quan tồn kho
  const summary = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter(isLowStock).length;
    const expiring = items.filter(isExpiringSoon).length;
    const expired = items.filter(isExpired).length;
    const totalImport = transactions.filter((t) => t.type === "IMPORT").reduce((s, t) => s + t.quantity, 0);
    const totalExport = transactions.filter((t) => t.type === "EXPORT").reduce((s, t) => s + t.quantity, 0);
    return { totalItems, lowStock, expiring, expired, totalImport, totalExport };
  }, [items, transactions]);

  // Thống kê theo danh mục
  const byCategory = useMemo(() => {
    const map: Record<string, { count: number; lowStock: number; expired: number }> = {};
    items.forEach((i) => {
      const cat = i.category || "OTHER";
      if (!map[cat]) map[cat] = { count: 0, lowStock: 0, expired: 0 };
      map[cat].count++;
      if (isLowStock(i)) map[cat].lowStock++;
      if (isExpired(i)) map[cat].expired++;
    });
    return map;
  }, [items]);

  // Xuất Excel: tồn kho
  const exportStock = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ["BÁO CÁO TỒN KHO — KHO HẦM B2"],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Mã", "Tên hàng", "Danh mục", "Tồn kho", "Đơn vị", "ĐV lẻ", "Quy đổi", "Đơn giá", "Ngưỡng cảnh báo", "Hạn sử dụng", "Số ngày còn hạn", "Ghi chú", "Trạng thái"],
        ...items.map((i) => {
          const daysLeft = i.expiryDate ? differenceInDays(new Date(i.expiryDate), new Date()) : null;
          const status = isExpired(i) ? "Hết hạn" : isExpiringSoon(i) ? "Sắp hết hạn" : isLowStock(i) ? "Tồn thấp" : "Bình thường";
          return [
            i.code, i.name, CATEGORIES[i.category] || i.category,
            i.currentQuantity, i.unit,
            i.subUnit || "—",
            i.subUnitRatio ? `1 ${i.unit} = ${i.subUnitRatio} ${i.subUnit}` : "—",
            i.unitPrice ? Number(i.unitPrice) : "—",
            i.minQuantity || "—",
            i.expiryDate ? format(new Date(i.expiryDate), "dd/MM/yyyy") : "—",
            daysLeft !== null ? daysLeft : "—",
            i.notes || "—", status,
          ];
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "Tồn kho");
      XLSX.writeFile(wb, `BC_TonKho_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất báo cáo tồn kho" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất" }); }
  };

  // Xuất Excel: lịch sử giao dịch
  const exportTransactions = () => {
    try {
      const wb = XLSX.utils.book_new();
      const rows = [
        ["BÁO CÁO LỊCH SỬ XUẤT NHẬP KHO — HẦM B2"],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        txFrom || txTo ? ["Khoảng thời gian", `${txFrom || "—"} đến ${txTo || "—"}`] : [],
        [],
        ["Ngày", "Loại", "Mã hàng", "Tên hàng", "Đơn vị", "Số lượng", "Đơn vị tài trợ", "Mục đích", "Người thực hiện", "Ghi chú"],
        ...transactions.map((t) => [
          format(new Date(t.transactionDate), "dd/MM/yyyy"),
          t.type === "IMPORT" ? "Nhập" : "Xuất",
          t.item?.code || "—", t.item?.name || "—", t.item?.unit || "—",
          t.quantity, t.donorUnit || "—", t.purpose || "—", t.handledBy || "—", t.notes || "—",
        ]),
        [],
        ["TỔNG NHẬP", "", "", "", "", transactions.filter((t) => t.type === "IMPORT").reduce((s, t) => s + t.quantity, 0)],
        ["TỔNG XUẤT", "", "", "", "", transactions.filter((t) => t.type === "EXPORT").reduce((s, t) => s + t.quantity, 0)],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, "Lịch sử");
      XLSX.writeFile(wb, `BC_XuatNhapKho_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất lịch sử giao dịch" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất" }); }
  };

  const isLoading = itemsLoading || txLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo Kho (Hầm B2)</h2>
        <p className="text-muted-foreground">Tổng quan tồn kho và lịch sử xuất nhập</p>
      </div>

      {/* Tóm tắt */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: "Mặt hàng", value: summary.totalItems, icon: Package, color: "" },
          { label: "Tồn kho thấp", value: summary.lowStock, icon: AlertTriangle, color: "text-yellow-600" },
          { label: "Sắp hết hạn", value: summary.expiring, icon: Clock, color: "text-orange-600" },
          { label: "Đã hết hạn", value: summary.expired, icon: AlertTriangle, color: "text-red-600" },
          { label: "Tổng nhập", value: summary.totalImport, icon: PackagePlus, color: "text-green-600" },
          { label: "Tổng xuất", value: summary.totalExport, icon: PackageMinus, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tồn kho hiện tại */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tồn kho hiện tại</CardTitle>
          <Button onClick={exportStock} disabled={isLoading} size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theo danh mục */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Theo danh mục</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(byCategory).map(([cat, v]) => (
                <div key={cat} className="border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{CATEGORIES[cat] || cat}</p>
                  <p className="text-xl font-bold">{v.count} <span className="text-xs font-normal text-muted-foreground">mặt hàng</span></p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {v.lowStock > 0 && <Badge variant="outline" className="text-xs text-yellow-700 bg-yellow-50">{v.lowStock} tồn thấp</Badge>}
                    {v.expired > 0 && <Badge variant="destructive" className="text-xs">{v.expired} hết hạn</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danh sách cần chú ý */}
          {(summary.expired > 0 || summary.expiring > 0 || summary.lowStock > 0) && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Mặt hàng cần chú ý</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên hàng</TableHead>
                    <TableHead className="text-right">Tồn kho</TableHead>
                    <TableHead>Hạn sử dụng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items
                    .filter((i) => isExpired(i) || isExpiringSoon(i) || isLowStock(i))
                    .sort((a, b) => {
                      // expired first, then expiring, then low stock
                      const scoreA = isExpired(a) ? 0 : isExpiringSoon(a) ? 1 : 2;
                      const scoreB = isExpired(b) ? 0 : isExpiringSoon(b) ? 1 : 2;
                      return scoreA - scoreB;
                    })
                    .map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-mono text-sm">{i.code}</TableCell>
                        <TableCell className="font-medium">{i.name}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${isLowStock(i) ? "text-red-600" : ""}`}>{i.currentQuantity}</span>
                          <span className="text-xs text-muted-foreground ml-1">{i.unit}</span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {i.expiryDate ? format(new Date(i.expiryDate), "dd/MM/yyyy") : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {isExpired(i) && <Badge variant="destructive" className="text-xs">Hết hạn</Badge>}
                            {isExpiringSoon(i) && <Badge className="text-xs bg-orange-500">Sắp hết hạn ({differenceInDays(new Date(i.expiryDate), new Date())}d)</Badge>}
                            {isLowStock(i) && <Badge variant="outline" className="text-xs text-yellow-700 bg-yellow-50">Tồn thấp (ngưỡng: {i.minQuantity})</Badge>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Toàn bộ tồn kho */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Toàn bộ mặt hàng</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên hàng</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead>Đơn vị tài trợ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Đang tải...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Chưa có mặt hàng nào</TableCell></TableRow>
                ) : (
                  items.map((i) => (
                    <TableRow key={i.id} className={isExpired(i) ? "bg-red-50/40" : isExpiringSoon(i) ? "bg-orange-50/40" : isLowStock(i) ? "bg-yellow-50/40" : ""}>
                      <TableCell className="font-mono text-sm">{i.code}</TableCell>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{CATEGORIES[i.category] || i.category}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${isLowStock(i) ? "text-red-600" : ""}`}>{i.currentQuantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">{i.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {i.expiryDate ? (
                          <span className={isExpired(i) ? "text-red-600 font-medium" : isExpiringSoon(i) ? "text-orange-600 font-medium" : ""}>
                            {format(new Date(i.expiryDate), "dd/MM/yyyy")}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{i.donorUnit || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lịch sử xuất nhập</CardTitle>
          <Button onClick={exportTransactions} disabled={isLoading} size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={txType} onValueChange={setTxType}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="IMPORT">Nhập kho</SelectItem>
                <SelectItem value="EXPORT">Xuất kho</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-44" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} />
            <span className="text-muted-foreground text-sm">—</span>
            <Input type="date" className="w-44" value={txTo} onChange={(e) => setTxTo(e.target.value)} />
            {(txFrom || txTo || txType !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setTxFrom(""); setTxTo(""); setTxType("all"); }}>Xoá bộ lọc</Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">{transactions.length} giao dịch</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Tên hàng</TableHead>
                <TableHead className="text-right">Số lượng</TableHead>
                <TableHead>Đơn vị tài trợ</TableHead>
                <TableHead>Mục đích</TableHead>
                <TableHead>Người thực hiện</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Đang tải...</TableCell></TableRow>
              ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Chưa có giao dịch nào</TableCell></TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm whitespace-nowrap">{format(new Date(t.transactionDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {t.type === "IMPORT"
                        ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Nhập</Badge>
                        : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Xuất</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{t.item?.code || "—"}</TableCell>
                    <TableCell className="font-medium">{t.item?.name || "—"}</TableCell>
                    <TableCell className="text-right font-bold">
                      <span className={t.type === "IMPORT" ? "text-green-700" : "text-red-700"}>
                        {t.type === "IMPORT" ? "+" : "−"}{t.quantity}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{t.item?.unit}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.donorUnit || "—"}</TableCell>
                    <TableCell className="text-sm max-w-40 truncate">{t.purpose || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.handledBy || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Tổng nhập/xuất */}
          {transactions.length > 0 && (
            <div className="flex gap-6 pt-2 border-t text-sm">
              <span>Tổng nhập: <strong className="text-green-700">+{summary.totalImport}</strong></span>
              <span>Tổng xuất: <strong className="text-red-700">−{summary.totalExport}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
