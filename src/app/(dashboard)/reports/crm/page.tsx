"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { FileSpreadsheet, TrendingDown, BarChart3, Wallet, AlertCircle, CheckCircle2, Eye, Trash2, RotateCcw, Plus, Search, Save, Send, Check, Clock, XCircle, Loader2, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CASH_PURPOSES } from "@/lib/validations/donation";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

type ReportType = "overview" | "yearly" | "pending";

type DrilldownGroup = { label: string; items: any[] } | null;

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [drilldown, setDrilldown] = useState<DrilldownGroup>(null);

  // Lập kế hoạch huy động
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [targetPurpose, setTargetPurpose] = useState<string>("");
  const [targetCustodian, setTargetCustodian] = useState<string>("");
  const [targetYear, setTargetYear] = useState<string>("all");
  // null = lẫn lộn (mặc định), "unused_first" = ưu tiên khoản nguyên, "partial_first" = ưu tiên khoản dang dở
  const [priorityMode, setPriorityMode] = useState<"unused_first" | "partial_first" | null>(null);
  const [planGenerated, setPlanGenerated] = useState(false);

  // Saved plan state
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [savedPlanStatus, setSavedPlanStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);

  // Interactive editing state — danh sách khoản đang chọn (mutable)
  const [planSelected, setPlanSelected] = useState<any[]>([]);
  const [planTarget, setPlanTarget] = useState(0);
  const [planTotalAvail, setPlanTotalAvail] = useState(0);
  const [planTrimmed, setPlanTrimmed] = useState(0);
  const [softRemovedIds, setSoftRemovedIds] = useState<Set<string>>(new Set()); // xoá tạm (đã thay thế)
  const [hardRemovedIds, setHardRemovedIds] = useState<Set<string>>(new Set()); // xoá luôn
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: cashData, isLoading } = useQuery({
    queryKey: ["cash-report"],
    queryFn: async () => {
      const res = await fetch("/api/donations/cash?limit=1000");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const allCash: any[] = cashData?.donations || [];

  // ===== DỮ LIỆU BÁO CÁO =====

  // 1. Tổng quan
  const overviewData = useMemo(() => {
    const total = allCash.reduce((s, d) => s + Number(d.amount), 0);
    const used = allCash.reduce((s, d) => s + Number(d.usedAmount || 0), 0);
    const remaining = total - used;

    const byPurpose: Record<string, { total: number; used: number; count: number }> = {};
    allCash.forEach((d) => {
      const p = d.purposeOther || d.purpose || "Không rõ";
      if (!byPurpose[p]) byPurpose[p] = { total: 0, used: 0, count: 0 };
      byPurpose[p].total += Number(d.amount);
      byPurpose[p].used += Number(d.usedAmount || 0);
      byPurpose[p].count += 1;
    });

    const byCustodian: Record<string, { total: number; used: number; count: number }> = {};
    allCash.forEach((d) => {
      const c = d.custodian || "Không rõ";
      if (!byCustodian[c]) byCustodian[c] = { total: 0, used: 0, count: 0 };
      byCustodian[c].total += Number(d.amount);
      byCustodian[c].used += Number(d.usedAmount || 0);
      byCustodian[c].count += 1;
    });

    // Danh sách custodian duy nhất
    const custodians = Array.from(
      new Set(allCash.map((d) => d.custodian || "Không rõ").filter(Boolean))
    ).sort();

    return { total, used, remaining, byPurpose, byCustodian, custodians };
  }, [allCash]);

  // 2. Theo năm
  const yearlyData = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearItems = allCash.filter((d) => new Date(d.receivedDate).getFullYear() === year);
    const months: { received: number; used: number; count: number }[] = Array.from({ length: 12 }, () => ({ received: 0, used: 0, count: 0 }));
    yearItems.forEach((d) => {
      const m = new Date(d.receivedDate).getMonth();
      months[m].received += Number(d.amount);
      months[m].used += Number(d.usedAmount || 0);
      months[m].count += 1;
    });
    return { months, items: yearItems };
  }, [allCash, selectedYear]);

  // 3. Tồn đọng
  const pendingData = useMemo(() => {
    return allCash
      .filter((d) => Number(d.usedAmount || 0) < Number(d.amount))
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
  }, [allCash]);

  // ===== POOL KHOẢN TÀI TRỢ (dùng chung cho algorithm + add dialog) =====
  const filteredPool = useMemo(() => {
    let pool = allCash.filter((d) => Number(d.usedAmount || 0) < Number(d.amount));
    if (targetPurpose && targetPurpose !== "all") {
      pool = pool.filter((d) => (d.purposeOther || d.purpose) === targetPurpose);
    }
    if (targetCustodian && targetCustodian !== "all") {
      pool = pool.filter((d) => (d.custodian || "Không rõ") === targetCustodian);
    }
    if (targetYear && targetYear !== "all") {
      const yr = parseInt(targetYear);
      pool = pool.filter((d) => new Date(d.receivedDate).getFullYear() === yr);
    }
    return pool.map((d) => ({
      ...d,
      _avail: Number(d.amount) - Number(d.usedAmount || 0),
      _isPartial: Number(d.usedAmount || 0) > 0,
    }));
  }, [allCash, targetPurpose, targetCustodian, targetYear]);

  // ===== LẬP KẾ HOẠCH HUY ĐỘNG =====
  // Algorithm chỉ chạy 1 lần khi generatePlan → kết quả lưu vào planSelected state
  const CUSTODIAN_KE_TOAN = "Kế toán đang giữ";

  const runAlgorithm = useCallback(() => {
    const target = parseFloat(targetAmount.replace(/[^\d.]/g, "")) * 1_000_000;
    if (!target || target <= 0) return;

    const avails = [...filteredPool];

    // Ưu tiên 1: Khoản khít đúng target
    const exactMatch = avails.find((d) => d._avail === target);
    if (exactMatch) {
      setPlanSelected([{ ...exactMatch, _take: exactMatch._avail, _source: "auto" }]);
      setPlanTarget(target);
      setPlanTotalAvail(avails.reduce((s, d) => s + d._avail, 0));
      setPlanTrimmed(0);
      return;
    }

    // Logic chính
    const partial = avails
      .filter((d) => d._isPartial)
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
    const unused = avails
      .filter((d) => !d._isPartial)
      .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

    let accumulated = 0;
    const selected: any[] = [];

    // === PHASE 1: Lấy tất cả khoản nhỏ hơn hoặc bằng số tiền còn thiếu (ưu tiên cũ trước) ===
    const pickSmaller = (list: typeof avails) => {
      for (const d of list) {
        if (accumulated >= target) break;
        const need = target - accumulated;
        if (d._avail <= need) {
          // Khoản nhỏ hơn/bằng số thiếu → lấy full
          accumulated += d._avail;
          selected.push({ ...d, _take: d._avail, _source: "auto" });
        }
        // Khoản lớn hơn need → skip ở phase 1, xử lý ở phase 2
      }
    };

    let sortedList: typeof avails;
    if (priorityMode === "partial_first") {
      sortedList = [...partial, ...unused];
    } else if (priorityMode === "unused_first") {
      sortedList = [...unused, ...partial];
    } else {
      sortedList = [...partial, ...unused].sort(
        (a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime()
      );
    }

    pickSmaller(sortedList);

    // === PHASE 2: Nếu vẫn chưa đủ → cần 1 khoản cuối cùng để chốt ===
    if (accumulated < target) {
      const need = target - accumulated;
      const selectedIds = new Set(selected.map((d) => d.id));
      const remaining = sortedList.filter((d) => !selectedIds.has(d.id));

      // Tìm khoản gần nhất với need (ưu tiên khoản vừa đủ hoặc nhỏ nhất > need)
      const closestMatch = remaining
        .filter((d) => d._avail >= need)
        .sort((a, b) => a._avail - b._avail)[0];

      if (closestMatch) {
        if (closestMatch.custodian === CUSTODIAN_KE_TOAN) {
          // Kế toán đang giữ → lấy FULL (không cắt dang dở)
          accumulated += closestMatch._avail;
          selected.push({ ...closestMatch, _take: closestMatch._avail, _source: "auto" });
        } else {
          // Không phải kế toán → lấy ĐÚNG số thiếu (dang dở)
          accumulated += need;
          selected.push({ ...closestMatch, _take: need, _source: "auto" });
        }
      } else if (remaining.length > 0) {
        // Không có khoản nào >= need → lấy khoản lớn nhất còn lại
        const largest = remaining.sort((a, b) => b._avail - a._avail)[0];
        accumulated += largest._avail;
        selected.push({ ...largest, _take: largest._avail, _source: "auto" });
      }
    }

    // === PHASE 3: Trimming — nếu vượt target, loại bỏ khoản nhỏ không cần thiết ===
    let trimmed = 0;
    if (accumulated > target) {
      const sortedByValue = selected
        .map((d, idx) => ({ ...d, _origIdx: idx }))
        .sort((a, b) => a._take - b._take);
      const removeIndices = new Set<number>();
      for (const item of sortedByValue) {
        if (accumulated - item._take >= target) {
          accumulated -= item._take;
          removeIndices.add(item._origIdx);
          trimmed++;
        }
      }
      if (removeIndices.size > 0) {
        const indicesToRemove = Array.from(removeIndices).sort((a, b) => b - a);
        for (const idx of indicesToRemove) selected.splice(idx, 1);
      }
    }

    setPlanSelected(selected);
    setPlanTarget(target);
    setPlanTotalAvail(filteredPool.reduce((s, d) => s + d._avail, 0));
    setPlanTrimmed(trimmed);
  }, [targetAmount, filteredPool, priorityMode]);

  // mobilizationPlan = computed from planSelected state (not useMemo on algorithm)
  const mobilizationPlan = useMemo(() => {
    if (!planGenerated || planSelected.length === 0) return planGenerated ? { selected: [], accumulated: 0, target: planTarget, shortage: planTarget, totalAvail: planTotalAvail, trimmed: planTrimmed } : null;
    const accumulated = planSelected.reduce((s, d) => s + d._take, 0);
    return {
      selected: planSelected,
      accumulated,
      target: planTarget,
      shortage: Math.max(0, planTarget - accumulated),
      totalAvail: planTotalAvail,
      trimmed: planTrimmed,
    };
  }, [planGenerated, planSelected, planTarget, planTotalAvail, planTrimmed]);

  // === Xoá tạm: tự động tìm 1 khoản thay thế tốt nhất, chèn vào đúng vị trí ===
  const handleSoftRemove = (donationId: string) => {
    const removedIdx = planSelected.findIndex((d) => d.id === donationId);
    if (removedIdx === -1) return;
    const removed = planSelected[removedIdx];

    // Tìm khoản thay thế từ pool (chưa có trong plan, chưa bị hardRemoved)
    const selectedIds = new Set(planSelected.map((d) => d.id));
    const candidates = filteredPool
      .filter((d) => !selectedIds.has(d.id) && !hardRemovedIds.has(d.id) && d.id !== donationId)
      .sort((a, b) => Math.abs(a._avail - removed._take) - Math.abs(b._avail - removed._take));

    const replacement = candidates[0] || null;

    setPlanSelected((prev) => {
      const next = [...prev];
      next.splice(removedIdx, 1); // xoá khoản cũ
      if (replacement) {
        // "Kế toán đang giữ" → lấy full _avail
        // Các trường hợp khác → lấy đúng số cần (= _take của khoản bị xoá), không lấy thừa
        const take = replacement.custodian === CUSTODIAN_KE_TOAN
          ? replacement._avail
          : Math.min(removed._take, replacement._avail);
        next.splice(removedIdx, 0, { ...replacement, _take: take, _source: "auto" as const });
      }
      return next;
    });

    setSoftRemovedIds((prev) => new Set([...prev, donationId]));
    if (replacement) {
      const take = replacement.custodian === CUSTODIAN_KE_TOAN
        ? replacement._avail
        : Math.min(removed._take, replacement._avail);
      toast({ title: "Đã thay thế", description: `${removed.donor?.fullName || "?"} (${formatCurrency(removed._take.toString())}) → ${replacement.donor?.fullName || "?"} (${formatCurrency(take.toString())})` });
    } else {
      toast({ variant: "destructive", title: "Không tìm được khoản thay thế", description: `Đã xoá khoản ${removed.donor?.fullName || "?"} (${formatCurrency(removed._take.toString())})` });
    }
  };

  const handleHardRemove = (donationId: string) => {
    setPlanSelected((prev) => prev.filter((d) => d.id !== donationId));
    setHardRemovedIds((prev) => new Set([...prev, donationId]));
  };

  const handleRestoreSoftRemoved = (donationId: string) => {
    // Khôi phục khoản bị xoá tạm: thêm lại vào danh sách
    const d = filteredPool.find((x) => x.id === donationId);
    if (d) {
      setPlanSelected((prev) => [...prev, { ...d, _take: d._avail, _source: "auto" as const }]);
    }
    setSoftRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(donationId);
      return next;
    });
  };

  const handleAddManual = (donationId: string) => {
    const d = filteredPool.find((x) => x.id === donationId);
    if (d) {
      setPlanSelected((prev) => [...prev, { ...d, _take: d._avail, _source: "manual" as const }]);
    }
    setAddDialogOpen(false);
    setAddSearch("");
  };

  // Counter để trigger algorithm (mỗi lần generate tăng 1)
  const [generateCounter, setGenerateCounter] = useState(0);

  // Reset tất cả khi tạo plan mới
  const handleGeneratePlan = () => {
    setSoftRemovedIds(new Set());
    setHardRemovedIds(new Set());
    setSavedPlanId(null);
    setSavedPlanStatus(null);
    setPlanGenerated(true);
    setGenerateCounter((c) => c + 1);
  };

  // Chạy algorithm khi counter thay đổi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { if (generateCounter > 0) runAlgorithm(); }, [generateCounter]);

  // Query danh sách kế hoạch đã lưu
  const { data: savedPlans } = useQuery({
    queryKey: ["mobilization-plans"],
    queryFn: async () => {
      const res = await fetch("/api/mobilization-plans");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Lưu kế hoạch
  const handleSavePlan = useCallback(async () => {
    if (!mobilizationPlan || mobilizationPlan.selected.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/mobilization-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAmount: mobilizationPlan.target,
          accumulatedAmount: mobilizationPlan.accumulated,
          filterPurpose: targetPurpose && targetPurpose !== "all" ? targetPurpose : null,
          filterCustodian: targetCustodian && targetCustodian !== "all" ? targetCustodian : null,
          filterYear: targetYear && targetYear !== "all" ? targetYear : null,
          priorityMode,
          items: mobilizationPlan.selected.map((d: any) => ({
            donationCashId: d.id,
            takeAmount: d._take,
            source: d._source || "auto",
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const plan = await res.json();
      setSavedPlanId(plan.id);
      setSavedPlanStatus(plan.status);
      queryClient.invalidateQueries({ queryKey: ["mobilization-plans"] });
      toast({ title: "Đã lưu", description: `Kế hoạch ${plan.planCode} đã được lưu` });
    } catch {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu kế hoạch" });
    } finally {
      setIsSaving(false);
    }
  }, [mobilizationPlan, targetPurpose, targetCustodian, targetYear, priorityMode, queryClient, toast]);

  // Gửi duyệt
  const handleSubmitPlan = useCallback(async () => {
    if (!savedPlanId) return;
    try {
      const res = await fetch(`/api/mobilization-plans/${savedPlanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSavedPlanStatus("PENDING");
      queryClient.invalidateQueries({ queryKey: ["mobilization-plans"] });
      toast({ title: "Đã gửi duyệt", description: "Kế hoạch đang chờ sếp xác nhận" });
    } catch {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể gửi duyệt" });
    }
  }, [savedPlanId, queryClient, toast]);

  // Xác nhận duyệt (sếp duyệt → trừ tiền)
  const handleApprovePlan = useCallback(async (planId: string) => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/mobilization-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", approvedBy: "Admin" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      if (planId === savedPlanId) setSavedPlanStatus("APPROVED");
      queryClient.invalidateQueries({ queryKey: ["mobilization-plans"] });
      queryClient.invalidateQueries({ queryKey: ["cash-report"] });
      toast({ title: "Đã duyệt", description: "Tiền đã được trừ vào các khoản tài trợ tương ứng" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi", description: err.message || "Không thể duyệt" });
    } finally {
      setIsApproving(false);
    }
  }, [savedPlanId, queryClient, toast]);

  // Xoá kế hoạch (chỉ DRAFT/REJECTED)
  const handleDeletePlan = useCallback(async (planId: string) => {
    try {
      const res = await fetch(`/api/mobilization-plans/${planId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      if (planId === savedPlanId) { setSavedPlanId(null); setSavedPlanStatus(null); }
      queryClient.invalidateQueries({ queryKey: ["mobilization-plans"] });
      toast({ title: "Đã xoá", description: "Kế hoạch đã được xoá" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Lỗi", description: err.message || "Không thể xoá" });
    }
  }, [savedPlanId, queryClient, toast]);

  // Từ chối
  const handleRejectPlan = useCallback(async (planId: string) => {
    try {
      const res = await fetch(`/api/mobilization-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (!res.ok) throw new Error("Failed");
      if (planId === savedPlanId) setSavedPlanStatus("REJECTED");
      queryClient.invalidateQueries({ queryKey: ["mobilization-plans"] });
      toast({ title: "Đã từ chối", description: "Kế hoạch bị từ chối" });
    } catch {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể từ chối" });
    }
  }, [savedPlanId, queryClient, toast]);

  // ===== XUẤT EXCEL =====
  const exportOverview = () => {
    try {
      const { total, used, remaining, byPurpose, byCustodian } = overviewData;
      const wb = XLSX.utils.book_new();
      const rows = [
        ["BÁO CÁO TỔNG QUAN TÌNH HÌNH SỬ DỤNG TIỀN MẶT"],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Chỉ số", "Giá trị", "Tỷ lệ"],
        ["Tổng tiền nhận", total, "100%"],
        ["Tổng đã sử dụng", used, total > 0 ? `${((used / total) * 100).toFixed(1)}%` : "0%"],
        ["Tổng còn lại", remaining, total > 0 ? `${((remaining / total) * 100).toFixed(1)}%` : "0%"],
        ["Số khoản tài trợ", allCash.length, ""],
        ["Số khoản còn tồn", pendingData.length, ""],
        [],
        ["BREAKDOWN THEO MỤC ĐÍCH"],
        ["Mục đích", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byPurpose).map(([p, v]) => [p, v.count, v.total, v.used, v.total - v.used, v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"]),
        [],
        ["BREAKDOWN THEO NGƯỜI GIỮ TIỀN"],
        ["Người giữ", "Số khoản", "Tổng tiền", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...Object.entries(byCustodian).map(([c, v]) => [c, v.count, v.total, v.used, v.total - v.used, v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, "Tổng quan");
      XLSX.writeFile(wb, `BC_TongQuan_TienMat_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất báo cáo tổng quan" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportYearly = () => {
    try {
      const { months, items } = yearlyData;
      const year = selectedYear;
      const wb = XLSX.utils.book_new();
      const rows = [
        [`BÁO CÁO TÌNH HÌNH SỬ DỤNG TIỀN MẶT NĂM ${year}`],
        ["Ngày xuất", format(new Date(), "dd/MM/yyyy HH:mm")],
        [],
        ["Tháng", "Số khoản", "Tổng tiền nhận", "Đã dùng", "Còn lại", "% Sử dụng"],
        ...months.map((v, i) => [`Tháng ${i + 1}`, v.count, v.received, v.used, v.received - v.used, v.received > 0 ? `${((v.used / v.received) * 100).toFixed(1)}%` : "0%"]),
        [],
        ["TỔNG", items.length,
          items.reduce((s, d) => s + Number(d.amount), 0),
          items.reduce((s, d) => s + Number(d.usedAmount || 0), 0),
          items.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0), ""],
        [],
        ["CHI TIẾT CÁC KHOẢN"],
        ["Nhà tài trợ", "Ngày nhận", "Mục đích", "Số tiền", "Đã dùng", "Còn lại", "% SD", "Người giữ"],
        ...items.map((d) => {
          const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
          return [d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "", amt, usd, amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%", d.custodian || ""];
        }),
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, `Năm ${year}`);
      XLSX.writeFile(wb, `BC_TienMat_Nam${year}_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất báo cáo năm ${year}` });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportPending = () => {
    try {
      const today = new Date();
      const wb = XLSX.utils.book_new();
      const summaryRows = [
        ["BÁO CÁO CÁC KHOẢN TIỀN MẶT TỒN ĐỌNG"],
        ["Ngày xuất", format(today, "dd/MM/yyyy HH:mm")],
        [],
        ["STT", "Nhà tài trợ", "Ngày nhận", "Mục đích", "Tổng tiền", "Đã dùng", "Còn lại", "% Đã dùng", "Số ngày tồn", "Người giữ"],
        ...pendingData.map((d, i) => {
          const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
          return [i + 1, d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "", amt, usd, amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%", differenceInDays(today, new Date(d.receivedDate)), d.custodian || ""];
        }),
        [],
        ["TỔNG", "", "", "", pendingData.reduce((s, d) => s + Number(d.amount), 0), pendingData.reduce((s, d) => s + Number(d.usedAmount || 0), 0), pendingData.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0)],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
      ws1["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Tồn đọng");

      const detailRows: any[] = [["CHI TIẾT SỬ DỤNG TỪNG KHOẢN TỒN ĐỌNG"], []];
      pendingData.forEach((d, i) => {
        const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
        detailRows.push([`${i + 1}. ${d.donor?.fullName || "Không rõ"} — ${formatDate(d.receivedDate)}`]);
        detailRows.push(["Mục đích:", d.purposeOther || d.purpose || "Không rõ"]);
        detailRows.push(["Tổng tiền:", amt, "Đã dùng:", usd, "Còn lại:", amt - usd, amt > 0 ? `${((usd / amt) * 100).toFixed(1)}%` : "0%"]);
        detailRows.push(["Tồn đọng:", `${differenceInDays(today, new Date(d.receivedDate))} ngày`, "Người giữ:", d.custodian || ""]);
        const items: any[] = Array.isArray(d.usageItems) ? d.usageItems : [];
        if (items.length > 0) {
          detailRows.push(["Lịch sử sử dụng:"]);
          detailRows.push(["", "STT", "Nội dung chi", "Số tiền"]);
          items.forEach((item: any, j: number) => detailRows.push(["", j + 1, item.description || "", Number(item.amount || 0)]));
        } else {
          detailRows.push(["Chưa có lịch sử sử dụng"]);
        }
        detailRows.push([]);
      });
      const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
      ws2["!cols"] = [{ wch: 5 }, { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Chi tiết sử dụng");
      XLSX.writeFile(wb, `BC_TonDong_TienMat_${format(today, "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: `Đã xuất ${pendingData.length} khoản tồn đọng` });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất báo cáo" }); }
  };

  const exportMobilizationPlan = () => {
    if (!mobilizationPlan) return;
    try {
      const { selected, accumulated, target, shortage } = mobilizationPlan;
      const wb = XLSX.utils.book_new();
      const rows = [
        ["KẾ HOẠCH HUY ĐỘNG VỐN"],
        ["Ngày lập", format(new Date(), "dd/MM/yyyy HH:mm")],
        ["Mục đích sử dụng", targetPurpose && targetPurpose !== "all" ? targetPurpose : "Tất cả"],
        ["Người giữ tiền", targetCustodian && targetCustodian !== "all" ? targetCustodian : "Tất cả"],
        ["Năm khoản tài trợ", targetYear && targetYear !== "all" ? targetYear : "Tất cả"],
        ["Logic ưu tiên", priorityMode === null ? "Lẫn lộn (mặc định)" : priorityMode === "unused_first" ? "Khoản nguyên trước" : "Khoản dang dở trước"],
        ["Số tiền cần huy động", target],
        ["Số tiền có thể huy động", accumulated],
        shortage > 0 ? ["Còn thiếu", shortage] : ["Trạng thái", "ĐỦ TIỀN"],
        [],
        ["STT", "Nhà tài trợ", "Ngày nhận", "Mục đích gốc", "Tổng khoản", "Đã dùng", "Còn lại", "Lấy bao nhiêu", "Ghi chú"],
        ...selected.map((d, i) => [
          i + 1, d.donor?.fullName || "", formatDate(d.receivedDate), d.purposeOther || d.purpose || "",
          Number(d.amount), Number(d.usedAmount || 0), d._avail, d._take,
          Number(d.usedAmount || 0) === 0 ? "Chưa sử dụng" : "Đang sử dụng dở",
        ]),
        [],
        ["TỔNG LẤY", "", "", "", "", "", "", accumulated, ""],
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, "Kế hoạch huy động");
      XLSX.writeFile(wb, `KeHoach_HuyDong_${format(new Date(), "dd-MM-yyyy")}.xlsx`);
      toast({ title: "Thành công", description: "Đã xuất kế hoạch huy động" });
    } catch { toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất" }); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Báo cáo & Thống kê</h2>
        <p className="text-muted-foreground">Xem và xuất báo cáo tình hình sử dụng tiền tài trợ</p>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-2" />Báo cáo</TabsTrigger>
          <TabsTrigger value="mobilize"><Wallet className="h-4 w-4 mr-2" />Lập kế hoạch huy động</TabsTrigger>
        </TabsList>

        {/* ===== TAB BÁO CÁO ===== */}
        <TabsContent value="reports" className="space-y-4 mt-4">

          {/* Chọn loại báo cáo */}
          <div className="flex gap-2">
            {([
              { key: "overview", label: "Tổng quan", icon: BarChart3 },
              { key: "yearly", label: "Theo năm", icon: FileSpreadsheet },
              { key: "pending", label: "Tồn đọng", icon: TrendingDown },
            ] as { key: ReportType; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={reportType === key ? "default" : "outline"}
                onClick={() => setReportType(key)}
                size="sm"
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          {/* BÁO CÁO 1: TỔNG QUAN */}
          {reportType === "overview" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tổng quan tình hình sử dụng tiền mặt</CardTitle>
                <Button onClick={exportOverview} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <>
                    {/* Tóm tắt */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Tổng tiền nhận", value: overviewData.total, sub: `${allCash.length} khoản`, color: "" },
                        { label: "Đã sử dụng", value: overviewData.used, sub: overviewData.total > 0 ? `${((overviewData.used / overviewData.total) * 100).toFixed(1)}%` : "0%", color: "text-blue-600" },
                        { label: "Còn lại (tồn đọng)", value: overviewData.remaining, sub: `${pendingData.length} khoản tồn`, color: "text-orange-600" },
                      ].map((item) => (
                        <div key={item.label} className="border rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value.toString())}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown mục đích */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Theo mục đích</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mục đích</TableHead>
                            <TableHead className="text-right">Số khoản</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead className="text-right">Đã dùng</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead className="text-right">% SD</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(overviewData.byPurpose).map(([p, v]) => (
                            <TableRow key={p}>
                              <TableCell className="font-medium">{p}</TableCell>
                              <TableCell className="text-right">{v.count}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.total.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.used.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency((v.total - v.used).toString())}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={v.total > 0 && v.used / v.total >= 0.9 ? "default" : "secondary"}>
                                  {v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setDrilldown({
                                    label: `Mục đích: ${p}`,
                                    items: allCash.filter((d) => (d.purposeOther || d.purpose || "Không rõ") === p),
                                  })}
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Breakdown người giữ */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Theo người giữ tiền</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Người giữ</TableHead>
                            <TableHead className="text-right">Số khoản</TableHead>
                            <TableHead className="text-right">Tổng tiền</TableHead>
                            <TableHead className="text-right">Còn lại</TableHead>
                            <TableHead className="text-right">% SD</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(overviewData.byCustodian).map(([c, v]) => (
                            <TableRow key={c}>
                              <TableCell className="font-medium">{c}</TableCell>
                              <TableCell className="text-right">{v.count}</TableCell>
                              <TableCell className="text-right">{formatCurrency(v.total.toString())}</TableCell>
                              <TableCell className="text-right">{formatCurrency((v.total - v.used).toString())}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">
                                  {v.total > 0 ? `${((v.used / v.total) * 100).toFixed(1)}%` : "0%"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setDrilldown({
                                    label: `Người giữ: ${c}`,
                                    items: allCash.filter((d) => (d.custodian || "Không rõ") === c),
                                  })}
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* BÁO CÁO 2: THEO NĂM */}
          {reportType === "yearly" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Tình hình sử dụng tiền mặt theo năm</CardTitle>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => <SelectItem key={y} value={y}>Năm {y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={exportYearly} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tháng</TableHead>
                          <TableHead className="text-right">Số khoản</TableHead>
                          <TableHead className="text-right">Tổng tiền nhận</TableHead>
                          <TableHead className="text-right">Đã dùng</TableHead>
                          <TableHead className="text-right">Còn lại</TableHead>
                          <TableHead className="text-right">% Sử dụng</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearlyData.months.map((v, i) => (
                          <TableRow key={i} className={v.count === 0 ? "opacity-40" : ""}>
                            <TableCell className="font-medium">Tháng {i + 1}</TableCell>
                            <TableCell className="text-right">{v.count}</TableCell>
                            <TableCell className="text-right">{v.received > 0 ? formatCurrency(v.received.toString()) : "—"}</TableCell>
                            <TableCell className="text-right">{v.used > 0 ? formatCurrency(v.used.toString()) : "—"}</TableCell>
                            <TableCell className="text-right">{v.received > 0 ? formatCurrency((v.received - v.used).toString()) : "—"}</TableCell>
                            <TableCell className="text-right">
                              {v.received > 0 ? (
                                <Badge variant="outline">{((v.used / v.received) * 100).toFixed(1)}%</Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold bg-muted/50">
                          <TableCell>TỔNG</TableCell>
                          <TableCell className="text-right">{yearlyData.items.length}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.amount), 0).toString())}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.usedAmount || 0), 0).toString())}</TableCell>
                          <TableCell className="text-right">{formatCurrency(yearlyData.items.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0).toString())}</TableCell>
                          <TableCell className="text-right">
                            {(() => {
                              const t = yearlyData.items.reduce((s, d) => s + Number(d.amount), 0);
                              const u = yearlyData.items.reduce((s, d) => s + Number(d.usedAmount || 0), 0);
                              return t > 0 ? <Badge>{((u / t) * 100).toFixed(1)}%</Badge> : "—";
                            })()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* BÁO CÁO 3: TỒN ĐỌNG */}
          {reportType === "pending" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Các khoản tiền mặt tồn đọng</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pendingData.length} khoản · Tổng còn: {formatCurrency(pendingData.reduce((s, d) => s + Number(d.amount) - Number(d.usedAmount || 0), 0).toString())}
                  </p>
                </div>
                <Button onClick={exportPending} disabled={isLoading} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel (2 sheets)
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? <p className="text-muted-foreground text-sm">Đang tải...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhà tài trợ</TableHead>
                        <TableHead>Ngày nhận</TableHead>
                        <TableHead>Mục đích</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                        <TableHead className="text-right">Đã dùng</TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                        <TableHead className="text-right">Tồn (ngày)</TableHead>
                        <TableHead>Người giữ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.map((d) => {
                        const amt = Number(d.amount), usd = Number(d.usedAmount || 0);
                        const days = differenceInDays(new Date(), new Date(d.receivedDate));
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.donor?.fullName || "—"}</TableCell>
                            <TableCell>{formatDate(d.receivedDate)}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{d.purposeOther || d.purpose || "—"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(amt.toString())}</TableCell>
                            <TableCell className="text-right">{usd > 0 ? formatCurrency(usd.toString()) : "—"}</TableCell>
                            <TableCell className="text-right font-medium text-orange-600">{formatCurrency((amt - usd).toString())}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={days > 180 ? "destructive" : days > 90 ? "secondary" : "outline"}>{days}d</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{d.custodian || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TAB LẬP KẾ HOẠCH HUY ĐỘNG ===== */}
        <TabsContent value="mobilize" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lập kế hoạch huy động vốn</CardTitle>
              <p className="text-sm text-muted-foreground">Nhập số tiền cần huy động, hệ thống sẽ gợi ý các khoản theo thứ tự ưu tiên</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Số tiền cần huy động (triệu VNĐ)</label>
                  <Input
                    type="number"
                    placeholder="VD: 300"
                    value={targetAmount}
                    onChange={(e) => { setTargetAmount(e.target.value); setPlanGenerated(false); }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lọc theo mục đích (tuỳ chọn)</label>
                  <Select value={targetPurpose} onValueChange={(v) => { setTargetPurpose(v); setPlanGenerated(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả mục đích" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả mục đích</SelectItem>
                      {CASH_PURPOSES.filter(p => p !== "Khác").map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lọc theo người giữ tiền (tuỳ chọn)</label>
                  <Select value={targetCustodian} onValueChange={(v) => { setTargetCustodian(v); setPlanGenerated(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả nguồn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả người giữ</SelectItem>
                      {overviewData.custodians.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lọc theo năm khoản tài trợ (tuỳ chọn)</label>
                  <Select value={targetYear} onValueChange={(v) => { setTargetYear(v); setPlanGenerated(false); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả năm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả năm</SelectItem>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={y}>Năm {y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Ưu tiên loại khoản (Tuỳ chọn)</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={priorityMode === null ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => { setPriorityMode(null); setPlanGenerated(false); }}
                    >
                      Không ưu tiên
                    </Button>
                    <Button
                      type="button"
                      variant={priorityMode === "unused_first" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => { setPriorityMode("unused_first"); setPlanGenerated(false); }}
                    >
                      Khoản còn nguyên trước
                    </Button>
                    <Button
                      type="button"
                      variant={priorityMode === "partial_first" ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => { setPriorityMode("partial_first"); setPlanGenerated(false); }}
                    >
                      Khoản dang dở trước
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {priorityMode === null
                      ? "Lấy lẫn lộn theo thứ tự ngày nhận, không phân biệt khoản nguyên hay dang dở"
                      : priorityMode === "unused_first"
                      ? "Ưu tiên dùng khoản chưa đụng tới, khoản dang dở dùng để lấp đầy phần còn thiếu"
                      : "Ưu tiên giải phóng khoản đang dùng dở, khoản nguyên dùng để lấp đầy phần còn thiếu"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGeneratePlan}
                disabled={!targetAmount || isLoading}
                className="w-full"
              >
                Tạo kế hoạch huy động
              </Button>
            </CardContent>
          </Card>

          {/* Kết quả kế hoạch */}
          {planGenerated && mobilizationPlan && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {mobilizationPlan.shortage === 0 ? (
                      <><CheckCircle2 className="h-5 w-5 text-green-600" />Đủ tiền huy động</>
                    ) : (
                      <><AlertCircle className="h-5 w-5 text-orange-500" />Không đủ tiền</>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Cần: <span className="font-semibold text-foreground">{formatCurrency((mobilizationPlan.target).toString())}</span></span>
                    <span>Huy động được: <span className={`font-semibold ${mobilizationPlan.accumulated > mobilizationPlan.target ? "text-orange-600" : "text-green-600"}`}>{formatCurrency(mobilizationPlan.accumulated.toString())}</span></span>
                    {mobilizationPlan.accumulated > mobilizationPlan.target && (
                      <span>Vượt: <span className="font-semibold text-orange-600">+{formatCurrency((mobilizationPlan.accumulated - mobilizationPlan.target).toString())}</span></span>
                    )}
                    {mobilizationPlan.shortage > 0 && (
                      <span>Còn thiếu: <span className="font-semibold text-red-600">{formatCurrency(mobilizationPlan.shortage.toString())}</span></span>
                    )}
                    {mobilizationPlan.trimmed > 0 && (
                      <span className="text-xs text-blue-600">Đã tự động loại {mobilizationPlan.trimmed} khoản nhỏ không cần thiết</span>
                    )}
                  </div>
                </div>
                <Button onClick={exportMobilizationPlan} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Xuất Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Nhà tài trợ</TableHead>
                      <TableHead className="w-[100px]">Ngày nhận</TableHead>
                      <TableHead className="w-[140px]">Mục đích gốc</TableHead>
                      <TableHead className="w-[120px] text-right">Tổng khoản</TableHead>
                      <TableHead className="w-[120px] text-right">Còn lại</TableHead>
                      <TableHead className="w-[120px] text-right">Lấy HĐ</TableHead>
                      <TableHead className="w-[120px]">Trạng thái</TableHead>
                      <TableHead className="w-[100px]">Người giữ</TableHead>
                      <TableHead className="w-[80px] text-center">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mobilizationPlan.selected.map((d: any) => (
                      <TableRow key={d.id} className={`h-[44px] ${d._source === "manual" ? "bg-blue-50 dark:bg-blue-950/20" : d._take < d._avail ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}>
                        <TableCell className="font-medium truncate">{d.donor?.fullName || "—"}</TableCell>
                        <TableCell className="text-sm">{formatDate(d.receivedDate)}</TableCell>
                        <TableCell className="truncate text-sm">{d.purposeOther || d.purpose || "—"}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(Number(d.amount).toString())}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(d._avail.toString())}</TableCell>
                        <TableCell className="text-right font-bold text-green-700 text-sm">{formatCurrency(d._take.toString())}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 items-center">
                            {Number(d.usedAmount || 0) === 0
                              ? <Badge variant="outline" className="text-[10px] h-5">Chưa dùng</Badge>
                              : <Badge variant="secondary" className="text-[10px] h-5">Dang dở</Badge>
                            }
                            {d._source === "manual" && <Badge variant="outline" className="text-[10px] h-5 border-blue-500 text-blue-700">Tay</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate">{d.custodian || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => handleSoftRemove(d.id)}
                              title="Xoá tạm — tự thay bằng khoản gần nhất"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleHardRemove(d.id)}
                              title="Xoá luôn — không thay thế"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold bg-muted/50 h-[44px]">
                      <TableCell colSpan={5}>TỔNG HUY ĐỘNG</TableCell>
                      <TableCell className="text-right text-green-700">{formatCurrency(mobilizationPlan.accumulated.toString())}</TableCell>
                      <TableCell colSpan={3}>{mobilizationPlan.selected.length} khoản</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                </div>

                {/* Nút thêm khoản thủ công */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />Thêm khoản vào kế hoạch
                  </Button>
                  {(softRemovedIds.size > 0 || hardRemovedIds.size > 0) && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleGeneratePlan}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset về ban đầu
                    </Button>
                  )}

                  {/* Nút Lưu / Gửi duyệt / Trạng thái */}
                  <div className="ml-auto flex gap-2 items-center">
                    {!savedPlanId && (
                      <Button size="sm" onClick={handleSavePlan} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Lưu kế hoạch
                      </Button>
                    )}
                    {savedPlanId && savedPlanStatus === "DRAFT" && (
                      <>
                        <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />Nháp</Badge>
                        <Button size="sm" onClick={handleSubmitPlan}>
                          <Send className="h-4 w-4 mr-1" />Gửi duyệt
                        </Button>
                      </>
                    )}
                    {savedPlanId && savedPlanStatus === "PENDING" && (
                      <>
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="h-3 w-3 mr-1" />Chờ duyệt</Badge>
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprovePlan(savedPlanId)} disabled={isApproving}>
                          {isApproving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                          Xác nhận duyệt
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleRejectPlan(savedPlanId)}>
                          <XCircle className="h-4 w-4 mr-1" />Từ chối
                        </Button>
                      </>
                    )}
                    {savedPlanId && savedPlanStatus === "APPROVED" && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Đã duyệt — tiền đã trừ</Badge>
                    )}
                    {savedPlanId && savedPlanStatus === "REJECTED" && (
                      <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Từ chối</Badge>
                    )}
                  </div>
                </div>

                {/* Khoản đã xoá tạm (đã được thay thế tự động, có thể khôi phục) */}
                {softRemovedIds.size > 0 && (
                  <div className="border rounded-md p-3 bg-orange-50/50 dark:bg-orange-950/10">
                    <p className="text-xs font-medium text-orange-700 mb-2">Khoản đã xoá tạm — đã thay thế tự động ({softRemovedIds.size}):</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(softRemovedIds).map((id) => {
                        const d = filteredPool.find((x) => x.id === id);
                        if (!d) return null;
                        return (
                          <Badge key={id} variant="outline" className="text-xs border-orange-300 gap-1">
                            {d.donor?.fullName || "?"} — {formatCurrency(d._avail.toString())}
                            <button onClick={() => handleRestoreSoftRemoved(id)} className="ml-1 hover:text-green-600" title="Khôi phục">
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  * Thứ tự ưu tiên: (1) Khoản khít đúng số tiền cần →{" "}
                  {priorityMode === null
                    ? "(2) Lấy lẫn lộn theo ngày nhận"
                    : priorityMode === "unused_first"
                    ? "(2) Khoản còn nguyên → (3) Khoản dang dở"
                    : "(2) Khoản dang dở → (3) Khoản còn nguyên"}
                  {" "}→ Tự động loại khoản nhỏ nếu vượt target.
                  <br />* <RotateCcw className="h-3 w-3 inline" /> Xoá tạm: tự động thay bằng khoản gần nhất. <Trash2 className="h-3 w-3 inline" /> Xoá luôn: loại hẳn, không thay. <Plus className="h-3 w-3 inline" /> Thêm tay: chọn từ pool.
                </p>
              </CardContent>
            </Card>
          )}

          {planGenerated && mobilizationPlan && mobilizationPlan.selected.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p>Không tìm thấy khoản nào phù hợp với bộ lọc đã chọn.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />Thêm khoản thủ công
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lịch sử kế hoạch đã lưu */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setShowSavedPlans(!showSavedPlans)}>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Lịch sử kế hoạch huy động
                {savedPlans && savedPlans.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{savedPlans.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            {showSavedPlans && (
              <CardContent>
                {!savedPlans || savedPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có kế hoạch nào được lưu</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã KH</TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead className="text-right">Cần huy động</TableHead>
                        <TableHead className="text-right">Huy động được</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Người duyệt</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savedPlans.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.planCode}</TableCell>
                          <TableCell className="text-sm">{p.title || "—"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(p.targetAmount).toString())}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(p.accumulatedAmount).toString())}</TableCell>
                          <TableCell>
                            {p.status === "DRAFT" && <Badge variant="outline" className="text-xs">Nháp</Badge>}
                            {p.status === "PENDING" && <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">Chờ duyệt</Badge>}
                            {p.status === "APPROVED" && <Badge className="text-xs bg-green-100 text-green-800 border-green-300">Đã duyệt</Badge>}
                            {p.status === "REJECTED" && <Badge variant="destructive" className="text-xs">Từ chối</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(p.createdAt)}</TableCell>
                          <TableCell className="text-sm">{p.approvedBy || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-center">
                              {p.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                    onClick={() => handleApprovePlan(p.id)}
                                    disabled={isApproving}
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />Duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => handleRejectPlan(p.id)}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />Từ chối
                                  </Button>
                                </>
                              )}
                              {(p.status === "DRAFT" || p.status === "REJECTED") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeletePlan(p.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />Xoá
                                </Button>
                              )}
                              {p.status === "APPROVED" && (
                                <span className="text-xs text-green-700">Duyệt lúc {p.approvedAt ? formatDate(p.approvedAt) : ""}</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            )}
          </Card>

          {/* Dialog thêm khoản thủ công */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm khoản vào kế hoạch huy động</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên nhà tài trợ..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhà tài trợ</TableHead>
                    <TableHead>Ngày nhận</TableHead>
                    <TableHead>Mục đích</TableHead>
                    <TableHead className="text-right">Còn lại</TableHead>
                    <TableHead>Người giữ</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const selectedIds = new Set(mobilizationPlan?.selected.map((d: any) => d.id) || []);
                    const available = filteredPool
                      .filter((d) => !selectedIds.has(d.id) && !hardRemovedIds.has(d.id) && !softRemovedIds.has(d.id))
                      .filter((d) => !addSearch || (d.donor?.fullName || "").toLowerCase().includes(addSearch.toLowerCase()))
                      .sort((a, b) => b._avail - a._avail)
                      .slice(0, 20);

                    if (available.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            Không còn khoản nào trong pool
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return available.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.donor?.fullName || "—"}</TableCell>
                        <TableCell className="text-sm">{formatDate(d.receivedDate)}</TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{d.purposeOther || d.purpose || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(d._avail.toString())}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.custodian || "—"}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="h-7" onClick={() => handleAddManual(d.id)}>
                            <Plus className="h-3.5 w-3.5 mr-1" />Thêm
                          </Button>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Drilldown dialog */}
      <Dialog open={!!drilldown} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drilldown?.label} — {drilldown?.items.length} khoản</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhà tài trợ</TableHead>
                <TableHead>Ngày nhận</TableHead>
                <TableHead>Mục đích</TableHead>
                <TableHead>Người giữ</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Đã dùng</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead className="text-right">% SD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drilldown?.items.map((d) => {
                const amt = Number(d.amount);
                const used = Number(d.usedAmount || 0);
                const remaining = amt - used;
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Link href={`/donors/${d.donor?.id || d.donorId}`} className="font-medium hover:underline" onClick={() => setDrilldown(null)}>
                        {d.donor?.fullName || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(d.receivedDate)}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{d.purposeOther || d.purpose || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.custodian || "—"}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">{formatCurrency(amt.toString())}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">{used > 0 ? formatCurrency(used.toString()) : "—"}</TableCell>
                    <TableCell className={`text-right whitespace-nowrap ${remaining > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                      {remaining > 0 ? formatCurrency(remaining.toString()) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={amt > 0 && used / amt >= 0.9 ? "default" : used > 0 ? "secondary" : "outline"} className="text-xs">
                        {amt > 0 ? `${((used / amt) * 100).toFixed(0)}%` : "0%"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {drilldown?.items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Không có khoản nào</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
