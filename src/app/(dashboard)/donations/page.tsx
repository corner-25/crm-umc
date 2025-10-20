"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, Plus } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function DonationsPage() {
  const { data: stats } = useQuery({
    queryKey: ["donation-stats"],
    queryFn: async () => {
      const [cash, inKind, volunteer] = await Promise.all([
        fetch("/api/donations/cash?limit=1").then((r) => r.json()),
        fetch("/api/donations/in-kind?limit=1").then((r) => r.json()),
        fetch("/api/donations/volunteer?limit=1").then((r) => r.json()),
      ]);
      return {
        cash: cash.pagination?.total || 0,
        inKind: inKind.pagination?.total || 0,
        volunteer: volunteer.pagination?.total || 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quản lý tài trợ</h2>
        <p className="text-muted-foreground">
          Theo dõi và quản lý tất cả các khoản tài trợ
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tài trợ tiền mặt
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cash || 0}</div>
            <p className="text-xs text-muted-foreground">
              Khoản tài trợ bằng tiền
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href="/donations/cash">
                Xem chi tiết
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tài trợ hiện vật
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inKind || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vật phẩm, thiết bị, thuốc
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href="/donations/in-kind">
                Xem chi tiết
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tình nguyện viên
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.volunteer || 0}</div>
            <p className="text-xs text-muted-foreground">
              Đóng góp thời gian, công sức
            </p>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href="/donations/volunteer">
                Xem chi tiết
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm tài trợ mới</CardTitle>
          <CardDescription>
            Chọn loại tài trợ để bắt đầu ghi nhận
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href="/donations/cash/new">
              <Plus className="mr-2 h-4 w-4" />
              Tiền mặt
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/donations/in-kind/new">
              <Plus className="mr-2 h-4 w-4" />
              Hiện vật
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/donations/volunteer/new">
              <Plus className="mr-2 h-4 w-4" />
              Tình nguyện
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
