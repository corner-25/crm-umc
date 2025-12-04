"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Pill, Activity, ArrowRight } from "lucide-react";

export default function CancerSupportPage() {
  const router = useRouter();

  const modules = [
    {
      title: "Người bệnh",
      description: "Quản lý thông tin bệnh nhân ung thư",
      icon: Users,
      href: "/cancer-support/patients",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Thuốc",
      description: "Quản lý thuốc và chính sách tài trợ",
      icon: Pill,
      href: "/cancer-support/medications",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Theo dõi",
      description: "Theo dõi chu kỳ điều trị và nhắc nhở",
      icon: Activity,
      href: "/cancer-support/tracking",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chương trình Hỗ trợ Ung thư</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý và theo dõi chương trình hỗ trợ thuốc cho bệnh nhân ung thư
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.href)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <CardTitle>{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between group">
                  Truy cập
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giới thiệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">📋 Quản lý Người bệnh</h4>
            <p className="text-sm text-muted-foreground">
              Lưu trữ đầy đủ thông tin bệnh nhân bao gồm: mã bệnh nhân, thông tin cá nhân,
              tình trạng điều trị và lịch sử chu kỳ điều trị.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">💊 Quản lý Thuốc</h4>
            <p className="text-sm text-muted-foreground">
              Quản lý thông tin thuốc, đơn giá, chu kỳ sử dụng và chính sách tài trợ
              (Mua 1 Tặng 1, Mua 2 Tặng 1). Liên kết với nhiều nhà tài trợ.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">📊 Theo dõi & Nhắc nhở</h4>
            <p className="text-sm text-muted-foreground">
              Tự động tính toán chu kỳ tiếp theo, nhắc nhở chu kỳ sắp đến,
              theo dõi tình trạng tài trợ và thống kê tổng quan chương trình.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
