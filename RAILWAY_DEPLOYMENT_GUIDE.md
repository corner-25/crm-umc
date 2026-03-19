# 🚂 HƯỚNG DẪN DEPLOY LÊN RAILWAY

## 📋 Yêu cầu
- ✅ Tài khoản Railway (đã có)
- ✅ Git repository (GitHub/GitLab)
- ✅ Dự án CRM đã hoàn thành

---

## 🗄️ BƯỚC 1: Chuẩn bị Git Repository

### 1.1 Tạo repository trên GitHub (nếu chưa có)
```bash
# Khởi tạo git (nếu chưa có)
git init

# Tạo .gitignore
cat > .gitignore << 'EOF'
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/
build

# production
dist

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/dev.db
prisma/dev.db-journal

# docker
docker-compose.yml
EOF
```

### 1.2 Push code lên GitHub
```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/crm-system.git

# Add all files
git add .

# Commit
git commit -m "Ready for Railway deployment"

# Push
git push -u origin main
```

---

## 🚀 BƯỚC 2: Deploy trên Railway

### 2.1 Tạo PostgreSQL Database
1. Vào [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Chọn **"Provision PostgreSQL"**
4. Database sẽ được tạo tự động với:
   - `DATABASE_URL` (connection string)
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`

### 2.2 Deploy Next.js App
1. Trong cùng project, click **"New Service"**
2. Chọn **"GitHub Repo"**
3. Authorize Railway truy cập GitHub
4. Chọn repository `crm-system`
5. Railway sẽ tự động detect Next.js và build

---

## ⚙️ BƯỚC 3: Cấu hình Environment Variables

### 3.1 Vào Settings của Next.js service
Click vào service Next.js > **Variables** tab

### 3.2 Thêm các biến môi trường:

```bash
# 1. DATABASE_URL (Railway tự động link)
# Click "Add Variable Reference" > Chọn PostgreSQL > DATABASE_URL

# 2. NextAuth Configuration
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<generate-random-secret-key>

# 3. Email Configuration (Gmail)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-gmail-app-password
EMAIL_FROM=Hospital CRM <noreply@hospital.com>

# 4. App Configuration
NEXT_PUBLIC_APP_NAME=Hospital CRM System
NEXT_PUBLIC_HOSPITAL_NAME=Bệnh viện ABC

# 5. Node Environment
NODE_ENV=production
```

### 📝 Cách generate NEXTAUTH_SECRET:
```bash
# Chạy command này để generate secret key
openssl rand -base64 32
```

### 📧 Cách lấy Gmail App Password:
1. Vào [Google Account](https://myaccount.google.com)
2. Security > 2-Step Verification (bật nếu chưa)
3. App passwords
4. Tạo app password mới cho "Mail"
5. Copy password (16 ký tự) vào `EMAIL_SERVER_PASSWORD`

---

## 🔧 BƯỚC 4: Cấu hình Build & Deploy Settings

### 4.1 Kiểm tra Build Command
Railway tự động detect, nhưng đảm bảo:
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:migrate`

### 4.2 Cấu hình trong Settings:
```
Root Directory: /
Build Command: npm run build (auto-detected)
Start Command: npm run start:migrate
```

---

## 🗃️ BƯỚC 5: Setup Database

### 5.1 Chạy Migration (Tự động)
Railway sẽ chạy migration khi deploy qua script:
```json
"start:migrate": "prisma migrate deploy && next start"
```

### 5.2 Seed Database (Optional - Chạy thủ công)
Nếu muốn thêm dữ liệu mẫu:

1. Vào PostgreSQL service > **Data** tab
2. Click **"Open in Prisma Studio"** (nếu có)
3. Hoặc connect local và seed:

```bash
# Local - Connect to Railway database
DATABASE_URL="postgresql://..." npm run db:seed
```

### 5.3 Tạo User Admin đầu tiên
Sau khi deploy xong, truy cập app và:
1. Vào `/api/auth/signin`
2. Hoặc dùng Prisma Studio để tạo user:

```sql
-- Chạy trong Railway PostgreSQL Query
INSERT INTO users (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin-001',
  'admin@hospital.com',
  'Admin',
  '$2a$10$YourHashedPassword', -- Dùng bcrypt hash
  'ADMIN',
  NOW(),
  NOW()
);
```

**Hoặc tạo user qua code:**
```javascript
// Truy cập domain/api/setup (tạo API route setup một lần)
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const hashedPassword = await bcrypt.hash('admin123', 10);
await prisma.user.create({
  data: {
    email: 'admin@hospital.com',
    name: 'Admin',
    password: hashedPassword,
    role: 'ADMIN'
  }
});
```

---

## 🌐 BƯỚC 6: Custom Domain (Optional)

### 6.1 Thêm Custom Domain
1. Vào Next.js service > **Settings** > **Domains**
2. Click **"Custom Domain"**
3. Nhập domain của bạn: `crm.yourdomain.com`

### 6.2 Cấu hình DNS
Thêm DNS record:
```
Type: CNAME
Name: crm
Value: your-app.up.railway.app
```

### 6.3 Cập nhật NEXTAUTH_URL
```bash
NEXTAUTH_URL=https://crm.yourdomain.com
```

---

## ✅ BƯỚC 7: Kiểm tra Deploy

### 7.1 Check Deployment
1. Vào **Deployments** tab
2. Xem logs để đảm bảo:
   - ✅ Build successful
   - ✅ Migration successful
   - ✅ App started

### 7.2 Test Application
Truy cập domain Railway:
```
https://your-app.up.railway.app
```

Test các tính năng:
- ✅ Login
- ✅ Dashboard load
- ✅ Tạo donor
- ✅ Upload ảnh
- ✅ Export Excel/PDF
- ✅ Gửi email

---

## 🔍 TROUBLESHOOTING

### ❌ Lỗi: Database connection failed
**Fix:**
```bash
# Kiểm tra DATABASE_URL đã được link chưa
# Variables > Add Variable Reference > PostgreSQL > DATABASE_URL
```

### ❌ Lỗi: Prisma Client not found
**Fix:**
```bash
# Thêm vào package.json scripts:
"build": "prisma generate && next build"
```

### ❌ Lỗi: NextAuth configuration error
**Fix:**
```bash
# Đảm bảo có đủ variables:
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=<your-secret>
```

### ❌ Lỗi: Upload ảnh không hoạt động
**Lưu ý:** Railway có ephemeral filesystem, ảnh sẽ mất sau mỗi deploy.

**Solution:** Dùng Cloud Storage:
- **Cloudinary** (Free 25GB)
- **AWS S3**
- **Vercel Blob**

---

## 📊 MONITORING & LOGS

### View Logs
```bash
# Trong Railway Dashboard
1. Click vào Next.js service
2. Vào tab "Deployments"
3. Click vào deployment mới nhất
4. Xem "Logs" real-time
```

### Check Metrics
- CPU Usage
- Memory Usage
- Network Traffic
- Deployment History

---

## 💰 PRICING (Railway)

### Free Tier
- ✅ $5 credit mỗi tháng
- ✅ 500 hours usage
- ✅ 1GB RAM
- ✅ 1GB Storage

### Paid Plans (nếu cần)
- **Hobby:** $5/month per service
- **Pro:** $20/month (unlimited)

---

## 🔐 BẢO MẬT PRODUCTION

### 1. Bảo vệ Environment Variables
- ❌ KHÔNG commit `.env` lên Git
- ✅ Dùng Railway Variables
- ✅ Rotate secrets định kỳ

### 2. HTTPS
- ✅ Railway tự động enable HTTPS
- ✅ Force HTTPS trong Next.js config

### 3. Rate Limiting
Thêm middleware:
```typescript
// middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/donors/:path*"]
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [Railway Docs](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)

---

## 🎉 HOÀN THÀNH!

Sau khi hoàn thành các bước trên, app sẽ:
- ✅ Deploy tự động khi push code
- ✅ PostgreSQL database trên cloud
- ✅ HTTPS enabled
- ✅ Môi trường production hoàn chỉnh

**Domain:** `https://your-app.up.railway.app`

**Login:** `admin@hospital.com` / `your-password`

---

**Ngày tạo:** 20/10/2025
**Version:** 1.0
