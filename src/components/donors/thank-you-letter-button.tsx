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

    // Generate printable HTML — chuẩn văn bản hành chính VN
    // Lề: trên 2cm, dưới 2cm, trái 3cm, phải 2cm (theo Nghị định 30/2020)
    const printHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Thư cảm ơn - ${donor.fullName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page {
    size: A4 portrait;
    margin: 0;
  }
  html, body {
    width: 210mm;
    min-height: 297mm;
    font-family: 'Times New Roman', Times, serif;
    font-size: 13pt;
    line-height: 1.8;
    color: #000;
    background: #fff;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 20mm 20mm 30mm;
  }
  /* Header: 2 cột - trái là cơ quan, phải là địa điểm ngày tháng */
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8mm;
  }
  .org-block {
    text-align: center;
    width: 55%;
  }
  .org-block .ministry {
    font-size: 12pt;
    font-weight: normal;
    text-transform: uppercase;
  }
  .org-block .hospital {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .org-block .dept {
    font-size: 11pt;
    font-weight: bold;
    text-decoration: underline;
    margin-top: 2px;
  }
  .date-block {
    text-align: center;
    font-size: 12pt;
    font-style: italic;
    padding-top: 2px;
    width: 44%;
  }
  /* Tiêu đề thư */
  .letter-title {
    text-align: center;
    font-size: 15pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 6mm 0 5mm;
  }
  /* Kính gửi */
  .recipient {
    font-size: 13pt;
    margin-bottom: 5mm;
  }
  /* Nội dung */
  .body-para {
    text-align: justify;
    text-indent: 10mm;
    margin-bottom: 4mm;
    font-size: 13pt;
  }
  /* Lời chào cuối */
  .closing {
    text-align: justify;
    text-indent: 10mm;
    margin-top: 3mm;
    font-size: 13pt;
  }
  /* Chữ ký */
  .signature-block {
    margin-top: 8mm;
    display: flex;
    justify-content: flex-end;
  }
  .signature-inner {
    text-align: center;
    width: 45%;
  }
  .sig-title {
    font-size: 12pt;
    font-style: italic;
    line-height: 1.5;
  }
  .sig-name {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 18mm;
  }
  @media print {
    html, body { width: 210mm; }
    .page { padding: 20mm 20mm 20mm 30mm; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header-row">
    <div class="org-block">
      <div class="ministry">BỘ Y TẾ</div>
      <div class="hospital">BỆNH VIỆN ĐẠI HỌC Y DƯỢC<br>THÀNH PHỐ HỒ CHÍ MINH</div>
      <div class="dept">Phòng Công tác xã hội</div>
    </div>
    <div class="date-block">
      Thành phố Hồ Chí Minh, ngày ${String(day).padStart(2, "0")} tháng ${String(month).padStart(2, "0")} năm ${year}
    </div>
  </div>

  <div class="letter-title">Thư cảm ơn</div>

  <div class="recipient"><strong>Kính gửi:</strong> ${salutation}</div>

  ${body.split("\n\n").map(p => `<div class="body-para">${p.trim()}</div>`).join("\n  ")}

  <div class="closing">Trân trọng kính chào./.</div>

  <div class="signature-block">
    <div class="signature-inner">
      <div class="sig-title">KT. GIÁM ĐỐC<br>PHÓ GIÁM ĐỐC</div>
      <div class="sig-name">Nguyễn Hoàng Định</div>
    </div>
  </div>

</div>
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
