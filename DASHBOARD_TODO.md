# Gợi ý bổ sung Dashboard (góc nhìn quản trị)

> Tạo ngày: 2026-03-14
> Trạng thái: Chờ đủ dữ liệu để implement

---

## Ưu tiên 1 — Hợp đồng sắp hết hạn (rủi ro tài chính trực tiếp)

**Metric cần thêm:**
- Số hợp đồng hết hạn trong 30 / 60 / 90 ngày tới
- Tổng giá trị cam kết chưa thu được từ các hợp đồng sắp hết hạn

**Nguồn dữ liệu:** bảng `Contract`, field `endDate`, `status = ACTIVE`, `committedAmount`

**Gợi ý hiển thị:** Card cảnh báo màu cam/đỏ, click vào → chuyển sang `/contracts` đã lọc sẵn

---

## Ưu tiên 2 — Lead Pipeline Funnel (phân bổ nhân lực)

**Metric cần thêm:**
- Số lead đang ở từng giai đoạn: NEW → CONTACTED → INTERESTED → NEGOTIATING → CONVERTED → LOST
- Tỷ lệ chuyển đổi tổng thể (converted / total)
- Số lead không có tương tác trong > 7 ngày (bị bỏ quên)

**Nguồn dữ liệu:** bảng `Donor`, field `leadStatus`, `leadSource`, `convertedAt`, bảng `Interaction`

**Gợi ý hiển thị:** Funnel chart hoặc bảng nhỏ từng giai đoạn, click → `/leads`

---

## Ưu tiên 3 — Bệnh nhân ung thư đang điều trị (trách nhiệm xã hội)

**Metric cần thêm:**
- Số bệnh nhân ACTIVE hiện tại
- Số chu kỳ điều trị sắp tới trong tháng
- Số bệnh nhân chưa có nhà tài trợ cho chu kỳ tiếp theo (cần tìm sponsor gấp)

**Nguồn dữ liệu:** bảng `CancerPatient` (status=ACTIVE), `PatientTreatment` (status=UPCOMING), `isSponsored`

**Gợi ý hiển thị:** 3 số nhỏ trong 1 card, click → `/cancer-support/tracking`

---

## Ưu tiên 4 — Nhà tài trợ im lặng / nguy cơ mất (retention)

**Metric cần thêm:**
- Số nhà tài trợ không có tương tác trong > 3 tháng
- Số nhà tài trợ không có tương tác trong > 6 tháng (nguy cơ cao)
- Tỷ lệ nhà tài trợ quay lại (có donation ≥ 2 năm khác nhau)

**Nguồn dữ liệu:** bảng `Interaction`, `DonationCash`, `Donor`

**Gợi ý hiển thị:** Card cảnh báo, list 5 nhà tài trợ cần liên hệ lại sớm nhất

---

## Ưu tiên 5 — Hiệu suất nhân viên (quản lý đội nhóm)

**Metric cần thêm:**
- Số nhà tài trợ mỗi nhân viên đang quản lý (manager assignment)
- Số tương tác mỗi nhân viên thực hiện trong tháng
- Tỷ lệ lead chuyển đổi theo nhân viên phụ trách

**Nguồn dữ liệu:** bảng `User`, `Donor.managerId`, `Interaction.userId` (cần thêm field nếu chưa có)

**Gợi ý hiển thị:** Bảng nhỏ tên nhân viên + số liệu, chỉ hiện với role ADMIN/MANAGER

---

## Thấp hơn — Tài chính vs. Kế hoạch

**Metric cần thêm:**
- So sánh tài trợ thu được vs. mục tiêu fundraising (đã có module lập kế hoạch trong `/reports`)
- % hoàn thành mục tiêu theo từng hạng mục mục đích
- Progress bar tổng thể

**Ghi chú:** Cần thêm bảng lưu mục tiêu (target) theo năm/mục đích nếu muốn so sánh động

---

## Ghi chú kỹ thuật

- Hầu hết metric trên có thể tính từ dữ liệu hiện có, không cần migration schema
- Ngoại lệ: Hiệu suất nhân viên cần xem lại `Interaction` có lưu `userId` không
- Nên gộp các metric mới vào endpoint `GET /api/dashboard/stats` hiện tại để giảm số request
