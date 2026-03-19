# 📝 HƯỚNG DẪN THÊM ENVIRONMENT VARIABLES TRÊN RAILWAY

## 🎯 Tổng quan
Sau khi Railway build xong, bạn cần thêm các biến môi trường (Environment Variables) để app chạy được.

---

## 📍 BƯỚC 1: MỞ RAILWAY DASHBOARD

1. Truy cập: https://railway.app/dashboard
2. Click vào **Project** của bạn
3. Bạn sẽ thấy 2 services:
   - **PostgreSQL** (database)
   - **Next.js app** (ứng dụng của bạn)

---

## 📍 BƯỚC 2: VÀO VARIABLES TAB

1. Click vào service **Next.js app** (không phải PostgreSQL)
2. Click tab **"Variables"** ở menu bên trái
3. Bạn sẽ thấy giao diện để thêm biến môi trường

---

## 📍 BƯỚC 3: THÊM DATABASE_URL (QUAN TRỌNG NHẤT!)

⚠️ **KHÔNG NHẬP MANUAL!** Phải link từ PostgreSQL service:

1. Click button **"+ New Variable"**
2. Chọn **"Add Variable Reference"**
3. Select service: **PostgreSQL**
4. Select variable: **DATABASE_URL**
5. Click **"Add Reference"**

✅ Giờ DATABASE_URL đã được link tự động!

---

## 📍 BƯỚC 4: GENERATE NEXTAUTH_SECRET

### Cách 1: Dùng script có sẵn (Mac/Linux)
```bash
cd /Users/quang/Desktop/crm-system
./generate-secret.sh
```

### Cách 2: Dùng OpenSSL command
```bash
openssl rand -base64 32
```

### Cách 3: Online generator
Truy cập: https://generate-secret.vercel.app/32

**Copy kết quả** (dạng: `abc123XYZ...`) để dùng cho bước tiếp theo.

---

## 📍 BƯỚC 5: THÊM CÁC VARIABLES CÒN LẠI

Click **"+ New Variable"** và thêm từng biến sau:

### 1. NEXTAUTH_URL
```
Variable Name: NEXTAUTH_URL
Value: ${{RAILWAY_PUBLIC_DOMAIN}}
```
📝 **Lưu ý:** Nhập chính xác `${{RAILWAY_PUBLIC_DOMAIN}}` - Railway sẽ tự thay thế bằng domain thực.

### 2. NEXTAUTH_SECRET
```
Variable Name: NEXTAUTH_SECRET
Value: <paste_key_từ_bước_4>
```
📝 Paste key bạn vừa generate ở Bước 4.

### 3. EMAIL_SERVER_HOST
```
Variable Name: EMAIL_SERVER_HOST
Value: smtp.gmail.com
```

### 4. EMAIL_SERVER_PORT
```
Variable Name: EMAIL_SERVER_PORT
Value: 587
```

### 5. EMAIL_SERVER_USER
```
Variable Name: EMAIL_SERVER_USER
Value: <your-email@gmail.com>
```
📝 Thay bằng email Gmail của bạn.

### 6. EMAIL_SERVER_PASSWORD
```
Variable Name: EMAIL_SERVER_PASSWORD
Value: <your-gmail-app-password>
```
📝 **QUAN TRỌNG:** Không phải password Gmail thường! Xem hướng dẫn lấy App Password bên dưới.

### 7. EMAIL_FROM
```
Variable Name: EMAIL_FROM
Value: Hospital CRM <noreply@hospital.com>
```
📝 Có thể đổi tên và email theo ý bạn.

### 8. NEXT_PUBLIC_APP_NAME
```
Variable Name: NEXT_PUBLIC_APP_NAME
Value: Hospital CRM System
```

### 9. NEXT_PUBLIC_HOSPITAL_NAME
```
Variable Name: NEXT_PUBLIC_HOSPITAL_NAME
Value: Bệnh viện ABC
```
📝 Thay bằng tên bệnh viện thật của bạn.

### 10. NODE_ENV
```
Variable Name: NODE_ENV
Value: production
```

---

## 🔐 HƯỚNG DẪN LẤY GMAIL APP PASSWORD

### Bước 1: Bật 2-Step Verification
1. Vào: https://myaccount.google.com/security
2. Tìm **"2-Step Verification"**
3. Click **"Get Started"** và làm theo hướng dẫn
4. Verify bằng phone number

### Bước 2: Tạo App Password
1. Sau khi bật 2-Step Verification, vào lại: https://myaccount.google.com/security
2. Tìm **"App passwords"** (trong phần Security)
3. Click vào **"App passwords"**
4. Select app: **"Mail"**
5. Select device: **"Other"** → Nhập: `Railway CRM`
6. Click **"Generate"**

### Bước 3: Copy Password
1. Bạn sẽ thấy mật khẩu **16 ký tự** (dạng: `abcd efgh ijkl mnop`)
2. **Copy toàn bộ** (bỏ dấu cách giữa các chữ cái)
3. Paste vào `EMAIL_SERVER_PASSWORD` ở Railway

