"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { format } from "date-fns";

function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

interface ExportPDFButtonProps {
  donor: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    type: string;
  };
  donations: Array<{
    receivedDate: string;
    amount: number;
    usedAmount: number;
    purpose: string;
    status: string;
    currency: string;
    paymentMethod: string;
    usageNote?: string;
    usageItems?: any[];
  }>;
  userName: string;
}

export function ExportPDFButton({ donor, donations, userName }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("BENH VIEN DAI HOC Y DUOC TP.HCM", 105, 18, { align: "center" });
      doc.setFontSize(12);
      doc.text("BAO CAO TAI TRO", 105, 26, { align: "center" });

      // Donor info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const donorName = removeDiacritics(donor.fullName);
      const donorType = removeDiacritics(donor.type);
      doc.text(`Nha tai tro: ${donorName}`, 14, 36);
      doc.text(`Loai: ${donorType}`, 14, 42);
      if (donor.phone) doc.text(`Dien thoai: ${donor.phone}`, 14, 48);
      if (donor.email) doc.text(`Email: ${donor.email}`, donor.phone ? 100 : 14, donor.phone ? 48 : 48);

      const generatedAt = format(new Date(), "dd/MM/yyyy HH:mm");
      const generatedBy = removeDiacritics(userName);
      doc.text(`Ngay tao: ${generatedAt}`, 14, donor.phone || donor.email ? 56 : 42);
      doc.text(`Nguoi tao: ${generatedBy}`, 100, donor.phone || donor.email ? 56 : 42);

      // Table
      const startY = (donor.phone || donor.email) ? 62 : 52;

      const tableRows = donations.map((d, idx) => {
        const amount = d.amount;
        const used = d.usedAmount;
        const remaining = amount - used;
        const date = d.receivedDate ? format(new Date(d.receivedDate), "dd/MM/yyyy") : "";
        const purpose = removeDiacritics(d.purpose || "");
        const status = remaining <= 0 ? "Da dung het" : used > 0 ? "Dung mot phan" : "Da nhan";
        const formatAmt = (n: number) =>
          n.toLocaleString("vi-VN") + (d.currency === "USD" ? " USD" : " VND");
        return [
          idx + 1,
          date,
          purpose,
          formatAmt(amount),
          formatAmt(used),
          formatAmt(remaining),
          status,
        ];
      });

      autoTable(doc, {
        startY,
        head: [["#", "Ngay nhan", "Muc dich", "So tien", "Da dung", "Con lai", "Tinh trang"]],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 22 },
          2: { cellWidth: 50 },
          3: { cellWidth: 28, halign: "right" },
          4: { cellWidth: 28, halign: "right" },
          5: { cellWidth: 28, halign: "right" },
          6: { cellWidth: 24, halign: "center" },
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // Summary
      const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
      const totalUsed = donations.reduce((s, d) => s + d.usedAmount, 0);
      const totalRemaining = totalAmount - totalUsed;
      const formatVND = (n: number) => n.toLocaleString("vi-VN") + " VND";

      const finalY = (doc as any).lastAutoTable?.finalY || startY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Tong quan:", 14, finalY + 10);
      doc.setFont("helvetica", "normal");
      doc.text(`Tong so khoản tai tro: ${donations.length}`, 14, finalY + 17);
      doc.text(`Tong gia tri: ${formatVND(totalAmount)}`, 14, finalY + 23);
      doc.text(`Tong da su dung: ${formatVND(totalUsed)}`, 14, finalY + 29);
      doc.text(`Tong con lai: ${formatVND(totalRemaining)}`, 14, finalY + 35);

      const fileName = `bao-cao-tai-tro-${removeDiacritics(donor.fullName).replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isGenerating || donations.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      {isGenerating ? "Dang tao PDF..." : "Xuat bao cao PDF"}
    </Button>
  );
}
