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

    // Xưng hô ngắn (lấy tên cuối)
    const pronoun = isCompany ? "Quý vị" : (donor.fullName.startsWith("Anh") || donor.fullName.startsWith("Chú") || donor.fullName.startsWith("Ông") ? "Anh/Ông" : "Chị");
    const shortTitle = `${pronoun} ${shortName}`;

    // Đoạn 3 — số tiền in nghiêng theo đúng file Word: "3.000.000 đồng (<i>Ba triệu đồng</i>)"
    const amountHtml = `${amountFormatted} đồng (<i>${amountText}</i>)`;

    // Build paragraphs as HTML strings (số tiền dùng <i>)
    let paragraphs: string[];
    if (letterType === "first") {
      paragraphs = [
        `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh chân thành cảm ơn sự đồng hành của ${salutation} trong công tác hỗ trợ người bệnh có hoàn cảnh khó khăn đang điều trị tại Bệnh viện.`,
        `Trong rất nhiều sự lựa chọn, chân thành cảm ơn ${shortTitle} đã tin tưởng, lựa chọn Bệnh viện chúng tôi để đồng hành. Sự ghi nhận của ${isCompany && donor.company ? `${donor.fullName} và ${donor.company}` : donor.fullName} chính là nguồn động lực để đội ngũ Bác sĩ, Điều dưỡng, Nhân viên y tế Bệnh viện ngày càng phấn đấu hơn, hoàn thiện hơn, thực hiện tốt sứ mệnh chăm sóc sức khỏe cộng đồng.`,
        `Ngày ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, Phòng Công tác xã hội đã tiếp nhận số tiền ${amountHtml} từ ${shortTitle} và chuyển đến ${recipientCount} trường hợp người bệnh có hoàn cảnh khó khăn, mắc bệnh hiểm nghèo đang điều trị tại Bệnh viện. Sự hỗ trợ về vật chất và tinh thần của ${pronoun} là lời cổ vũ vô cùng quý giá gửi đến gia đình người bệnh khó khăn, giúp họ có thêm niềm tin và động lực để tiếp tục vươn lên trong cuộc sống.`,
        ...(customNote ? [customNote] : []),
        `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh xin kính chúc ${salutation} sức khỏe, bình an và hạnh phúc. Rất mong ${shortTitle} sẽ tiếp tục chung tay cùng Bệnh viện trong những hoạt động hỗ trợ người bệnh khác.`,
      ];
    } else {
      paragraphs = [
        `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh chân thành cảm ơn sự đồng hành của ${salutation} trong công tác hỗ trợ người bệnh có hoàn cảnh khó khăn đang điều trị tại Bệnh viện.`,
        `Trong nhiều năm qua, ${salutation} đã tin tưởng, lựa chọn Bệnh viện chúng tôi để đồng hành trong các hoạt động hỗ trợ người bệnh. Sự ghi nhận của ${isCompany && donor.company ? `${donor.fullName} và ${donor.company}` : donor.fullName} chính là nguồn động lực để đội ngũ Bác sĩ, Điều dưỡng, Nhân viên y tế Bệnh viện ngày càng phấn đấu, hoàn thiện hơn để thực hiện tốt sứ mệnh chăm sóc sức khỏe cộng đồng.`,
        `Ngày ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, Phòng Công tác xã hội đã tiếp nhận số tiền ${amountHtml} từ ${shortTitle} để hỗ trợ cho người bệnh có hoàn cảnh khó khăn, mắc bệnh hiểm nghèo đang điều trị tại Bệnh viện. Sự hỗ trợ về vật chất và tinh thần của ${pronoun} là lời cổ vũ vô cùng quý giá gửi đến gia đình người bệnh khó khăn, giúp họ có thêm niềm tin và động lực để tiếp tục vươn lên trong cuộc sống.`,
        ...(customNote ? [customNote] : []),
        `Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh xin kính chúc ${salutation} thật nhiều sức khỏe, bình an và hạnh phúc${isCompany && donor.company ? `; kính chúc ${donor.company} ngày càng phát triển bền vững, thịnh vượng` : ""}. Rất mong ${shortTitle} sẽ tiếp tục chung tay cùng Bệnh viện trong những hoạt động hỗ trợ người bệnh khác sắp tới.`,
      ];
    }

    // CSS copy y chang từ textutil -convert html của file Word gốc
    const printHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta http-equiv="Content-Style-Type" content="text/css">