⚠️ **LƯU Ý:**
- Mật khẩu này CHỈ hiện 1 lần
- Lưu lại ở đâu đó an toàn
- Nếu mất, tạo lại password mới

---

## 📍 BƯỚC 6: VERIFY VARIABLES

Sau khi thêm hết, check lại danh sách variables:

✅ **Phải có 11 variables:**
1. DATABASE_URL (Reference từ PostgreSQL)
2. NEXTAUTH_URL
3. NEXTAUTH_SECRET
4. EMAIL_SERVER_HOST
5. EMAIL_SERVER_PORT
6. EMAIL_SERVER_USER
7. EMAIL_SERVER_PASSWORD
8. EMAIL_FROM
9. NEXT_PUBLIC_APP_NAME
10. NEXT_PUBLIC_HOSPITAL_NAME
11. NODE_ENV

---

## 📍 BƯỚC 7: REDEPLOY APP

Sau khi thêm variables:

1. Railway sẽ **tự động redeploy** app
2. Hoặc bạn có thể force deploy:
   - Click tab **"Deployments"**
   - Click **"Redeploy"** trên deployment mới nhất

⏱️ **Đợi 2-3 phút** để Railway build lại.

---

## 📍 BƯỚC 8: KIỂM TRA DEPLOYMENT

### Check Logs
1. Click tab **"Deployments"**
2. Click vào deployment mới nhất
3. Xem **"Logs"**

### Dấu hiệu deploy thành công:
```
✓ Compiled successfully
Migration successful ✅
Server listening on port 3000
```

### Nếu có lỗi:
- Check lại từng variable xem có đúng tên không
- Check xem DATABASE_URL đã link đúng chưa
- Xem logs để biết lỗi cụ thể

---

## 🌐 BƯỚC 9: LẤY URL APP

1. Click vào Next.js service
2. Tab **"Settings"** → **"Domains"**
3. Copy **Public Domain**:
   ```
   https://your-app-name-production.up.railway.app
   ```

✅ **App đã live!**

---

## 🎉 BƯỚC 10: TẠO ADMIN USER

Truy cập:
```
https://your-app-name-production.up.railway.app/api/setup
```

Bạn sẽ thấy message:
```json
{
  "success": true,
  "message": "Admin user created successfully!",
  "data": {
    "email": "admin@hospital.com",
    "name": "Administrator",
    "role": "ADMIN"
  },
  "warning": "⚠️ PLEASE DELETE /src/app/api/setup FOLDER NOW FOR SECURITY!"
}
```

⚠️ **QUAN TRỌNG:** Sau khi tạo admin, **XÓA NGAY** folder setup:

```bash
cd /Users/quang/Desktop/crm-system
rm -rf src/app/api/setup
git add .
git commit -m "Remove setup route after admin creation"
git push
```

---

## 🔐 ĐĂNG NHẬP

**URL:** `https://your-app-name-production.up.railway.app/auth/signin`

**Credentials:**
- Email: `admin@hospital.com`
- Password: `admin123`

⚠️ **ĐỔI PASSWORD NGAY SAU KHI LOGIN!**

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Database connection failed"
→ **Fix:** Check DATABASE_URL đã link đúng chưa (phải dùng Reference, không nhập manual)

### Lỗi: "Invalid NEXTAUTH_URL"
→ **Fix:** Đảm bảo nhập đúng `${{RAILWAY_PUBLIC_DOMAIN}}` (có dấu ngoặc nhọn kép)

### Lỗi: "NEXTAUTH_SECRET is required"
→ **Fix:** Check xem đã thêm NEXTAUTH_SECRET chưa, và giá trị không rỗng

### Lỗi: Email không gửi được
→ **Fix:**
1. Check EMAIL_SERVER_PASSWORD có đúng là App Password không (16 ký tự)
2. Check EMAIL_SERVER_USER có đúng email Gmail không
3. Check đã bật 2-Step Verification chưa

### Lỗi: "Cannot find module '@prisma/client'"
→ **Fix:** Railway sẽ tự build lại. Nếu vẫn lỗi, check logs để xem chi tiết

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Đã thêm đủ 11 environment variables
- [ ] DATABASE_URL được link từ PostgreSQL (không nhập manual)
- [ ] NEXTAUTH_SECRET đã generate và thêm vào
- [ ] Gmail App Password đã lấy và thêm vào
- [ ] App deploy thành công (check logs)
- [ ] Đã tạo admin user qua `/api/setup`
- [ ] Đã xóa folder `/src/app/api/setup`
- [ ] Đã login thành công
- [ ] Đã đổi password admin

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Check logs trong Railway Deployments tab
2. Đọc [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md) để xem hướng dẫn chi tiết hơn
3. Xem [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) cho troubleshooting tips

---

**Updated:** 20/10/2025
**Status:** Ready for Production 🚀
