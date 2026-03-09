"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Style cho PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 24,
    borderBottom: "2px solid #1a56db",
    paddingBottom: 12,
  },
  hospitalName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a56db",
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    padding: "6 8",
    backgroundColor: "#eff6ff",
    color: "#1a56db",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    color: "#6b7280",
  },
  value: {
    width: "65%",
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 4",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 4",
    borderBottom: "1px solid #e5e7eb",
  },
  col1: { width: "25%" },
  col2: { width: "20%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  col5: { width: "15%", textAlign: "right" },
  highlightBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 4,
    border: "1px solid #bbf7d0",
    marginTop: 8,
  },
  highlightLabel: {
    fontSize: 10,
    color: "#166534",
  },
  highlightValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#15803d",
  },
  warningBox: {
    backgroundColor: "#fef3c7",
    padding: 8,
    border: "1px solid #fcd34d",
    borderRadius: 4,
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface DonationReportPDFProps {
  donor: {
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
  }>;
  generatedAt: string;
  generatedBy: string;
}

const formatMoney = (amount: number, currency: string = "VND") => {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  }
  return new Intl.NumberFormat("en-US").format(amount) + " " + currency;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const STATUS_LABELS: Record<string, string> = {
  COMMITTED: "Cam kết",
  RECEIVED: "Đã nhận",
  IN_USE: "Đang dùng",
  REPORTED: "Đã báo cáo",
};

export function DonationReportPDF({ donor, donations, generatedAt, generatedBy }: DonationReportPDFProps) {
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalUsed = donations.reduce((sum, d) => sum + (d.usedAmount || 0), 0);
  const totalRemaining = totalAmount - totalUsed;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.hospitalName}>BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP.HCM</Text>
          <Text style={{ fontSize: 9, color: "#6b7280" }}>Phòng Công tác Xã hội</Text>
          <Text style={styles.reportTitle}>BÁO CÁO TÀI TRỢ</Text>
          <Text style={styles.reportSubtitle}>Ngày tạo: {generatedAt} | Người tạo: {generatedBy}</Text>
        </View>

        {/* Thông tin nhà tài trợ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN NHÀ TÀI TRỢ</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Họ và tên:</Text>
            <Text style={styles.value}>{donor.fullName}</Text>
          </View>
          {donor.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{donor.email}</Text>
            </View>
          )}
          {donor.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Điện thoại:</Text>
              <Text style={styles.value}>{donor.phone}</Text>
            </View>
          )}
        </View>

        {/* Tổng quan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TỔNG QUAN</Text>
          <View style={styles.highlightBox}>
            <View>
              <Text style={styles.highlightLabel}>Tổng tài trợ</Text>
              <Text style={styles.highlightValue}>{formatMoney(totalAmount)}</Text>
            </View>
            <View>
              <Text style={styles.highlightLabel}>Đã sử dụng</Text>
              <Text style={{ ...styles.highlightValue, color: "#1d4ed8" }}>{formatMoney(totalUsed)}</Text>
            </View>
            <View>
              <Text style={styles.highlightLabel}>Còn dư</Text>
              <Text style={styles.highlightValue}>{formatMoney(totalRemaining)}</Text>
            </View>
            <View>
              <Text style={styles.highlightLabel}>Số khoản</Text>
              <Text style={styles.highlightValue}>{donations.length}</Text>
            </View>
          </View>
        </View>

        {/* Chi tiết từng khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHI TIẾT CÁC KHOẢN TÀI TRỢ</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Ngày nhận</Text>
              <Text style={styles.col2}>Mục đích</Text>
              <Text style={styles.col3}>Số tiền</Text>
              <Text style={styles.col4}>Đã dùng</Text>
              <Text style={styles.col5}>Còn dư</Text>
            </View>
            {donations.map((d, i) => {
              const remaining = d.amount - (d.usedAmount || 0);
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 ? {} : { backgroundColor: "#f9fafb" }]}>
                  <Text style={styles.col1}>{formatDate(d.receivedDate)}</Text>
                  <Text style={[styles.col2, { fontSize: 8 }]} numberOfLines={2}>{d.purpose}</Text>
                  <Text style={styles.col3}>{formatMoney(d.amount, d.currency)}</Text>
                  <Text style={styles.col4}>{formatMoney(d.usedAmount || 0, d.currency)}</Text>
                  <Text style={[styles.col5, { color: remaining === 0 ? "#6b7280" : "#15803d" }]}>
                    {formatMoney(remaining, d.currency)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ghi chú sử dụng */}
        {donations.some(d => d.usageNote) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GHI CHÚ TÌNH TRẠNG SỬ DỤNG</Text>
            {donations.filter(d => d.usageNote).map((d, i) => (
              <View key={i} style={[styles.warningBox, { marginBottom: 6 }]}>
                <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold" }}>
                  {formatDate(d.receivedDate)} — {d.purpose}:
                </Text>
                <Text style={{ fontSize: 9, marginTop: 3 }}>{d.usageNote}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Phòng Công tác Xã hội - BV Đại học Y Dược TP.HCM</Text>
          <Text style={styles.footerText}>Tài liệu được tạo tự động từ hệ thống CRM</Text>
        </View>
      </Page>
    </Document>
  );
}
