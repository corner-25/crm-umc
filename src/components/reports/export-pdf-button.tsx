"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
    purposeOther?: string;
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
  const { toast } = useToast();

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { DonationReportPDF } = await import("./donation-report-pdf");
      const React = await import("react");

      const blob = await pdf(
        React.createElement(DonationReportPDF, {
          donor,
          donations,
          generatedAt: format(new Date(), "dd/MM/yyyy HH:mm"),
          generatedBy: userName,
        }) as any
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bao-cao-tai-tro-${donor.fullName.replace(/\s+/g, "-")}-${format(new Date(), "yyyyMMdd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Thành công", description: "Đã xuất báo cáo PDF" });
    } catch (error) {
      console.error("PDF error:", error);
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xuất PDF" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={isGenerating || donations.length === 0}>
      <FileDown className="mr-2 h-4 w-4" />
      {isGenerating ? "Đang tạo PDF..." : "Xuất báo cáo PDF"}
    </Button>
  );
}
