"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const C = {
  blue: "#1a56db",
  blueDark: "#1e3a8a",
  blueLight: "#eff6ff",
  green: "#15803d",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber: "#b45309",
  amberLight: "#fffbeb",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray700: "#374151",
  black: "#111827",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: C.black,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // Header banner
  headerBanner: {
    backgroundColor: C.blueDark,
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerLogo: {
    width: 52,
    height: 52,
    borderRadius: 4,
    marginLeft: 16,
  },
  hospitalName: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 13,
    color: C.white,
    letterSpacing: 0.3,
  },
  hospitalSub: {
    fontSize: 9,
    color: "#93c5fd",
    marginTop: 2,
  },
  reportTitle: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 18,
    color: C.white,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  reportMeta: {
    fontSize: 8,
    color: "#bfdbfe",
    marginTop: 4,
  },

  // Body
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },

  // Donor card
  donorCard: {
    backgroundColor: C.blueLight,
    borderRadius: 6,
    borderLeft: `3px solid ${C.blue}`,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  donorCardLeft: { flex: 1 },
  donorCardRight: { flex: 1, paddingLeft: 20 },
  donorLabel: {
    fontSize: 7.5,
    color: C.gray500,
    marginBottom: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  donorValue: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 12,
    color: C.blueDark,
    marginBottom: 6,
  },
  donorField: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "center",
  },
  donorFieldLabel: {
    fontSize: 8,
    color: C.gray500,
    width: 60,
  },
  donorFieldValue: {
    fontSize: 8,
    color: C.gray700,
    flex: 1,
  },

  // Summary boxes
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    border: `1px solid ${C.gray300}`,
  },
  summaryBoxBlue: {
    backgroundColor: C.blueLight,
    border: `1px solid #bfdbfe`,
  },
  summaryBoxGreen: {
    backgroundColor: C.greenLight,
    border: `1px solid ${C.greenBorder}`,
  },
  summaryBoxAmber: {
    backgroundColor: C.amberLight,
    border: `1px solid #fcd34d`,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: C.gray500,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 13,
    color: C.blueDark,
  },
  summaryValueGreen: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 13,
    color: C.green,
  },
  summaryValueAmber: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 13,
    color: C.amber,
  },
  summarySub: {
    fontSize: 7.5,
    color: C.gray500,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 10,
    color: C.blueDark,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${C.gray300}`,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Table
  table: { marginBottom: 16 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.blueDark,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 7.5,
    color: C.white,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottom: `1px solid ${C.gray100}`,
    alignItems: "flex-start",
  },
  tableRowAlt: {
    backgroundColor: C.gray50,
  },
  tableCell: {
    fontSize: 8.5,
    color: C.gray700,
  },
  tableCellBold: {
    fontFamily: "Roboto",
    fontWeight: 700,
    fontSize: 8.5,
    color: C.black,
  },

  // Usage items
  usageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    paddingLeft: 6,
  },
  usageItemText: {
    fontSize: 7.5,
    color: C.gray500,
    flex: 1,
  },
  usageItemAmount: {
    fontSize: 7.5,
    color: C.gray700,
    fontFamily: "Roboto",
    fontWeight: 700,
    marginLeft: 4,
  },

  // Status badges
  badgeGreen: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeGreenText: { fontSize: 7, color: C.green, fontFamily: "Roboto", fontWeight: 700 },
  badgeAmber: {
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeAmberText: { fontSize: 7, color: C.amber, fontFamily: "Roboto", fontWeight: 700 },
  badgeGray: {
    backgroundColor: C.gray100,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeGrayText: { fontSize: 7, color: C.gray500, fontFamily: "Roboto", fontWeight: 700 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    borderTop: `1px solid ${C.gray300}`,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: C.gray500 },
  pageNumber: { fontSize: 7, color: C.gray500 },
});

// Column widths (total ~520pt for A4 content)
const COL = {
  no: "4%",
  date: "10%",
  purpose: "26%",
  amount: "13%",
  used: "13%",
  remaining: "13%",
  status: "11%",
  detail: "10%",
};

const formatMoney = (amount: number, currency = "VND") => {
  const formatted = new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  return currency === "USD" ? `${formatted} USD` : `${formatted} đ`;
};

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};

interface DonationReportPDFProps {
  donor: { fullName: string; email?: string; phone?: string; type: string };
  logoUrl?: string;
  donations: Array<{
    receivedDate: string;
    amount: number;
    usedAmount: number;
    purpose: string;
    purposeOther?: string;
    status: string;
    currency: string;
    usageNote?: string;
    usageItems?: { description: string; amount: number }[];
  }>;
  generatedAt: string;
  generatedBy: string;
}

export function DonationReportPDF({ donor, donations, generatedAt, generatedBy, logoUrl }: DonationReportPDFProps) {
  const totalAmount = donations.reduce((s, d) => s + d.amount, 0);
  const totalUsed = donations.reduce((s, d) => s + (d.usedAmount || 0), 0);
  const totalRemaining = totalAmount - totalUsed;
  const usedPct = totalAmount > 0 ? ((totalUsed / totalAmount) * 100).toFixed(1) : "0";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerLeft}>
            <Text style={styles.hospitalName}>BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP.HCM</Text>
            <Text style={styles.hospitalSub}>Phòng Công tác Xã hội</Text>
            <Text style={styles.reportTitle}>BÁO CÁO TÀI TRỢ</Text>
            <Text style={styles.reportMeta}>
              Ngày tạo: {generatedAt}  |  Người tạo: {generatedBy}
            </Text>
          </View>
          {logoUrl && <Image src={logoUrl} style={styles.headerLogo} />}
        </View>

        <View style={styles.body}>

          {/* Donor Info */}
          <View style={styles.donorCard}>
            <View style={styles.donorCardLeft}>
              <Text style={styles.donorLabel}>Nhà tài trợ</Text>
              <Text style={styles.donorValue}>{donor.fullName}</Text>
              {donor.phone && (
                <View style={styles.donorField}>
                  <Text style={styles.donorFieldLabel}>Điện thoại:</Text>
                  <Text style={styles.donorFieldValue}>{donor.phone}</Text>
                </View>
              )}
              {donor.email && (
                <View style={styles.donorField}>
                  <Text style={styles.donorFieldLabel}>Email:</Text>
                  <Text style={styles.donorFieldValue}>{donor.email}</Text>
                </View>
              )}
            </View>
            <View style={styles.donorCardRight}>
              <Text style={styles.donorLabel}>Loại nhà tài trợ</Text>
              <Text style={[styles.donorFieldValue, { marginBottom: 6, fontFamily: "Roboto" }]}>
                {donor.type}
              </Text>
              <Text style={styles.donorLabel}>Số khoản tài trợ</Text>
              <Text style={[styles.donorFieldValue, { fontFamily: "Roboto" }]}>
                {donations.length} khoản
              </Text>
            </View>
          </View>

          {/* Summary Boxes */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, styles.summaryBoxBlue]}>
              <Text style={styles.summaryLabel}>Tổng tiền tài trợ</Text>
              <Text style={styles.summaryValue}>{formatMoney(totalAmount)}</Text>
              <Text style={styles.summarySub}>{donations.length} khoản</Text>
            </View>
            <View style={[styles.summaryBox, styles.summaryBoxAmber]}>
              <Text style={styles.summaryLabel}>Đã sử dụng</Text>
              <Text style={styles.summaryValueAmber}>{formatMoney(totalUsed)}</Text>
              <Text style={styles.summarySub}>{usedPct}% tổng tiền</Text>
            </View>
            <View style={[styles.summaryBox, styles.summaryBoxGreen]}>
              <Text style={styles.summaryLabel}>Còn lại</Text>
              <Text style={styles.summaryValueGreen}>{formatMoney(totalRemaining)}</Text>
              <Text style={styles.summarySub}>
                {donations.filter(d => d.amount - (d.usedAmount || 0) > 0).length} khoản tồn đọng
              </Text>
            </View>
          </View>

          {/* Table */}
          <Text style={styles.sectionTitle}>Chi tiết các khoản tài trợ</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: COL.no, textAlign: "center" }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.date }]}>Ngày nhận</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.purpose }]}>Mục đích</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.amount, textAlign: "right" }]}>Số tiền</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.used, textAlign: "right" }]}>Đã dùng</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.remaining, textAlign: "right" }]}>Còn lại</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.status, textAlign: "center" }]}>Tình trạng</Text>
              <Text style={[styles.tableHeaderCell, { width: COL.detail }]}>Chi tiết</Text>
            </View>

            {donations.map((d, i) => {
              const rem = d.amount - (d.usedAmount || 0);
              const items = d.usageItems || [];
              const isFullyUsed = rem <= 0;
              const isPartial = !isFullyUsed && (d.usedAmount || 0) > 0;
              const purpose = d.purposeOther || d.purpose || "";

              return (
                <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: COL.no, textAlign: "center", color: C.gray500 }]}>{i + 1}</Text>
                  <Text style={[styles.tableCell, { width: COL.date }]}>{fmtDate(d.receivedDate)}</Text>
                  <Text style={[styles.tableCell, { width: COL.purpose }]}>{purpose}</Text>
                  <Text style={[styles.tableCellBold, { width: COL.amount, textAlign: "right" }]}>
                    {formatMoney(d.amount, d.currency)}
                  </Text>
                  <Text style={[styles.tableCell, { width: COL.used, textAlign: "right", color: (d.usedAmount || 0) > 0 ? C.amber : C.gray500 }]}>
                    {(d.usedAmount || 0) > 0 ? formatMoney(d.usedAmount, d.currency) : "—"}
                  </Text>
                  <Text style={[styles.tableCellBold, { width: COL.remaining, textAlign: "right", color: rem > 0 ? C.green : C.gray500 }]}>
                    {rem > 0 ? formatMoney(rem, d.currency) : "—"}
                  </Text>
                  <View style={{ width: COL.status, alignItems: "center", paddingTop: 1 }}>
                    {isFullyUsed ? (
                      <View style={styles.badgeGreen}><Text style={styles.badgeGreenText}>Hết</Text></View>
                    ) : isPartial ? (
                      <View style={styles.badgeAmber}><Text style={styles.badgeAmberText}>Một phần</Text></View>
                    ) : (
                      <View style={styles.badgeGray}><Text style={styles.badgeGrayText}>Đã nhận</Text></View>
                    )}
                  </View>
                  <View style={{ width: COL.detail }}>
                    {items.slice(0, 3).map((item, j) => (
                      <View key={j} style={styles.usageItem}>
                        <Text style={styles.usageItemText}>• {item.description}</Text>
                        <Text style={styles.usageItemAmount}>{formatMoney(item.amount, d.currency)}</Text>
                      </View>
                    ))}
                    {items.length > 3 && (
                      <Text style={[styles.usageItemText, { paddingLeft: 6 }]}>+{items.length - 3} mục...</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Total row */}
            <View style={[styles.tableRow, { backgroundColor: "#eff6ff", borderTop: `2px solid ${C.blue}` }]}>
              <Text style={[styles.tableCellBold, { width: COL.no }]} />
              <Text style={[styles.tableCellBold, { width: COL.date }]} />
              <Text style={[styles.tableCellBold, { width: COL.purpose, color: C.blueDark }]}>TỔNG CỘNG</Text>
              <Text style={[styles.tableCellBold, { width: COL.amount, textAlign: "right", color: C.blueDark }]}>
                {formatMoney(totalAmount)}
              </Text>
              <Text style={[styles.tableCellBold, { width: COL.used, textAlign: "right", color: C.amber }]}>
                {formatMoney(totalUsed)}
              </Text>
              <Text style={[styles.tableCellBold, { width: COL.remaining, textAlign: "right", color: C.green }]}>
                {formatMoney(totalRemaining)}
              </Text>
              <Text style={[styles.tableCellBold, { width: COL.status }]} />
              <Text style={[styles.tableCellBold, { width: COL.detail }]} />
            </View>
          </View>

          {/* Usage notes */}
          {donations.some(d => d.usageNote) && (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.sectionTitle}>Ghi chú tình trạng sử dụng</Text>
              {donations.filter(d => d.usageNote).map((d, i) => (
                <View key={i} style={{ marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid ${C.amber}` }}>
                  <Text style={[styles.tableCell, { fontFamily: "Roboto", fontWeight: 700, marginBottom: 2 }]}>
                    {fmtDate(d.receivedDate)} — {d.purposeOther || d.purpose}
                  </Text>
                  <Text style={[styles.tableCell, { color: C.gray500 }]}>{d.usageNote}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Phòng Công tác Xã hội — BV Đại học Y Dược TP.HCM</Text>
          <Text style={styles.footerText}>Tài liệu được tạo tự động từ hệ thống CRM  |  {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
