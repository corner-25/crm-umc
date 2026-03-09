"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Send, Facebook, Phone, ExternalLink, CheckCheck,
  RefreshCw, User, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  FACEBOOK: <Facebook className="h-3 w-3 text-blue-600" />,
  ZALO: <span className="text-xs font-bold text-blue-500">Z</span>,
  EMAIL: <span className="text-xs text-gray-500">@</span>,
};

const CHANNEL_COLORS: Record<string, string> = {
  FACEBOOK: "bg-blue-100 text-blue-700",
  ZALO: "bg-cyan-100 text-cyan-700",
  EMAIL: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Đang mở",
  RESOLVED: "Đã xử lý",
  SPAM: "Spam",
};

export default function InboxPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Danh sách conversations - polling mỗi 10s
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ["inbox-conversations", search, channelFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter });
      if (search) params.set("search", search);
      if (channelFilter !== "all") params.set("channel", channelFilter);
      const res = await fetch(`/api/inbox/conversations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 10000,
  });

  // Chi tiết conversation + messages - polling mỗi 5s
  const { data: conversation, isLoading: convLoading } = useQuery({
    queryKey: ["inbox-conversation", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/inbox/conversations/${selectedId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  // Auto scroll xuống cuối khi có tin mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: (data) => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["inbox-conversation", selectedId] });
      queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
      if (data.sendError) {
        toast({ title: data.sendError, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Không thể gửi tin nhắn", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/inbox/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-conversation", selectedId] });
    },
  });

  const linkDonorMutation = useMutation({
    mutationFn: async ({ id, donorId }: { id: string; donorId: string | null }) => {
      const res = await fetch(`/api/inbox/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-conversation", selectedId] });
      toast({ title: "Đã cập nhật liên kết nhà tài trợ" });
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedId) return;
    sendMutation.mutate(messageText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Panel trái: Danh sách conversations */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Hộp thư</h2>
            {listData?.unreadCount > 0 && (
              <Badge className="bg-red-500">{listData.unreadCount}</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kênh</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="ZALO">Zalo</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Đang mở</SelectItem>
                <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Danh sách */}
        <div className="flex-1 overflow-y-auto">
          {listLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">Đang tải...</div>
          )}
          {listData?.conversations?.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">Không có hội thoại</div>
          )}
          {listData?.conversations?.map((conv: any) => {
            const lastMsg = conv.messages?.[0];
            const isSelected = conv.id === selectedId;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b hover:bg-slate-50 transition-colors",
                  isSelected && "bg-blue-50 border-l-2 border-l-blue-500",
                  !conv.isRead && !isSelected && "bg-orange-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={conv.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {(conv.displayName || conv.donor?.fullName || "?")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("text-sm font-medium truncate", !conv.isRead && "font-semibold")}>
                        {conv.donor?.fullName || conv.displayName || "Người dùng ẩn"}
                      </span>
                      <span className="flex items-center gap-1 text-xs flex-shrink-0">
                        {CHANNEL_ICONS[conv.channel]}
                        {lastMsg && format(new Date(lastMsg.sentAt), "HH:mm")}
                      </span>
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {lastMsg.direction === "OUT" && "Bạn: "}{lastMsg.content}
                      </p>
                    )}
                    {!conv.isRead && (
                      <Circle className="h-2 w-2 fill-blue-500 text-blue-500 mt-1" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel phải: Khung chat */}
      {selectedId && conversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header cuộc trò chuyện */}
          <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={conversation.avatarUrl} />
                <AvatarFallback>
                  {(conversation.displayName || conversation.donor?.fullName || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {conversation.donor?.fullName || conversation.displayName || "Người dùng ẩn"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", CHANNEL_COLORS[conversation.channel])}>
                    {conversation.channel}
                  </Badge>
                  {conversation.donor && (
                    <Link
                      href={`/donors/${conversation.donor.id}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Xem hồ sơ
                    </Link>
                  )}
                  {conversation.donor?.phone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {conversation.donor.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!conversation.donor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <Link href={`/donors?linkConversation=${conversation.id}`}>
                    <User className="mr-1 h-3 w-3" />
                    Liên kết donor
                  </Link>
                </Button>
              )}
              {conversation.status === "OPEN" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => updateStatusMutation.mutate({ id: conversation.id, status: "RESOLVED" })}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Đánh dấu xử lý
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => updateStatusMutation.mutate({ id: conversation.id, status: "OPEN" })}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Mở lại
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {convLoading && (
              <div className="text-center text-sm text-muted-foreground">Đang tải...</div>
            )}
            {conversation.messages?.map((msg: any) => {
              const isOut = msg.direction === "OUT";
              return (
                <div key={msg.id} className={cn("flex", isOut ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                    isOut
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white text-slate-800 rounded-bl-sm shadow-sm border"
                  )}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={cn(
                      "flex items-center justify-end gap-1 mt-1",
                      isOut ? "text-blue-200" : "text-muted-foreground"
                    )}>
                      <span className="text-xs">
                        {format(new Date(msg.sentAt), "HH:mm dd/MM")}
                      </span>
                      {isOut && msg.sentBy && (
                        <span className="text-xs">· {msg.sentBy.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input gửi tin */}
          {conversation.status === "OPEN" ? (
            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  className="resize-none text-sm"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 border-t bg-slate-100 text-center text-sm text-muted-foreground">
              Hội thoại đã được đánh dấu xử lý
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium">Chọn một hội thoại</p>
            <p className="text-sm mt-1">Tin nhắn Facebook và Zalo sẽ xuất hiện ở đây</p>
          </div>
        </div>
      )}
    </div>
  );
}
