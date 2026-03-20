"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Package, PackagePlus, PackageMinus, History, AlertTriangle, Clock, Plus, Search, Pencil, Trash2, ClipboardList, DollarSign } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  { value: "FOOD", label: "Thực phẩm" },
  { value: "MEDICINE", label: "Thuốc / Vật tư y tế" },
  { value: "GIFT", label: "Quà tặng" },
  { value: "EQUIPMENT", label: "Thiết bị" },
  { value: "OTHER", label: "Khác" },
];

const categoryLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label || v;

function categoryBadge(category: string) {
  const colors: Record<string, string> = {
    FOOD: "bg-green-100 text-green-700",
    MEDICINE: "bg-blue-100 text-blue-700",
    GIFT: "bg-purple-100 text-purple-700",
    EQUIPMENT: "bg-orange-100 text-orange-700",
    OTHER: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[category] || colors.OTHER}`}>
      {categoryLabel(category)}
    </span>
  );
}

function isLowStock(item: any) {
  return item.minQuantity > 0 && item.currentQuantity <= item.minQuantity;
}

function isExpiringSoon(item: any) {
  if (!item.nearestExpiry) return false;
  const alertMonths = item.nearestExpiryAlertMonths || 1;
  const alertDate = new Date();
  alertDate.setMonth(alertDate.getMonth() + alertMonths);
  return new Date(item.nearestExpiry) <= alertDate;
}

function isExpired(item: any) {
  if (!item.nearestExpiry) return false;
  return new Date(item.nearestExpiry) < new Date();
}

// ─── Form nhập/xuất kho ────────────────────────────────────────────────────
function TransactionDialog({
  open, onClose, type, preselectedItem, items,
}: {
  open: boolean; onClose: () => void; type: "IMPORT" | "EXPORT"; preselectedItem?: any; items: any[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [itemId, setItemId] = useState(preselectedItem?.id || "");
  const [quantity, setQuantity] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryAlertMonths, setExpiryAlertMonths] = useState("1");
  const [donorUnit, setDonorUnit] = useState("");
  const [purpose, setPurpose] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const reset = () => {
    setItemId(preselectedItem?.id || "");
    setQuantity(""); setBatchCode(""); setExpiryDate(""); setExpiryAlertMonths("1");
    setDonorUnit(""); setPurpose("");
    setHandledBy(""); setTransactionDate(format(new Date(), "yyyy-MM-dd")); setNotes("");
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/warehouse/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Lỗi"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: type === "IMPORT" ? "Đã nhập kho" : "Đã xuất kho" });
      qc.invalidateQueries({ queryKey: ["warehouse-items"] });
      qc.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      reset(); onClose();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  const selectedItem = items.find((i) => i.id === itemId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "IMPORT" ? <PackagePlus className="h-5 w-5 text-green-600" /> : <PackageMinus className="h-5 w-5 text-red-600" />}
            {type === "IMPORT" ? "Nhập kho" : "Xuất kho"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Mặt hàng *</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger><SelectValue placeholder="Chọn mặt hàng" /></SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    [{i.code}] {i.name} — tồn: {i.currentQuantity} {i.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số lượng *</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
              {type === "EXPORT" && selectedItem && (
                <p className="text-xs text-muted-foreground mt-1">Tồn hiện tại: {selectedItem.currentQuantity} {selectedItem.unit}</p>
              )}
            </div>
            <div>
              <Label>Ngày {type === "IMPORT" ? "nhập" : "xuất"}</Label>
              <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
            </div>
          </div>

          {type === "IMPORT" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Mã lô</Label>
                <Input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="LOT-2026-03" />
              </div>
              <div>
                <Label>Hạn sử dụng</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
              <div>
                <Label>Cảnh báo trước</Label>
                <Select value={expiryAlertMonths} onValueChange={setExpiryAlertMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((m) => <SelectItem key={m} value={m.toString()}>{m} tháng</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Đơn vị tài trợ</Label>
              <Input value={donorUnit} onChange={(e) => setDonorUnit(e.target.value)} placeholder="Tên tổ chức / cá nhân" />
            </div>
            <div>
              <Label>Người {type === "IMPORT" ? "nhận" : "giao"}</Label>
              <Input value={handledBy} onChange={(e) => setHandledBy(e.target.value)} placeholder="Họ tên" />
            </div>
          </div>

          <div>
            <Label>Mục đích</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={type === "IMPORT" ? "VD: Quà Tết, từ thiện..." : "VD: Chuyến từ thiện Q1, phát quà bệnh nhân..."} />
          </div>

          <div>
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Tình trạng hàng, điều kiện đặc biệt..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Huỷ</Button>
          <Button
            onClick={() => mutation.mutate({ itemId, type, quantity: parseInt(quantity), batchCode, expiryDate: expiryDate || null, expiryAlertMonths: parseInt(expiryAlertMonths) || 1, donorUnit, purpose, handledBy, transactionDate, notes })}
            disabled={mutation.isPending || !itemId || !quantity || parseInt(quantity) <= 0}
            className={type === "IMPORT" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {mutation.isPending ? "Đang lưu..." : type === "IMPORT" ? "Nhập kho" : "Xuất kho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Form thêm/sửa mặt hàng ────────────────────────────────────────────────
function ItemFormDialog({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!editItem;

  const [code, setCode] = useState(editItem?.code || "");
  const [name, setName] = useState(editItem?.name || "");
  const [unit, setUnit] = useState(editItem?.unit || "");
  const [subUnit, setSubUnit] = useState(editItem?.subUnit || "");
  const [subUnitRatio, setSubUnitRatio] = useState(editItem?.subUnitRatio?.toString() || "");
  const [unitPrice, setUnitPrice] = useState(editItem?.unitPrice?.toString() || "");
  const [category, setCategory] = useState(editItem?.category || "OTHER");
  const [currentQuantity, setCurrentQuantity] = useState(editItem?.currentQuantity?.toString() || "0");
  const [minQuantity, setMinQuantity] = useState(editItem?.minQuantity?.toString() || "0");
  const [notes, setNotes] = useState(editItem?.notes || "");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEdit ? `/api/warehouse/items/${editItem.id}` : "/api/warehouse/items";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Lỗi"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Thành công", description: isEdit ? "Đã cập nhật mặt hàng" : "Đã thêm mặt hàng vào kho" });
      qc.invalidateQueries({ queryKey: ["warehouse-items"] });
      onClose();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Lỗi", description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa mặt hàng" : "Thêm mặt hàng mới"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Label>Mã hàng {isEdit ? "" : "(tự sinh nếu để trống)"}</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={isEdit ? "" : "Tự sinh nếu để trống"} disabled={isEdit} />
          </div>
          <div>
            <Label>Tên mặt hàng *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên đầy đủ" />
          </div>
          <div>
            <Label>Đơn vị nhận *</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="thùng, hộp, kg..." />
          </div>
          <div>
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Đơn vị lẻ</Label>
            <Input value={subUnit} onChange={(e) => setSubUnit(e.target.value)} placeholder="ly, viên, gói..." />
          </div>
          <div>
            <Label>Quy đổi (1 {unit || "đơn vị"} = ? {subUnit || "lẻ"})</Label>
            <Input type="number" min={1} value={subUnitRatio} onChange={(e) => setSubUnitRatio(e.target.value)} placeholder="VD: 4" />
          </div>
          <div>
            <Label>Đơn giá ({subUnit || unit || "đơn vị"})</Label>
            <Input type="number" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="VNĐ" />
          </div>
          <div>
            <Label>Ngưỡng cảnh báo tồn thấp</Label>
            <Input type="number" min={0} value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} placeholder="0 = tắt" />
          </div>
          {!isEdit && (
            <div>
              <Label>Tồn kho ban đầu</Label>
              <Input type="number" min={0} value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} placeholder="0" />
            </div>
          )}
          <div className={isEdit ? "col-span-2" : ""}>
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Tình trạng, điều kiện bảo quản..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => mutation.mutate({ code: code || undefined, name, unit, subUnit: subUnit || null, subUnitRatio: subUnitRatio ? parseInt(subUnitRatio) : null, unitPrice: unitPrice ? parseFloat(unitPrice) : null, category, currentQuantity: parseInt(currentQuantity) || 0, minQuantity: parseInt(minQuantity) || 0, notes })}
            disabled={mutation.isPending || !name || !unit}
          >
            {mutation.isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm mặt hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Nhập kho nhanh ─────────────────────────────────────────────────────────
// Chọn mặt hàng có sẵn HOẶC tạo mới → nhập số lượng + lô + HSD → tự tạo transaction IMPORT + cập nhật/tạo mặt hàng
function QuickImportDialog({ open, onClose, items, prefill }: { open: boolean; onClose: () => void; items: any[]; prefill?: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  type QuickRow = {
    mode: "existing" | "new";
    itemId: string;       // nếu chọn hàng có sẵn
    name: string;
    unit: string;
    category: string;
    subUnit: string;
    subUnitRatio: string;
    unitPrice: string;
    quantity: string;      // số lượng nhập
    batchCode: string;
    expiryDate: string;
    expiryAlertMonths: string;
    donorUnit: string;     // đơn vị tài trợ
  };

  const emptyRow = (): QuickRow => ({
    mode: "existing", itemId: "", name: "", unit: "", category: "OTHER", subUnit: "", subUnitRatio: "", unitPrice: "",
    quantity: "", batchCode: "", expiryDate: "", expiryAlertMonths: "1", donorUnit: "",
  });

  const prefillRow = (): QuickRow => {
    if (!prefill) return emptyRow();
    return {
      mode: "new", itemId: "", name: prefill.name || "", unit: prefill.unit || "",
      category: prefill.category || "OTHER", subUnit: "", subUnitRatio: "", unitPrice: "",
      quantity: prefill.quantity || "", batchCode: "", expiryDate: "", expiryAlertMonths: "1",
      donorUnit: prefill.donor || "",
    };
  };

  const [rows, setRows] = useState<QuickRow[]>([prefill ? prefillRow() : emptyRow()]);

  const updateRow = (idx: number, updates: Partial<QuickRow>) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const selectExistingItem = (idx: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      updateRow(idx, {
        mode: "existing", itemId, name: item.name, unit: item.unit,
        subUnit: item.subUnit || "", subUnitRatio: item.subUnitRatio?.toString() || "",
        unitPrice: item.unitPrice?.toString() || "",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let successCount = 0;
    try {
      for (const row of rows) {
        const qty = parseInt(row.quantity);
        if (!qty || qty <= 0) continue;

        let itemId = row.itemId;

        // Nếu tạo mới → POST item trước (code tự sinh)
        if (row.mode === "new") {
          if (!row.name || !row.unit) continue;
          const createRes = await fetch("/api/warehouse/items", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: row.name, unit: row.unit,
              subUnit: row.subUnit || null,
              subUnitRatio: row.subUnitRatio ? parseInt(row.subUnitRatio) : null,
              unitPrice: row.unitPrice ? parseFloat(row.unitPrice) : null,
              category: row.category || "OTHER", currentQuantity: 0, minQuantity: 0,
            }),
          });
          if (!createRes.ok) { const e = await createRes.json(); throw new Error(e.error || "Lỗi tạo mặt hàng"); }
          const created = await createRes.json();
          itemId = created.item.id;
        } else {
          if (!itemId) continue;
          // Cập nhật subUnit/subUnitRatio/unitPrice nếu user sửa
          await fetch(`/api/warehouse/items/${itemId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subUnit: row.subUnit || null,
              subUnitRatio: row.subUnitRatio ? parseInt(row.subUnitRatio) : null,
              unitPrice: row.unitPrice ? parseFloat(row.unitPrice) : null,
            }),
          });
        }

        // Tạo transaction IMPORT
        await fetch("/api/warehouse/transactions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId, type: "IMPORT", quantity: qty,
            batchCode: row.batchCode || null,
            expiryDate: row.expiryDate || null,
            expiryAlertMonths: parseInt(row.expiryAlertMonths) || 1,
            donorUnit: row.donorUnit || null,
            transactionDate: format(new Date(), "yyyy-MM-dd"),
          }),
        });
        successCount++;
      }
      if (successCount > 0) {
        toast({ title: "Thành công", description: `Đã nhập ${successCount} mặt hàng vào kho` });
        qc.invalidateQueries({ queryKey: ["warehouse-items"] });
        qc.invalidateQueries({ queryKey: ["warehouse-transactions"] });
        setRows([emptyRow()]);
        onClose();
      } else {
        toast({ variant: "destructive", title: "Chưa có gì để nhập", description: "Hãy điền số lượng > 0" });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Lỗi", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else setRows([emptyRow()]); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-green-600" />
            Nhập kho nhanh
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Chọn mặt hàng có sẵn hoặc tạo mới → hệ thống tự tạo phiếu nhập kho.</p>
        </DialogHeader>

        <div className="space-y-4">
          {rows.map((row, idx) => (
            <Card key={idx} className="relative">
              <CardContent className="p-4 space-y-4">
                {/* Header: mode toggle + delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                    <div className="flex gap-1 bg-muted rounded-md p-0.5">
                      <button className={cn("px-3 py-1 text-xs font-medium rounded transition-colors", row.mode === "existing" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => updateRow(idx, { mode: "existing", itemId: "" })}>Chọn có sẵn</button>
                      <button className={cn("px-3 py-1 text-xs font-medium rounded transition-colors", row.mode === "new" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                        onClick={() => updateRow(idx, { mode: "new", itemId: "" })}>Tạo mới</button>
                    </div>
                  </div>
                  {rows.length > 1 && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setRows((p) => p.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>

                {/* Phần 1: Chọn hoặc tạo mặt hàng */}
                {row.mode === "existing" ? (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Mặt hàng</Label>
                    <Select value={row.itemId} onValueChange={(v) => selectExistingItem(idx, v)}>
                      <SelectTrigger><SelectValue placeholder="-- Chọn mặt hàng có sẵn --" /></SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            <span className="font-mono text-xs text-muted-foreground mr-2">[{i.code}]</span>
                            {i.name}
                            <span className="text-xs text-muted-foreground ml-2">— tồn: {i.currentQuantity} {i.unit}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Tên mặt hàng *</Label>
                      <Input value={row.name} onChange={(e) => updateRow(idx, { name: e.target.value })} placeholder="VD: Mì gói Hảo Hảo" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Đơn vị nhận *</Label>
                      <Input value={row.unit} onChange={(e) => updateRow(idx, { unit: e.target.value })} placeholder="thùng, hộp, kg..." />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">Danh mục</Label>
                      <Select value={row.category} onValueChange={(v) => updateRow(idx, { category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Phần 2: Số lượng + Quy đổi */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Số lượng nhập *</Label>
                    <Input type="number" min={1} value={row.quantity} onChange={(e) => updateRow(idx, { quantity: e.target.value })} placeholder="500" className="font-semibold" />
                    {row.mode === "existing" && row.unit && <p className="text-[10px] text-muted-foreground mt-0.5">{row.unit}</p>}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Đơn vị lẻ</Label>
                    <Input value={row.subUnit} onChange={(e) => updateRow(idx, { subUnit: e.target.value })} placeholder="gói, viên..." />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">1 {row.unit || "đơn vị"} = ? {row.subUnit || "lẻ"}</Label>
                    <Input type="number" min={1} value={row.subUnitRatio} onChange={(e) => updateRow(idx, { subUnitRatio: e.target.value })} placeholder="30" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Đơn giá/{row.subUnit || row.unit || "đv"}</Label>
                    <Input type="number" min={0} value={row.unitPrice} onChange={(e) => updateRow(idx, { unitPrice: e.target.value })} placeholder="VNĐ" />
                  </div>
                </div>

                {/* Tính nhanh */}
                {row.quantity && row.subUnitRatio && (
                  <div className="bg-green-50 border border-green-200 rounded-md px-3 py-1.5 text-sm text-green-700">
                    = <strong>{(parseInt(row.quantity) * parseInt(row.subUnitRatio)).toLocaleString("vi-VN")}</strong> {row.subUnit || "lẻ"}
                    {row.unitPrice ? <> — Thành tiền: <strong>{(parseInt(row.quantity) * parseInt(row.subUnitRatio) * parseFloat(row.unitPrice)).toLocaleString("vi-VN")}đ</strong></> : ""}
                  </div>
                )}

                {/* Phần 3: Lô + HSD + NTT */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Số lô</Label>
                    <Input value={row.batchCode} onChange={(e) => updateRow(idx, { batchCode: e.target.value })} placeholder="LOT-2026-03" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Hạn sử dụng</Label>
                    <Input type="date" value={row.expiryDate} onChange={(e) => updateRow(idx, { expiryDate: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Cảnh báo HSD trước</Label>
                    <Select value={row.expiryAlertMonths} onValueChange={(v) => updateRow(idx, { expiryAlertMonths: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((m) => <SelectItem key={m} value={m.toString()}>{m} tháng</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1">Đơn vị tài trợ</Label>
                    <Input value={row.donorUnit} onChange={(e) => updateRow(idx, { donorUnit: e.target.value })} placeholder="Tên NTT" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setRows((p) => [...p, emptyRow()])}>
            <Plus className="h-4 w-4 mr-2" />Thêm mặt hàng
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? "Đang nhập..." : `Nhập kho (${rows.filter(r => parseInt(r.quantity) > 0).length} mặt hàng)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <WarehouseContent />
    </Suspense>
  );
}

function WarehouseContent() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAlert, setFilterAlert] = useState("all");

  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showQuickStock, setShowQuickStock] = useState(false);
  const [quickItem, setQuickItem] = useState<any>(null);
  const [txType, setTxType] = useState<"IMPORT" | "EXPORT">("IMPORT");
  const [inkindPrefill, setInkindPrefill] = useState<any>(null);

  // Filter lịch sử
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ["warehouse-items"],
    queryFn: async () => {
      const res = await fetch("/api/warehouse/items");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["warehouse-transactions", historyFilter, historyFrom, historyTo],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "200" });
      if (historyFilter !== "all") params.set("type", historyFilter);
      if (historyFrom) params.set("from", historyFrom);
      if (historyTo) params.set("to", historyTo);
      const res = await fetch(`/api/warehouse/transactions?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouse/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xoá");
    },
    onSuccess: () => {
      toast({ title: "Đã xoá mặt hàng" });
      qc.invalidateQueries({ queryKey: ["warehouse-items"] });
    },
    onError: () => toast({ variant: "destructive", title: "Lỗi", description: "Không thể xoá" }),
  });

  // Auto-open quick import khi navigate từ hiện vật
  useEffect(() => {
    if (searchParams.get("import_from") === "inkind") {
      const inKindCatToWarehouse: Record<string, string> = {
        MEDICAL_EQUIPMENT: "EQUIPMENT",
        MEDICINE: "MEDICINE",
        SUPPLIES: "OTHER",
        FOOD: "FOOD",
        OTHER: "OTHER",
      };
      setInkindPrefill({
        name: searchParams.get("item_name") || "",
        quantity: searchParams.get("quantity") || "",
        unit: searchParams.get("unit") || "",
        donor: searchParams.get("donor") || "",
        category: inKindCatToWarehouse[searchParams.get("category") || ""] || "OTHER",
      });
      setShowQuickStock(true);
    }
  }, [searchParams]);

  const allItems: any[] = itemsData?.items || [];
  const transactions: any[] = txData?.transactions || [];

  // Filter items
  const filtered = allItems.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || i.category === filterCategory;
    const matchAlert = filterAlert === "all"
      || (filterAlert === "low" && isLowStock(i))
      || (filterAlert === "expiring" && isExpiringSoon(i) && !isExpired(i))
      || (filterAlert === "expired" && isExpired(i));
    return matchSearch && matchCat && matchAlert;
  });

  const lowStockCount = allItems.filter(isLowStock).length;
  const expiringCount = allItems.filter((i) => isExpiringSoon(i) && !isExpired(i)).length;
  const expiredCount = allItems.filter(isExpired).length;

  const openQuickAction = (item: any, type: "IMPORT" | "EXPORT") => {
    setQuickItem(item);
    setTxType(type);
    if (type === "IMPORT") setShowImport(true);
    else setShowExport(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quản lý kho (Hầm B2)</h2>
          <p className="text-muted-foreground">Theo dõi nhập xuất và tồn kho hàng tài trợ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50" onClick={() => setShowQuickStock(true)}>
            <ClipboardList className="h-4 w-4 mr-2" />Nhập kho nhanh
          </Button>
          <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-50" onClick={() => { setQuickItem(null); setShowImport(true); }}>
            <PackagePlus className="h-4 w-4 mr-2" />Nhập kho
          </Button>
          <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => { setQuickItem(null); setShowExport(true); }}>
            <PackageMinus className="h-4 w-4 mr-2" />Xuất kho
          </Button>
          <Button onClick={() => { setEditItem(null); setShowItemForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />Thêm mặt hàng
          </Button>
        </div>
      </div>

      {/* Cảnh báo */}
      {(lowStockCount > 0 || expiringCount > 0 || expiredCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 cursor-pointer" onClick={() => setFilterAlert("expired")}>
              <AlertTriangle className="h-4 w-4" />{expiredCount} mặt hàng đã hết hạn
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700 cursor-pointer" onClick={() => setFilterAlert("expiring")}>
              <Clock className="h-4 w-4" />{expiringCount} mặt hàng sắp hết hạn
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700 cursor-pointer" onClick={() => setFilterAlert("low")}>
              <Package className="h-4 w-4" />{lowStockCount} mặt hàng sắp hết tồn kho
            </div>
          )}
          {filterAlert !== "all" && (
            <button className="text-xs text-muted-foreground underline" onClick={() => setFilterAlert("all")}>Xoá bộ lọc</button>
          )}
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock"><Package className="h-4 w-4 mr-2" />Tồn kho ({allItems.length})</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Lịch sử xuất nhập</TabsTrigger>
        </TabsList>

        {/* ===== TỒN KHO ===== */}
        <TabsContent value="stock" className="mt-4 space-y-4">
          {/* Bộ lọc */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo mã, tên hàng..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả danh mục" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAlert} onValueChange={setFilterAlert}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="low">Tồn kho thấp</SelectItem>
                <SelectItem value="expiring">Sắp hết hạn</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Không có mặt hàng nào</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Mã</TableHead>
                      <TableHead>Tên mặt hàng</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead className="text-right">Tồn kho</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead>HSD gần nhất</TableHead>
                      <TableHead>Lô</TableHead>
                      <TableHead className="w-40"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => {
                      const low = isLowStock(item);
                      const expiring = isExpiringSoon(item) && !isExpired(item);
                      const expired = isExpired(item);
                      return (
                        <TableRow key={item.id} className={expired ? "bg-red-50/50" : expiring ? "bg-orange-50/50" : low ? "bg-yellow-50/50" : ""}>
                          <TableCell className="font-mono text-sm">{item.code}</TableCell>
                          <TableCell className="font-medium">
                            <div>{item.name}</div>
                            <div className="flex gap-1 mt-0.5">
                              {expired && <Badge variant="destructive" className="text-xs">Hết hạn</Badge>}
                              {expiring && <Badge className="text-xs bg-orange-500">Sắp hết hạn</Badge>}
                              {low && <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100">Tồn thấp</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{categoryBadge(item.category)}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-bold text-lg ${low ? "text-red-600" : "text-slate-800"}`}>{item.currentQuantity}</span>
                            <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                            {item.subUnit && item.subUnitRatio && (
                              <div className="text-xs text-muted-foreground">= {item.currentQuantity * item.subUnitRatio} {item.subUnit}</div>
                            )}
                            {item.minQuantity > 0 && (
                              <div className="text-xs text-muted-foreground">ngưỡng: {item.minQuantity}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.nearestExpiry ? (
                              <span className={expired ? "text-red-600 font-medium" : expiring ? "text-orange-600 font-medium" : ""}>
                                {format(new Date(item.nearestExpiry), "dd/MM/yyyy")}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{item.nearestBatchCode || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700 hover:bg-green-50" onClick={() => openQuickAction(item, "IMPORT")}>
                                <PackagePlus className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-red-700 hover:bg-red-50" onClick={() => openQuickAction(item, "EXPORT")} disabled={item.currentQuantity === 0}>
                                <PackageMinus className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditItem(item); setShowItemForm(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:bg-red-50" onClick={() => {
                                if (confirm(`Xoá mặt hàng "${item.name}"?`)) deleteMutation.mutate(item.id);
                              }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LỊCH SỬ ===== */}
        <TabsContent value="history" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={historyFilter} onValueChange={setHistoryFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Tất cả" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="IMPORT">Nhập kho</SelectItem>
                <SelectItem value="EXPORT">Xuất kho</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-44" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} placeholder="Từ ngày" />
            <Input type="date" className="w-44" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} placeholder="Đến ngày" />
            {(historyFilter !== "all" || historyFrom || historyTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setHistoryFilter("all"); setHistoryFrom(""); setHistoryTo(""); }}>
                Xoá bộ lọc
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {txLoading ? (
                <p className="text-center text-muted-foreground py-8">Đang tải...</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên hàng</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>Đơn vị tài trợ</TableHead>
                      <TableHead>Mục đích</TableHead>
                      <TableHead>Người thực hiện</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm whitespace-nowrap">{format(new Date(tx.transactionDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          {tx.type === "IMPORT" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Nhập</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Xuất</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{tx.item?.code || "—"}</TableCell>
                        <TableCell className="font-medium">{tx.item?.name || "—"}</TableCell>
                        <TableCell className="text-right font-bold">
                          <span className={tx.type === "IMPORT" ? "text-green-700" : "text-red-700"}>
                            {tx.type === "IMPORT" ? "+" : "−"}{tx.quantity}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{tx.item?.unit}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.donorUnit || "—"}</TableCell>
                        <TableCell className="text-sm max-w-40 truncate">{tx.purpose || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{tx.handledBy || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-36 truncate">{tx.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TransactionDialog open={showImport} onClose={() => { setShowImport(false); setQuickItem(null); }} type="IMPORT" preselectedItem={quickItem} items={allItems} />
      <TransactionDialog open={showExport} onClose={() => { setShowExport(false); setQuickItem(null); }} type="EXPORT" preselectedItem={quickItem} items={allItems} />
      <ItemFormDialog open={showItemForm} onClose={() => { setShowItemForm(false); setEditItem(null); }} editItem={editItem} />
      <QuickImportDialog open={showQuickStock} onClose={() => { setShowQuickStock(false); setInkindPrefill(null); }} items={allItems} prefill={inkindPrefill} />
    </div>
  );
}
