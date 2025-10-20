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
import { format } from "date-fns";
import { CalendarIcon, FileSpreadsheet, FileText, Download } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

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
          <CardTitle>Xuất báo cáo</CardTitle>
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
    </div>
  );
}
