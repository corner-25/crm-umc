"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Bell, Printer } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

export default function GratitudePage() {
  const { data: stats } = useQuery({
    queryKey: ["gratitude-stats"],
    queryFn: async () => {
      const [templates, reminders] = await Promise.all([
        fetch("/api/emails/templates").then((r) => r.json()),
        fetch("/api/reminders").then((r) => r.json()),
      ]);
      return {
        templates: templates.templates?.length || 0,
        reminders: reminders.reminders?.filter((r: any) => !r.isCompleted).length || 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tri ân nhà tài trợ</h2>
        <p className="text-muted-foreground">
          In thư cảm ơn và quản lý nhắc nhở
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In thư cảm ơn</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Soạn và in thư cảm ơn dựa trên mẫu, tuỳ chỉnh trước khi in
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/gratitude/thank-you-letter">
                <Printer className="mr-2 h-4 w-4" />
                In thư cảm ơn
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mẫu thư cảm ơn</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.templates || 0}</div>
            <p className="text-xs text-muted-foreground mb-4">
              Mẫu thư có sẵn
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/gratitude/templates">
                Quản lý mẫu
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhắc nhở</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reminders || 0}</div>
            <p className="text-xs text-muted-foreground mb-4">
              Nhắc nhở đang chờ
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link href="/gratitude/reminders">
                Xem nhắc nhở
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động tri ân</CardTitle>
          <CardDescription>
            Các công cụ để duy trì mối quan hệ với nhà tài trợ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Printer className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Thư cảm ơn tuỳ chỉnh</h3>
              <p className="text-sm text-muted-foreground">
                Chọn mẫu thư, tuỳ chỉnh nội dung, review rồi mới in
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Mẫu thư đa dạng</h3>
              <p className="text-sm text-muted-foreground">
                Tạo và quản lý mẫu thư cho từng dịp: cảm ơn, sinh nhật, kỷ niệm
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Nhắc nhở thông minh</h3>
              <p className="text-sm text-muted-foreground">
                Cảnh báo hàng sắp hết hạn, sinh nhật và ngày kỷ niệm tài trợ lần đầu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
