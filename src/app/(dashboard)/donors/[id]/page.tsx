"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/** Parse purpose từ DB (JSON array string hoặc plain string) thành chuỗi hiển thị */
function displayPurpose(purpose: string | undefined | null): string {
  if (!purpose) return "—";
  try {
    const parsed = JSON.parse(purpose);
    if (Array.isArray(parsed)) return parsed.join(", ");
  } catch {}
  return purpose;
}
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
import { Edit, Trash2, ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, Plus, FileText, ExternalLink, ChevronDown, Banknote, Package, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { donorTypeLabels, donorTierLabels, donorTierColors } from "@/types/donor";
import { DonorType, DonorTier } from "@prisma/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { format, isWithinInterval, addDays } from "date-fns";
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
import { ExportPDFButton } from "@/components/reports/export-pdf-button";
import { ThankYouLetterButton } from "@/components/donors/thank-you-letter-button";

export default function DonorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const donorId = params.id as string;
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);

  const { data: contractsData } = useQuery({
    queryKey: ["contracts", donorId],
    queryFn: async () => {
      const res = await fetch(`/api/contracts?donorId=${donorId}&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });

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
    (donor.cashDonations?.length || 0) +
    (donor.inKindDonations?.length || 0) +
    (donor.volunteerDonations?.length || 0);

  // Tính tổng tiền tài trợ (tiền mặt + quy đổi hiện vật + quy đổi tình nguyện)
  const totalCashAmount = (donor.cashDonations || []).reduce(
    (sum: number, d: any) => sum + Number(d.amount || 0), 0
  );
  const totalInKindValue = (donor.inKindDonations || []).reduce(
    (sum: number, d: any) => sum + Number(d.estimatedValue || 0), 0
  );
  const totalVolunteerValue = (donor.volunteerDonations || []).reduce(
    (sum: number, d: any) => sum + Number(d.totalValue || 0), 0
  );
  const totalAmount = totalCashAmount + totalInKindValue + totalVolunteerValue;

  // Tổng đã sử dụng (chỉ tiền mặt có usedAmount)
  const totalUsed = (donor.cashDonations || []).reduce(
    (sum: number, d: any) => sum + Number(d.usedAmount || 0), 0
  );
  const totalRemaining = totalCashAmount - totalUsed;

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
          <ThankYouLetterButton donor={donor} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Thêm tài trợ
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/donations/cash/new?donorId=${donorId}`}>
                  <Banknote className="mr-2 h-4 w-4 text-green-600" />
                  Tài trợ tiền mặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/donations/in-kind/new?donorId=${donorId}`}>
                  <Package className="mr-2 h-4 w-4 text-blue-600" />
                  Tài trợ hiện vật
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/donations/volunteer/new?donorId=${donorId}`}>
                  <Heart className="mr-2 h-4 w-4 text-rose-600" />
                  Tình nguyện
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Thông tin nhà tài trợ + Thống kê */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Card 1: Thông tin nhân khẩu học (span 2 cols) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Thông tin nhà tài trợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {donor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{donor.phone}</span>
                </div>
              )}
              {donor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{donor.email}</span>
                </div>
              )}
              {donor.address && (
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{donor.address}</span>
                </div>
              )}
              {(donor.occupation || donor.company) && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{[donor.occupation, donor.company].filter(Boolean).join(" - ")}</span>
                </div>
              )}
              {donor.position && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{donor.position}</span>
                </div>
              )}
              {donor.birthday && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Sinh nhật: {formatDate(donor.birthday)}</span>
                </div>
              )}
              {donor.firstDonationDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Tài trợ lần đầu: {formatDate(donor.firstDonationDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Số khoản tài trợ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khoản tài trợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDonations}</div>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              {(donor.cashDonations?.length || 0) > 0 && (
                <span>{donor.cashDonations.length} tiền mặt</span>
              )}
              {(donor.inKindDonations?.length || 0) > 0 && (
                <span>{donor.inKindDonations.length} hiện vật</span>
              )}
              {(donor.volunteerDonations?.length || 0) > 0 && (
                <span>{donor.volunteerDonations.length} tình nguyện</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tổng giá trị tài trợ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng giá trị tài trợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalAmount.toString())}</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Đã sử dụng</span>
                <span className="font-medium text-foreground">{formatCurrency(totalUsed.toString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Tiền mặt còn lại</span>
                <span className={cn("font-medium", totalRemaining > 0 ? "text-blue-600" : "text-foreground")}>
                  {formatCurrency(totalRemaining.toString())}
                </span>
              </div>
            </div>
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
          <TabsTrigger value="contracts">
            Hợp đồng ({contractsData?.pagination?.total || 0})
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
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Lịch sử tài trợ</CardTitle>
                <CardDescription>Tất cả các khoản tài trợ từ nhà tài trợ này</CardDescription>
              </div>
              {donor.cashDonations?.length > 0 && (
                <ExportPDFButton
                  donor={donor}
                  donations={donor.cashDonations.map((d: any) => ({
                    receivedDate: d.receivedDate,
                    amount: Number(d.amount),
                    usedAmount: Number(d.usedAmount || 0),
                    purpose: displayPurpose(d.purpose),
                    status: d.status,
                    currency: d.currency,
                    paymentMethod: d.paymentMethod,
                    usageNote: d.usageNote,
                    usageItems: d.usageItems || [],
                  }))}
                  userName="Staff"
                />
              )}
            </CardHeader>
            <CardContent>
              {(() => {
                const cashRows = (donor.cashDonations || []).map((d: any) => ({
                  ...d,
                  _type: "cash" as const,
                  _sortDate: d.receivedDate ? new Date(d.receivedDate) : new Date(0),
                }));
                const inkindRows = (donor.inKindDonations || []).map((d: any) => ({
                  ...d,
                  _type: "inkind" as const,
                  _sortDate: d.createdAt ? new Date(d.createdAt) : new Date(0),
                }));
                const volunteerRows = (donor.volunteerDonations || []).map((d: any) => ({
                  ...d,
                  _type: "volunteer" as const,
                  _sortDate: d.startDate ? new Date(d.startDate) : new Date(0),
                }));
                const allRows = [...cashRows, ...inkindRows, ...volunteerRows].sort(
                  (a, b) => b._sortDate.getTime() - a._sortDate.getTime()
                );

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Mục đích tài trợ</TableHead>
                        <TableHead className="text-right">Giá trị</TableHead>
                        <TableHead className="text-right">Đã sử dụng</TableHead>
                        <TableHead>Mô tả chi tiết</TableHead>
                        <TableHead>Tình trạng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRows.map((row: any) => {
                        if (row._type === "cash") {
                          const amount = Number(row.amount);
                          const used = Number(row.usedAmount || 0);
                          const usageItems: { description: string; amount: number }[] =
                            Array.isArray(row.usageItems) ? row.usageItems : [];
                          return (
                            <TableRow key={`cash-${row.id}`}>
                              <TableCell className="whitespace-nowrap">{formatDate(row.receivedDate)}</TableCell>
                              <TableCell className="font-medium">{displayPurpose(row.purpose)}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatCurrency(row.amount.toString(), row.currency)}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {used > 0 ? formatCurrency(used.toString(), row.currency) : "—"}
                              </TableCell>
                              <TableCell>
                                {usageItems.length > 0 ? (
                                  <ul className="space-y-0.5">
                                    {usageItems.map((item, idx) => (
                                      <li key={idx} className="flex items-start justify-between gap-4 text-xs text-muted-foreground">
                                        <span>• {item.description}</span>
                                        <span className="shrink-0 font-medium text-foreground">
                                          {formatCurrency(item.amount.toString(), row.currency)}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {used <= 0 ? (
                                  <Badge variant="outline" className="whitespace-nowrap">Đã nhận</Badge>
                                ) : used < amount ? (
                                  <Badge variant="outline" className="border-amber-400 text-amber-700 whitespace-nowrap">Dùng một phần</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-700 whitespace-nowrap">Đã dùng hết</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        if (row._type === "inkind") {
                          return (
                            <TableRow key={`inkind-${row.id}`}>
                              <TableCell className="whitespace-nowrap">{formatDate(row.createdAt)}</TableCell>
                              <TableCell className="font-medium">
                                {row.itemName} ({row.quantity} {row.unit})
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {formatCurrency(row.estimatedValue.toString())}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-muted-foreground">—</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-muted-foreground text-sm">—</span>
                              </TableCell>
                              <TableCell>
                                {row.distributionStatus === "PENDING" && (
                                  <Badge variant="outline" className="whitespace-nowrap">Chờ nhận</Badge>
                                )}
                                {row.distributionStatus === "RECEIVED" && (
                                  <Badge variant="outline" className="border-amber-400 text-amber-700 whitespace-nowrap">Đã nhận</Badge>
                                )}
                                {row.distributionStatus === "DISTRIBUTED" && (
                                  <Badge variant="outline" className="border-green-500 text-green-700 whitespace-nowrap">Đã phân phối</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // volunteer
                        return (
                          <TableRow key={`volunteer-${row.id}`}>
                            <TableCell className="whitespace-nowrap">{formatDate(row.startDate)}</TableCell>
                            <TableCell className="font-medium">
                              {row.workType} - {row.hours} giờ
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {formatCurrency(row.totalValue.toString())}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">—</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">—</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground text-sm">—</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {totalDonations === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            Chưa có khoản tài trợ nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                );
              })()}
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

        {/* Tab: Hợp đồng */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hợp đồng tài trợ</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/contracts/new?donorId=${donorId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo hợp đồng
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {contractsData?.contracts?.length > 0 ? (
                <div className="space-y-3">
                  {contractsData.contracts.map((contract: any) => {
                    const statusColors: Record<string, string> = {
                      DRAFT: "bg-gray-100 text-gray-700",
                      ACTIVE: "bg-green-100 text-green-700",
                      EXPIRED: "bg-red-100 text-red-700",
                      TERMINATED: "bg-slate-100 text-slate-700",
                    };
                    const statusLabels: Record<string, string> = {
                      DRAFT: "Nháp",
                      ACTIVE: "Đang hiệu lực",
                      EXPIRED: "Hết hạn",
                      TERMINATED: "Đã thanh lý",
                    };
                    const isExpiringSoon = contract.status === "ACTIVE" && contract.endDate &&
                      isWithinInterval(new Date(contract.endDate), { start: new Date(), end: addDays(new Date(), 30) });
                    return (
                      <div key={contract.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{contract.contractNumber}</p>
                            <p className="text-sm text-muted-foreground">{contract.purpose}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                              <span>Ký: {format(new Date(contract.signedDate), "dd/MM/yyyy")}</span>
                              {contract.endDate && (
                                <span className={isExpiringSoon ? "text-yellow-600 font-medium" : ""}>
                                  Hết hạn: {format(new Date(contract.endDate), "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(contract.committedAmount)}</p>
                            <Badge className={statusColors[contract.status]}>
                              {statusLabels[contract.status]}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            {contract.fileUrl && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/contracts/${contract.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Chưa có hợp đồng nào</p>
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
