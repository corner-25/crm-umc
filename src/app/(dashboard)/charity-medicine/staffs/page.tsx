"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Staff {
  id: string;
  staffCode?: string | null;
  fullName: string;
  department?: string | null;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  notes?: string | null;
  _count?: { trips: number };
}

function StaffDialog({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: Staff }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(editItem?.fullName || "");
  const [staffCode, setStaffCode] = useState(editItem?.staffCode || "");
  const [department, setDepartment] = useState(editItem?.department || "");
  const [role, setRole] = useState(editItem?.role || "");
  const [phone, setPhone] = useState(editItem?.phone || "");
  const [email, setEmail] = useState(editItem?.email || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [isActive, setIsActive] = useState(editItem?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/staffs/${editItem.id}` : "/api/staffs";
      const res = await fetch(url, {
        method: editItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staffs"] });
      toast({ title: editItem ? "Đã cập nhật" : "Đã thêm NVYT" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Sửa NVYT" : "Thêm NVYT"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Họ tên *</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Mã nhân viên</Label><Input value={staffCode} onChange={(e) => setStaffCode(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Khoa / Phòng</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div><Label>Chức danh</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="BS, ĐD, KTV..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Điện thoại</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          {editItem && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <Label htmlFor="isActive" className="!mt-0">Còn làm việc</Label>
            </div>
          )}
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() =>
              mutation.mutate({ fullName, staffCode, department, role, phone, email, notes, ...(editItem && { isActive }) })
            }
            disabled={!fullName.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Staff }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["staffs", showInactive],
    queryFn: async () => {
      const res = await fetch(`/api/staffs?includeInactive=${showInactive}`);
      if (!res.ok) return { staffs: [] };
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/staffs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xoá thất bại");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staffs"] });
      toast({ title: "Đã xoá NVYT" });
    },
  });

  const staffs: Staff[] = data?.staffs || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staffs;
    return staffs.filter((s) =>
      s.fullName.toLowerCase().includes(q) ||
      (s.staffCode || "").toLowerCase().includes(q) ||
      (s.department || "").toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q)
    );
  }, [staffs, search]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Nhân viên y tế
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh bạ NVYT tham gia các chuyến từ thiện — cuối năm tổng hợp để tri ân
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-1" /> Thêm NVYT
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Danh sách ({filtered.length})</CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
                Hiển thị đã nghỉ
              </label>
              <div className="relative w-72">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm tên, mã, khoa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Chưa có NVYT nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Khoa / Phòng</TableHead>
                  <TableHead>Chức danh</TableHead>
                  <TableHead>Liên lạc</TableHead>
                  <TableHead className="text-center">Số chuyến</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-xs">{s.staffCode || "—"}</TableCell>
                    <TableCell className="font-medium">
                      {s.fullName}
                      {!s.isActive && (
                        <span className="ml-2 text-xs text-muted-foreground">(đã nghỉ)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{s.department || "—"}</TableCell>
                    <TableCell className="text-sm">{s.role || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {s.phone && <div>{s.phone}</div>}
                      {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                      {!s.phone && !s.email && "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={
                        (s._count?.trips || 0) > 0
                          ? "inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium"
                          : "text-muted-foreground text-sm"
                      }>
                        {s._count?.trips ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, edit: s })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Xoá NVYT này? Các chuyến đã tham gia vẫn giữ lịch sử.")) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {dialog.open && (
        <StaffDialog open={dialog.open} onClose={() => setDialog({ open: false })} editItem={dialog.edit} />
      )}
    </div>
  );
}