<title>Thư cảm ơn - ${donor.fullName}</title>
<style type="text/css">
  @page { size: A4 portrait; margin: 2cm 2cm 2cm 3cm; }
  p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: center; line-height: 17.0px; font: 1.0px 'Times New Roman'; min-height: 1.0px}
  p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: center; line-height: 17.0px; font: 12.0px 'Times New Roman'; min-height: 15.0px}
  p.p3 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: right; line-height: 17.0px; font: 13.0px 'Times New Roman'; min-height: 16.0px}
  p.p4 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: right; line-height: 17.0px; font: 13.0px 'Times New Roman'}
  p.p5 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: center; line-height: 17.0px; font: 11.0px 'Times New Roman'; min-height: 12.0px}
  p.p6 {margin: 0.0px 0.0px 12.0px 0.0px; text-align: center; line-height: 23.0px; font: 16.0px 'Times New Roman'}
  p.p7 {margin: 0.0px 0.0px 0.0px 0.0px; text-align: right; line-height: 17.0px; font: 4.0px 'Times New Roman'; min-height: 5.0px}
  p.p8 {margin: 0.0px 0.0px 12.0px 0.0px; text-align: center; text-indent: 28.4px; line-height: 23.0px; font: 14.0px 'Times New Roman'}
  p.p9 {margin: 6.0px 0.0px 6.0px 0.0px; text-align: justify; text-indent: 28.4px; line-height: 17.0px; font: 14.0px 'Times New Roman'}
  p.p10 {margin: 0.0px 0.0px 6.0px 28.4px; text-align: justify; text-indent: -0.6px; line-height: 23.0px; font: 14.0px 'Times New Roman'}
  p.p11 {margin: 0.0px 0.0px 6.0px 28.4px; text-align: justify; text-indent: -0.6px; line-height: 23.0px; font: 14.0px 'Times New Roman'; min-height: 16.0px}
  p.p12 {margin: 0.0px 0.0px 0.0px 17.9px; text-align: justify; line-height: 17.0px; font: 13.0px 'Times New Roman'}
  p.p13 {margin: 0.0px 0.0px 0.0px 17.9px; text-align: justify; line-height: 17.0px; font: 13.0px 'Times New Roman'; min-height: 16.0px}
  p.p14 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px 'Times New Roman'; min-height: 15.0px}
  span.Apple-tab-span {white-space:pre}
</style>
</head>
<body>
<p class="p1"><br></p>
<p class="p2"><br></p>
<p class="p3"><i></i><br></p>
<p class="p3"><i></i><br></p>
<p class="p4"><i>Thành phố Hồ Chí Minh, ngày ${String(day).padStart(2, "0")} tháng ${String(month).padStart(2, "0")} năm ${year}</i></p>
<p class="p5"><br></p>
<p class="p2"><br></p>
<p class="p6"><b>THƯ CẢM ƠN</b></p>
<p class="p7"><br></p>
<p class="p8">Kính gửi: ${salutation}</p>
${paragraphs.map(p => `<p class="p9">${p}</p>`).join("\n")}
<p class="p10">Trân trọng kính chào./.</p>
<p class="p11"><br></p>
<p class="p12"><b><span class="Apple-tab-span">	</span>KT. GIÁM ĐỐC</b></p>
<p class="p12"><b><span class="Apple-tab-span">	</span>PHÓ GIÁM ĐỐC</b></p>
<p class="p13"><b></b><br></p>
<p class="p13"><b></b><br></p>
<p class="p13"><b></b><br></p>
<p class="p13"><b></b><br></p>
<p class="p13"><b></b><br></p>
<p class="p12"><b><span class="Apple-tab-span">	</span>Nguyễn Hoàng Định</b></p>
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
