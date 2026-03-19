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
import { CalendarIcon, FileSpreadsheet, Download, Users, Activity, TrendingUp, Building2 } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PatientStats {
  totalPatients: number;
  activePatients: number;
  newPatients: number;
  transferredIn: number;
  transferredOut: number;
  discontinued: number;
  rejoined: number;
}

interface SponsorStats {
  sponsorId: string;
  sponsorName: string;
  sponsorCompany: string | null;
  medications: {
    medicationId: string;
    medicationName: string;
    totalDoses: number;
    totalValue: number;
  }[];
  totalDoses: number;
  totalValue: number;
}

export default function DrugSupportReportsPage() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  // Fetch patient statistics
  const { data: patientStats, isLoading: loadingPatients } = useQuery({
    queryKey: ["patient-stats", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await fetch(`/api/cancer-support/reports/patient-stats?${params}`);
      if (!res.ok) throw new Error("Failed to fetch patient stats");
      return res.json() as Promise<PatientStats>;
    },
  });

  // Fetch sponsor statistics
  const { data: sponsorStats, isLoading: loadingSponsors } = useQuery({
    queryKey: ["sponsor-stats", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await fetch(`/api/cancer-support/reports/sponsor-stats?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sponsor stats");
      return res.json() as Promise<SponsorStats[]>;
    },
  });

  const isLoading = loadingPatients || loadingSponsors;

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Patient Statistics
      const patientData = [
        ["Chỉ số", "Giá trị"],
        ["Tổng số NB tham gia", patientStats?.totalPatients || 0],
        ["Số NB đang tham gia", patientStats?.activePatients || 0],
        ["Số NB tham gia mới", patientStats?.newPatients || 0],
        ["Số NB được tiếp nhận từ BV khác", patientStats?.transferredIn || 0],
        ["Số NB chuyển đi viện khác", patientStats?.transferredOut || 0],
        ["Số NB ngừng tham gia", patientStats?.discontinued || 0],
        ["Số NB tham gia lại CT", patientStats?.rejoined || 0],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(patientData);
      XLSX.utils.book_append_sheet(wb, ws1, "Thống kê người bệnh");

      // Sheet 2: Sponsor Statistics
      if (sponsorStats && sponsorStats.length > 0) {
        const sponsorData: any[][] = [
          ["Nhà tài trợ", "Công ty", "Thuốc", "Số liều", "Giá trị (VNĐ)"]
        ];

        sponsorStats.forEach(sponsor => {
          sponsor.medications.forEach((med, index) => {
            sponsorData.push([
              index === 0 ? sponsor.sponsorName : "",
              index === 0 ? (sponsor.sponsorCompany || "") : "",
              med.medicationName,
              med.totalDoses,
              med.totalValue
            ]);
          });
          // Add total row for sponsor
          sponsorData.push([
            "",
            "Tổng",
            "",
            sponsor.totalDoses,
            sponsor.totalValue
          ]);
          sponsorData.push([]); // Empty row for spacing
        });

        const ws2 = XLSX.utils.aoa_to_sheet(sponsorData);
        XLSX.utils.book_append_sheet(wb, ws2, "Thống kê nhà tài trợ");
      }

      // Generate filename with date range
      const dateRange = startDate && endDate
        ? `_${format(startDate, "dd-MM-yyyy")}_${format(endDate, "dd-MM-yyyy")}`
        : "";
      const filename = `Bao_cao_ho_tro_thuoc${dateRange}.xlsx`;

      XLSX.writeFile(wb, filename);

      toast({
        title: "Thành công",
        description: "Đã xuất báo cáo ra file Excel",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xuất báo cáo",
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      title: "Tổng số NB tham gia",
      value: patientStats?.totalPatients || 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Số NB đang tham gia",
      value: patientStats?.activePatients || 0,
      icon: Activity,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Số NB tham gia mới",
      value: patientStats?.newPatients || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Số NB tiếp nhận từ BV khác",
      value: patientStats?.transferredIn || 0,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Báo cáo Chương trình Hỗ trợ thuốc</h1>
        <p className="text-muted-foreground mt-1">
          Thống kê người bệnh và nhà tài trợ
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Lọc theo thời gian</CardTitle>
          <CardDescription>
            Chọn khoảng thời gian để xem báo cáo (để trống để xem tất cả)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Từ ngày:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
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

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Đến ngày:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
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

            <Button onClick={exportToExcel} disabled={isLoading}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patient Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={cn("rounded-full p-2", stat.bg)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Số NB chuyển đi viện khác
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientStats?.transferredOut || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Số NB ngừng tham gia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientStats?.discontinued || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Số NB tham gia lại CT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientStats?.rejoined || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sponsor Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo nhà tài trợ</CardTitle>
          <CardDescription>
            Chi tiết tài trợ thuốc theo từng nhà tài trợ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSponsors ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : !sponsorStats || sponsorStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có dữ liệu tài trợ
            </div>
          ) : (
            <div className="space-y-6">
              {sponsorStats.map((sponsor) => (
                <div key={sponsor.sponsorId} className="border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg">{sponsor.sponsorName}</h3>
                    {sponsor.sponsorCompany && (
                      <p className="text-sm text-muted-foreground">
                        {sponsor.sponsorCompany}
                      </p>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Thuốc</TableHead>
                        <TableHead className="text-right">Số liều</TableHead>
                        <TableHead className="text-right">Giá trị</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sponsor.medications.map((med) => (
                        <TableRow key={med.medicationId}>
                          <TableCell>{med.medicationName}</TableCell>
                          <TableCell className="text-right">
                            {med.totalDoses}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(med.totalValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell>Tổng cộng</TableCell>
                        <TableCell className="text-right">
                          {sponsor.totalDoses}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(sponsor.totalValue)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
