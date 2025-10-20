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
import { DollarSign, Users, TrendingUp, Gift, Heart, Coins, CalendarIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { donorTierColors, donorTierLabels } from "@/types/donor";
import { DonorTier } from "@prisma/client";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subMonths } from "date-fns";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 5));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
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
    {
      label: "6 tháng",
      onClick: () => {
        setStartDate(subMonths(new Date(), 5));
        setEndDate(new Date());
      },
    },
    {
      label: "1 năm",
      onClick: () => {
        setStartDate(subMonths(new Date(), 11));
        setEndDate(new Date());
      },
    },
    {
      label: "Tất cả",
      onClick: () => {
        setStartDate(new Date(2020, 0, 1));
        setEndDate(new Date());
      },
    },
  ];

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản lý nhà tài trợ
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng giá trị tài trợ
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.grandTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bao gồm tất cả loại hình
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiền mặt
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalCash || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.cashCount || 0} khoản
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hiện vật
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalInKind || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inKindCount || 0} khoản
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tình nguyện
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalVolunteer || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.volunteerCount || 0} khoản
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nhà tài trợ
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonors || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số nhà tài trợ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khoản tài trợ
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDonations || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số khoản
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart with Date Range */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Xu hướng tài trợ</CardTitle>
              <CardDescription>
                Theo dõi tài trợ theo thời gian
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="outline"
                  size="sm"
                  onClick={filter.onClick}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Từ ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Đến ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <div className="py-12 text-center">Đang tải...</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  style={{ fontSize: "12px" }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cash"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Tiền mặt"
                />
                <Line
                  type="monotone"
                  dataKey="inKind"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Hiện vật"
                />
                <Line
                  type="monotone"
                  dataKey="volunteer"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Tình nguyện"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  name="Tổng"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân loại tài trợ</CardTitle>
            <CardDescription>
              Theo giá trị từng loại hình
            </CardDescription>
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
                    outerRadius={100}
                    label={(entry: any) =>
                      `${entry.type}: ${((entry.value / stats.grandTotal) * 100).toFixed(1)}%`
                    }
                  >
                    {stats.donationsByType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 nhà tài trợ</CardTitle>
            <CardDescription>
              Theo tổng giá trị tài trợ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topDonors?.slice(0, 5).map((donor: any, index: number) => (
                <Link
                  key={donor.id}
                  href={`/donors/${donor.id}`}
                  className="flex items-center justify-between hover:bg-slate-50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{donor.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {donor.donationCount} khoản tài trợ
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(donor.totalValue)}</p>
                    <Badge
                      variant="outline"
                      className={donorTierColors[donor.tier as DonorTier]}
                    >
                      {donorTierLabels[donor.tier as DonorTier]}
                    </Badge>
                  </div>
                </Link>
              ))}
              {(!stats?.topDonors || stats.topDonors.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  Chưa có dữ liệu
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
