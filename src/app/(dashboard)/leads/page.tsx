"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Phone, Mail, ChevronRight, MoreVertical, MessageSquare, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = [
  { key: "NEW",         label: "Mới tiếp cận",      color: "bg-slate-100",  badge: "bg-slate-200 text-slate-700" },
  { key: "CONTACTED",   label: "Đã liên hệ",         color: "bg-blue-50",    badge: "bg-blue-100 text-blue-700" },
  { key: "INTERESTED",  label: "Quan tâm",            color: "bg-yellow-50",  badge: "bg-yellow-100 text-yellow-700" },
  { key: "NEGOTIATING", label: "Đang thương lượng",  color: "bg-orange-50",  badge: "bg-orange-100 text-orange-700" },
  { key: "CONVERTED",   label: "Đã chuyển đổi",      color: "bg-green-50",   badge: "bg-green-100 text-green-700" },
  { key: "LOST",        label: "Không thành",         color: "bg-red-50",     badge: "bg-red-100 text-red-700" },
];

const SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  ZALO: "Zalo",
  REFERRAL: "Giới thiệu",
  EVENT: "Sự kiện",
  WEBSITE: "Website",
  COLD_CALL: "Gọi trực tiếp",
  OTHER: "Khác",
};

const NEXT_STAGES: Record<string, string> = {
  NEW: "CONTACTED",
  CONTACTED: "INTERESTED",
  INTERESTED: "NEGOTIATING",
  NEGOTIATING: "CONVERTED",
};

export default function LeadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["leads", search, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      const res = await fetch(`/api/leads?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, leadStatus }: { id: string; leadStatus: string }) => {
      const body: any = { leadStatus };
      if (leadStatus === "CONVERTED") {
        body.convertedAt = new Date().toISOString();
        body.leadStatus = "CONVERTED";
      }
      const res = await fetch(`/api/donors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: (_, { leadStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: leadStatus === "CONVERTED"
          ? "Chuyển đổi thành công! Lead đã trở thành nhà tài trợ."
          : "Cập nhật trạng thái thành công",
      });
    },
    onError: () => {
      toast({ title: "Lỗi khi cập nhật", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý Lead</h2>
          <p className="text-muted-foreground">Pipeline chuyển đổi nhà tài trợ tiềm năng</p>
        </div>
        <Button asChild>
          <Link href="/donors/new?isLead=true">
            <Plus className="mr-2 h-4 w-4" />
            Thêm lead mới
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid gap-3 grid-cols-3 md:grid-cols-6">
          {STAGES.map((stage) => (
            <Card key={stage.key} className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold">{data.pipeline?.[stage.key]?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{stage.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, email, điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Nguồn tiếp cận" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nguồn</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Pipeline */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const leads = data?.pipeline?.[stage.key] ?? [];
            return (
              <div key={stage.key} className={`rounded-lg ${stage.color} p-3 min-h-[200px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge className={stage.badge}>{leads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {leads.map((lead: any) => (
                    <div key={lead.id} className="bg-white rounded-md p-3 shadow-sm border">
                      <div className="flex items-start justify-between gap-1">
                        <Link href={`/donors/${lead.id}`} className="font-medium text-sm hover:underline line-clamp-1">
                          {lead.fullName}
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {NEXT_STAGES[stage.key] && (
                              <DropdownMenuItem
                                onClick={() => updateStageMutation.mutate({ id: lead.id, leadStatus: NEXT_STAGES[stage.key] })}
                              >
                                <ChevronRight className="mr-2 h-4 w-4" />
                                Chuyển: {STAGES.find(s => s.key === NEXT_STAGES[stage.key])?.label}
                              </DropdownMenuItem>
                            )}
                            {stage.key !== "CONVERTED" && stage.key !== "LOST" && (
                              <DropdownMenuItem
                                onClick={() => updateStageMutation.mutate({ id: lead.id, leadStatus: "LOST" })}
                                className="text-destructive"
                              >
                                Không chuyển đổi được
                              </DropdownMenuItem>
                            )}
                            {stage.key === "NEGOTIATING" && (
                              <DropdownMenuItem
                                onClick={() => updateStageMutation.mutate({ id: lead.id, leadStatus: "CONVERTED" })}
                                className="text-green-600"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Chuyển đổi thành donor
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/donors/${lead.id}/edit`}>
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {lead.leadSource && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {SOURCE_LABELS[lead.leadSource]}
                        </Badge>
                      )}

                      <div className="mt-2 space-y-1">
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead._count?.interactions > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {lead._count.interactions} tương tác
                          </div>
                        )}
                      </div>

                      {lead.leadNote && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 border-t pt-2">
                          {lead.leadNote}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(lead.createdAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                  ))}

                  {leads.length === 0 && (
                    <p className="text-xs text-center text-muted-foreground py-4">Trống</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
