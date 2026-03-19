# 🚀 DEPLOY NHANH LÊN RAILWAY - 5 PHÚT

## TÓM TẮT

Hướng dẫn deploy nhanh nhất. Xem chi tiết tại [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)

---

## BƯỚC 1: PUSH CODE LÊN GITHUB

```bash
# Nếu chưa có git repo
git init
git add .
git commit -m "Ready for deployment"

# Tạo repo trên GitHub rồi:
git remote add origin https://github.com/YOUR_USERNAME/crm-system.git
git push -u origin main
```

---

## BƯỚC 2: DEPLOY LÊN RAILWAY

### 1. Tạo PostgreSQL
1. Vào https://railway.app
2. New Project → **Provision PostgreSQL**

### 2. Deploy App
1. Trong cùng project → **New Service**
2. Chọn **GitHub Repo** → Chọn `crm-system`
3. Đợi build (2-3 phút)

---

## BƯỚC 3: CÀI ĐẶT BIẾN MÔI TRƯỜNG

Vào Next.js service → **Variables** → Add:

### Generate Secret Key trước:
```bash
# Chạy lệnh này
./generate-secret.sh

# Hoặc
openssl rand -base64 32
```

### Copy & Paste vào Railway:

```bash
# 1. Link Database (QUAN TRỌNG!)
# Click "Add Variable Reference" → PostgreSQL → DATABASE_URL

# 2. NextAuth
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<PASTE_KEY_TỪ_TRÊN>

# 3. Email (thay email của bạn)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=<GMAIL_APP_PASSWORD>
EMAIL_FROM=Hospital CRM <noreply@hospital.com>

# 4. App Config
NEXT_PUBLIC_APP_NAME=Hospital CRM System
NEXT_PUBLIC_HOSPITAL_NAME=Bệnh viện ABC
NODE_ENV=production
```

### Lấy Gmail App Password:
1. https://myaccount.google.com/security
2. Bật 2-Step Verification
3. App passwords → Mail
4. Copy 16 ký tự

---

## BƯỚC 4: TẠO ADMIN USER

Sau khi deploy xong:

1. Truy cập: `https://your-app.up.railway.app/api/setup`
2. Sẽ hiện: "Admin user created successfully"
3. **XÓA** folder `/src/app/api/setup` ngay (bảo mật)

---

## BƯỚC 5: ĐĂNG NHẬP

URL: `https://your-app.up.railway.app/auth/signin`

**Credentials:**
- Email: `admin@hospital.com`
- Password: `admin123`

⚠️ **ĐỔI PASSWORD NGAY SAU KHI LOGIN!**

---

## ✅ HOÀN THÀNH!

App đã sẵn sàng. Test các tính năng:
- Dashboard
- Tạo Donor
- Donations
- Export Excel/PDF
- Gửi Email

---

## 🐛 LỖI THƯỜNG GẶP

### Build failed
→ Check logs, thường do:
- Missing environment variables
- TypeScript errors

### Database connection failed
→ Đảm bảo DATABASE_URL đã "Add Variable Reference" (không nhập manual)

### NextAuth error
→ Check NEXTAUTH_URL và NEXTAUTH_SECRET đã đúng

### Upload ảnh bị mất
→ Railway dùng ephemeral filesystem
→ **Giải pháp:** Dùng Cloudinary (free 25GB)

---

## 📚 TÀI LIỆU

- **Chi tiết:** [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)
- Railway Docs: https://docs.railway.app

---

## 🔄 AUTO DEPLOY

Mỗi lần push code:
```bash
git add .
git commit -m "Update feature"
git push
```
→ Railway tự động deploy!

---

**Prepared:** 20/10/2025
**Time to deploy:** ~5 phút
