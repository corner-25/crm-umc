# Hospital CRM System - Hệ thống Quản lý Nhà Tài trợ

Hệ thống CRM quản lý nhà tài trợ cho bệnh viện - Giai đoạn 1 (MVP)

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Docker)
- **ORM**: Prisma
- **UI**: Shadcn/ui + Tailwind CSS
- **Form**: React Hook Form + Zod
- **State Management**: Zustand
- **API Client**: TanStack Query (React Query)
- **Charts**: Recharts
- **Table**: TanStack Table
- **Authentication**: NextAuth.js
- **File Upload**: React Dropzone
- **Date**: date-fns

## 📋 Tính năng Giai đoạn 1

### Module A: Quản lý Nhà Tài trợ
- ✅ CRUD nhà tài trợ (Cá nhân, Doanh nghiệp, Tổ chức, Nhóm/Cộng đồng)
- ✅ Phân loại và phân cấp (VIP, Thường xuyên, Mới, Tiềm năng)
- ✅ Tìm kiếm, lọc, phân trang
- ✅ Quản lý thông tin chi tiết
- ✅ Lịch sử tương tác (Cuộc gọi, Email, Gặp mặt, Sự kiện)

### Module B: Quản lý Tài trợ
- ✅ Tài trợ tiền mặt (VNĐ, USD, EUR)
- ✅ Tài trợ hiện vật (Thiết bị y tế, Thuốc, Đồ dùng, Thực phẩm)
- ✅ Công tác xã hội tình nguyện
- ✅ Liên kết tài trợ với nhà tài trợ

### Module C: Thống kê và Báo cáo
- ✅ Dashboard với KPI cards
- ✅ Biểu đồ thống kê theo thời gian
- ✅ Phân loại tài trợ (Pie chart)
- ✅ Top nhà tài trợ
- ✅ Xuất báo cáo Excel/PDF

### Module D: Tri ân
- ✅ Gửi email cảm ơn
- ✅ Quản lý Email Templates
- ✅ Hệ thống nhắc nhở (Sinh nhật, Kỷ niệm, Báo cáo)

## 🛠️ Installation

### 1. Clone repository

\`\`\`bash
git clone <repository-url>
cd crm-system
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Setup Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Chỉnh sửa file `.env` với thông tin của bạn.

### 4. Start PostgreSQL (Docker)

\`\`\`bash
docker-compose up -d
\`\`\`

### 5. Run Database Migration

\`\`\`bash
npx prisma migrate dev
\`\`\`

### 6. Seed Database

\`\`\`bash
npm run db:seed
\`\`\`

### 7. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Truy cập: http://localhost:3000

## 🔐 Default Login

- **Email**: admin@hospital.com
- **Password**: admin123

## 📁 Project Structure

\`\`\`
crm-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Dashboard routes
│   │   ├── api/           # API routes
│   │   ├── auth/          # Auth pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Shadcn components
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   ├── auth.ts        # NextAuth config
│   │   └── utils.ts       # Utility functions
│   ├── types/
│   ├── hooks/
│   └── stores/
├── docker-compose.yml
├── package.json
└── README.md
\`\`\`

## 🗄️ Database Schema

### Main Models:
- **User**: Quản lý người dùng và authentication
- **Donor**: Nhà tài trợ
- **DonationCash**: Tài trợ tiền mặt
- **DonationInKind**: Tài trợ hiện vật
- **DonationVolunteer**: Công tác tình nguyện
- **Interaction**: Lịch sử tương tác
- **EmailLog**: Lịch sử email đã gửi
- **EmailTemplate**: Mẫu email
- **Reminder**: Nhắc nhở

## 🔧 Development

### Database Commands

\`\`\`bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npm run db:seed
\`\`\`

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📝 API Routes

- `POST /api/auth/[...nextauth]` - Authentication
- `GET|POST /api/donors` - Quản lý nhà tài trợ
- `GET|POST /api/donations/cash` - Tài trợ tiền mặt
- `GET|POST /api/donations/in-kind` - Tài trợ hiện vật
- `GET|POST /api/donations/volunteer` - Tình nguyện
- `GET /api/dashboard/stats` - Thống kê dashboard
- `POST /api/emails/send` - Gửi email
- `GET /api/reminders` - Nhắc nhở

## 🎨 UI Components (Shadcn)

Các components đã được cài đặt:
- Button, Input, Label
- Card, Table, Tabs
- Dialog, Dropdown Menu, Select
- Toast, Badge, Avatar
- Popover, Calendar

## 🚦 Port Configuration

- **Next.js**: http://localhost:3000
- **PostgreSQL**: localhost:5433 (mapped from container 5432)

## 🔒 Security Features

- Password hashing với bcrypt
- JWT-based sessions
- Role-based access control (ADMIN, MANAGER, STAFF)
- Soft delete for data retention

## 📧 Email Configuration

Để sử dụng tính năng gửi email, cấu hình SMTP trong `.env`:

\`\`\`env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=Hospital CRM <noreply@hospital.com>
\`\`\`

## 📊 Sample Data

Database được seed với dữ liệu mẫu:
- 1 Admin user
- 2 Donors (1 cá nhân VIP, 1 công ty)
- 1 Cash donation (50 triệu VNĐ)
- 1 In-kind donation (5 máy thở)
- 1 Volunteer donation (40 giờ)
- 1 Email template
- 1 Reminder

## 🐛 Troubleshooting

### Port 5432 already in use
Nếu port 5432 đã được sử dụng, docker-compose đã được cấu hình sử dụng port 5433.

### Cannot connect to database
Đảm bảo Docker đang chạy và PostgreSQL container đã khởi động:
\`\`\`bash
docker-compose ps
docker-compose logs postgres
\`\`\`

## 📄 License

MIT

## 👥 Contributors

- Development Team

---

**Note**: Đây là phiên bản MVP (Minimum Viable Product) - Giai đoạn 1. Các tính năng nâng cao sẽ được triển khai trong các giai đoạn tiếp theo.
