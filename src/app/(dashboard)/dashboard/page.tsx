"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DollarSign, Users, TrendingUp, Gift, Coins, CalendarIcon, Wallet, Activity, Pill, HeartPulse } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { donorTierColors, donorTierLabels } from "@/types/donor";
import { DonorTier } from "@prisma/client";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  BarChart, Bar,
} from "recharts";
import { format, subMonths } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const DONOR_TYPE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

const YEAR_FILTERS = [2024, 2025, 2026];

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 5));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const statsFrom = selectedYear ? new Date(selectedYear, 0, 1).toISOString() : undefined;
  const statsTo = selectedYear ? new Date(selectedYear, 11, 31, 23, 59, 59).toISOString() : undefined;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statsFrom) params.set("from", statsFrom);
      if (statsTo) params.set("to", statsTo);
      const res = await fetch(`/api/dashboard/stats?${params}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["dashboard-trends", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      const res = await fetch(`/api/dashboard/trends?${params}`);
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
  });

  const quickFilters = [
    { label: "6 tháng", onClick: () => { setStartDate(subMonths(new Date(), 5)); setEndDate(new Date()); } },
    { label: "1 năm", onClick: () => { setStartDate(subMonths(new Date(), 11)); setEndDate(new Date()); } },
    { label: "Tất cả", onClick: () => { setStartDate(new Date(2020, 0, 1)); setEndDate(new Date()); } },
  ];

  // Donut data: tỷ lệ sử dụng tiền
  const usageDonutData = [
    { name: "Đã sử dụng", value: stats?.totalUsed || 0 },
    { name: "Còn lại", value: stats?.totalRemaining || 0 },
  ];
  const usagePercent = stats?.totalCash > 0 ? ((stats.totalUsed / stats.totalCash) * 100).toFixed(1) : "0";

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Tổng quan hệ thống quản lý nhà tài trợ</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Năm:</span>
          {YEAR_FILTERS.map((year) => (
            <Button key={year} variant={selectedYear === year ? "default" : "outline"} size="sm"
              onClick={() => setSelectedYear(selectedYear === year ? null : year)}>
              {year}
            </Button>
          ))}
          {selectedYear && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedYear(null)} className="text-muted-foreground">
              Tất cả
            </Button>
          )}
        </div>
      </div>

      {/* Row 1: KPI Cards — 3x2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giá trị tài trợ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.grandTotal || 0)}</div>
            <p className="text-xs text-muted-foreground">Bao gồm tất cả loại hình</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiền mặt nhận được</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCash || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.cashCount || 0} khoản</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiền chưa sử dụng</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.totalRemaining || 0)}</div>
            <p className="text-xs text-muted-foreground">Đã dùng: {formatCurrency(stats?.totalUsed || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiện vật</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalInKind || 0)}</div>
            <p className="text-xs text-muted-foreground">{stats?.inKindCount || 0} khoản</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhà tài trợ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear ? `Tài trợ lần đầu năm ${selectedYear}` : "Tổng số nhà tài trợ"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khoản tài trợ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonations || 0}</div>
            <p className="text-xs text-muted-foreground">Tổng số khoản</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Xu hướng (65%) + Phân loại tài trợ Pie (35%) */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Xu hướng tài trợ</CardTitle>
                <CardDescription>Theo dõi tài trợ theo thời gian</CardDescription>
              </div>
              <div className="flex gap-2">
                {quickFilters.map((filter) => (
                  <Button key={filter.label} variant="outline" size="sm" onClick={filter.onClick}>
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Từ ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Đến ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="py-12 text-center">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" style={{ fontSize: "12px" }} />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} style={{ fontSize: "12px" }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} labelStyle={{ color: "#000" }} />
                  <Legend />
                  <Line type="monotone" dataKey="cash" stroke="#3b82f6" strokeWidth={2} name="Tiền mặt" />
                  <Line type="monotone" dataKey="inKind" stroke="#10b981" strokeWidth={2} name="Hiện vật" />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} name="Tổng" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Phân loại tài trợ</CardTitle>
            <CardDescription>Theo giá trị từng loại hình</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.donationsByType && (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.donationsByType}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) =>
                      `${entry.type}: ${stats.grandTotal > 0 ? ((entry.value / stats.grandTotal) * 100).toFixed(1) : 0}%`
                    }
                  >
                    {stats.donationsByType.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Dòng tiền — FULL WIDTH */}
      <Card>
        <CardHeader>
          <CardTitle>Dòng tiền mặt</CardTitle>
          <CardDescription>Tiền tài trợ, tiền đã sử dụng và tiền còn lại theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="py-12 text-center">Đang tải...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends?.trends || []}>
                <defs>
                  <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" style={{ fontSize: "12px" }} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} style={{ fontSize: "12px" }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const total = payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                        <p className="font-medium mb-1">{label}</p>
                        {payload.map((p: any) => (
                          <p key={p.dataKey} style={{ color: p.color }}>
                            {p.name}: {formatCurrency(p.value)}
                          </p>
                        ))}
                        <p className="border-t mt-1 pt-1 font-semibold">Tổng: {formatCurrency(total)}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="cashUsed" stackId="1" stroke="#ef4444" fill="url(#colorUsed)" name="Đã sử dụng" />
                <Area type="monotone" dataKey="cashRemaining" stackId="1" stroke="#10b981" fill="url(#colorRemaining)" name="Còn lại" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Row 4: Donut (25%) + Tiền theo mục đích (40%) + Hiện vật theo danh mục (35%) */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Donut tỷ lệ sử dụng */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tỷ lệ sử dụng tiền</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={usageDonutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-center text-2xl font-bold mt-2">{usagePercent}%</p>
            <p className="text-center text-xs text-muted-foreground">đã sử dụng</p>
          </CardContent>
        </Card>

        {/* Tiền theo mục đích */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Tiền mặt theo mục đích</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.cashByPurpose?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.cashByPurpose.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} style={{ fontSize: "11px" }} />
                  <YAxis type="category" dataKey="purpose" width={140} style={{ fontSize: "11px" }} tick={{ width: 130 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Giá trị" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Hiện vật theo danh mục */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Hiện vật theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.inKindByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.inKindByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" style={{ fontSize: "11px" }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Giá trị">
                    {stats.inKindByCategory.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Top 10 giá trị (33%) + Top 10 số lần (33%) + Phân bổ NTT theo loại (33%) */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top 10 theo giá trị */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 đóng góp lớn nhất</CardTitle>
            <CardDescription>Nhà tài trợ có tổng giá trị đóng góp cao nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.topDonorsByValue?.slice(0, 10).map((donor: any, index: number) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{donor.fullName}</p>
                      <p className="text-xs text-muted-foreground">{donor.donationCount} khoản</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-sm">{formatCurrency(donor.totalValue)}</p>
                    <Badge variant="outline" className={`text-[10px] ${donorTierColors[donor.tier as DonorTier]}`}>
                      {donorTierLabels[donor.tier as DonorTier]}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(!stats?.topDonorsByValue || stats.topDonorsByValue.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 theo số lần */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 thường xuyên nhất</CardTitle>
            <CardDescription>Nhà tài trợ đóng góp nhiều lần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.topDonorsByFrequency?.slice(0, 10).map((donor: any, index: number) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{donor.fullName}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(donor.totalValue)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-bold text-sm">{donor.donationCount} lần</p>
                    <Badge variant="outline" className={`text-[10px] ${donorTierColors[donor.tier as DonorTier]}`}>
                      {donorTierLabels[donor.tier as DonorTier]}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(!stats?.topDonorsByFrequency || stats.topDonorsByFrequency.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Chưa có dữ liệu</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phân bổ NTT theo loại */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nhà tài trợ theo loại</CardTitle>
            <CardDescription>Cá nhân, Doanh nghiệp, Tổ chức, Cộng đồng</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.donorsByType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={stats.donorsByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label={(entry: any) => {
                      const total = stats.donorsByType.reduce((s: number, d: any) => s + d.count, 0);
                      return `${entry.type}: ${total > 0 ? ((entry.count / total) * 100).toFixed(0) : 0}%`;
                    }}
                  >
                    {stats.donorsByType.map((_: any, index: number) => (
                      <Cell key={index} fill={DONOR_TYPE_COLORS[index % DONOR_TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Cancer Support Stats — full width, 3-4 KPI nhỏ */}
      {stats?.cancerStats && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Hỗ trợ thuốc ung thư
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bệnh nhân đang điều trị</CardTitle>
                <Activity className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancerStats.activePatients}</div>
                <p className="text-xs text-muted-foreground">Đang hoạt động</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chu kỳ hoàn thành</CardTitle>
                <Pill className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancerStats.completedCycles}</div>
                <p className="text-xs text-muted-foreground">Tổng chu kỳ điều trị xong</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng tiền tài trợ thuốc</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.cancerStats.totalSponsorAmount)}</div>
                <p className="text-xs text-muted-foreground">Từ các nhà tài trợ</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
