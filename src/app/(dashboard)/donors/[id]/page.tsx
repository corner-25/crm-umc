"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { donorTypeLabels, donorTierLabels, donorTierColors } from "@/types/donor";
import { DonorType, DonorTier } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InteractionFormDialog, InteractionFormValues } from "@/components/interactions/interaction-form-dialog";
import { InteractionTimeline } from "@/components/interactions/interaction-timeline";

export default function DonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const donorId = params.id as string;
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);

  const { data: donor, isLoading } = useQuery({
    queryKey: ["donor", donorId],
    queryFn: async () => {
      const res = await fetch(`/api/donors/${donorId}`);
      if (!res.ok) throw new Error("Failed to fetch donor");
      return res.json();
    },
  });

  // Fetch interactions
  const { data: interactionsData } = useQuery({
    queryKey: ["interactions", donorId],
    queryFn: async () => {
      const res = await fetch(`/api/interactions?donorId=${donorId}`);
      if (!res.ok) throw new Error("Failed to fetch interactions");
      return res.json();
    },
  });

  // Create interaction mutation
  const createInteractionMutation = useMutation({
    mutationFn: async (values: InteractionFormValues) => {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          donorId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm tương tác mới",
      });
      queryClient.invalidateQueries({ queryKey: ["interactions", donorId] });
      setInteractionDialogOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm tương tác",
      });
    },
  });

  // Delete interaction mutation
  const deleteInteractionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/interactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa tương tác",
      });
      queryClient.invalidateQueries({ queryKey: ["interactions", donorId] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa tương tác",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/donors/${donorId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete donor");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã xóa nhà tài trợ",
      });
      router.push("/donors");
      router.refresh();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa. Vui lòng thử lại.",
      });
    },
  });

  if (isLoading) {
    return <div className="py-8 text-center">Đang tải...</div>;
  }

  if (!donor) {
    return <div className="py-8 text-center">Không tìm thấy nhà tài trợ</div>;
  }

  const totalDonations =
    donor._count?.cashDonations +
    donor._count?.inKindDonations +
    donor._count?.volunteerDonations || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/donors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{donor.fullName}</h2>
            <p className="text-muted-foreground">
              {donorTypeLabels[donor.type as DonorType]} -{" "}
              <Badge variant="outline" className={donorTierColors[donor.tier as DonorTier]}>
                {donorTierLabels[donor.tier as DonorTier]}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/donors/${donorId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa nhà tài trợ này? Thao tác này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {donor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {donor.phone}
              </div>
            )}
            {donor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {donor.email}
              </div>
            )}
            {donor.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {donor.address}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Công việc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {donor.occupation && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                {donor.occupation}
              </div>
            )}
            {donor.company && <div className="text-sm">{donor.company}</div>}
            {donor.position && <div className="text-sm text-muted-foreground">{donor.position}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ngày quan trọng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {donor.birthday && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Sinh nhật: {formatDate(donor.birthday)}
              </div>
            )}
            {donor.firstDonationDate && (
              <div className="text-sm">
                Tài trợ lần đầu: {formatDate(donor.firstDonationDate)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Thống kê</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{totalDonations}</div>
            <p className="text-sm text-muted-foreground">Tổng số khoản tài trợ</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="donations">
            Lịch sử tài trợ ({totalDonations})
          </TabsTrigger>
          <TabsTrigger value="interactions">
            Tương tác ({donor.interactions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="emails">
            Email đã gửi ({donor.emailLogs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reminders">
            Nhắc nhở ({donor.reminders?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Thông tin */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {donor.personalInterests && (
                <div>
                  <h4 className="mb-2 font-medium">Sở thích cá nhân</h4>
                  <p className="text-sm text-muted-foreground">{donor.personalInterests}</p>
                </div>
              )}
              {donor.areasOfInterest && donor.areasOfInterest.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">Lĩnh vực quan tâm</h4>
                  <div className="flex flex-wrap gap-2">
                    {donor.areasOfInterest.map((area: string) => (
                      <Badge key={area} variant="secondary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {donor.notes && (
                <div>
                  <h4 className="mb-2 font-medium">Ghi chú</h4>
                  <p className="text-sm text-muted-foreground">{donor.notes}</p>
                </div>
              )}
              {donor.manager && (
                <div>
                  <h4 className="mb-2 font-medium">Người phụ trách</h4>
                  <p className="text-sm">{donor.manager.name || donor.manager.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lịch sử tài trợ */}
        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử tài trợ</CardTitle>
              <CardDescription>Tất cả các khoản tài trợ từ nhà tài trợ này</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead className="text-right">Giá trị</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donor.cashDonations?.map((donation: any) => (
                    <TableRow key={`cash-${donation.id}`}>
                      <TableCell>
                        <Badge>Tiền mặt</Badge>
                      </TableCell>
                      <TableCell>{donation.purpose}</TableCell>
                      <TableCell>{formatDate(donation.receivedDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(donation.amount.toString(), donation.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {donor.inKindDonations?.map((donation: any) => (
                    <TableRow key={`inkind-${donation.id}`}>
                      <TableCell>
                        <Badge variant="secondary">Hiện vật</Badge>
                      </TableCell>
                      <TableCell>
                        {donation.itemName} ({donation.quantity} {donation.unit})
                      </TableCell>
                      <TableCell>{formatDate(donation.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(donation.estimatedValue.toString())}
                      </TableCell>
                    </TableRow>
                  ))}
                  {donor.volunteerDonations?.map((donation: any) => (
                    <TableRow key={`volunteer-${donation.id}`}>
                      <TableCell>
                        <Badge variant="outline">Tình nguyện</Badge>
                      </TableCell>
                      <TableCell>
                        {donation.workType} - {donation.hours} giờ
                      </TableCell>
                      <TableCell>{formatDate(donation.startDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(donation.totalValue.toString())}
                      </TableCell>
                    </TableRow>
                  ))}
                  {totalDonations === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Chưa có khoản tài trợ nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tương tác */}
        <TabsContent value="interactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lịch sử tương tác</CardTitle>
                  <CardDescription>Các cuộc gọi, email, gặp mặt, sự kiện</CardDescription>
                </div>
                <Button onClick={() => setInteractionDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm tương tác
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <InteractionTimeline
                interactions={interactionsData?.interactions || []}
                onDelete={(id) => deleteInteractionMutation.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Email */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Email đã gửi</CardTitle>
            </CardHeader>
            <CardContent>
              {donor.emailLogs && donor.emailLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donor.emailLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.sentAt)}</TableCell>
                        <TableCell>{log.subject}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === "SENT" ? "default" : "destructive"}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground">Chưa gửi email nào</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Nhắc nhở */}
        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Nhắc nhở</CardTitle>
            </CardHeader>
            <CardContent>
              {donor.reminders && donor.reminders.length > 0 ? (
                <div className="space-y-4">
                  {donor.reminders.map((reminder: any) => (
                    <div key={reminder.id} className="flex items-start justify-between border-b pb-4">
                      <div>
                        <h4 className="font-medium">{reminder.title}</h4>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Đến hạn: {formatDate(reminder.dueDate)}
                        </p>
                      </div>
                      <Badge variant={reminder.isCompleted ? "secondary" : "default"}>
                        {reminder.isCompleted ? "Đã xử lý" : "Chưa xử lý"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Không có nhắc nhở nào</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InteractionFormDialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
        onSubmit={(values) => createInteractionMutation.mutate(values)}
        isLoading={createInteractionMutation.isPending}
      />
    </div>
  );
}
