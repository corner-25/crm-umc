"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface GiftType {
  id: string;
  name: string;
  unit?: string | null;
  isDefault: boolean;
  notes?: string | null;
}

function GiftTypeDialog({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: GiftType }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState(editItem?.name || "");
  const [unit, setUnit] = useState(editItem?.unit || "");
  const [notes, setNotes] = useState(editItem?.notes || "");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/trip-gift-types/${editItem.id}` : "/api/trip-gift-types";
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
      qc.invalidateQueries({ queryKey: ["trip-gift-types"] });
      toast({ title: editItem ? "Đã cập nhật" : "Đã thêm loại quà" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editItem ? "Sửa loại quà" : "Thêm loại quà"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tên quà *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Xe lăn, Xe đạp, Bò..." />
          </div>
          <div>
            <Label>Đơn vị</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="chiếc, con, cái..." />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => mutation.mutate({ name, unit, notes })}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GiftsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<{ open: boolean; edit?: GiftType }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["trip-gift-types"],
    queryFn: async () => {
      const res = await fetch("/api/trip-gift-types");
      if (!res.ok) return { giftTypes: [] };
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trip-gift-types/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Xoá thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trip-gift-types"] });
      toast({ title: "Đã xoá loại quà" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const giftTypes: GiftType[] = data?.giftTypes || [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Quà tặng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh mục các loại quà mang theo chuyến đi (xe lăn, xe đạp, bò, cầu...)
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="h-4 w-4 mr-1" /> Thêm loại quà
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Danh sách ({giftTypes.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : giftTypes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>Chưa có loại quà nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Mặc định</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftTypes.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.unit || "—"}</TableCell>
                    <TableCell>
                      {g.isDefault ? (
                        <span className="inline-flex items-center rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-xs">
                          Mặc định
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{g.notes || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, edit: g })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {!g.isDefault && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Xoá loại quà này?")) deleteMutation.mutate(g.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
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
        <GiftTypeDialog open={dialog.open} onClose={() => setDialog({ open: false })} editItem={dialog.edit} />
      )}
    </div>
  );
}
