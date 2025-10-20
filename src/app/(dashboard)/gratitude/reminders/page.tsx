"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ReminderFormDialog, ReminderFormValues } from "@/components/reminders/reminder-form-dialog";

const reminderTypeLabels = {
  BIRTHDAY: "Sinh nhật",
  DONATION_ANNIVERSARY: "Kỷ niệm tài trợ",
  SEND_REPORT: "Gửi báo cáo",
  FOLLOW_UP: "Theo dõi",
  OTHER: "Khác",
};

export default function RemindersPage() {
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reminders", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter === "pending") params.append("completed", "false");
      if (filter === "completed") params.append("completed", "true");
      if (filter === "today") params.append("filter", "today");
      if (filter === "upcoming") params.append("filter", "upcoming");
      if (filter === "overdue") params.append("filter", "overdue");

      const res = await fetch(`/api/reminders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: ReminderFormValues) => {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Thành công",
        description: "Đã tạo nhắc nhở mới",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tạo nhắc nhở",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: true }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Thành công",
        description: "Đã đánh dấu hoàn thành",
      });
    },
  });

  const pendingCount = data?.reminders?.filter((r: any) => !r.isCompleted).length || 0;
  const overdueCount = data?.reminders?.filter(
    (r: any) => !r.isCompleted && new Date(r.dueDate) < new Date()
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nhắc nhở</h2>
          <p className="text-muted-foreground">
            Quản lý các nhắc nhở và công việc
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo nhắc nhở
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa xử lý</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.reminders?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhắc nhở</CardTitle>
          <CardDescription>
            Lọc theo trạng thái
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="today">Hôm nay</TabsTrigger>
              <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
              <TabsTrigger value="overdue">Quá hạn</TabsTrigger>
              <TabsTrigger value="completed">Đã xử lý</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4 mt-4">
              {isLoading ? (
                <div className="py-8 text-center">Đang tải...</div>
              ) : data?.reminders?.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Không có nhắc nhở nào
                </div>
              ) : (
                data?.reminders?.map((reminder: any) => {
                  const isOverdue = !reminder.isCompleted && new Date(reminder.dueDate) < new Date();

                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-start justify-between border-l-4 p-4 rounded-r-lg ${
                        isOverdue
                          ? "border-l-destructive bg-destructive/5"
                          : reminder.isCompleted
                          ? "border-l-green-500 bg-green-50"
                          : "border-l-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{reminder.title}</h4>
                          <Badge variant="outline">
                            {reminderTypeLabels[reminder.type as keyof typeof reminderTypeLabels]}
                          </Badge>
                        </div>
                        {reminder.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {reminder.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className={isOverdue ? "text-destructive font-medium" : ""}>
                            Đến hạn: {formatDate(reminder.dueDate)}
                          </span>
                          {reminder.donor && (
                            <Link
                              href={`/donors/${reminder.donor.id}`}
                              className="text-primary hover:underline"
                            >
                              {reminder.donor.fullName}
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {reminder.isCompleted ? (
                          <Badge variant="secondary">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Đã xử lý
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => completeMutation.mutate(reminder.id)}
                            disabled={completeMutation.isPending}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Hoàn thành
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ReminderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(values) => createMutation.mutate(values)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
