"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { FileSpreadsheet, TrendingDown, BarChart3, Wallet, AlertCircle, CheckCircle2, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CASH_PURPOSES } from "@/lib/validations/donation";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

type ReportType = "overview" | "yearly" | "pending";

type DrilldownGroup = { label: string; items: any[] } | null;

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [drilldown, setDrilldown] = useState<DrilldownGroup>(null);

  // Lập kế hoạch huy động
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [targetPurpose, setTargetPurpose] = useState<string>("");
  const [targetCustodian, setTargetCustodian] = useState<string>("");
  const [planGenerated, setPlanGenerated] = useState(false);

  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: cashData, isLoading } = useQuery({
    queryKey: ["cash-report"],
    queryFn: async () => {
      const res = await fetch("/api/donations/cash?limit=1000");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const allCash: any[] = cashData?.donations || [];

  // ===== DỮ LIỆU BÁO CÁO =====

  // 1. Tổng quan
  const overviewData = useMemo(() => {
    const total = allCash.reduce((s, d) => s + Number(d.amount), 0);
    const used = allCash.reduce((s, d) => s + Number(d.usedAmount || 0), 0);
    const remaining = total - used;

    const byPurpose: Record<string, { total: number; used: number; count: number }> = {};
    allCash.forEach((d) => {
      const p = d.purposeOther || d.purpose || "Không rõ";
      if (!byPurpose[p]) byPurpose[p] = { total: 0, used: 0, count: 0 };
      byPurpose[p].total += Number(d.amount);
      byPurpose[p].used += Number(d.usedAmount || 0);
      byPurpose[p].count += 1;
    });

    const byCustodian: Record<string, { total: number; used: number; count: number }> = {};
    allCash.forEach((d) => {
      const c = d.custodian || "Không rõ";
      if (!byCustodian[c]) byCustodian[c] = { total: 0, used: 0, count: 0 };
      byCustodian[c].total += Number(d.amount);
      byCustodian[c].used += Number(d.usedAmount || 0);
      byCustodian[c].count += 1;
    });

    // Danh sách custodian duy nhất
    const custodians = Array.from(
      new Set(allCash.map((d) => d.custodian || "Không rõ").filter(Boolean))
    ).sort();

    return { total, used, remaining, byPurpose, byCustodian, custodians };
  }, [allCash]);

  // 2. Theo năm
  const yearlyData = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearItems = allCash.filter((d) => new Date(d.receivedDate).getFullYear() === year);
    const months: { received: number; used: number; count: number }[] = Array.from({ length: 12 }, () => ({ received: 0, used: 0, count: 0 }));
    yearItems.forEach((d) => {
      const m = new Date(d.receivedDate).getMonth();
      months[m].received += Number(d.amount);
      months[m].used += Number(d.usedAmount || 0);
      months[m].count += 1;
    });
    return { months, items: yearItems };
  }, [allCash, selectedYear]);

  // 3. Tồn đọng
  const pendingData = useMemo(() => {
    return allCash
      .filter((d) => Number(d.usedAmount || 0) < Number(d.amount))
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
  }, [allCash]);

  // ===== LẬP KẾ HOẠCH HUY ĐỘNG =====
  const mobilizationPlan = useMemo(() => {
    if (!planGenerated || !targetAmount) return null;
    const target = parseFloat(targetAmount.replace(/[^\d.]/g, "")) * 1_000_000;
    if (!target || target <= 0) return null;

    // Lọc pool
    let pool = allCash.filter((d) => Number(d.usedAmount || 0) < Number(d.amount));
    if (targetPurpose && targetPurpose !== "all") {
      pool = pool.filter((d) => (d.purposeOther || d.purpose) === targetPurpose);
    }
    if (targetCustodian && targetCustodian !== "all") {
      pool = pool.filter((d) => (d.custodian || "Không rõ") === targetCustodian);
    }

    const avails = pool.map((d) => ({
      ...d,
      _avail: Number(d.amount) - Number(d.usedAmount || 0),
      _isPartial: Number(d.usedAmount || 0) > 0,
    }));

    // === Ưu tiên 1: Khoản khít đúng target (chọn khoản có avail <= target và gần target nhất) ===
    const exactOrLess = avails
      .filter((d) => d._avail <= target)
      .sort((a, b) => b._avail - a._avail); // lớn nhất trước (gần target nhất)

    // Thử dùng một khoản khít (avail === target)
    const exactMatch = avails.find((d) => d._avail === target);
    if (exactMatch) {
      return {
        selected: [{ ...exactMatch, _take: exactMatch._avail }],
        accumulated: exactMatch._avail,
        target,
        shortage: 0,
        totalAvail: avails.reduce((s, d) => s + d._avail, 0),
        strategy: "exact",
      };
    }

    // === Ưu tiên 2 & 3 ===
    const partial = avails
      .filter((d) => d._isPartial)
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

    const unused = avails
      .filter((d) => !d._isPartial)
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

    // Giai đoạn 1: dùng hết tất cả khoản tồn đọng (lấy toàn bộ avail)
    let accumulated = 0;
    const selected: any[] = [];
    const usedIds = new Set<string>();

    for (const d of partial) {
      if (accumulated >= target) break;
      const take = Math.min(d._avail, target - accumulated);
      accumulated += take;
      selected.push({ ...d, _take: take });
      usedIds.add(d.id);
    }

    // Giai đoạn 2: nếu chưa đủ, dùng khoản nguyên — nhưng chỉ lấy FULL (không xé lẻ)
    // Nếu khoản nguyên phải xé lẻ → bỏ qua, tiếp tục tìm khoản nguyên khác vừa khít hơn
    // Sau khi duyệt hết khoản nguyên full, nếu vẫn còn thiếu → mới xé lẻ khoản nguyên cuối cùng
    const remaining_needed = () => target - accumulated;

    // Ưu tiên khoản nguyên lấy full (avail <= phần còn thiếu), cũ nhất trước
    const unusedFull = unused.filter((d) => d._avail <= remaining_needed());
    for (const d of unusedFull) {
      if (accumulated >= target) break;
      accumulated += d._avail;
      selected.push({ ...d, _take: d._avail });
      usedIds.add(d.id);
    }

    // Nếu vẫn chưa đủ sau khi dùng hết khoản nguyên vừa khít:
    // → Tìm thêm khoản tồn đọng còn sót (chưa dùng ở giai đoạn 1 vì đã đủ target lúc đó)
    // (thực ra partial đã dùng hết ở giai đoạn 1, nên đây là fallback xé lẻ khoản nguyên)
    if (accumulated < target) {
      // Thử tìm khoản tồn đọng chưa được chọn (nếu có — trường hợp giai đoạn 1 dừng sớm)
      const remainingPartial = partial.filter((d) => !usedIds.has(d.id));
      for (const d of remainingPartial) {
        if (accumulated >= target) break;
        const take = Math.min(d._avail, target - accumulated);
        accumulated += take;
        selected.push({ ...d, _take: take });
        usedIds.add(d.id);
      }

      // Nếu vẫn thiếu → buộc phải xé lẻ một khoản nguyên (chọn khoản nhỏ nhất đủ lấp)
      if (accumulated < target) {
        const need = target - accumulated;
        const unusedRemaining = unused.filter((d) => !usedIds.has(d.id));
        // Ưu tiên khoản nguyên nhỏ nhất mà avail >= need (để xé ít nhất)
        const bestPartialUnused = unusedRemaining
          .filter((d) => d._avail >= need)
          .sort((a, b) => a._avail - b._avail)[0]; // nhỏ nhất đủ lấp
        if (bestPartialUnused) {
          accumulated += need;
          selected.push({ ...bestPartialUnused, _take: need });
        } else {
          // Không tìm được khoản đủ → lấy tất cả còn lại
          for (const d of unusedRemaining) {
            if (accumulated >= target) break;
            const take = Math.min(d._avail, target - accumulated);
            accumulated += take;
            selected.push({ ...d, _take: take });
          }
        }
      }
    }

    const totalAvail = avails.reduce((s, d) => s + d._avail, 0);

    return { selected, accumulated, target, shortage: Math.max(0, target - accumulated), totalAvail, strategy: "sequential" };
  }, [planGenerated, targetAmount, targetPurpose, targetCustodian, allCash]);

  // ===== XUẤT EXCEL =====
  const exportOverview = () => {
    try {
      const { total, used, remaining, byPurpose, byCustodian } = overviewData;
      const wb = XLSX.utils.book_new();
      const rows = [
        ["BÁO CÁO TỔNG QUAN TÌNH HÌNH SỬ DỤNG TIỀN MẶT"],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Chỉ số", "Giá trị", "Tỷ lệ"],
        ["Tổng tiền nhận", total, "100%"],
        ["Tổng đã sử dụng", used, total > 0 ? `${((used / total) * 100).toFixed(1)}%` : "0%"],
        ["Tổng còn lại", remaining, total > 0 ? `${((remaining / total) * 100).toFixed(1)}%` : "0%"],
        ["Số khoản tài trợ", allCash.length, ""],
        ["Số khoản còn tồn", pendingData.length, ""],
        [],
        ["BREAKDOWN THEO MỤC ĐÍCH"],
        ["Mục đích", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byPurpose).map(([p, v]) => [p, v.count, v.total, v.used, v.total - v.used, v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"]),
        [],
        ["BREAKDOWN THEO NGƯỜI GIỮ TIỀN"],
        ["Người giữ", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byCustodian).map(([c, v]) => [c, v.count, v.total, v.used, v.total - v.used, v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, "Tổng quan");
      XLSX.writeFile(wb, `BC_TongQuan_TienMat_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất báo cáo tổng quan" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportYearly = () => {
    try {
      const { months, items } = yearlyData;
      const year = selectedYear;
      const wb = XLSX.utils.book_new();
      const rows = [
        [`BÁO CÁO TÌNH HÌNH SỬ DỤNG TIỀN MẶT NĂM ${year}`],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Tháng", "Số khoản", "Tổng tiền nhận", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...months.map((v, i) => [`Tháng ${i + 1}`, v.count, v.received, v.used, v.received - v.used, v.received > 0 ? `${((v.used / v.received) * 100).toFixed(1)}%` : "0%"]),
        [],
        ["TỔNG", items.length,
          items.reduce((s, d) => s + Number(d.amount), 0),
          items.reduce((s, d) => s + Number(d.usedAmount || 0), 0),
          items.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0), ""],
        [],
        ["CHI TIẾT CÁC KHOẢN"],
        ["Nhà tài trợ", "Ngày nhận", "Mục đích", "Số tiền", "Đã dùng", "Còn lại", "% SD", "Người giữ"],
        ...items.map((d) => {
          const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
          return [d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "", amt, usd, amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%", d.custodian || ""];
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, `Năm ${year}`);
      XLSX.writeFile(wb, `BC_TienMat_Nam${year}_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất báo cáo năm ${year}` });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportPending = () => {
    try {
      const today = new Date();
      const wb = XLSX.utils.book_new();
      const summaryRows = [
        ["BÁO CÁO CÁC KHOẢN TIỀN MẶT TỒN ĐỌNG"],
        ["Ngày xuất", format(today, "dd/MM/yyyy HH:mm")],
        [],
        ["STT", "Nhà tài trợ", "Ngày nhận", "Mục đích", "Tổng tiền", "Đã dùng", "Còn lại", "% Đã dùng", "Số ngày tồn", "Người giữ"],
        ...pendingData.map((d, i) => {
          const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
          return [i + 1, d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "", amt, usd, amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%", differenceInDays(today, new Date(d.receivedDate)), d.custodian || ""];
        }),
        [],
        ["TỔNG", "", "", "", pendingData.reduce((s, d) => s + Number(d.amount), 0), pendingData.reduce((s, d) => s + Number(d.usedAmount || 0), 0), pendingData.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0)],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws1["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Tồn đọng");

      const detailRows: any[] = [["CHI TIẾT SỬ DỤNG TỪNG KHOẢN TỒN ĐỌNG"], []];
      pendingData.forEach((d, i) => {
        const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
        detailRows.push([`${i + 1}. ${d.donor?.fullName || "Không rõ"} — ${formatDate(d.receivedDate)}`]);
        detailRows.push(["Mục đích:", d.purposeOther || d.purpose || "Không rõ"]);
        detailRows.push(["Tổng tiền:", amt, "Đã dùng:", usd, "Còn lại:", amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%"]);
        detailRows.push(["Tồn đọng:", `${differenceInDays(today, new Date(d.receivedDate))} ngày`, "Người giữ:", d.custodian || ""]);
        const items: any[] = Array.isArray(d.usageItems) ? d.usageItems : [];
        if (items.length > 0) {
          detailRows.push(["Lịch sử sử dụng:"]);
          detailRows.push(["", "STT", "Nội dung chi", "Số tiền"]);
          items.forEach((item: any, j: number) => detailRows.push(["", j + 1, item.description || "", Number(item.amount || 0)]));
        } else {
          detailRows.push(["Chưa có lịch sử sử dụng"]);
        }
        detailRows.push([]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
      ws2["!cols"] = [{ wch: 5 }, { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết sử dụng");
      XLSX.writeFile(wb, `BC_TonDong_TienMat_${format(today, "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất ${pendingData.length} khoản tồn đọng` });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportMobilizationPlan = () => {
    if (!mobilizationPlan) return;
    try {
      const { selected, accumulated, target, shortage } = mobilizationPlan;
      const wb = XLSX.utils.book_new();
      const rows = [
        ["KẾ HOẠCH HUY ĐỘNG VỐN"],
        ["Ngày lập", format(new Date(), "dd/MM/yyyy HH:mm")],
        ["Mục đích sử dụng", targetPurpose && targetPurpose !== "all" ? targetPurpose : "Tất cả"],
        ["Người giữ tiền", targetCustodian && targetCustodian !== "all" ? targetCustodian : "Tất cả"],
        ["Số tiền cần huy động", target],
        ["Số tiền có thể huy động", accumulated],
        shortage > 0 ? ["Còn thiếu", shortage] : ["Trạng thái", "ĐỦ TIỀN"],
        [],
        ["STT", "Nhà tài trợ", "Ngày nhận", "Mục đích gốc", "Tổng khoản", "Đã dùng", "Còn lại", "Lấy bao nhiêu", "Ghi chú"],
        ...selected.map((d, i) => [
          i + 1, d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "",
          Number(d.amount), Number(d.usedAmount || 0), d._avail, d._take,
          Number(d.usedAmount || 0) === 0 ? "Chưa sử dụng" : "Đang sử dụng dở",
        ]),
        [],
        ["TỔNG LẤY", "", "", "", "", "", "", accumulated, ""],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, "Kế hoạch huy động");
      XLSX.writeFile(wb, `KeHoach_HuyDong_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất kế hoạch huy động" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất" }); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h2>
        <p className="text-muted-foreground">Xem và xuất báo cáo tình hình sử dụng tiền tài trợ</p>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-2" />Báo cáo</TabsTrigger>
          <TabsTrigger value="mobilize"><Wallet className="h-4 w-4 mr-2" />Lập kế hoạch huy động</TabsTrigger>
        </TabsList>

        {/* ===== TAB BÁO CÁO ===== */}
        <TabsContent value="reports" className="space-y-4 mt-4">

          {/* Chọn loại báo cáo */}
          <div className="flex gap-2">
            {([
              { key: "overview", label: "Tổng quan", icon: BarChart3 },
              { key: "yearly", label: "Theo năm", icon: FileSpreadsheet },
              { key: "pending", label: "Tồn đọng", icon: TrendingDown },
            ] as { key: ReportType; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={reportType === key ? "default" : "outline"}
                onClick={() => setReportType(key)}
                size="sm"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          {/* BÁO CÁO 1: TỔNG QUAN */}
          {reportType === "overview" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tổng quan tình hình sử dụng tiền mặt</CardTitle>
                <Button onClick={exportOverview} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <>
                    {/* Tóm tắt */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Tổng tiền nhận", value: overviewData.total, sub: `${allCash.length} khoản`, color: "" },
                        { label: "Đã sử dụng", value: overviewData.used, sub: overviewData.total > 0 ? `${((overviewData.used / overviewData.total) * 100).toFixed(1)}%` : "0%", color: "text-blue-600" },
                        { label: "Còn lại (tồn đọng)", value: overviewData.remaining, sub: `${pendingData.length} khoản tồn`, color: "text-orange-600" },
                      ].map((item) => (
                        <div key={item.label} className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value.toString())}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown mục đích */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Theo mục đích</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mục đích</TableHead>
                            <TableHead className="text-right">Số khoản</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead className="text-right">Đã dùng</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead className="text-right">% SD</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(overviewData.byPurpose).map(([p, v]) => (
                            <TableRow key={p}>
                              <TableCell className="font-medium">{p}</TableCell>
                              <TableCell className="text-right">{v.count}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.total.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.used.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency((v.total - v.used).toString())}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={v.total > 0 && v.used / v.total >= 0.9 ? "default" : "secondary"}>
                                  {v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setDrilldown({
                                    label: `Mục đích: ${p}`,
                                    items: allCash.filter((d) => (d.purposeOther || d.purpose || "Không rõ") === p),
                                  })}
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Breakdown người giữ */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Theo người giữ tiền</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Người giữ</TableHead>
                            <TableHead className="text-right">Số khoản</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead className="text-right">% SD</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(overviewData.byCustodian).map(([c, v]) => (
                            <TableRow key={c}>
                              <TableCell className="font-medium">{c}</TableCell>
                              <TableCell className="text-right">{v.count}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.total.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency((v.total - v.used).toString())}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">
                                  {v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setDrilldown({
                                    label: `Người giữ: ${c}`,
                                    items: allCash.filter((d) => (d.custodian || "Không rõ") === c),
                                  })}
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* BÁO CÁO 2: THEO NĂM */}
          {reportType === "yearly" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Tình hình sử dụng tiền mặt theo năm</CardTitle>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => <SelectItem key={y} value={y}>Năm {y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={exportYearly} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tháng</TableHead>
                          <TableHead className="text-right">Số khoản</TableHead>
                          <TableHead className="text-right">Tổng tiền nhận</TableHead>
                          <TableHead className="text-right">Đã dùng</TableHead>
                          <TableHead className="text-right">Còn lại</TableHead>
                          <TableHead className="text-right">% Sử dụng</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearlyData.months.map((v, i) => (
                          <TableRow key={i} className={v.count === 0 ? "opacity-40" : ""}>
                            <TableCell className="font-medium">Tháng {i + 1}</TableCell>
                            <TableCell className="text-right">{v.count}</TableCell>
                            <TableCell className="text-right">{v.received > 0 ? formatCurrency(v.received.toString()) : "—"}</TableCell>
                            <TableCell className="text-right">{v.used > 0 ? formatCurrency(v.used.toString()) : "—"}</TableCell>
                            <TableCell className="text-right">{v.received > 0 ? formatCurrency((v.received - v.used).toString()) : "—"}</TableCell>
                            <TableCell className="text-right">
                              {v.received > 0 ? (
                                <Badge variant="outline">{((v.used / v.received) * 100).toFixed(1)}%</Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>TỔNG</TableCell>
                          <TableCell className="text-right">{yearlyData.items.length}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.amount), 0).toString())}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.usedAmount || 0), 0).toString())}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0).toString())}</TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const t = yearlyData.items.reduce((s, d) => s + Number(d.amount), 0);
                              const u = yearlyData.items.reduce((s, d) => s + Number(d.usedAmount || 0), 0);
                              return t > 0 ? <Badge>{((u / t) * 100).toFixed(1)}%</Badge> : "—";
                            })()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* BÁO CÁO 3: TỒN ĐỌNG */}
          {reportType === "pending" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Các khoản tiền mặt tồn đọng</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingData.length} khoản · Tổng còn: {formatCurrency(pendingData.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0).toString())}
                  </p>
                </div>
                <Button onClick={exportPending} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel (2 sheets)
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhà tài trợ</TableHead>
                        <TableHead>Ngày nhận</TableHead>
                        <TableHead>Mục đích</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Đã dùng</TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                        <TableHead className="text-right">Tồn (ngày)</TableHead>
                        <TableHead>Người giữ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.map((d) => {
                        const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
                        const days = differenceInDays(new Date(), new Date(d.receivedDate));
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.donor?.fullName || "—"}</TableCell>
                            <TableCell>{formatDate(d.receivedDate)}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{d.purposeOther || d.purpose || "—"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(amt.toString())}</TableCell>
                            <TableCell className="text-right">{usd > 0 ? formatCurrency(usd.toString()) : "—"}</TableCell>
                            <TableCell className="text-right font-medium text-orange-600">{formatCurrency((amt - usd).toString())}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={days > 180 ? "destructive" : days > 90 ? "secondary" : "outline"}>{days}d</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{d.custodian || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB LẬP KẾ HOẠCH HUY ĐỘNG ===== */}
        <TabsContent value="mobilize" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lập kế hoạch huy động vốn</CardTitle>
              <p className="text-sm text-muted-foreground">Nhập số tiền cần huy động, hệ thống sẽ gợi ý các khoản theo thứ tự ưu tiên</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Số tiền cần huy động (triệu VNĐ)</label>
                  <Input
                    type="number"
                    placeholder="VD: 300"
                    value={targetAmount}
                    onChange={(e) => { setTargetAmount(e.target.value); setPlanGenerated(false); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lọc theo mục đích (tuỳ chọn)</label>
                  <Select value={targetPurpose} onValueChange={(v) => { setTargetPurpose(v); setPlanGenerated(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả mục đích" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả mục đích</SelectItem>
                      {CASH_PURPOSES.filter(p => p !== "Khác").map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lọc theo người giữ tiền (tuỳ chọn)</label>
                  <Select value={targetCustodian} onValueChange={(v) => { setTargetCustodian(v); setPlanGenerated(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả người giữ</SelectItem>
                      {overviewData.custodians.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => setPlanGenerated(true)}
                disabled={!targetAmount || isLoading}
                className="w-full"
              >
                Tạo kế hoạch huy động
              </Button>
            </CardContent>
          </Card>

          {/* Kết quả kế hoạch */}
          {planGenerated && mobilizationPlan && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {mobilizationPlan.shortage === 0 ? (
                      <><CheckCircle2 className="h-5 w-5 text-green-600" />Đủ tiền huy động</>
                    ) : (
                      <><AlertCircle className="h-5 w-5 text-orange-500" />Không đủ tiền</>
                    )}
                  </CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Cần: <span className="font-semibold text-foreground">{formatCurrency((mobilizationPlan.target).toString())}</span></span>
                    <span>Huy động được: <span className="font-semibold text-green-600">{formatCurrency(mobilizationPlan.accumulated.toString())}</span></span>
                    {mobilizationPlan.shortage > 0 && (
                      <span>Còn thiếu: <span className="font-semibold text-red-600">{formatCurrency(mobilizationPlan.shortage.toString())}</span></span>
                    )}
                  </div>
                </div>
                <Button onClick={exportMobilizationPlan} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nhà tài trợ</TableHead>
                      <TableHead>Ngày nhận</TableHead>
                      <TableHead>Mục đích gốc</TableHead>
                      <TableHead className="text-right">Tổng khoản</TableHead>
                      <TableHead className="text-right">Còn lại</TableHead>
                      <TableHead className="text-right">Lấy bao nhiêu</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Người giữ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mobilizationPlan.selected.map((d) => (
                      <TableRow key={d.id} className={d._take < d._avail ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                        <TableCell className="font-medium">{d.donor?.fullName || "—"}</TableCell>
                        <TableCell>{formatDate(d.receivedDate)}</TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm">{d.purposeOther || d.purpose || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(d.amount).toString())}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d._avail.toString())}</TableCell>
                        <TableCell className="text-right font-bold text-green-700">{formatCurrency(d._take.toString())}</TableCell>
                        <TableCell>
                          {Number(d.usedAmount || 0) === 0
                            ? <Badge variant="outline" className="text-xs">Chưa dùng</Badge>
                            : <Badge variant="secondary" className="text-xs">Đang dùng dở</Badge>
                          }
                          {d._take < d._avail && <Badge variant="outline" className="text-xs ml-1 border-yellow-500 text-yellow-700">Lấy một phần</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.custodian || "—"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={5}>TỔNG HUY ĐỘNG</TableCell>
                      <TableCell className="text-right text-green-700">{formatCurrency(mobilizationPlan.accumulated.toString())}</TableCell>
                      <TableCell colSpan={2}>{mobilizationPlan.selected.length} khoản</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-3">
                  * Thứ tự ưu tiên: (1) Khoản khít đúng số tiền cần → (2) Dọn hết các khoản tồn đọng (đang dùng dở) → (3) Dùng khoản chưa sử dụng, cũ nhất trước
                </p>
              </CardContent>
            </Card>
          )}

          {planGenerated && mobilizationPlan && mobilizationPlan.selected.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p>Không tìm thấy khoản nào phù hợp với mục đích đã chọn.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Drilldown dialog */}
      <Dialog open={!!drilldown} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drilldown?.label} — {drilldown?.items.length} khoản</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà tài trợ</TableHead>
                <TableHead>Ngày nhận</TableHead>
                <TableHead>Mục đích</TableHead>
                <TableHead>Người giữ</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Đã dùng</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead className="text-right">% SD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drilldown?.items.map((d) => {
                const amt = Number(d.amount);
                const used = Number(d.usedAmount || 0);
                const remaining = amt - used;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/donors/${d.donor?.id || d.donorId}`} className="font-medium hover:underline" onClick={() => setDrilldown(null)}>
                        {d.donor?.fullName || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(d.receivedDate)}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{d.purposeOther || d.purpose || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.custodian || "—"}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(amt.toString())}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">{used > 0 ? formatCurrency(used.toString()) : "—"}</TableCell>
                    <TableCell className={`text-right whitespace-nowrap ${remaining > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                      {remaining > 0 ? formatCurrency(remaining.toString()) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={amt > 0 && used / amt >= 0.9 ? "default" : used > 0 ? "secondary" : "outline"} className="text-xs">
                        {amt > 0 ? `${((used / amt) * 100).toFixed(0)}%` : "0%"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {drilldown?.items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Không có khoản nào</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
