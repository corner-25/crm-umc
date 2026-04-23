"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Plus, X, Trash2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Section — accordion item đơn giản, auto mở/thu gọn
// ────────────────────────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  defaultOpen = false,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string | number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          {open ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronRight className="h-4 w-4 text-slate-600" />}
          <div>
            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
              {title}
              {badge !== undefined && badge !== 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
      </button>
      {open && <div className="p-3 border-t bg-white space-y-3">{children}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface StaffOption {
  id: string;
  fullName: string;
  staffCode?: string | null;
  department?: string | null;
  role?: string | null;
}
interface GiftTypeOption {
  id: string;
  name: string;
  unit?: string | null;
  isDefault: boolean;
}
interface DonationAvailable {
  id: string;
  donorId: string;
  donorName: string;
  remaining: number;
  purpose: string;
}
interface DonorOption {
  id: string;
  fullName: string;
  type: string;
}

interface GiftLine {
  giftTypeId: string;
  quantity: number;
  notes?: string;
}
interface FundingLine {
  source: "EXISTING" | "NEW";
  donationCashId?: string;
  donorId?: string;
  amount: number;
  notes?: string;
}

interface TripFormProps {
  open: boolean;
  onClose: () => void;
  editItem?: any;
  locations: any[];
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export function TripFormDialog({ open, onClose, editItem, locations }: TripFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ─── Form state ───────────────────────────────────────────────────────
  const [tripCode, setTripCode] = useState("");
  const [tripName, setTripName] = useState("");
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expectedPatients, setExpectedPatients] = useState("");
  const [actualPatients, setActualPatients] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [newAudience, setNewAudience] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [transport, setTransport] = useState("");
  const [demographics, setDemographics] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: "", staffCode: "", department: "", role: "", phone: "" });

  const [giftLines, setGiftLines] = useState<GiftLine[]>([]);
  const [showAddGiftType, setShowAddGiftType] = useState(false);
  const [newGiftType, setNewGiftType] = useState({ name: "", unit: "" });

  const [fundingLines, setFundingLines] = useState<FundingLine[]>([]);

  // ─── Load initial data khi edit ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editItem) {
      setTripCode(editItem.tripCode || "");
      setTripName(editItem.tripName || "");
      setProvince(editItem.location?.province || "");
      setWard(editItem.location?.ward || "");
      setStartDate(editItem.startDate ? format(new Date(editItem.startDate), "yyyy-MM-dd") : "");
      setEndDate(editItem.endDate ? format(new Date(editItem.endDate), "yyyy-MM-dd") : "");
      setExpectedPatients(editItem.expectedPatients?.toString() || "");
      setActualPatients(editItem.actualPatients?.toString() || "");
      setTargetAudience(editItem.targetAudience || "");
      setDistanceKm(editItem.distanceKm?.toString() || "");
      setTransport(editItem.transport || "");
      setDemographics(editItem.demographics || "");
      setNotes(editItem.notes || "");
      setSelectedStaffIds(editItem.staffs?.map((s: any) => s.staffId) || []);
      setGiftLines(
        editItem.gifts?.map((g: any) => ({
          giftTypeId: g.giftTypeId,
          quantity: g.quantity,
          notes: g.notes || "",
        })) || []
      );
      setFundingLines(
        editItem.fundings?.map((f: any) => ({
          source: f.source,
          donationCashId: f.source === "EXISTING" ? f.donationCashId : undefined,
          donorId: f.donation?.donorId,
          amount: Number(f.amount),
          notes: f.notes || "",
        })) || []
      );
    } else {
      setTripCode("");
      setTripName("");
      setProvince("");
      setWard("");
      setStartDate("");
      setEndDate("");
      setExpectedPatients("");
      setActualPatients("");
      setTargetAudience("");
      setDistanceKm("");
      setTransport("");
      setDemographics("");
      setNotes("");
      setSelectedStaffIds([]);
      setGiftLines([]);
      setFundingLines([]);
    }
  }, [editItem, open]);

  // ─── Data queries ──────────────────────────────────────────────────────
  const { data: audienceOptions = [] } = useQuery({
    queryKey: ["custom-options", "trip_audience"],
    queryFn: async () => {
      const res = await fetch("/api/custom-options?type=trip_audience");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const { data: staffList = [] } = useQuery<StaffOption[]>({
    queryKey: ["staffs"],
    queryFn: async () => {
      const res = await fetch("/api/staffs");
      if (!res.ok) return [];
      const json = await res.json();
      return json.staffs || [];
    },
    enabled: open,
  });

  const { data: giftTypes = [] } = useQuery<GiftTypeOption[]>({
    queryKey: ["trip-gift-types"],
    queryFn: async () => {
      const res = await fetch("/api/trip-gift-types");
      if (!res.ok) return [];
      const json = await res.json();
      return json.giftTypes || [];
    },
    enabled: open,
  });

  const { data: availableDonations = [] } = useQuery<DonationAvailable[]>({
    queryKey: ["donations-cash-available"],
    queryFn: async () => {
      const res = await fetch("/api/donations/cash/available");
      if (!res.ok) return [];
      const json = await res.json();
      return json.donations || [];
    },
    enabled: open,
  });

  const { data: donorList = [] } = useQuery<DonorOption[]>({
    queryKey: ["donors-all-light"],
    queryFn: async () => {
      const res = await fetch("/api/donors?limit=500");
      if (!res.ok) return [];
      const json = await res.json();
      return (json.donors || []).map((d: any) => ({ id: d.id, fullName: d.fullName, type: d.type }));
    },
    enabled: open,
  });

  const { data: wardsGeo } = useQuery({
    queryKey: ["wards-by-province-trip", province],
    queryFn: async () => {
      const idx = await (await fetch("/wards/index.json")).json();
      const entry = idx[province];
      if (!entry) return null;
      const res = await fetch(`/wards/${entry.file}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open && !!province,
    staleTime: Infinity,
  });

  const provinceList: string[] = useMemo(
    () => Array.from(new Set(locations.map((l: any) => l.province))).sort() as string[],
    [locations]
  );
  const wardList: string[] = useMemo(() => {
    return wardsGeo?.features
      ? (wardsGeo.features.map((f: any) => f.properties.ten_xa as string) as string[]).sort()
      : [];
  }, [wardsGeo]);

  // Tự ghép tên chuyến khi tỉnh/xã thay đổi (nếu user chưa gõ tay)
  useEffect(() => {
    if (!province) return;
    const auto = ward ? `Từ thiện ${province} - ${ward}` : `Từ thiện ${province}`;
    // Chỉ tự động set nếu user chưa gõ tay (trùng với dạng "Từ thiện ...")
    setTripName((prev) => {
      if (!prev || prev.startsWith("Từ thiện ")) return auto;
      return prev;
    });
  }, [province, ward]);

  // ─── Mutations — staff/gift quick-add ─────────────────────────────────
  const addStaffMutation = useMutation({
    mutationFn: async (data: typeof newStaff) => {
      const res = await fetch("/api/staffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Thêm NVYT thất bại");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["staffs"] });
      setSelectedStaffIds((prev) => [...prev, data.staff.id]);
      setShowAddStaff(false);
      setNewStaff({ fullName: "", staffCode: "", department: "", role: "", phone: "" });
      toast({ title: "Đã thêm NVYT" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const addGiftTypeMutation = useMutation({
    mutationFn: async (data: typeof newGiftType) => {
      const res = await fetch("/api/trip-gift-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Thêm loại quà thất bại");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["trip-gift-types"] });
      setGiftLines((prev) => [...prev, { giftTypeId: data.giftType.id, quantity: 1 }]);
      setShowAddGiftType(false);
      setNewGiftType({ name: "", unit: "" });
      toast({ title: "Đã thêm loại quà" });
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const addAudienceMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch("/api/custom-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trip_audience", label }),
      });
      if (!res.ok) throw new Error("Thêm thất bại");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["custom-options", "trip_audience"] });
      setTargetAudience(data.label);
      setNewAudience("");
    },
  });

  // ─── Submit ────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Tìm hoặc tạo location
      let locationId = locations.find(
        (l: any) => l.province === province && (l.ward || "") === (ward || "")
      )?.id;
      if (!locationId) {
        const r = await fetch("/api/charity-medicine/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ province, ward: ward || null }),
        });
        if (!r.ok) throw new Error("Không tạo được địa điểm");
        const loc = await r.json();
        locationId = loc.id;
        qc.invalidateQueries({ queryKey: ["charity-locations"] });
      }

      const body = {
        tripCode,
        tripName: tripName || undefined,
        locationId,
        startDate,
        endDate,
        expectedPatients: expectedPatients ? parseInt(expectedPatients) : null,
        actualPatients: actualPatients ? parseInt(actualPatients) : null,
        distanceKm: distanceKm ? parseFloat(distanceKm) : null,
        transport: transport || null,
        targetAudience: targetAudience || null,
        demographics: demographics || null,
        notes: notes || null,
        staffIds: selectedStaffIds,
        gifts: giftLines.filter((g) => g.giftTypeId && g.quantity > 0),
        fundings: fundingLines.filter((f) => f.amount > 0),
      };

      const url = editItem ? `/api/charity-medicine/trips/${editItem.id}` : "/api/charity-medicine/trips";
      const res = await fetch(url, {
        method: editItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Lưu thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["charity-trips"] });
      qc.invalidateQueries({ queryKey: ["donations-cash-available"] });
      qc.invalidateQueries({ queryKey: ["donations-cash"] });
      toast({ title: editItem ? "Đã cập nhật chuyến đi" : "Đã tạo chuyến đi" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  // ─── Derived ───────────────────────────────────────────────────────────
  const filteredStaffList = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return staffList;
    return staffList.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        (s.staffCode || "").toLowerCase().includes(q) ||
        (s.department || "").toLowerCase().includes(q)
    );
  }, [staffList, staffSearch]);

  const selectedStaffs = useMemo(
    () => staffList.filter((s) => selectedStaffIds.includes(s.id)),
    [staffList, selectedStaffIds]
  );

  const totalFunding = useMemo(
    () => fundingLines.reduce((sum, f) => sum + (f.amount || 0), 0),
    [fundingLines]
  );

  // ─── Render ────────────────────────────────────────────────────────────
  const canSubmit =
    tripCode.trim() && province && startDate && endDate && !submitMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? "Sửa chuyến đi" : "Tạo chuyến đi mới"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* ────── SECTION 1 — Thông tin cơ bản (luôn mở) ────── */}
          <Section title="1. Thông tin cơ bản" subtitle="Bắt buộc" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mã chuyến *</Label>
                <Input
                  value={tripCode}
                  onChange={(e) => setTripCode(e.target.value)}
                  disabled={!!editItem}
                  placeholder="VD: TT-2026-001"
                />
              </div>
              <div>
                <Label>Tên chuyến (tự ghép)</Label>
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="Từ thiện Tây Ninh - Xã Tân Tập"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tỉnh / TP *</Label>
                <Select value={province} onValueChange={(v) => { setProvince(v); setWard(""); }}>
                  <SelectTrigger><SelectValue placeholder="Chọn tỉnh/TP" /></SelectTrigger>
                  <SelectContent>
                    {provinceList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phường / Xã</Label>
                <Select value={ward} onValueChange={setWard} disabled={!province}>
                  <SelectTrigger><SelectValue placeholder={province ? "Chọn xã" : "Chọn tỉnh trước"} /></SelectTrigger>
                  <SelectContent>
                    {wardList.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ngày đi *</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Ngày về *</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Số BN dự kiến</Label>
                <Input type="number" value={expectedPatients} onChange={(e) => setExpectedPatients(e.target.value)} />
              </div>
              <div>
                <Label>Số BN thực tế</Label>
                <Input type="number" value={actualPatients} onChange={(e) => setActualPatients(e.target.value)} placeholder="Cập nhật sau chuyến" />
              </div>
            </div>

            <div>
              <Label>Đối tượng</Label>
              <div className="flex gap-2">
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Chọn đối tượng" /></SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Hoặc nhập đối tượng mới rồi bấm +"
                  className="h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => newAudience.trim() && addAudienceMutation.mutate(newAudience.trim())}
                  disabled={!newAudience.trim() || addAudienceMutation.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Ghi chú chuyến</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </Section>

          {/* ────── SECTION 2 — Quãng đường & phương tiện ────── */}
          <Section title="2. Quãng đường & phương tiện" subtitle="Nhập tay (tự tính Google Maps sẽ thêm sau)">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quãng đường 1 chiều (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="VD: 320"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Xã → Bệnh viện, 1 chiều. Tra Google Maps rồi nhập số km.
                </p>
              </div>
              <div>
                <Label>Phương tiện</Label>
                <Input value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="Xe khách / Ô tô / ..." />
              </div>
            </div>
            <div>
              <Label>Đặc điểm dân cư / Dịch tễ</Label>
              <Input value={demographics} onChange={(e) => setDemographics(e.target.value)} placeholder="Tỷ lệ già/trẻ em, vùng núi..." />
            </div>
          </Section>

          {/* ────── SECTION 3 — Nhân viên y tế ────── */}
          <Section
            title="3. Nhân viên y tế tham gia"
            subtitle="Danh sách NVYT đi chuyến — cuối năm tổng hợp để tri ân"
            badge={selectedStaffs.length}
          >
            {/* Đã chọn */}
            {selectedStaffs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedStaffs.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 text-xs"
                  >
                    <span className="font-medium">{s.fullName}</span>
                    {s.department && <span className="text-muted-foreground">· {s.department}</span>}
                    <button
                      type="button"
                      onClick={() => setSelectedStaffIds((prev) => prev.filter((id) => id !== s.id))}
                      className="ml-0.5 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <Input
                placeholder="Tìm NVYT để thêm..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />
              {staffSearch && (
                <div className="mt-2 border rounded max-h-40 overflow-y-auto">
                  {filteredStaffList.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">Không tìm thấy — bấm "+ Thêm NVYT mới" bên dưới</p>
                  ) : (
                    filteredStaffList
                      .filter((s) => !selectedStaffIds.includes(s.id))
                      .slice(0, 20)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedStaffIds((prev) => [...prev, s.id]);
                            setStaffSearch("");
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-sm border-b last:border-0"
                        >
                          <div className="font-medium">{s.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {[s.staffCode, s.department, s.role].filter(Boolean).join(" · ")}
                          </div>
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>

            {!showAddStaff ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddStaff(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm NVYT mới vào danh bạ
              </Button>
            ) : (
              <div className="border rounded p-3 space-y-2 bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Họ tên *" value={newStaff.fullName}
                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })} />
                  <Input placeholder="Mã nhân viên" value={newStaff.staffCode}
                    onChange={(e) => setNewStaff({ ...newStaff, staffCode: e.target.value })} />
                  <Input placeholder="Khoa/Phòng" value={newStaff.department}
                    onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} />
                  <Input placeholder="Chức danh (BS, ĐD,...)" value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} />
                  <Input placeholder="Điện thoại" value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addStaffMutation.mutate(newStaff)}
                    disabled={!newStaff.fullName.trim() || addStaffMutation.isPending}
                  >
                    Lưu & Thêm vào chuyến
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddStaff(false)}>
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
          </Section>

          {/* ────── SECTION 4 — Quà tặng ────── */}
          <Section
            title="4. Quà tặng"
            subtitle="Xe lăn, xe đạp là mặc định — thêm quà khác khi cần"
            badge={giftLines.length}
          >
            {giftLines.length > 0 && (
              <div className="space-y-2">
                {giftLines.map((line, idx) => {
                  const gt = giftTypes.find((g) => g.id === line.giftTypeId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Select
                        value={line.giftTypeId}
                        onValueChange={(v) =>
                          setGiftLines((prev) => prev.map((l, i) => (i === idx ? { ...l, giftTypeId: v } : l)))
                        }
                      >
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Chọn loại quà" /></SelectTrigger>
                        <SelectContent>
                          {giftTypes.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}{g.unit ? ` (${g.unit})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="SL"
                        value={line.quantity}
                        onChange={(e) =>
                          setGiftLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, quantity: parseInt(e.target.value) || 0 } : l))
                          )
                        }
                      />
                      <span className="text-xs text-muted-foreground w-10">{gt?.unit || ""}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setGiftLines((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setGiftLines((prev) => [...prev, { giftTypeId: "", quantity: 1 }])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm dòng quà
              </Button>
              {!showAddGiftType ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddGiftType(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Thêm loại quà mới (bò, cầu...)
                </Button>
              ) : null}
            </div>

            {showAddGiftType && (
              <div className="border rounded p-3 space-y-2 bg-slate-50">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Tên quà *" value={newGiftType.name}
                    onChange={(e) => setNewGiftType({ ...newGiftType, name: e.target.value })} />
                  <Input placeholder="Đơn vị (con, chiếc,...)" value={newGiftType.unit}
                    onChange={(e) => setNewGiftType({ ...newGiftType, unit: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addGiftTypeMutation.mutate(newGiftType)}
                    disabled={!newGiftType.name.trim() || addGiftTypeMutation.isPending}
                  >
                    Lưu loại quà
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddGiftType(false)}>
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
          </Section>

          {/* ────── SECTION 5 — Nguồn tài trợ ────── */}
          <Section
            title="5. Nguồn tài trợ"
            subtitle={
              totalFunding > 0
                ? `Tổng: ${totalFunding.toLocaleString("vi-VN")} VND`
                : "Trích từ khoản có sẵn (PTSC 1 tỷ...) hoặc tài trợ riêng cho chuyến"
            }
            badge={fundingLines.length}
          >
            {fundingLines.length > 0 && (
              <div className="space-y-2">
                {fundingLines.map((line, idx) => (
                  <div key={idx} className="border rounded p-3 space-y-2 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={line.source === "EXISTING"}
                            onChange={() =>
                              setFundingLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { source: "EXISTING", amount: l.amount, notes: l.notes } : l
                                )
                              )
                            }
                          />
                          Trích từ khoản có sẵn
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            checked={line.source === "NEW"}
                            onChange={() =>
                              setFundingLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { source: "NEW", amount: l.amount, notes: l.notes } : l
                                )
                              )
                            }
                          />
                          Tài trợ riêng cho chuyến này
                        </label>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setFundingLines((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {line.source === "EXISTING" ? (
                      <Select
                        value={line.donationCashId || ""}
                        onValueChange={(v) =>
                          setFundingLines((prev) => prev.map((l, i) => (i === idx ? { ...l, donationCashId: v } : l)))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khoản tiền còn số dư" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDonations.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.donorName} — Còn {d.remaining.toLocaleString("vi-VN")} VND
                              {d.purpose ? ` (${d.purpose})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={line.donorId || ""}
                        onValueChange={(v) =>
                          setFundingLines((prev) => prev.map((l, i) => (i === idx ? { ...l, donorId: v } : l)))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà tài trợ" />
                        </SelectTrigger>
                        <SelectContent>
                          {donorList.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Số tiền (VND)</Label>
                        <Input
                          type="number"
                          value={line.amount || ""}
                          onChange={(e) =>
                            setFundingLines((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, amount: parseFloat(e.target.value) || 0 } : l
                              )
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ghi chú</Label>
                        <Input
                          value={line.notes || ""}
                          onChange={(e) =>
                            setFundingLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, notes: e.target.value } : l))
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setFundingLines((prev) => [...prev, { source: "EXISTING", amount: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Trích từ khoản có sẵn
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setFundingLines((prev) => [...prev, { source: "NEW", amount: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm tài trợ riêng
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Khi lưu chuyến, phân hệ Tiền mặt sẽ tự cập nhật: kịch bản "trích" trừ vào khoản có sẵn; kịch bản "riêng" tạo 1 khoản mới đã dùng hết, mục đích = tên chuyến.
            </p>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={() => submitMutation.mutate()} disabled={!canSubmit}>
            {submitMutation.isPending ? "Đang lưu..." : editItem ? "Cập nhật" : "Tạo chuyến"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
