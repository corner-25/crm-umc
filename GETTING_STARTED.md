# 🚀 Getting Started - Bắt đầu ngay

## Bước 1: Khởi động Database

```bash
docker-compose up -d
```

Kiểm tra container đã chạy:
```bash
docker-compose ps
```

## Bước 2: Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

## Bước 3: Đăng nhập

Truy cập http://localhost:3000 và đăng nhập với:

- **Email**: `admin@hospital.com`
- **Password**: `admin123`

## Bước 4: Khám phá hệ thống

### 📊 Dashboard
- Truy cập: `/dashboard`
- Xem tổng quan hệ thống (hiện tại là placeholder)

### 👥 Quản lý Nhà Tài trợ
- Truy cập: `/donors`
- Tính năng đã có:
  - ✅ Xem danh sách (2 donors mẫu)
  - ✅ Tìm kiếm theo tên, email, SĐT
  - ✅ Lọc theo Loại & Cấp độ
  - ✅ Phân trang
  - ⏳ Thêm mới (form chưa có)
  - ⏳ Chỉnh sửa (form chưa có)
  - ⏳ Xóa (dialog xác nhận chưa có)
  - ⏳ Xem chi tiết (page chưa có)

### 💰 Tài trợ
- `/donations/cash` - Chưa có
- `/donations/in-kind` - Chưa có
- `/donations/volunteer` - Chưa có

### 💝 Tri ân
- `/gratitude/emails` - Chưa có
- `/gratitude/templates` - Chưa có
- `/gratitude/reminders` - Chưa có

### 📈 Báo cáo
- `/reports` - Chưa có

## 🗄️ Database Tools

### Prisma Studio (GUI cho database)
```bash
npx prisma studio
```

Mở tại: http://localhost:5555

### Re-seed database (reset dữ liệu mẫu)
```bash
npm run db:seed
```

### Xem logs của PostgreSQL
```bash
docker-compose logs postgres
```

## 📁 File Structure quan trọng

```
src/
├── app/
│   ├── (dashboard)/         # Tất cả pages sau khi login
│   │   ├── dashboard/       # Trang chủ
│   │   ├── donors/          # Quản lý nhà tài trợ
│   │   └── layout.tsx       # Layout với sidebar
│   ├── api/                 # API routes
│   │   ├── donors/          # Donors API
│   │   └── auth/            # NextAuth
│   └── auth/
│       └── signin/          # Trang login
├── components/
│   ├── layout/              # Sidebar, Header
│   └── ui/                  # Shadcn components
├── lib/
│   ├── prisma.ts            # Database client
│   ├── auth.ts              # Auth config
│   └── utils.ts             # Utilities
└── types/                   # TypeScript types
```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npx prisma studio       # Open database GUI
npx prisma migrate dev  # Create new migration
npm run db:seed         # Seed database

# Docker
docker-compose up -d    # Start database
docker-compose down     # Stop database
docker-compose logs     # View logs
```

## 🎯 Tiếp theo - Phát triển Features

Xem chi tiết trong **DEVELOPMENT_GUIDE.md**

### Priority 1: Hoàn thiện Donors Module
1. Tạo form Create/Edit donor
2. Tạo trang Detail với tabs
3. Add interaction timeline
4. Delete confirmation

### Priority 2: Donations Module
1. Cash donations CRUD
2. In-kind donations CRUD
3. Volunteer donations CRUD

### Priority 3: Dashboard với real data
1. Stats API
2. Charts (Recharts)
3. Top donors

## 📚 Tài liệu

- **README.md**: Overview và installation
- **DEVELOPMENT_GUIDE.md**: Chi tiết từng feature cần làm
- **PROJECT_STATUS.md**: Trạng thái hiện tại của project

## ❓ Troubleshooting

### Lỗi: Port 5433 already in use
```bash
docker-compose down
docker-compose up -d
```

### Lỗi: Cannot connect to database
Đảm bảo Docker đang chạy và port 5433 chưa được sử dụng.

### Lỗi: Prisma Client not generated
```bash
npx prisma generate
```

### Lỗi: TypeScript errors
```bash
npm run lint
```

## 🎓 Tech Stack sử dụng

- **Next.js 14+** - React framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication
- **Shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Hook Form** - Form management
- **Zod** - Validation

## 💡 Tips

1. **Hot Reload**: Mọi thay đổi code sẽ tự động reload
2. **Database Changes**: Sau khi sửa schema.prisma, chạy `npx prisma migrate dev`
3. **API Testing**: Dùng Prisma Studio hoặc tools như Postman
4. **UI Components**: Browse tại https://ui.shadcn.com

## 📞 Support

Nếu gặp vấn đề, check:
1. DEVELOPMENT_GUIDE.md - Hướng dẫn chi tiết
2. Console logs (browser và terminal)
3. Database logs (`docker-compose logs postgres`)

---

**Happy Coding! 🎉**

Bắt đầu với việc hoàn thiện Donors module theo hướng dẫn trong DEVELOPMENT_GUIDE.md
