"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ThankYouLetterButtonProps {
  donor: {
    fullName: string;
    company?: string | null;
    type?: string;
    cashDonations?: any[];
    inKindDonations?: any[];
  };
}

function numberToVietnamese(num: number): string {
  if (num === 0) return "Không đồng";

  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
  const positions = ["", "nghìn", "triệu", "tỷ"];

  function readThreeDigits(n: number, isFirst: boolean): string {
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    let result = "";

    if (hundreds > 0) {
      result += units[hundreds] + " trăm";
      if (tens === 0 && ones > 0) result += " lẻ";
    }
    if (tens > 0) {
      if (result) result += " ";
      if (tens === 1) result += "mười";
      else result += units[tens] + " mươi";
      if (ones === 1 && tens > 1) result += " mốt";
      else if (ones === 5 && tens > 0) result += " lăm";
      else if (ones > 0) result += " " + units[ones];
    } else if (ones > 0) {
      if (result) result += " ";
      result += units[ones];
    }
    return result;
  }

  const groups: number[] = [];
  let n = Math.floor(num);
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const part = readThreeDigits(groups[i], i === groups.length - 1);
    parts.push(part + (positions[i] ? " " + positions[i] : ""));
  }

  const result = parts.join(" ");
  return result.charAt(0).toUpperCase() + result.slice(1) + " đồng";
}

