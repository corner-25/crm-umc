"use client";

import { useState, useMemo } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Pill, Package, Plus, Truck, ClipboardList, ArrowUpFromLine, ArrowDownToLine, Trash2, Check, Search } from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Trang theo dõi đơn giản: Tồn kho + Ghi nhận chuyến đi
// Dùng chung data với module chi tiết (CharityMedicine, MedicineBatch, CharityTrip, MedicineTransaction)
// ────────────────────────────────────────────────────────────────────────────

export default function SimpleCharityMedicinePage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [showTripDialog, setShowTripDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState<string | null>(null); // tripId
  const [showReturnDialog, setShowReturnDialog] = useState<string | null>(null); // tripId

  // ─── Data queries ─────────────────────────────────────────────────────────

  const { data: medData } = useQuery({
    queryKey: ["charity-medicines"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/medicines?limit=500");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: tripData } = useQuery({
    queryKey: ["charity-trips"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/trips");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: locData } = useQuery({
    queryKey: ["charity-locations"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/locations");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: batchData } = useQuery({
    queryKey: ["charity-batches"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/batches?hasStock=true");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const medicines: any[] = medData?.medicines || [];
  const trips: any[] = tripData?.trips || [];
  const locations: any[] = locData?.locations || [];
  const batches: any[] = batchData?.batches || [];

  // ─── Tồn kho đơn giản ────────────────────────────────────────────────────

  const stockList = useMemo(() => {
    return medicines
      .map((m: any) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        unit: m.unit,
        totalStock: m.totalStock || 0,
        nearestExpiry: m.nearestExpiry,
      }))
      .filter((m) => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()));
  }, [medicines, search]);

  const totalStock = stockList.reduce((s, m) => s + m.totalStock, 0);
  const lowStockCount = stockList.filter((m) => m.totalStock <= 0).length;

  // ─── Tạo chuyến đi ───────────────────────────────────────────────────────

  const [tripCode, setTripCode] = useState("");
  const [tripLocationId, setTripLocationId] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [tripExpected, setTripExpected] = useState("");
  const [tripNotes, setTripNotes] = useState("");

  const createTrip = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/charity-medicine/trips", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["charity-trips"] });
      toast({ title: "Đã tạo chuyến đi" });
      setShowTripDialog(false);
      setTripCode(""); setTripLocationId(""); setTripStart(""); setTripEnd(""); setTripExpected(""); setTripNotes("");
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  // ─── Xuất thuốc cho chuyến đi (multi-row) ─────────────────────────────────

  const [exportRows, setExportRows] = useState<Array<{ batchId: string; quantity: string }>>([{ batchId: "", quantity: "" }]);

  const addExportRow = () => setExportRows((prev) => [...prev, { batchId: "", quantity: "" }]);
  const updateExportRow = (idx: number, field: string, value: string) => {
    setExportRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const removeExportRow = (idx: number) => setExportRows((prev) => prev.filter((_, i) => i !== idx));

  const [exportSaving, setExportSaving] = useState(false);
  const handleExportAll = async () => {
    if (!showExportDialog) return;
    setExportSaving(true);
    try {
      for (const row of exportRows) {
        if (!row.batchId || !row.quantity || parseInt(row.quantity) <= 0) continue;
        const res = await fetch("/api/charity-medicine/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: row.batchId, tripId: showExportDialog, type: "EXPORT", quantity: parseInt(row.quantity) }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      }
      qc.invalidateQueries({ queryKey: ["charity-medicines"] });
      qc.invalidateQueries({ queryKey: ["charity-batches"] });
      qc.invalidateQueries({ queryKey: ["charity-trips"] });
      toast({ title: "Đã xuất thuốc cho chuyến đi" });
      setShowExportDialog(null);
      setExportRows([{ batchId: "", quantity: "" }]);
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setExportSaving(false);
    }
  };

  // ─── Thu hồi thuốc (multi-row) ────────────────────────────────────────────

  const [returnRows, setReturnRows] = useState<Array<{ batchId: string; quantity: string }>>([{ batchId: "", quantity: "" }]);

  const addReturnRow = () => setReturnRows((prev) => [...prev, { batchId: "", quantity: "" }]);
  const updateReturnRow = (idx: number, field: string, value: string) => {
    setReturnRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };
  const removeReturnRow = (idx: number) => setReturnRows((prev) => prev.filter((_, i) => i !== idx));

  const [returnSaving, setReturnSaving] = useState(false);
  const handleReturnAll = async () => {
    if (!showReturnDialog) return;
    setReturnSaving(true);
    try {
      for (const row of returnRows) {
        if (!row.batchId || !row.quantity || parseInt(row.quantity) <= 0) continue;
        const res = await fetch("/api/charity-medicine/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: row.batchId, tripId: showReturnDialog, type: "RETURN", quantity: parseInt(row.quantity) }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      }
      qc.invalidateQueries({ queryKey: ["charity-medicines"] });
      qc.invalidateQueries({ queryKey: ["charity-batches"] });
      qc.invalidateQueries({ queryKey: ["charity-trips"] });
      toast({ title: "Đã thu hồi thuốc về kho" });
      setShowReturnDialog(null);
      setReturnRows([{ batchId: "", quantity: "" }]);
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setReturnSaving(false);
    }
  };

  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Thuốc từ thiện — Theo dõi đơn giản</h2>
        <p className="text-muted-foreground">Tồn kho hiện tại và ghi nhận chuyến đi</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Pill className="h-4 w-4" />Danh mục thuốc</div>
            <p className="text-2xl font-bold">{medicines.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" />Tổng tồn kho</div>
            <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="h-4 w-4" />Chuyến đi</div>
            <p className="text-2xl font-bold">{trips.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tồn kho hiện tại */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Tồn kho hiện tại</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm thuốc..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mã</TableHead>
                <TableHead>Tên thuốc</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead>HSD gần nhất</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có thuốc</TableCell></TableRow>
              ) : stockList.map((m) => (
                <TableRow key={m.id} className={m.totalStock <= 0 ? "bg-red-50/50" : ""}>
                  <TableCell className="font-mono text-sm">{m.code}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.unit}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold text-lg ${m.totalStock <= 0 ? "text-red-600" : ""}`}>{m.totalStock.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.nearestExpiry ? format(new Date(m.nearestExpiry), "dd/MM/yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Danh sách chuyến đi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Chuyến đi từ thiện</CardTitle>
          <Button onClick={() => setShowTripDialog(true)}><Plus className="h-4 w-4 mr-1" />Tạo chuyến mới</Button>
        </CardHeader>
        <CardContent className="p-0">
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
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setShowExportDialog(trip.id); setExportRows([{ batchId: "", quantity: "" }]); }}>
                        <ArrowUpFromLine className="h-3 w-3 mr-1" />Xuất thuốc
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => { setShowReturnDialog(trip.id); setReturnRows([{ batchId: "", quantity: "" }]); }}>
                        <ArrowDownToLine className="h-3 w-3 mr-1" />Thu hồi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Dialog: Tạo chuyến đi ─── */}
      <Dialog open={showTripDialog} onOpenChange={setShowTripDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo chuyến đi mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Mã chuyến *</Label><Input value={tripCode} onChange={(e) => setTripCode(e.target.value)} placeholder="VD: TT-2026-001" /></div>
            <div><Label>Địa điểm *</Label>
              <Select value={tripLocationId} onValueChange={setTripLocationId}>
                <SelectTrigger><SelectValue placeholder="Chọn địa điểm" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.province}{l.district ? ` - ${l.district}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ngày bắt đầu *</Label><Input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} /></div>
              <div><Label>Ngày kết thúc *</Label><Input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} /></div>
            </div>
            <div><Label>Số người dự kiến</Label><Input type="number" value={tripExpected} onChange={(e) => setTripExpected(e.target.value)} /></div>
            <div><Label>Ghi chú</Label><Textarea value={tripNotes} onChange={(e) => setTripNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTripDialog(false)}>Huỷ</Button>
            <Button onClick={() => createTrip.mutate({ tripCode, locationId: tripLocationId, startDate: tripStart, endDate: tripEnd, expectedPatients: tripExpected ? parseInt(tripExpected) : null, notes: tripNotes })}
              disabled={createTrip.isPending || !tripCode || !tripLocationId || !tripStart || !tripEnd}>
              {createTrip.isPending ? "Đang tạo..." : "Tạo chuyến"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Xuất thuốc cho chuyến (multi-row) ─── */}
      <Dialog open={!!showExportDialog} onOpenChange={(o) => { if (!o) setShowExportDialog(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5 text-red-600" />Xuất thuốc mang đi</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Thêm từng loại thuốc và số lượng mang đi cho chuyến này.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thuốc (lô)</TableHead>
                <TableHead className="w-28">Số lượng</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exportRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Select value={row.batchId} onValueChange={(v) => updateExportRow(idx, "batchId", v)}>
                      <SelectTrigger><SelectValue placeholder="Chọn thuốc..." /></SelectTrigger>
                      <SelectContent>
                        {batches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            [{b.medicine?.code}] {b.medicine?.name} — Tồn: {b.currentStock} — HSD: {format(new Date(b.expiryDate), "dd/MM/yyyy")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="number" min={1} value={row.quantity} onChange={(e) => updateExportRow(idx, "quantity", e.target.value)} placeholder="0" /></TableCell>
                  <TableCell>
                    {exportRows.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-7 px-1 text-red-500" onClick={() => removeExportRow(idx)}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addExportRow}><Plus className="h-3 w-3 mr-1" />Thêm dòng</Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(null)}>Huỷ</Button>
            <Button onClick={handleExportAll} disabled={exportSaving} className="bg-red-600 hover:bg-red-700">
              {exportSaving ? "Đang xuất..." : "Xuất tất cả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: Thu hồi thuốc (multi-row) ─── */}
      <Dialog open={!!showReturnDialog} onOpenChange={(o) => { if (!o) setShowReturnDialog(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5 text-green-600" />Thu hồi thuốc về kho</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Nhập số lượng thuốc mang về từ chuyến đi. Tồn kho sẽ tự động tăng lên.</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thuốc (lô)</TableHead>
                <TableHead className="w-28">Số lượng</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Select value={row.batchId} onValueChange={(v) => updateReturnRow(idx, "batchId", v)}>
                      <SelectTrigger><SelectValue placeholder="Chọn thuốc..." /></SelectTrigger>
                      <SelectContent>
                        {batches.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>
                            [{b.medicine?.code}] {b.medicine?.name} — Tồn: {b.currentStock} — HSD: {format(new Date(b.expiryDate), "dd/MM/yyyy")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input type="number" min={1} value={row.quantity} onChange={(e) => updateReturnRow(idx, "quantity", e.target.value)} placeholder="0" /></TableCell>
                  <TableCell>
                    {returnRows.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-7 px-1 text-red-500" onClick={() => removeReturnRow(idx)}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addReturnRow}><Plus className="h-3 w-3 mr-1" />Thêm dòng</Button>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(null)}>Huỷ</Button>
            <Button onClick={handleReturnAll} disabled={returnSaving} className="bg-green-600 hover:bg-green-700">
              {returnSaving ? "Đang thu hồi..." : "Thu hồi tất cả"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
