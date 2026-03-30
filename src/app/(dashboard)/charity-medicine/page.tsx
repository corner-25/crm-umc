"use client";

import { useState } from "react";
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
import {
  Pill, MapPin, Package, Plus, Search, Pencil, Trash2,
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RotateCcw, BarChart3, Truck,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────

const MEDICINE_CATEGORIES = [
  { value: "ANTIBIOTIC", label: "Kháng sinh" },
  { value: "PAINKILLER", label: "Giảm đau" },
  { value: "DIGESTIVE", label: "Tiêu hóa" },
  { value: "RESPIRATORY", label: "Hô hấp" },
  { value: "CARDIOVASCULAR", label: "Tim mạch" },
  { value: "DERMATOLOGY", label: "Da liễu" },
  { value: "MUSCULOSKELETAL", label: "Cơ xương khớp" },
  { value: "VITAMIN", label: "Vitamin / Bổ sung" },
  { value: "EYE_ENT", label: "Mắt / Tai mũi họng" },
  { value: "DIABETES", label: "Tiểu đường" },
  { value: "ALLERGY", label: "Dị ứng" },
  { value: "OTHER", label: "Khác" },
];

const TRIP_STATUSES = [
  { value: "PLANNING", label: "Lên kế hoạch", color: "bg-yellow-100 text-yellow-700" },
  { value: "PREPARED", label: "Đã chuẩn bị", color: "bg-blue-100 text-blue-700" },
  { value: "IN_PROGRESS", label: "Đang thực hiện", color: "bg-green-100 text-green-700" },
  { value: "COMPLETED", label: "Hoàn thành", color: "bg-slate-100 text-slate-700" },
  { value: "CANCELLED", label: "Huỷ", color: "bg-red-100 text-red-700" },
];

const TX_TYPES = [
  { value: "IMPORT", label: "Nhập kho", icon: ArrowDownToLine, color: "text-green-600" },
  { value: "EXPORT", label: "Xuất đi", icon: ArrowUpFromLine, color: "text-red-600" },
  { value: "RETURN", label: "Thu hồi", icon: RotateCcw, color: "text-blue-600" },
  { value: "ADJUSTMENT", label: "Điều chỉnh", icon: Pencil, color: "text-orange-600" },
];

const catLabel = (v: string) => MEDICINE_CATEGORIES.find((c) => c.value === v)?.label || v;
const tripStatusInfo = (v: string) => TRIP_STATUSES.find((s) => s.value === v) || TRIP_STATUSES[0];
const txTypeInfo = (v: string) => TX_TYPES.find((t) => t.value === v) || TX_TYPES[0];

function catBadge(category: string) {
  const colors: Record<string, string> = {
    ANTIBIOTIC: "bg-red-100 text-red-700",
    PAINKILLER: "bg-orange-100 text-orange-700",
    DIGESTIVE: "bg-green-100 text-green-700",
    RESPIRATORY: "bg-cyan-100 text-cyan-700",
    CARDIOVASCULAR: "bg-pink-100 text-pink-700",
    DERMATOLOGY: "bg-amber-100 text-amber-700",
    MUSCULOSKELETAL: "bg-indigo-100 text-indigo-700",
    VITAMIN: "bg-lime-100 text-lime-700",
    EYE_ENT: "bg-teal-100 text-teal-700",
    DIABETES: "bg-purple-100 text-purple-700",
    ALLERGY: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[category] || "bg-slate-100 text-slate-700"}`}>
      {catLabel(category)}
    </span>
  );
}

// ─── Medicine Form Dialog ──────────────────────────────────────────────────

function MedicineFormDialog({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [code, setCode] = useState(editItem?.code || "");
  const [name, setName] = useState(editItem?.name || "");
  const [activeIngredient, setActiveIngredient] = useState(editItem?.activeIngredient || "");
  const [unit, setUnit] = useState(editItem?.unit || "");
  const [category, setCategory] = useState(editItem?.category || "OTHER");
  const [notes, setNotes] = useState(editItem?.notes || "");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/charity-medicine/medicines/${editItem.id}` : "/api/charity-medicine/medicines";
      const res = await fetch(url, { method: editItem ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-medicines"] }); toast({ title: editItem ? "Đã cập nhật" : "Đã thêm thuốc" }); onClose(); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Sửa thuốc" : "Thêm thuốc mới"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mã thuốc *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} disabled={!!editItem} /></div>
            <div><Label>Đơn vị *</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="viên, hộp, chai..." /></div>
          </div>
          <div><Label>Tên thuốc *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Hoạt chất</Label><Input value={activeIngredient} onChange={(e) => setActiveIngredient(e.target.value)} /></div>
          <div><Label>Phân loại</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEDICINE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ code, name, activeIngredient, unit, category, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Location Form Dialog ──────────────────────────────────────────────────

function LocationFormDialog({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: any }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [province, setProvince] = useState(editItem?.province || "");
  const [district, setDistrict] = useState(editItem?.district || "");
  const [ward, setWard] = useState(editItem?.ward || "");
  const [epidemiology, setEpidemiology] = useState(editItem?.epidemiology || "");
  const [notes, setNotes] = useState(editItem?.notes || "");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/charity-medicine/locations/${editItem.id}` : "/api/charity-medicine/locations";
      const res = await fetch(url, { method: editItem ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-locations"] }); toast({ title: editItem ? "Đã cập nhật" : "Đã thêm địa điểm" }); onClose(); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Sửa địa điểm" : "Thêm địa điểm mới"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tỉnh/TP *</Label><Input value={province} onChange={(e) => setProvince(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quận/Huyện</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
            <div><Label>Phường/Xã</Label><Input value={ward} onChange={(e) => setWard(e.target.value)} /></div>
          </div>
          <div><Label>Đặc điểm dịch tễ</Label><Input value={epidemiology} onChange={(e) => setEpidemiology(e.target.value)} placeholder="Vùng núi, đồng bằng, ngập nước..." /></div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ province, district, ward, epidemiology, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Trip Form Dialog ──────────────────────────────────────────────────────

function TripFormDialog({ open, onClose, editItem, locations }: { open: boolean; onClose: () => void; editItem?: any; locations: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tripCode, setTripCode] = useState(editItem?.tripCode || "");
  const [locationId, setLocationId] = useState(editItem?.locationId || "");
  const [startDate, setStartDate] = useState(editItem?.startDate ? format(new Date(editItem.startDate), "yyyy-MM-dd") : "");
  const [endDate, setEndDate] = useState(editItem?.endDate ? format(new Date(editItem.endDate), "yyyy-MM-dd") : "");
  const [expectedPatients, setExpectedPatients] = useState(editItem?.expectedPatients?.toString() || "");
  const [demographics, setDemographics] = useState(editItem?.demographics || "");
  const [notes, setNotes] = useState(editItem?.notes || "");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestionsData } = useQuery({
    queryKey: ["medicine-suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/suggestions/medicine-list");
      if (!res.ok) return { suggestions: [] };
      return res.json();
    },
    enabled: !editItem, // chỉ fetch khi tạo mới
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editItem ? `/api/charity-medicine/trips/${editItem.id}` : "/api/charity-medicine/trips";
      const res = await fetch(url, { method: editItem ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-trips"] }); toast({ title: editItem ? "Đã cập nhật" : "Đã thêm chuyến" }); onClose(); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editItem ? "Sửa chuyến đi" : "Thêm chuyến đi mới"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Mã chuyến *</Label><Input value={tripCode} onChange={(e) => setTripCode(e.target.value)} disabled={!!editItem} placeholder="VD: TT-2026-001" />
          </div>
          <div><Label>Địa điểm *</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue placeholder="Chọn địa điểm" /></SelectTrigger>
              <SelectContent>
                {locations.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.province}{l.district ? ` - ${l.district}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ngày bắt đầu *</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><Label>Ngày kết thúc *</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Số lượng dự kiến</Label><Input type="number" value={expectedPatients} onChange={(e) => setExpectedPatients(e.target.value)} /></div>
            <div><Label>Đặc điểm dân cư</Label><Input value={demographics} onChange={(e) => setDemographics(e.target.value)} placeholder="Tỷ lệ già/trẻ em..." /></div>
          </div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>

          {/* Gợi ý danh mục thuốc — chỉ hiện khi tạo mới */}
          {!editItem && (
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <span className="flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5" />
                  Gợi ý danh mục thuốc từ các chuyến trước
                  {suggestionsData?.suggestions?.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {suggestionsData.suggestions.length}
                    </span>
                  )}
                </span>
                <span className="text-xs">{showSuggestions ? "▲ Thu gọn" : "▼ Xem"}</span>
              </button>
              {showSuggestions && (
                <div className="max-h-56 overflow-y-auto">
                  {!suggestionsData?.suggestions?.length ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Chưa có dữ liệu lịch sử</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Tên thuốc</th>
                          <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Tồn kho</th>
                          <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Gợi ý</th>
                          <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Cần nhập</th>
                          <th className="text-center px-2 py-1.5 font-medium text-muted-foreground">Số chuyến</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suggestionsData.suggestions.map((s: any) => (
                          <tr key={s.medicineId} className="border-t hover:bg-gray-50">
                            <td className="px-3 py-1.5">
                              <p className="font-medium">{s.name}</p>
                              <p className="text-muted-foreground">{s.code} · {s.unit}</p>
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className={s.currentStock === 0 ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                                {s.currentStock}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-center font-medium text-blue-600">{s.suggested}</td>
                            <td className="px-2 py-1.5 text-center">
                              {s.toImport > 0
                                ? <span className="text-amber-600 font-medium">+{s.toImport}</span>
                                : <span className="text-green-600">✓ Đủ</span>}
                            </td>
                            <td className="px-2 py-1.5 text-center text-muted-foreground">{s.tripCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ tripCode, locationId, startDate, endDate, expectedPatients: expectedPatients ? parseInt(expectedPatients) : null, demographics, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Batch Import Dialog ───────────────────────────────────────────────────

function BatchImportDialog({ open, onClose, medicines }: { open: boolean; onClose: () => void; medicines: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [medicineId, setMedicineId] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/charity-medicine/batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["charity-medicines"] });
      qc.invalidateQueries({ queryKey: ["charity-batches"] });
      toast({ title: "Đã nhập lô thuốc" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nhập lô thuốc mới</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Thuốc *</Label>
            <Select value={medicineId} onValueChange={setMedicineId}>
              <SelectTrigger><SelectValue placeholder="Chọn thuốc" /></SelectTrigger>
              <SelectContent>
                {medicines.map((m: any) => <SelectItem key={m.id} value={m.id}>[{m.code}] {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mã lô</Label><Input value={batchCode} onChange={(e) => setBatchCode(e.target.value)} placeholder="VD: LOT-2026-03" /></div>
            <div><Label>Hạn sử dụng *</Label><Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Số lượng *</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            <div><Label>Đơn giá</Label><Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nhà cung cấp / Nguồn</Label><Input value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
            <div><Label>Người nhận</Label><Input value={handledBy} onChange={(e) => setHandledBy(e.target.value)} /></div>
          </div>
          <div><Label>Ngày nhập</Label><Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} /></div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ medicineId, batchCode, expiryDate, quantity: parseInt(quantity), unitCost: unitCost ? parseFloat(unitCost) : null, supplier, handledBy, transactionDate, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Nhập kho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export / Return Dialog ────────────────────────────────────────────────

function TransactionDialog({ open, onClose, type, trips, batches }: {
  open: boolean; onClose: () => void; type: "EXPORT" | "RETURN"; trips: any[]; batches: any[];
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [batchId, setBatchId] = useState("");
  const [tripId, setTripId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [handledBy, setHandledBy] = useState("");
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/charity-medicine/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["charity-medicines"] });
      qc.invalidateQueries({ queryKey: ["charity-batches"] });
      qc.invalidateQueries({ queryKey: ["charity-transactions"] });
      toast({ title: type === "EXPORT" ? "Đã xuất thuốc" : "Đã thu hồi" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  // Sắp FEFO: hết hạn trước lên đầu
  const sortedBatches = [...batches].filter((b: any) => b.currentStock > 0).sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{type === "EXPORT" ? "Xuất thuốc cho chuyến đi" : "Thu hồi thuốc"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Chuyến đi *</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
              <SelectContent>
                {trips.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.tripCode} — {t.location?.province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Lô thuốc * (FEFO — hết hạn trước lên đầu)</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger><SelectValue placeholder="Chọn lô" /></SelectTrigger>
              <SelectContent>
                {sortedBatches.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    [{b.medicine.code}] {b.medicine.name} — Lô: {b.batchCode || "N/A"} — HSD: {format(new Date(b.expiryDate), "dd/MM/yyyy")} — Tồn: {b.currentStock}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Số lượng *</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            <div><Label>Người thực hiện</Label><Input value={handledBy} onChange={(e) => setHandledBy(e.target.value)} /></div>
          </div>
          <div><Label>Ngày giao dịch</Label><Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} /></div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ batchId, tripId, type, quantity: parseInt(quantity), handledBy, transactionDate, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : type === "EXPORT" ? "Xuất kho" : "Thu hồi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Demand Stats Dialog ───────────────────────────────────────────────────

function DemandStatDialog({ open, onClose, trips, medicines }: { open: boolean; onClose: () => void; trips: any[]; medicines: any[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tripId, setTripId] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [quantityUsed, setQuantityUsed] = useState("");
  const [quantityShort, setQuantityShort] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/charity-medicine/demand-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-demand-stats"] }); toast({ title: "Đã lưu thống kê" }); onClose(); },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nhập thống kê nhu cầu</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Chuyến đi *</Label>
            <Select value={tripId} onValueChange={setTripId}>
              <SelectTrigger><SelectValue placeholder="Chọn chuyến" /></SelectTrigger>
              <SelectContent>
                {trips.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.tripCode} — {t.location?.province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Thuốc *</Label>
            <Select value={medicineId} onValueChange={setMedicineId}>
              <SelectTrigger><SelectValue placeholder="Chọn thuốc" /></SelectTrigger>
              <SelectContent>
                {medicines.map((m: any) => <SelectItem key={m.id} value={m.id}>[{m.code}] {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Số lượng thực xài</Label><Input type="number" value={quantityUsed} onChange={(e) => setQuantityUsed(e.target.value)} /></div>
            <div><Label>Số lượng thiếu (nhu cầu ảo)</Label><Input type="number" value={quantityShort} onChange={(e) => setQuantityShort(e.target.value)} /></div>
          </div>
          <div><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => mutation.mutate({ tripId, medicineId, quantityUsed: parseInt(quantityUsed) || 0, quantityShort: parseInt(quantityShort) || 0, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function CharityMedicinePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  // Dialogs
  const [medDialog, setMedDialog] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [locDialog, setLocDialog] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [tripDialog, setTripDialog] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [batchDialog, setBatchDialog] = useState(false);
  const [txDialog, setTxDialog] = useState<{ open: boolean; type: "EXPORT" | "RETURN" }>({ open: false, type: "EXPORT" });
  const [demandDialog, setDemandDialog] = useState(false);

  // Queries
  const { data: medData } = useQuery({
    queryKey: ["charity-medicines", search, catFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (catFilter) p.set("category", catFilter);
      const res = await fetch(`/api/charity-medicine/medicines?${p}`);
      return res.json();
    },
  });

  const { data: locData } = useQuery({
    queryKey: ["charity-locations"],
    queryFn: async () => { const res = await fetch("/api/charity-medicine/locations"); return res.json(); },
  });

  const { data: tripData } = useQuery({
    queryKey: ["charity-trips"],
    queryFn: async () => { const res = await fetch("/api/charity-medicine/trips"); return res.json(); },
  });

  const { data: batchData } = useQuery({
    queryKey: ["charity-batches"],
    queryFn: async () => { const res = await fetch("/api/charity-medicine/batches?hasStock=true"); return res.json(); },
  });

  const { data: txData } = useQuery({
    queryKey: ["charity-transactions"],
    queryFn: async () => { const res = await fetch("/api/charity-medicine/transactions?limit=50"); return res.json(); },
  });

  const { data: demandData } = useQuery({
    queryKey: ["charity-demand-stats"],
    queryFn: async () => { const res = await fetch("/api/charity-medicine/demand-stats"); return res.json(); },
  });

  const medicines = medData?.medicines || [];
  const locations = locData?.locations || [];
  const trips = tripData?.trips || [];
  const batches = batchData?.batches || [];
  const transactions = txData?.transactions || [];
  const demandStats = demandData?.stats || [];

  const deleteMed = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/charity-medicine/medicines/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-medicines"] }); toast({ title: "Đã xoá" }); },
  });
  const deleteLoc = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/charity-medicine/locations/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-locations"] }); toast({ title: "Đã xoá" }); },
  });
  const deleteTrip = useMutation({
    mutationFn: async (id: string) => { await fetch(`/api/charity-medicine/trips/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["charity-trips"] }); toast({ title: "Đã xoá" }); },
  });

  // Summary cards
  const totalMedicines = medicines.length;
  const totalStock = medicines.reduce((s: number, m: any) => s + (m.totalStock || 0), 0);
  const expiringSoon = medicines.filter((m: any) => {
    if (!m.nearestExpiry) return false;
    const d = new Date(m.nearestExpiry);
    const warn = new Date();
    warn.setMonth(warn.getMonth() + 3);
    return d <= warn;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý thuốc từ thiện</h1>
          <p className="text-sm text-muted-foreground">Quản lý danh mục thuốc, lô thuốc, chuyến đi & dự báo nhu cầu</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2"><Pill className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">Danh mục thuốc</p><p className="text-2xl font-bold">{totalMedicines}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2"><Package className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Tổng tồn kho</p><p className="text-2xl font-bold">{totalStock.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
              <div><p className="text-sm text-muted-foreground">Sắp hết hạn</p><p className="text-2xl font-bold">{expiringSoon}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="medicines">
        <TabsList>
          <TabsTrigger value="medicines"><Pill className="h-4 w-4 mr-1" /> Danh mục thuốc</TabsTrigger>
          <TabsTrigger value="batches"><Package className="h-4 w-4 mr-1" /> Lô & Tồn kho</TabsTrigger>
          <TabsTrigger value="trips"><Truck className="h-4 w-4 mr-1" /> Chuyến đi</TabsTrigger>
          <TabsTrigger value="locations"><MapPin className="h-4 w-4 mr-1" /> Địa điểm</TabsTrigger>
          <TabsTrigger value="history"><ArrowDownToLine className="h-4 w-4 mr-1" /> Lịch sử giao dịch</TabsTrigger>
          <TabsTrigger value="demand"><BarChart3 className="h-4 w-4 mr-1" /> Thống kê nhu cầu</TabsTrigger>
        </TabsList>

        {/* ─── Tab: Danh mục thuốc ─── */}
        <TabsContent value="medicines" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm thuốc..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={(v) => setCatFilter(v === "ALL" ? "" : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Phân loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {MEDICINE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setMedDialog({ open: true })}><Plus className="h-4 w-4 mr-1" /> Thêm thuốc</Button>
            <Button variant="outline" onClick={() => setBatchDialog(true)}><ArrowDownToLine className="h-4 w-4 mr-1" /> Nhập lô</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Hoạt chất</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead>HSD gần nhất</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Chưa có dữ liệu thuốc</TableCell></TableRow>
                ) : medicines.map((med: any) => {
                  const expiring = med.nearestExpiry && new Date(med.nearestExpiry) <= new Date(Date.now() + 90 * 86400000);
                  const expired = med.nearestExpiry && new Date(med.nearestExpiry) < new Date();
                  return (
                    <TableRow key={med.id}>
                      <TableCell className="font-mono text-xs">{med.code}</TableCell>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{med.activeIngredient || "—"}</TableCell>
                      <TableCell>{med.unit}</TableCell>
                      <TableCell>{catBadge(med.category)}</TableCell>
                      <TableCell className="text-right font-medium">{(med.totalStock || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {med.nearestExpiry ? (
                          <span className={expired ? "text-red-600 font-medium" : expiring ? "text-orange-600" : ""}>
                            {format(new Date(med.nearestExpiry), "dd/MM/yyyy")}
                            {expired && <Badge variant="destructive" className="ml-1 text-[10px]">Hết hạn</Badge>}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setMedDialog({ open: true, edit: med })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Xoá thuốc này?")) deleteMed.mutate(med.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Tab: Lô & Tồn kho ─── */}
        <TabsContent value="batches" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setBatchDialog(true)}><ArrowDownToLine className="h-4 w-4 mr-1" /> Nhập lô mới</Button>
            <Button variant="outline" onClick={() => setTxDialog({ open: true, type: "EXPORT" })}><ArrowUpFromLine className="h-4 w-4 mr-1" /> Xuất thuốc</Button>
            <Button variant="outline" onClick={() => setTxDialog({ open: true, type: "RETURN" })}><RotateCcw className="h-4 w-4 mr-1" /> Thu hồi</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thuốc</TableHead>
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Nhập ban đầu</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có lô thuốc</TableCell></TableRow>
                ) : batches.map((b: any) => {
                  const expired = new Date(b.expiryDate) < new Date();
                  const expiring = !expired && new Date(b.expiryDate) <= new Date(Date.now() + 90 * 86400000);
                  return (
                    <TableRow key={b.id} className={expired ? "bg-red-50" : expiring ? "bg-orange-50" : ""}>
                      <TableCell className="font-medium">[{b.medicine.code}] {b.medicine.name}</TableCell>
                      <TableCell className="font-mono text-xs">{b.batchCode || "—"}</TableCell>
                      <TableCell>
                        <span className={expired ? "text-red-600 font-medium" : expiring ? "text-orange-600" : ""}>
                          {format(new Date(b.expiryDate), "dd/MM/yyyy")}
                          {expired && <Badge variant="destructive" className="ml-1 text-[10px]">Hết hạn</Badge>}
                          {expiring && !expired && <Badge className="ml-1 text-[10px] bg-orange-100 text-orange-700">Sắp hết hạn</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{b.currentStock.toLocaleString()} {b.medicine.unit}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{b.initialQuantity.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.supplier || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Tab: Chuyến đi ─── */}
        <TabsContent value="trips" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setTripDialog({ open: true })}><Plus className="h-4 w-4 mr-1" /> Thêm chuyến</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã chuyến</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Dự kiến</TableHead>
                  <TableHead>Thực tế</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có chuyến đi</TableCell></TableRow>
                ) : trips.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-mono font-medium">{trip.tripCode}</TableCell>
                      <TableCell>{trip.location?.province}{trip.location?.district ? ` - ${trip.location.district}` : ""}</TableCell>
                      <TableCell className="text-sm">{format(new Date(trip.startDate), "dd/MM/yyyy")} — {format(new Date(trip.endDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">{trip.expectedPatients?.toLocaleString() || "—"}</TableCell>
                      <TableCell className="text-right">{trip.actualPatients?.toLocaleString() || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setTripDialog({ open: true, edit: trip })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Xoá chuyến này?")) deleteTrip.mutate(trip.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Tab: Địa điểm ─── */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setLocDialog({ open: true })}><Plus className="h-4 w-4 mr-1" /> Thêm địa điểm</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tỉnh/TP</TableHead>
                  <TableHead>Quận/Huyện</TableHead>
                  <TableHead>Phường/Xã</TableHead>
                  <TableHead>Đặc điểm dịch tễ</TableHead>
                  <TableHead className="text-right">Số chuyến</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có địa điểm</TableCell></TableRow>
                ) : locations.map((loc: any) => (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">{loc.province}</TableCell>
                    <TableCell>{loc.district || "—"}</TableCell>
                    <TableCell>{loc.ward || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{loc.epidemiology || "—"}</TableCell>
                    <TableCell className="text-right">{loc._count?.trips || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setLocDialog({ open: true, edit: loc })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Xoá địa điểm này?")) deleteLoc.mutate(loc.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Tab: Lịch sử giao dịch ─── */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thuốc</TableHead>
                  <TableHead>Lô</TableHead>
                  <TableHead>Chuyến đi</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Chưa có giao dịch</TableCell></TableRow>
                ) : transactions.map((tx: any) => {
                  const ti = txTypeInfo(tx.type);
                  const Icon = ti.icon;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">{format(new Date(tx.transactionDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell><span className={`inline-flex items-center gap-1 text-xs font-medium ${ti.color}`}><Icon className="h-3 w-3" /> {ti.label}</span></TableCell>
                      <TableCell className="font-medium">[{tx.batch?.medicine?.code}] {tx.batch?.medicine?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.batch?.batchCode || "—"}</TableCell>
                      <TableCell className="text-sm">{tx.trip ? `${tx.trip.tripCode} — ${tx.trip.location?.province || ""}` : "—"}</TableCell>
                      <TableCell className="text-right font-medium">{tx.quantity.toLocaleString()} {tx.batch?.medicine?.unit}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tx.handledBy || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tx.notes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ─── Tab: Thống kê nhu cầu ─── */}
        <TabsContent value="demand" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => setDemandDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nhập thống kê</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chuyến đi</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Thuốc</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead className="text-right">Thực xài</TableHead>
                  <TableHead className="text-right">Thiếu (nhu cầu ảo)</TableHead>
                  <TableHead className="text-right">Nhu cầu thực</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandStats.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Chưa có dữ liệu thống kê</TableCell></TableRow>
                ) : demandStats.map((stat: any) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-mono font-medium">{stat.trip?.tripCode}</TableCell>
                    <TableCell className="text-sm">{stat.trip?.location?.province}{stat.trip?.location?.district ? ` - ${stat.trip.location.district}` : ""}</TableCell>
                    <TableCell className="font-medium">[{stat.medicine?.code}] {stat.medicine?.name}</TableCell>
                    <TableCell>{catBadge(stat.medicine?.category)}</TableCell>
                    <TableCell className="text-right">{stat.quantityUsed.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">{stat.quantityShort > 0 ? stat.quantityShort.toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{(stat.quantityUsed + stat.quantityShort).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{stat.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {medDialog.open && <MedicineFormDialog open={medDialog.open} onClose={() => setMedDialog({ open: false })} editItem={medDialog.edit} />}
      {locDialog.open && <LocationFormDialog open={locDialog.open} onClose={() => setLocDialog({ open: false })} editItem={locDialog.edit} />}
      {tripDialog.open && <TripFormDialog open={tripDialog.open} onClose={() => setTripDialog({ open: false })} editItem={tripDialog.edit} locations={locations} />}
      {batchDialog && <BatchImportDialog open={batchDialog} onClose={() => setBatchDialog(false)} medicines={medicines} />}
      {txDialog.open && <TransactionDialog open={txDialog.open} onClose={() => setTxDialog({ open: false, type: "EXPORT" })} type={txDialog.type} trips={trips} batches={batches} />}
      {demandDialog && <DemandStatDialog open={demandDialog} onClose={() => setDemandDialog(false)} trips={trips} medicines={medicines} />}
    </div>
  );
}