export function ThankYouLetterButton({ donor }: ThankYouLetterButtonProps) {
  const [open, setOpen] = useState(false);
  const [letterType, setLetterType] = useState<"first" | "repeat">("first");
  const [donationDate, setDonationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [recipientCount, setRecipientCount] = useState("01");
  const [customNote, setCustomNote] = useState("");

  const isCompany = donor.type === "CORPORATE" || !!donor.company;

  const handlePrint = () => {
    const dateObj = new Date(donationDate);
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    const amountNum = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
    const amountText = numberToVietnamese(amountNum);
    const amountFormatted = new Intl.NumberFormat("vi-VN").format(amountNum);

    // Build salutation
    const salutation = isCompany && donor.company
      ? `${donor.fullName} cùng với ${donor.company}`
      : donor.fullName;

    const shortName = donor.fullName.split(" ").pop() || donor.fullName;

    // Build letter body based on type
    let body = "";
    if (letterType === "first") {
      body = `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh chân thành cảm ơn sự đồng hành của ${salutation} trong công tác hỗ trợ người bệnh có hoàn cảnh khó khăn đang điều trị tại Bệnh viện.

Trong rất nhiều sự lựa chọn, chân thành cảm ơn ${isCompany ? "Quý vị" : `${donor.fullName.includes("Anh") || donor.fullName.includes("Chú") ? "Anh/Chú" : "Chị"} ${shortName}`} đã tin tưởng, lựa chọn Bệnh viện chúng tôi để đồng hành. Sự ghi nhận của ${isCompany && donor.company ? `${donor.fullName} và ${donor.company}` : `${donor.fullName.split(" ").slice(-2).join(" ")}`} chính là nguồn động lực để đội ngũ Bác sĩ, Điều dưỡng, Nhân viên y tế Bệnh viện ngày càng phấn đấu hơn, hoàn thiện hơn, thực hiện tốt sứ mệnh chăm sóc sức khỏe cộng đồng.

Ngày ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, Phòng Công tác xã hội đã tiếp nhận số tiền ${amountFormatted} đồng (${amountText}) từ ${isCompany ? "Quý vị" : `${donor.fullName.split(" ").slice(-2).join(" ")}`} và chuyển đến ${recipientCount} trường hợp người bệnh có hoàn cảnh khó khăn, mắc bệnh hiểm nghèo đang điều trị tại Bệnh viện. Sự hỗ trợ về vật chất và tinh thần của ${isCompany ? "Quý vị" : "Chị/Anh"} là lời cổ vũ vô cùng quý giá gửi đến gia đình người bệnh khó khăn, giúp họ có thêm niềm tin và động lực để tiếp tục vươn lên trong cuộc sống.${customNote ? "\n\n" + customNote : ""}

Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh xin kính chúc ${salutation} sức khỏe, bình an và hạnh phúc. Rất mong ${isCompany ? "Quý vị" : `${donor.fullName.split(" ").slice(-2).join(" ")}`} sẽ tiếp tục chung tay cùng Bệnh viện trong những hoạt động hỗ trợ người bệnh khác.`;
    } else {
      body = `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh chân thành cảm ơn sự đồng hành của ${salutation} trong công tác hỗ trợ người bệnh có hoàn cảnh khó khăn đang điều trị tại Bệnh viện.

Trong nhiều năm qua, ${salutation} đã tin tưởng, lựa chọn Bệnh viện chúng tôi để đồng hành trong các hoạt động hỗ trợ người bệnh. Sự ghi nhận của ${isCompany && donor.company ? `${donor.fullName} và ${donor.company}` : `${donor.fullName.split(" ").slice(-2).join(" ")}`} chính là nguồn động lực để đội ngũ Bác sĩ, Điều dưỡng, Nhân viên y tế Bệnh viện ngày càng phấn đấu, hoàn thiện hơn để thực hiện tốt sứ mệnh chăm sóc sức khỏe cộng đồng.

Ngày ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, Phòng Công tác xã hội đã tiếp nhận số tiền ${amountFormatted} đồng (${amountText}) từ ${isCompany ? "Quý vị" : `${donor.fullName.split(" ").slice(-2).join(" ")}`} để hỗ trợ cho người bệnh có hoàn cảnh khó khăn, mắc bệnh hiểm nghèo đang điều trị tại Bệnh viện. Sự hỗ trợ về vật chất và tinh thần của ${isCompany ? "Quý vị" : "Chị/Anh"} là lời cổ vũ vô cùng quý giá gửi đến gia đình người bệnh khó khăn, giúp họ có thêm niềm tin và động lực để tiếp tục vươn lên trong cuộc sống.${customNote ? "\n\n" + customNote : ""}

Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh xin kính chúc ${salutation} thật nhiều sức khỏe, bình an và hạnh phúc${isCompany && donor.company ? `; kính chúc ${donor.company} ngày càng phát triển bền vững, thịnh vượng` : ""}. Rất mong ${isCompany ? "Quý vị" : `${donor.fullName.split(" ").slice(-2).join(" ")}`} sẽ tiếp tục chung tay cùng Bệnh viện trong những hoạt động hỗ trợ người bệnh khác sắp tới.`;
    }

    // HTML in đúng 1:1 theo file Word (CSS đo từ textutil -convert html)
    const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Thư cảm ơn - ${donor.fullName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 2cm 2cm 2cm 3cm; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 14px;
    color: #000;
    background: #fff;
  }
  /* Dòng trống đầu (file gốc có 4 dòng trống trước ngày tháng) */
  .top-spacer { height: 68px; }
  /* Ngày tháng: right, italic, 13px, line-height 17px */
  .p-date {
    margin: 0; text-align: right; line-height: 17px;
    font-size: 13px; font-style: italic;
  }
  /* Dòng trống sau ngày */
  .spacer-sm { height: 17px; }
  .spacer-md { height: 34px; }
  /* THƯ CẢM ƠN: center, bold, 16px, margin-bottom 12px, line-height 23px */
  .p-title {
    margin: 0 0 12px 0; text-align: center; line-height: 23px;
    font-size: 16px; font-weight: bold;
  }
  /* Kính gửi: center, text-indent 28.4px, line-height 23px, 14px, margin-bottom 12px */
  .p-recipient {
    margin: 0 0 12px 0; text-align: center; text-indent: 28.4px;
    line-height: 23px; font-size: 14px;
  }
  /* Body paragraphs: justify, text-indent 28.4px, line-height 17px, margin 6px top/bottom */
  .p-body {
    margin: 6px 0; text-align: justify; text-indent: 28.4px;
    line-height: 17px; font-size: 14px;
  }
  /* Số tiền in nghiêng */
  .p-body i { font-style: italic; }
  /* Trân trọng: margin-left 28.4px, justify, line-height 23px, margin-bottom 6px */
  .p-closing {
    margin: 0 0 6px 28.4px; text-align: justify;
    line-height: 23px; font-size: 14px;
  }
  /* Chữ ký: margin-left 17.9px, line-height 17px, 13px, bold */
  .p-sig {
    margin: 0 0 0 17.9px; text-align: justify;
    line-height: 17px; font-size: 13px; font-weight: bold;
  }
  .p-sig-space { margin: 0 0 0 17.9px; line-height: 17px; height: 17px; }
  /* 5 dòng trống giữa chức danh và tên ký */
  .sig-gap { height: 85px; }
  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="top-spacer"></div>

<p class="p-date">Thành phố Hồ Chí Minh, ngày ${String(day).padStart(2, "0")} tháng ${String(month).padStart(2, "0")} năm ${year}</p>
<div class="spacer-md"></div>
<div class="spacer-sm"></div>

<p class="p-title">THƯ CẢM ƠN</p>
<div class="spacer-sm" style="height:23px"></div>

<p class="p-recipient">Kính gửi: ${salutation}</p>

${body.split("\n\n").map(p => `<p class="p-body">${p.trim()}</p>`).join("\n")}

<p class="p-closing">Trân trọng kính chào./.</p>
<div class="spacer-sm"></div>

<p class="p-sig">&nbsp;&nbsp;&nbsp;&nbsp;KT. GIÁM ĐỐC</p>
<p class="p-sig">&nbsp;&nbsp;&nbsp;&nbsp;PHÓ GIÁM ĐỐC</p>
<div class="sig-gap"></div>
<p class="p-sig">&nbsp;&nbsp;&nbsp;&nbsp;Nguyễn Hoàng Định</p>

</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        Thư cảm ơn
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>In thư cảm ơn — {donor.fullName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Loại thư</Label>
              <Select value={letterType} onValueChange={(v) => setLetterType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">Lần đầu tài trợ</SelectItem>
                  <SelectItem value="repeat">Tài trợ lần tiếp theo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ngày tiếp nhận</Label>
                <Input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Tiền tệ</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Số tiền (VD: 3000000)</Label>
              <Input
                type="number"
                placeholder="3000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amount && (
                <p className="text-xs text-muted-foreground mt-1">
                  {numberToVietnamese(parseFloat(amount) || 0)}
                </p>
              )}
            </div>

            <div>
              <Label>Số trường hợp được hỗ trợ</Label>
              <Input
                placeholder="01"
                value={recipientCount}
                onChange={(e) => setRecipientCount(e.target.value)}
              />
            </div>

            <div>
              <Label>Ghi chú thêm (tùy chọn)</Label>
              <Textarea
                placeholder="Thông tin thêm muốn đưa vào thư..."
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handlePrint} disabled={!amount || !donationDate}>
              <Printer className="mr-2 h-4 w-4" />
              Xem & In thư
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
