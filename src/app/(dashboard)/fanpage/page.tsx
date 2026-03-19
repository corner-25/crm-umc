"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Plus, Facebook, CalendarDays,
  CheckCircle2, Clock, XCircle, Pencil, Trash2, Users, Eye,
  ThumbsUp, MessageCircle, Share2, Send, RefreshCw, ExternalLink,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isToday, isSameDay, addMonths, subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  SCHEDULED: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
  PUBLISHED: { label: "Đã đăng", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

// ============================
// TAB 1: TỔNG QUAN
// ============================
function OverviewTab() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["fb-insights"],
    queryFn: async () => {
      const res = await fetch("/api/fanpage/insights");
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu từ Facebook...</div>;
  if (error) return (
    <div className="py-12 text-center">
      <p className="text-destructive mb-2">Lỗi: {(error as Error).message}</p>
      <Button variant="outline" onClick={() => refetch()}>Thử lại</Button>
    </div>
  );

  const { page, insights } = data;
  const last7 = (arr: any[]) => arr.slice(-7).reduce((s: number, v: any) => s + (v.value || 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {page.picture && <img src={page.picture} className="w-16 h-16 rounded-full border" alt={page.name} />}
            <div>
              <h3 className="text-xl font-bold">{page.name}</h3>
              <p className="text-muted-foreground text-sm">ID: {page.id}</p>
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người theo dõi</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(page.fanCount || 0)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(page.followersCount || 0)} followers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reach 7 ngày</CardTitle>
            <Eye className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatNumber(last7(insights.reach))}</div>
            <p className="text-xs text-muted-foreground">người tiếp cận</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tương tác 7 ngày</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(last7(insights.engagedUsers))}</div>
            <p className="text-xs text-muted-foreground">người tương tác</p>
          </CardContent>
        </Card>
      </div>

      {insights.reach.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reach theo ngày (14 ngày gần nhất)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.reach.slice(-14).map((v: any, i: number) => {
                const max = Math.max(...insights.reach.slice(-14).map((x: any) => x.value || 0));
                const pct = max > 0 ? ((v.value || 0) / max) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-20 text-muted-foreground shrink-0">
                      {format(new Date(v.end_time), "dd/MM")}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-right font-medium">{formatNumber(v.value || 0)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================
// TAB 2: BÀI ĐĂNG THẬT
// ============================
function FbPostsTab() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["fb-real-posts"],
    queryFn: async () => {
      const res = await fetch("/api/fanpage/fb-posts?limit=20&insights=true");
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Đang tải bài đăng từ Facebook...</div>;
  if (error) return (
    <div className="py-12 text-center">
      <p className="text-destructive mb-2">Lỗi: {(error as Error).message}</p>
      <Button variant="outline" onClick={() => refetch()}>Thử lại</Button>
    </div>
  );

  const posts = data?.posts || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
          Làm mới
        </Button>
      </div>
      {posts.length === 0 && <p className="text-center text-muted-foreground py-8">Không có bài đăng nào</p>}
      {posts.map((post: any) => (
        <Card key={post.id}>
          <CardContent className="pt-4">
            <div className="flex gap-4">
              {post.full_picture && (
                <img src={post.full_picture} className="w-24 h-24 rounded object-cover shrink-0" alt="" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">
                  {format(new Date(post.created_time), "HH:mm - dd/MM/yyyy")}
                </p>
                <p className="text-sm line-clamp-3">{post.message || post.story || "(Không có nội dung)"}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-purple-500" />
                    <span className="font-medium text-foreground">{formatNumber(post.reach)}</span> reach
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-blue-500" />
                    <span className="font-medium text-foreground">{formatNumber(post.likeCount)}</span> like
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3 text-green-500" />
                    <span className="font-medium text-foreground">{formatNumber(post.commentCount)}</span> bình luận
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3 text-orange-500" />
                    <span className="font-medium text-foreground">{formatNumber(post.shareCount)}</span> chia sẻ
                  </span>
                </div>
              </div>
              {post.permalink_url && (
                <a href={post.permalink_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================
// TAB 3: HỘP THƯ MESSENGER
// ============================
function MessengerTab() {
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messageText, setMessageText] = useState("");

  const { data: convData, isLoading: loadingConvs, refetch: refetchConvs } = useQuery({
    queryKey: ["fb-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/fanpage/conversations");
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const queryClient = useQueryClient();

  const { data: msgData, isLoading: loadingMsgs } = useQuery({
    queryKey: ["fb-messages", selectedConv?.id],
    queryFn: async () => {
      const res = await fetch(`/api/fanpage/conversations/${selectedConv.id}/messages`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    enabled: !!selectedConv,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const recipientId = selectedConv?.user?.id;
      if (!recipientId) throw new Error("Không xác định được người nhận");
      const res = await fetch(`/api/fanpage/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, text: messageText }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["fb-messages", selectedConv?.id] });
      refetchConvs();
    },
    onError: (err: any) => {
      alert("Lỗi gửi tin nhắn: " + err.message);
    },
  });

  const conversations = convData?.conversations || [];
  const messages = msgData?.messages || [];

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Danh sách conversations */}
      <Card className="w-80 shrink-0 flex flex-col">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">Tin nhắn</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetchConvs()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {loadingConvs && <p className="text-center text-sm text-muted-foreground py-4">Đang tải...</p>}
          {conversations.length === 0 && !loadingConvs && (
            <p className="text-center text-sm text-muted-foreground py-4">Chưa có tin nhắn</p>
          )}
          {conversations.map((conv: any) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                "px-4 py-3 cursor-pointer border-b hover:bg-muted/50 transition-colors",
                selectedConv?.id === conv.id && "bg-muted"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate">{conv.user?.name || "Người dùng Facebook"}</span>
                {conv.unreadCount > 0 && (
                  <Badge className="h-4 text-[10px] px-1 bg-blue-600">{conv.unreadCount}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.snippet}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format(new Date(conv.updatedTime), "HH:mm dd/MM")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Khung chat */}
      <Card className="flex-1 flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Chọn một cuộc trò chuyện để xem tin nhắn
          </div>
        ) : (
          <>
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-sm">{selectedConv.user?.name || "Người dùng Facebook"}</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs && <p className="text-center text-sm text-muted-foreground">Đang tải tin nhắn...</p>}
              {messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex", msg.isFromPage ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                    msg.isFromPage ? "bg-blue-600 text-white rounded-br-sm" : "bg-muted rounded-bl-sm"
                  )}>
                    <p>{msg.message}</p>
                    <p className={cn("text-[10px] mt-1", msg.isFromPage ? "text-blue-200" : "text-muted-foreground")}>
                      {format(new Date(msg.createdTime), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input
                placeholder="Nhập tin nhắn... (Enter để gửi)"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && messageText.trim()) {
                    e.preventDefault();
                    sendMutation.mutate();
                  }
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                disabled={!messageText.trim() || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// ============================
// TAB 4: LỊCH ĐĂNG BÀI
// ============================
function ScheduleTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [form, setForm] = useState({ title: "", scheduledAt: "", content: "", status: "SCHEDULED" });

  const { data } = useQuery({
    queryKey: ["fanpage-posts", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const res = await fetch(`/api/fanpage/posts?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const posts: any[] = data?.posts || [];

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/fanpage/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fanpage-posts"] }); toast({ title: "Đã thêm lịch đăng bài" }); setIsDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await fetch(`/api/fanpage/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fanpage-posts"] }); toast({ title: "Đã cập nhật" }); setIsDialogOpen(false); setEditingPost(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fanpage/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fanpage-posts"] }); toast({ title: "Đã xoá lịch đăng bài" }); },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...days];
  const getPostsForDay = (day: Date) => posts.filter((p) => isSameDay(new Date(p.scheduledAt), day));

  const openNew = (day?: Date) => {
    setEditingPost(null);
    setForm({ title: "", scheduledAt: day ? format(day, "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"), content: "", status: "SCHEDULED" });
    setIsDialogOpen(true);
  };
  const openEdit = (post: any) => {
    setEditingPost(post);
    setForm({ title: post.title, scheduledAt: format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm"), content: post.content || "", status: post.status });
    setIsDialogOpen(true);
  };
  const handleSave = () => {
    if (!form.title || !form.scheduledAt) { toast({ variant: "destructive", title: "Vui lòng điền tiêu đề và ngày giờ" }); return; }
    if (editingPost) updateMutation.mutate({ id: editingPost.id, ...form });
    else createMutation.mutate(form);
  };

  const scheduled = posts.filter((p) => p.status === "SCHEDULED").length;
  const published = posts.filter((p) => p.status === "PUBLISHED").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />Thêm lịch đăng bài</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tháng này</CardTitle><CalendarDays className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{posts.length}</div><p className="text-xs text-muted-foreground">bài lên lịch</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Đã đăng</CardTitle><CheckCircle2 className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{published}</div><p className="text-xs text-muted-foreground">bài trong tháng</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chờ đăng</CardTitle><Clock className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{scheduled}</div><p className="text-xs text-muted-foreground">bài đã lên lịch</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy", { locale: vi })}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Hôm nay</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-t">
            {paddedDays.map((day, i) => {
              const dayPosts = day ? getPostsForDay(day) : [];
              return (
                <div key={i} onClick={() => day && setSelectedDay(day)} className={cn("min-h-[90px] border-r border-b p-1 cursor-pointer transition-colors", day ? "hover:bg-slate-50" : "bg-slate-50/50", day && isToday(day) && "bg-blue-50", day && selectedDay && isSameDay(day, selectedDay) && "ring-2 ring-inset ring-primary")}>
                  {day && (<>
                    <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday(day) && "bg-primary text-white")}>{format(day, "d")}</div>
                    <div className="space-y-1">
                      {dayPosts.slice(0, 2).map((p) => (
                        <div key={p.id} onClick={(e) => { e.stopPropagation(); openEdit(p); }} className={cn("text-[10px] px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80", STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG]?.color)}>
                          {format(new Date(p.scheduledAt), "HH:mm")} {p.title}
                        </div>
                      ))}
                      {dayPosts.length > 2 && <div className="text-[10px] text-muted-foreground pl-1">+{dayPosts.length - 2} bài</div>}
                    </div>
                  </>)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{format(selectedDay, "EEEE, dd/MM/yyyy", { locale: vi })}</CardTitle>
              <Button size="sm" onClick={() => openNew(selectedDay)}><Plus className="h-4 w-4 mr-1" /> Thêm bài</Button>
            </div>
          </CardHeader>
          <CardContent>
            {getPostsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có bài nào hôm này</p>
            ) : (
              <div className="space-y-3">
                {getPostsForDay(selectedDay).map((post) => {
                  const cfg = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
                  const Icon = cfg?.icon || Clock;
                  return (
                    <div key={post.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{format(new Date(post.scheduledAt), "HH:mm")}</span>
                          <Badge variant="outline" className={cn("text-xs", cfg?.color)}><Icon className="h-3 w-3 mr-1" />{cfg?.label}</Badge>
                        </div>
                        <p className="text-sm font-medium">{post.title}</p>
                        {post.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(post.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingPost ? "Chỉnh sửa lịch đăng bài" : "Thêm lịch đăng bài"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Tiêu đề *</label><Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Ngày giờ đăng *</label><Input className="mt-1" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Nội dung (tuỳ chọn)</label><Textarea className="mt-1" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Trạng thái</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Đã lên lịch</SelectItem>
                  <SelectItem value="PUBLISHED">Đã đăng</SelectItem>
                  <SelectItem value="CANCELLED">Huỷ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingPost(null); }}>Huỷ</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>{editingPost ? "Lưu thay đổi" : "Thêm lịch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================
// MAIN PAGE
// ============================
export default function FanpagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Facebook className="h-8 w-8 text-blue-600" />
          Fanpage
        </h2>
        <p className="text-muted-foreground">Quản lý Fanpage Facebook và hộp thư Messenger</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="posts">Bài đăng thật</TabsTrigger>
          <TabsTrigger value="messenger">Hộp thư</TabsTrigger>
          <TabsTrigger value="schedule">Lịch đăng</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6"><OverviewTab /></TabsContent>
        <TabsContent value="posts" className="mt-6"><FbPostsTab /></TabsContent>
        <TabsContent value="messenger" className="mt-6"><MessengerTab /></TabsContent>
        <TabsContent value="schedule" className="mt-6"><ScheduleTab /></TabsContent>
      </Tabs>
    </div>
  );
}
