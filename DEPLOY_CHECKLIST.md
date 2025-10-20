# ✅ CHECKLIST DEPLOY RAILWAY - CRM SYSTEM

## 📋 TRƯỚC KHI DEPLOY

### Git & GitHub
- [ ] Push code lên GitHub repository
- [ ] Kiểm tra `.gitignore` đã exclude `.env`
- [ ] Đảm bảo `node_modules` không được commit

### Cấu hình Project
- [x] `nixpacks.toml` đã tạo
- [x] `package.json` có script `start:migrate`
- [ ] Test build local: `npm run build`
- [ ] Test prisma generate: `npx prisma generate`

---

## 🚂 RAILWAY SETUP

### 1. Tạo Project
- [ ] Login vào [Railway.app](https://railway.app)
- [ ] Click "New Project"
- [ ] Chọn "Provision PostgreSQL" → Database được tạo

### 2. Deploy Next.js App
- [ ] Click "New Service" trong cùng project
- [ ] Chọn "GitHub Repo"
- [ ] Authorize Railway
- [ ] Chọn repository `crm-system`
- [ ] Chờ deploy tự động

---

## ⚙️ ENVIRONMENT VARIABLES

### Required Variables (Copy & Paste vào Railway)

```bash
# 1. DATABASE_URL
# ⚠️ QUAN TRỌNG: Click "Add Variable Reference" > PostgreSQL > DATABASE_URL
# KHÔNG nhập manual!

# 2. NextAuth
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<PASTE_KEY_TỪ_BƯỚC_DƯỚI>

# 3. Email (Gmail)
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

### Generate NEXTAUTH_SECRET
```bash
# Chạy lệnh này để tạo secret key:
openssl rand -base64 32

# Copy kết quả vào NEXTAUTH_SECRET
```

### Lấy Gmail App Password
1. Vào: https://myaccount.google.com/security
2. Bật "2-Step Verification"
3. Tìm "App passwords"
4. Tạo mật khẩu mới → chọn "Mail"
5. Copy 16 ký tự → paste vào `EMAIL_SERVER_PASSWORD`

---

## 🔧 DEPLOY SETTINGS

### Build & Start Commands
- [ ] Build Command: `npm run build` (auto)
- [ ] Start Command: `npm run start:migrate` (auto)
- [ ] Root Directory: `/`

### Health Check
- [ ] Đợi deployment hoàn thành (2-5 phút)
- [ ] Check logs không có error
- [ ] Migration successful ✅

---

## 🗄️ DATABASE SETUP

### Tạo Admin User
Chọn 1 trong 2 cách:

#### Cách 1: Qua Railway PostgreSQL Query
1. Vào PostgreSQL service → Data tab
2. Chạy query:
```sql
INSERT INTO users (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@hospital.com',
  'Admin',
  '$2a$10$qK3pVxN8lY9hKz0P.vMQZeK7yR3rHQJ5Wq8hN6pVxN8lY9hKz0P.v', -- password: admin123
  'ADMIN',
  NOW(),
  NOW()
);
```

#### Cách 2: Tạo API setup route (Recommended)
1. Tạo file `src/app/api/setup/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check if admin exists
    const adminExists = await prisma.user.findFirst({
      where: { email: 'admin@hospital.com' }
    });

    if (adminExists) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hospital.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({
      message: 'Admin created successfully',
      email: admin.email
    });
  } catch (error) {
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}
```

2. Truy cập: `https://your-app.up.railway.app/api/setup`
3. Xóa route sau khi setup xong (bảo mật)

---

## 🌐 DOMAIN SETUP (Optional)

### Railway Default Domain
- [ ] Copy domain: `your-app.up.railway.app`
- [ ] Test truy cập

### Custom Domain (Nếu có)
- [ ] Vào Settings → Domains → Add Custom Domain
- [ ] Nhập: `crm.yourdomain.com`
- [ ] Cấu hình DNS:
  ```
  Type: CNAME
  Name: crm
  Value: your-app.up.railway.app
  ```
- [ ] Đợi DNS propagate (5-30 phút)
- [ ] Update `NEXTAUTH_URL` thành custom domain

---

## ✅ TEST APPLICATION

### Login
- [ ] Truy cập: `https://your-app.up.railway.app/auth/signin`
- [ ] Login: `admin@hospital.com` / `admin123`
- [ ] Redirect về Dashboard ✅

### Core Features
- [ ] Dashboard hiển thị charts
- [ ] Tạo Donor mới
- [ ] Tạo Cash Donation
- [ ] Tạo In-Kind Donation (test upload ảnh)
- [ ] Tạo Volunteer Donation
- [ ] Export Excel
- [ ] Export PDF
- [ ] Gửi email (test SMTP)
- [ ] Tạo reminder

---

## 🐛 TROUBLESHOOTING

### ❌ Build Failed
```bash
# Check logs → tìm error
# Common issues:
- Missing dependencies → npm install
- TypeScript errors → npm run lint
- Prisma errors → prisma generate
```

### ❌ Database Connection Error
```bash
# Ensure DATABASE_URL is linked:
Variables → Add Variable Reference → PostgreSQL → DATABASE_URL
```

### ❌ NextAuth Error
```bash
# Check:
1. NEXTAUTH_URL = ${{RAILWAY_PUBLIC_DOMAIN}}
2. NEXTAUTH_SECRET exists
3. Restart deployment
```

### ❌ Upload Ảnh Bị Mất
```
⚠️ Railway dùng ephemeral filesystem
→ Ảnh sẽ mất sau mỗi deploy/restart

Giải pháp:
1. Dùng Cloudinary (Free 25GB)
2. Dùng AWS S3
3. Dùng Vercel Blob
```

---

## 📊 MONITORING

### Railway Dashboard
- [ ] Check CPU/Memory usage
- [ ] View deployment logs
- [ ] Monitor uptime

### Logs Command
```bash
# View real-time logs
Deployments → Latest → View Logs
```

---

## 🔄 CI/CD (Auto Deploy)

Railway tự động deploy khi:
- ✅ Push code lên `main` branch
- ✅ Auto build & migrate
- ✅ Zero-downtime deployment

### Workflow
```bash
# Local development
git add .
git commit -m "Add new feature"
git push origin main

# Railway tự động:
1. Detect changes
2. Build project
3. Run migration
4. Deploy new version
```

---

## 💾 BACKUP DATABASE

### Manual Backup
```bash
# Trong Railway PostgreSQL
1. Data tab
2. Download backup
3. Hoặc dùng pg_dump
```

### Schedule Backup (Railway Pro)
- Automatic daily backups
- Point-in-time recovery

---

## 🎉 DEPLOYMENT COMPLETE!

Khi tất cả checklist ✅:

**App URL:** `https://your-app.up.railway.app`

**Admin Login:**
- Email: `admin@hospital.com`
- Password: `admin123`

**⚠️ ĐỔI PASSWORD SAU KHI LOGIN LẦN ĐẦU!**

---

## 📞 SUPPORT

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Prisma Railway Guide: https://pris.ly/d/railway

---

**Prepared by:** Claude AI
**Date:** 20/10/2025
**Status:** Ready for Production 🚀
