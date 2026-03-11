"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, FileSpreadsheet, FileText, TrendingDown } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Fetch all data for reports
  const { data: donors, isLoading: loadingDonors } = useQuery({
    queryKey: ["donors-report"],
    queryFn: async () => {
      const res = await fetch("/api/donors?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: cashDonations, isLoading: loadingCash } = useQuery({
    queryKey: ["cash-report"],
    queryFn: async () => {
      const res = await fetch("/api/donations/cash?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: inKindDonations, isLoading: loadingInKind } = useQuery({
    queryKey: ["in-kind-report"],
    queryFn: async () => {
      const res = await fetch("/api/donations/in-kind?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: volunteerDonations, isLoading: loadingVolunteer } = useQuery({
    queryKey: ["volunteer-report"],
    queryFn: async () => {
      const res = await fetch("/api/donations/volunteer?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const isLoading = loadingDonors || loadingCash || loadingInKind || loadingVolunteer;

  // Filter data by date range
  const filterByDate = (items: any[], dateField: string = "date") => {
    if (!items) return [];
    return items.filter((item) => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  };

  const filteredCash = filterByDate(cashDonations?.donations || [], "receivedDate");
  const filteredInKind = filterByDate(inKindDonations?.donations || [], "date");
  const filteredVolunteer = filterByDate(volunteerDonations?.donations || [], "startDate");

  // Export to Excel
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Donors
      const donorsData = (donors?.donors || []).map((d: any) => ({
        "Họ tên": d.fullName || "",
        "Loại": d.type || "",
        "Cấp độ": d.tier || "",
        "Email": d.email || "",
        "Số điện thoại": d.phone || "",
        "Địa chỉ": d.address || "",
        "Ngày tạo": d.createdAt ? formatDate(d.createdAt) : "",
      }));
      const ws1 = XLSX.utils.json_to_sheet(donorsData.length > 0 ? donorsData : [{"Thông báo": "Không có dữ liệu"}]);
      XLSX.utils.book_append_sheet(wb, ws1, "Nhà tài trợ");

      // Sheet 2: Cash Donations
      const cashData = filteredCash.map((d: any) => ({
        "Nhà tài trợ": d.donor?.fullName || "",
        "Số tiền": d.amount || 0,
        "Loại tiền": d.currency || "",
        "Phương thức": d.paymentMethod || "",
        "Ngày nhận": d.receivedDate ? formatDate(d.receivedDate) : "",
        "Mục đích": d.purpose || "",
        "Trạng thái": d.status || "",
      }));
      const ws2 = XLSX.utils.json_to_sheet(cashData.length > 0 ? cashData : [{"Thông báo": "Không có dữ liệu"}]);
      XLSX.utils.book_append_sheet(wb, ws2, "Tài trợ tiền mặt");

      // Sheet 3: In-Kind Donations
      const inKindData = filteredInKind.map((d: any) => ({
        "Nhà tài trợ": d.donor?.fullName || "",
        "Vật phẩm": d.itemName || "",
        "Danh mục": d.category || "",
        "Số lượng": d.quantity || 0,
        "Đơn vị": d.unit || "",
        "Giá trị ước tính": d.estimatedValue || 0,
        "Ngày nhận": d.date ? formatDate(d.date) : "",
        "Trạng thái": d.distributionStatus || "",
      }));
      const ws3 = XLSX.utils.json_to_sheet(inKindData.length > 0 ? inKindData : [{"Thông báo": "Không có dữ liệu"}]);
      XLSX.utils.book_append_sheet(wb, ws3, "Tài trợ hiện vật");

      // Sheet 4: Volunteer
      const volunteerData = filteredVolunteer.map((d: any) => ({
        "Tình nguyện viên": d.donor?.fullName || "",
        "Loại công việc": d.workType || "",
        "Ngày bắt đầu": d.startDate ? formatDate(d.startDate) : "",
        "Ngày kết thúc": d.endDate ? formatDate(d.endDate) : "",
        "Số giờ": d.hours || 0,
        "Giá trị/giờ": d.hourlyRate || 0,
        "Tổng giá trị": d.totalValue || 0,
        "Đánh giá": d.rating || "",
      }));
      const ws4 = XLSX.utils.json_to_sheet(volunteerData.length > 0 ? volunteerData : [{"Thông báo": "Không có dữ liệu"}]);
      XLSX.utils.book_append_sheet(wb, ws4, "Công tác tình nguyện");

      // Download
      const fileName = `Bao_cao_${startDate ? format(startDate, "dd-MM-yyyy") : "tat_ca"}_${endDate ? format(endDate, "dd-MM-yyyy") : "den_nay"}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Thành công",
        description: "Đã xuất báo cáo Excel",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Không thể xuất Excel: ${error instanceof Error ? error.message : "Lỗi không xác định"}`,
      });
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      // Add UTF-8 font support (you may need to add Vietnamese font)
      doc.setFont("helvetica");

      // Title
      doc.setFontSize(18);
      doc.text("BAO CAO TAI TRO BENH VIEN", 105, 15, { align: "center" });

      doc.setFontSize(10);
      const dateRange = `${startDate ? format(startDate, "dd/MM/yyyy") : "Tat ca"} - ${endDate ? format(endDate, "dd/MM/yyyy") : "Den nay"}`;
      doc.text(dateRange, 105, 22, { align: "center" });

      let yPos = 30;

      // Summary
      doc.setFontSize(12);
      doc.text("TONG QUAN", 14, yPos);
      yPos += 7;

      doc.setFontSize(10);
      const totalCash = filteredCash.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const totalInKind = filteredInKind.reduce((sum: number, d: any) => sum + Number(d.estimatedValue), 0);
      const totalVolunteer = filteredVolunteer.reduce((sum: number, d: any) => sum + Number(d.totalValue), 0);

      doc.text(`Tong tien mat: ${formatCurrency(totalCash.toString())}`, 14, yPos);
      yPos += 6;
      doc.text(`Tong hien vat: ${formatCurrency(totalInKind.toString())}`, 14, yPos);
      yPos += 6;
      doc.text(`Tong tinh nguyen: ${formatCurrency(totalVolunteer.toString())}`, 14, yPos);
      yPos += 6;
      doc.text(`TONG CONG: ${formatCurrency((totalCash + totalInKind + totalVolunteer).toString())}`, 14, yPos);
      yPos += 10;

      // Cash Donations Table
      if (filteredCash.length > 0) {
        doc.setFontSize(12);
        doc.text("TAI TRO TIEN MAT", 14, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [["Nha tai tro", "So tien", "Phuong thuc", "Ngay nhan"]],
          body: filteredCash.slice(0, 20).map((d: any) => [
            d.donor?.fullName || "",
            formatCurrency(d.amount.toString()),
            d.paymentMethod,
            formatDate(d.receivedDate),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add page if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // In-Kind Donations Table
      if (filteredInKind.length > 0 && yPos < 250) {
        doc.setFontSize(12);
        doc.text("TAI TRO HIEN VAT", 14, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [["Nha tai tro", "Vat pham", "So luong", "Gia tri"]],
          body: filteredInKind.slice(0, 20).map((d: any) => [
            d.donor?.fullName || "",
            d.itemName,
            `${d.quantity} ${d.unit}`,
            formatCurrency(d.estimatedValue.toString()),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [92, 184, 92] },
        });
      }

      // Save PDF
      const fileName = `Bao_cao_${startDate ? format(startDate, "dd-MM-yyyy") : "tat_ca"}_${endDate ? format(endDate, "dd-MM-yyyy") : "den_nay"}.pdf`;
      doc.save(fileName);

      toast({
        title: "Thành công",
        description: "Đã xuất báo cáo PDF",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xuất PDF",
      });
    }
  };

  // ===== BÁO CÁO TIỀN MẶT =====
  const allCash: any[] = cashDonations?.donations || [];

  // 1. Tổng quan
  const exportCashOverview = () => {
    try {
      const total = allCash.reduce((s: number, d: any) => s + Number(d.amount), 0);
      const used = allCash.reduce((s: number, d: any) => s + Number(d.usedAmount || 0), 0);
      const remaining = total - used;
      const usedPct = total > 0 ? ((used / total) * 100).toFixed(1) : "0";
      const remainingPct = total > 0 ? ((remaining / total) * 100).toFixed(1) : "0";

      // Breakdown theo mục đích
      const byPurpose: Record<string, { total: number; used: number; count: number }> = {};
      allCash.forEach((d: any) => {
        const p = d.purposeOther || d.purpose || "Không rõ";
        if (!byPurpose[p]) byPurpose[p] = { total: 0, used: 0, count: 0 };
        byPurpose[p].total += Number(d.amount);
        byPurpose[p].used += Number(d.usedAmount || 0);
        byPurpose[p].count += 1;
      });

      // Breakdown theo người giữ
      const byCustodian: Record<string, { total: number; used: number; count: number }> = {};
      allCash.forEach((d: any) => {
        const c = d.custodian || "Không rõ";
        if (!byCustodian[c]) byCustodian[c] = { total: 0, used: 0, count: 0 };
        byCustodian[c].total += Number(d.amount);
        byCustodian[c].used += Number(d.usedAmount || 0);
        byCustodian[c].count += 1;
      });

      const wb = XLSX.utils.book_new();

      // Sheet 1: Tổng quan
      const overviewRows = [
        ["BÁO CÁO TỔNG QUAN TÌNH HÌNH SỬ DỤNG TIỀN MẶT"],
        ["Ngày xuất báo cáo", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Chỉ số", "Giá trị", "Tỷ lệ"],
        ["Tổng tiền nhận", total, "100%"],
        ["Tổng đã sử dụng", used, `${usedPct}%`],
        ["Tổng còn lại (tồn đọng)", remaining, `${remainingPct}%`],
        ["Số khoản tài trợ", allCash.length, ""],
        ["Số khoản còn tồn", allCash.filter((d: any) => Number(d.usedAmount || 0) < Number(d.amount)).length, ""],
        [],
        ["BREAKDOWN THEO MỤC ĐÍCH"],
        ["Mục đích", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byPurpose).map(([p, v]) => [
          p, v.count, v.total, v.used, v.total - v.used,
          v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%",
        ]),
        [],
        ["BREAKDOWN THEO NGƯỜI GIỮ TIỀN"],
        ["Người giữ", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byCustodian).map(([c, v]) => [
          c, v.count, v.total, v.used, v.total - v.used,
          v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%",
        ]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(overviewRows);
      ws1["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Tổng quan");

      XLSX.writeFile(wb, `BC_TongQuan_TienMat_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất báo cáo tổng quan" });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" });
    }
  };

  // 2. Theo năm
  const exportCashByYear = () => {
    try {
      const year = parseInt(selectedYear);
      const yearData = allCash.filter((d: any) => new Date(d.receivedDate).getFullYear() === year);

      const months: Record<number, { received: number; used: number; count: number }> = {};
      for (let m = 1; m <= 12; m++) months[m] = { received: 0, used: 0, count: 0 };

      yearData.forEach((d: any) => {
        const m = new Date(d.receivedDate).getMonth() + 1;
        months[m].received += Number(d.amount);
        months[m].used += Number(d.usedAmount || 0);
        months[m].count += 1;
      });

      const totalReceived = yearData.reduce((s: number, d: any) => s + Number(d.amount), 0);
      const totalUsed = yearData.reduce((s: number, d: any) => s + Number(d.usedAmount || 0), 0);

      const wb = XLSX.utils.book_new();

      const rows = [
        [`BÁO CÁO TÌNH HÌNH SỬ DỤNG TIỀN MẶT NĂM ${year}`],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Tháng", "Số khoản nhận", "Tổng tiền nhận", "Tổng đã dùng", "Còn lại", "% Sử dụng"],
        ...Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const v = months[m];
          return [
            `Tháng ${m}`, v.count, v.received, v.used, v.received - v.used,
            v.received > 0 ? `${((v.used / v.received) * 100).toFixed(1)}%` : "0%",
          ];
        }),
        [],
        ["TỔNG NĂM", yearData.length, totalReceived, totalUsed, totalReceived - totalUsed,
          totalReceived > 0 ? `${((totalUsed / totalReceived) * 100).toFixed(1)}%` : "0%"],
        [],
        ["CHI TIẾT CÁC KHOẢN NĂM " + year],
        ["Nhà tài trợ", "Ngày nhận", "Mục đích", "Số tiền", "Đã dùng", "Còn lại", "% SD", "Người giữ"],
        ...yearData.map((d: any) => {
          const amt = Number(d.amount);
          const usd = Number(d.usedAmount || 0);
          return [
            d.donor?.fullName || "",
            formatDate(d.receivedDate),
            d.purposeOther || d.purpose || "",
            amt, usd, amt - usd,
            amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%",
            d.custodian || "",
          ];
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, `Năm ${year}`);

      XLSX.writeFile(wb, `BC_TienMat_Nam${year}_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất báo cáo năm ${year}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" });
    }
  };

  // 3. Tồn đọng chi tiết
  const exportCashPending = () => {
    try {
      const pending = allCash.filter((d: any) => Number(d.usedAmount || 0) < Number(d.amount));
      const today = new Date();

      const wb = XLSX.utils.book_new();

      // Sheet 1: Danh sách tồn đọng
      const summaryRows = [
        ["BÁO CÁO CÁC KHOẢN TIỀN MẶT TỒN ĐỌNG"],
        ["Ngày xuất", format(today, "dd/MM/yyyy HH:mm")],
        [`Số khoản tồn đọng: ${pending.length}`],
        [],
        ["STT", "Nhà tài trợ", "Ngày nhận", "Mục đích", "Tổng tiền", "Đã sử dụng", "Còn lại", "% Đã dùng", "Số ngày tồn", "Người giữ", "Ghi chú"],
        ...pending.map((d: any, i: number) => {
          const amt = Number(d.amount);
          const usd = Number(d.usedAmount || 0);
          const rem = amt - usd;
          const days = differenceInDays(today, new Date(d.receivedDate));
          return [
            i + 1,
            d.donor?.fullName || "",
            formatDate(d.receivedDate),
            d.purposeOther || d.purpose || "",
            amt, usd, rem,
            amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%",
            days,
            d.custodian || "",
            d.usageNote || "",
          ];
        }),
        [],
        ["TỔNG", "", "", "",
          pending.reduce((s: number, d: any) => s + Number(d.amount), 0),
          pending.reduce((s: number, d: any) => s + Number(d.usedAmount || 0), 0),
          pending.reduce((s: number, d: any) => s + Number(d.amount) - Number(d.usedAmount || 0), 0),
        ],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws1["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Tồn đọng");

      // Sheet 2: Chi tiết từng khoản đã chi
      const detailRows: any[] = [
        ["CHI TIẾT SỬ DỤNG TỪNG KHOẢN TỒN ĐỌNG"],
        [],
      ];
      pending.forEach((d: any, i: number) => {
        const amt = Number(d.amount);
        const usd = Number(d.usedAmount || 0);
        const rem = amt - usd;
        const days = differenceInDays(today, new Date(d.receivedDate));
        detailRows.push([`${i + 1}. ${d.donor?.fullName || "Không rõ"} — ${formatDate(d.receivedDate)}`]);
        detailRows.push(["   Mục đích:", d.purposeOther || d.purpose || "Không rõ"]);
        detailRows.push(["   Tổng tiền:", amt, "   Đã dùng:", usd, "   Còn lại:", rem, `(${amt > 0 ? ((usd / amt) * 100).toFixed(1) : 0}%)`]);
        detailRows.push(["   Số ngày tồn đọng:", `${days} ngày`]);
        detailRows.push(["   Người giữ tiền:", d.custodian || "Không rõ"]);

        const items: any[] = Array.isArray(d.usageItems) ? d.usageItems : [];
        if (items.length > 0) {
          detailRows.push(["   Lịch sử sử dụng:"]);
          detailRows.push(["   ", "STT", "Nội dung chi", "Số tiền"]);
          items.forEach((item: any, j: number) => {
            detailRows.push(["   ", j + 1, item.description || "", Number(item.amount || 0)]);
          });
        } else {
          detailRows.push(["   Chưa có lịch sử sử dụng"]);
        }
        if (d.usageNote) detailRows.push(["   Ghi chú:", d.usageNote]);
        detailRows.push([]);
      });

      const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
      ws2["!cols"] = [{ wch: 5 }, { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết sử dụng");

      XLSX.writeFile(wb, `BC_TonDong_TienMat_${format(today, "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất ${pending.length} khoản tồn đọng` });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo & Xuất dữ liệu</h2>
        <p className="text-muted-foreground">
          Xuất báo cáo tài trợ dưới dạng Excel hoặc PDF
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn khoảng thời gian</CardTitle>
          <CardDescription>
            Lọc dữ liệu theo ngày (để trống để lấy tất cả)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Từ ngày</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Đến ngày</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tiền mặt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredCash.reduce((sum: number, d: any) => sum + Number(d.amount), 0).toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredCash.length} khoản tài trợ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hiện vật</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredInKind.reduce((sum: number, d: any) => sum + Number(d.estimatedValue), 0).toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredInKind.length} khoản tài trợ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tình nguyện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredVolunteer.reduce((sum: number, d: any) => sum + Number(d.totalValue), 0).toString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredVolunteer.length} hoạt động
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Xuất báo cáo tổng hợp</CardTitle>
          <CardDescription>
            Tải xuống dữ liệu dưới định dạng Excel hoặc PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={exportToExcel}
            disabled={isLoading}
            className="flex-1"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Xuất Excel (4 sheets)
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={isLoading}
            variant="secondary"
            className="flex-1"
          >
            <FileText className="mr-2 h-4 w-4" />
            Xuất PDF (Tóm tắt)
          </Button>
        </CardContent>
      </Card>

      {/* Báo cáo tiền mặt chi tiết */}
      <div>
        <h3 className="text-xl font-bold tracking-tight mb-1">Báo cáo tiền mặt</h3>
        <p className="text-sm text-muted-foreground mb-4">Xuất báo cáo chi tiết về tình hình sử dụng tiền tài trợ</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Báo cáo 1: Tổng quan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Tổng quan sử dụng
            </CardTitle>
            <CardDescription>
              Tổng tiền nhận, đã dùng, còn lại, % sử dụng — breakdown theo mục đích và người giữ tiền
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isLoading && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Tổng khoản: <span className="font-medium text-foreground">{allCash.length}</span></p>
                <p>Tổng tiền: <span className="font-medium text-foreground">{formatCurrency(allCash.reduce((s: number, d: any) => s + Number(d.amount), 0).toString())}</span></p>
                <p>Tồn đọng: <span className="font-medium text-orange-600">{allCash.filter((d: any) => Number(d.usedAmount || 0) < Number(d.amount)).length} khoản</span></p>
              </div>
            )}
            <Button onClick={exportCashOverview} disabled={isLoading} className="w-full" variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          </CardContent>
        </Card>

        {/* Báo cáo 2: Theo năm */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Theo năm
            </CardTitle>
            <CardDescription>
              Thống kê theo từng tháng trong năm, % sử dụng, chi tiết từng khoản
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Chọn năm</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>Năm {y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {allCash.filter((d: any) => new Date(d.receivedDate).getFullYear() === parseInt(selectedYear)).length} khoản trong năm {selectedYear}
              </p>
            )}
            <Button onClick={exportCashByYear} disabled={isLoading} className="w-full" variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          </CardContent>
        </Card>

        {/* Báo cáo 3: Tồn đọng */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Tồn đọng chi tiết
            </CardTitle>
            <CardDescription>
              Từng khoản còn số dư: đã chi gì, còn lại bao nhiêu, tồn bao nhiêu ngày
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isLoading && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Số khoản tồn: <span className="font-medium text-red-600">{allCash.filter((d: any) => Number(d.usedAmount || 0) < Number(d.amount)).length}</span></p>
                <p>Tổng còn lại: <span className="font-medium text-red-600">
                  {formatCurrency(allCash.reduce((s: number, d: any) => s + Math.max(0, Number(d.amount) - Number(d.usedAmount || 0)), 0).toString())}
                </span></p>
              </div>
            )}
            <Button onClick={exportCashPending} disabled={isLoading} className="w-full" variant="outline">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel (2 sheets)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
