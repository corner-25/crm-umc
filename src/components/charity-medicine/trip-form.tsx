"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomOptionSelect } from "@/components/ui/custom-option-select";
import { useToast } from "@/hooks/use-toast";

// ────────────────────────────────────────────────────────────────────────────
// Section — accordion thu gọn/mở
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
    <div className="border rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
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
      {open && <div className="p-4 border-t space-y-3">{children}</div>}
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

export interface TripFormProps {
  tripId?: string;                     // undefined = new, defined = edit
  onDone?: () => void;                 // Gọi sau khi lưu thành công (mặc định: router.push về /trips)
}

export function TripForm({ tripId, onDone }: TripFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const isEdit = !!tripId;

  // ─── Fetch data khi edit ───────────────────────────────────────────────
  const { data: editData, isLoading: loadingEdit } = useQuery({
    queryKey: ["charity-trip", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/charity-medicine/trips/${tripId}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.trip;
    },
    enabled: isEdit,
  });

  // ─── Form state ────────────────────────────────────────────────────────
  const [tripCode, setTripCode] = useState("");
  const [tripName, setTripName] = useState("");
  const [province, setProvince] = useState("");
  const [ward, setWard] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expectedPatients, setExpectedPatients] = useState("");
  const [actualPatients, setActualPatients] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [transport, setTransport] = useState("");
  const [demographics, setDemographics] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");

  const [giftLines, setGiftLines] = useState<GiftLine[]>([]);

  const [fundingLines, setFundingLines] = useState<FundingLine[]>([]);

  // ─── Populate từ editData ──────────────────────────────────────────────
  useEffect(() => {
    if (!editData) return;
    setTripCode(editData.tripCode || "");
    setTripName(editData.tripName || "");
    setProvince(editData.location?.province || "");
    setWard(editData.location?.ward || "");
    setStartDate(editData.startDate ? format(new Date(editData.startDate), "yyyy-MM-dd") : "");
    setEndDate(editData.endDate ? format(new Date(editData.endDate), "yyyy-MM-dd") : "");
    setExpectedPatients(editData.expectedPatients?.toString() || "");
    setActualPatients(editData.actualPatients?.toString() || "");
    setTargetAudience(editData.targetAudience || "");
    setDistanceKm(editData.distanceKm?.toString() || "");
    setTransport(editData.transport || "");
    setDemographics(editData.demographics || "");
    setNotes(editData.notes || "");
    setSelectedStaffIds(editData.staffs?.map((s: any) => s.staffId) || []);
    setGiftLines(
      editData.gifts?.map((g: any) => ({
        giftTypeId: g.giftTypeId,
        quantity: g.quantity,
        notes: g.notes || "",
      })) || []
    );
    setFundingLines(
      editData.fundings?.map((f: any) => ({
        source: f.source,
        donationCashId: f.source === "EXISTING" ? f.donationCashId : undefined,
        donorId: f.donation?.donorId,
        amount: Number(f.amount),
        notes: f.notes || "",
      })) || []
    );
  }, [editData]);

  // ─── Data queries ──────────────────────────────────────────────────────
  const { data: locData } = useQuery({
    queryKey: ["charity-locations"],
    queryFn: async () => {
      const res = await fetch("/api/charity-medicine/locations");
      if (!res.ok) return { locations: [] };
      return res.json();
    },
  });
  const locations: any[] = locData?.locations || [];

  const { data: staffList = [] } = useQuery<StaffOption[]>({
    queryKey: ["staffs"],
    queryFn: async () => {
      const res = await fetch("/api/staffs");
      if (!res.ok) return [];
      const json = await res.json();
      return json.staffs || [];
    },
  });

  const { data: giftTypes = [] } = useQuery<GiftTypeOption[]>({
    queryKey: ["trip-gift-types"],
    queryFn: async () => {
      const res = await fetch("/api/trip-gift-types");
      if (!res.ok) return [];
      const json = await res.json();
      return json.giftTypes || [];
    },
  });

  const { data: availableDonations = [] } = useQuery<DonationAvailable[]>({
    queryKey: ["donations-cash-available"],
    queryFn: async () => {
      const res = await fetch("/api/donations/cash/available");
      if (!res.ok) return [];
      const json = await res.json();
      return json.donations || [];
    },
  });

  const { data: donorList = [] } = useQuery<DonorOption[]>({
    queryKey: ["donors-all-light"],
    queryFn: async () => {
      const res = await fetch("/api/donors?limit=500");
      if (!res.ok) return [];
      const json = await res.json();
      return (json.donors || []).map((d: any) => ({ id: d.id, fullName: d.fullName, type: d.type }));
    },
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
    enabled: !!province,
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

  // Tự ghép tên chuyến khi tỉnh/xã thay đổi (nếu user chưa gõ tay riêng)
  useEffect(() => {
    if (!province) return;
    const auto = ward ? `Từ thiện ${province} - ${ward}` : `Từ thiện ${province}`;
    setTripName((prev) => {
      if (!prev || prev.startsWith("Từ thiện ")) return auto;
      return prev;
    });
  }, [province, ward]);

  // ─── Submit ────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
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

      const url = isEdit ? `/api/charity-medicine/trips/${tripId}` : "/api/charity-medicine/trips";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
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
      toast({ title: isEdit ? "Đã cập nhật chuyến đi" : "Đã tạo chuyến đi" });
      if (onDone) onDone();
      else router.push("/charity-medicine/trips");
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

  const canSubmit = province && startDate && endDate && !submitMutation.isPending;

  if (isEdit && loadingEdit) {
    return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-3 max-w-4xl">
      {/* ────── SECTION 1 — Thông tin cơ bản ────── */}
      <Section title="1. Thông tin cơ bản" subtitle="Bắt buộc" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mã chuyến {isEdit ? "" : "(tự sinh sau khi lưu)"}</Label>
            <Input
              value={tripCode}
              disabled
              readOnly
              placeholder="TT-YYYY-XXX (tự sinh)"
              className="bg-slate-50"
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
          <CustomOptionSelect
            type="trip_audience"
            value={targetAudience}
            onChange={(v) => setTargetAudience(Array.isArray(v) ? v[0] || "" : v)}
            placeholder="Chọn hoặc thêm đối tượng..."
          />
        </div>

        <div>
          <Label>Ghi chú chuyến</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </Section>

      {/* ────── SECTION 2 — Quãng đường & phương tiện ────── */}
      <Section title="2. Quãng đường & phương tiện" subtitle="Nhập tay từ Google Maps">
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
              Xã → Bệnh viện, 1 chiều. Tra Google Maps rồi nhập.
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

      {/* ────── SECTION 3 — NVYT ────── */}
      <Section
        title="3. Nhân viên y tế tham gia"
        subtitle="Chọn từ danh bạ đã có — quản lý danh bạ ở mục Nhân viên y tế"
        badge={selectedStaffs.length}
      >
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
            placeholder="Tìm NVYT để thêm (tên / mã / khoa)..."
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
          />
          {staffSearch && (
            <div className="mt-2 border rounded max-h-56 overflow-y-auto">
              {filteredStaffList.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">
                  Không tìm thấy. Thêm NVYT mới ở mục <b>Nhân viên y tế</b> trên sidebar.
                </p>
              ) : (
                filteredStaffList
                  .filter((s) => !selectedStaffIds.includes(s.id))
                  .slice(0, 30)
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
      </Section>

      {/* ────── SECTION 4 — Quà tặng ────── */}
      <Section
        title="4. Quà tặng"
        subtitle="Chọn từ danh mục — quản lý loại quà ở mục Quà tặng"
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

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setGiftLines((prev) => [...prev, { giftTypeId: "", quantity: 1 }])}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Thêm dòng quà
        </Button>
      </Section>

      {/* ────── SECTION 5 — Nguồn tài trợ ────── */}
      <Section
        title="5. Nguồn tài trợ"
        subtitle={
          totalFunding > 0
            ? `Tổng: ${totalFunding.toLocaleString("vi-VN")} VND`
            : "Trích từ khoản có sẵn hoặc tài trợ riêng cho chuyến"
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
          Khi lưu: kịch bản "trích" sẽ trừ vào khoản có sẵn; kịch bản "riêng" tạo 1 khoản mới đã dùng hết, mục đích = tên chuyến.
        </p>
      </Section>

      {/* ────── Footer actions ────── */}
      <div className="flex items-center justify-end gap-2 pt-4 sticky bottom-0 bg-white border-t -mx-1 px-1 pb-1">
        <Button variant="outline" onClick={() => router.push("/charity-medicine/trips")}>
          Huỷ
        </Button>
        <Button onClick={() => submitMutation.mutate()} disabled={!canSubmit}>
          {submitMutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo chuyến"}
        </Button>
      </div>
    </div>
  );
}
