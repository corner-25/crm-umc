# Development Guide - Hướng dẫn Phát triển Tiếp

## ✅ Đã Hoàn thành

### Infrastructure
- ✅ Next.js 14+ với App Router
- ✅ PostgreSQL với Docker (port 5433)
- ✅ Prisma schema với tất cả models
- ✅ NextAuth.js authentication
- ✅ Shadcn/ui components
- ✅ Tailwind CSS
- ✅ React Query setup
- ✅ Layout và Navigation
- ✅ Seed data với admin user

### Authentication
- ✅ Login page: `/auth/signin`
- ✅ Default user: admin@hospital.com / admin123
- ✅ Session management với JWT
- ✅ Role-based auth (ADMIN, MANAGER, STAFF)

### Database
- ✅ 9 models đầy đủ
- ✅ Relations đã setup
- ✅ Indexes cho performance
- ✅ Soft delete
- ✅ Timestamps

## 🚧 Cần Hoàn thiện

### Module A: Quản lý Nhà Tài trợ

#### API Routes (Đã có base)
- ✅ `GET /api/donors` - List với pagination, search, filter
- ✅ `POST /api/donors` - Create
- ✅ `GET /api/donors/[id]` - Detail
- ✅ `PUT /api/donors/[id]` - Update
- ✅ `DELETE /api/donors/[id]` - Soft delete

#### Frontend Pages (CẦN TẠO)

**1. Donors List Page**: `src/app/(dashboard)/donors/page.tsx`
```tsx
// Cần tạo:
- TanStack Table với columns
- Search bar
- Filter dropdown (type, tier)
- Pagination
- Actions (Edit, Delete, View Detail)
- Add New button
```

**2. Donor Create/Edit Form**: `src/app/(dashboard)/donors/new/page.tsx`
```tsx
// Cần tạo:
- React Hook Form với Zod validation
- All fields theo spec
- Multi-select cho areasOfInterest
- Date pickers (birthday, firstDonationDate)
- Submit handler với React Query mutation
```

**3. Donor Detail Page**: `src/app/(dashboard)/donors/[id]/page.tsx`
```tsx
// Cần tạo với tabs:
- Tab "Thông tin": Hiển thị thông tin cơ bản
- Tab "Lịch sử tài trợ": Tất cả 3 loại donations
- Tab "Tương tác": Timeline interactions
- Tab "Email đã gửi": Email logs
- Tab "Nhắc nhở": Reminders chưa hoàn thành
```

**4. Add Interaction Modal**
```tsx
// Component: src/components/donors/add-interaction-dialog.tsx
- Form với type, date, content
- Timeline component
```

#### Components Cần Tạo

1. **DonorTable**: `src/components/donors/donor-table.tsx`
   - TanStack Table
   - Column definitions
   - Row actions

2. **DonorForm**: `src/components/donors/donor-form.tsx`
   - React Hook Form
   - Zod schema
   - All form fields

3. **DonorCard**: `src/components/donors/donor-card.tsx`
   - Display donor info
   - Badges cho tier

4. **InteractionTimeline**: `src/components/donors/interaction-timeline.tsx`
   - Timeline UI
   - Icons theo type

5. **DonationHistoryTable**: `src/components/donors/donation-history-table.tsx`
   - Combined table cho cả 3 loại
   - Tính tổng giá trị

### Module B: Quản lý Tài trợ

#### API Routes CẦN TẠO

**Cash Donations**
- `src/app/api/donations/cash/route.ts` - GET, POST
- `src/app/api/donations/cash/[id]/route.ts` - GET, PUT, DELETE

**In-Kind Donations**
- `src/app/api/donations/in-kind/route.ts` - GET, POST
- `src/app/api/donations/in-kind/[id]/route.ts` - GET, PUT, DELETE

**Volunteer Donations**
- `src/app/api/donations/volunteer/route.ts` - GET, POST
- `src/app/api/donations/volunteer/[id]/route.ts` - GET, PUT, DELETE

#### Frontend Pages CẦN TẠO

**1. Cash Donations**: `src/app/(dashboard)/donations/cash/page.tsx`
```tsx
// Features:
- List table
- Create form với:
  - Donor search/select (combobox)
  - Amount input với currency format
  - Currency select (VND, USD, EUR)
  - Payment method
  - Date picker
  - Purpose textarea
  - Receipt upload (React Dropzone)
  - Status select
- Edit/Delete actions
```

**2. In-Kind Donations**: `src/app/(dashboard)/donations/in-kind/page.tsx`
```tsx
// Features:
- All fields theo spec
- Multiple image upload
- Image gallery view
- Category filter
```

**3. Volunteer Donations**: `src/app/(dashboard)/donations/volunteer/page.tsx`
```tsx
// Features:
- Work type select
- Date range picker
- Auto-calculate totalValue = hours * hourlyRate
- Star rating component
- Print certificate button (PDF)
```

### Module C: Dashboard & Reports

#### API Routes CẦN TẠO

**Dashboard Stats**
```typescript
// src/app/api/dashboard/stats/route.ts
GET /api/dashboard/stats?from=YYYY-MM-DD&to=YYYY-MM-DD

Response: {
  totalCash: number,
  totalInKind: number,
  totalVolunteer: number,
  totalDonors: number,
  totalDonations: number,
  growth: number,
  cashByMonth: [],
  donationsByType: [],
  topDonors: [],
}
```

**Export Reports**
```typescript
// src/app/api/reports/export/route.ts
POST /api/reports/export
Body: { format: 'excel' | 'pdf', from, to }
```

#### Frontend Pages CẦN TẠO

**Dashboard**: `src/app/(dashboard)/dashboard/page.tsx` (CẬP NHẬT)
```tsx
// Thay thế placeholder bằng:
- Real KPI cards với data
- Line chart (Recharts) - trend theo tháng
- Pie chart - phân loại tài trợ
- Top 10 donors table
- Date range filter
```

**Reports**: `src/app/(dashboard)/reports/page.tsx`
```tsx
// Features:
- Date range picker
- Quick filters (This month, This quarter, This year)
- Export Excel button
- Export PDF button
- Preview data table
```

### Module D: Tri ân

#### API Routes CẦN TẠO

**Email Templates**
- `src/app/api/emails/templates/route.ts` - GET, POST
- `src/app/api/emails/templates/[id]/route.ts` - GET, PUT, DELETE

**Send Email**
```typescript
// src/app/api/emails/send/route.ts
POST /api/emails/send
Body: {
  donorIds: string[],
  templateId?: string,
  subject: string,
  body: string,
}
```

**Reminders**
- `src/app/api/reminders/route.ts` - GET, POST
- `src/app/api/reminders/[id]/route.ts` - GET, PUT, DELETE

#### Frontend Pages CẦN TẠO

**1. Email Templates**: `src/app/(dashboard)/gratitude/templates/page.tsx`
```tsx
// Features:
- CRUD templates
- Rich text editor (simple)
- Variables support: {tên}, {số_tiền}, {ngày}, {vật_phẩm}
- Preview modal
- Duplicate template
```

**2. Send Email**: `src/app/(dashboard)/gratitude/emails/page.tsx`
```tsx
// Features:
- Multi-select donors
- Template dropdown (load template)
- Rich text editor
- Variables insertion
- Preview before send
- Send history tab
```

**3. Reminders**: `src/app/(dashboard)/gratitude/reminders/page.tsx`
```tsx
// Features:
- List với filter (Upcoming, Today, Overdue)
- Auto-generated reminders:
  - Birthday (3 days before)
  - Donation anniversary (from firstDonationDate)
- Manual create reminder
- Mark as completed
- Badge count trên navbar
```

## 📋 Implementation Checklist

### Priority 1 - Core Features
- [ ] Donors List Page với Table
- [ ] Donor Create/Edit Form
- [ ] Donor Detail Page với Tabs
- [ ] Cash Donations CRUD
- [ ] Dashboard với real data

### Priority 2 - Extended Features
- [ ] In-Kind Donations CRUD
- [ ] Volunteer Donations CRUD
- [ ] Interaction Timeline
- [ ] Email Templates CRUD
- [ ] Send Email Feature

### Priority 3 - Nice to Have
- [ ] Reminders System
- [ ] Export Reports (Excel/PDF)
- [ ] Charts và Statistics
- [ ] File Upload cho receipts/images
- [ ] Print Volunteer Certificate

## 🎨 UI Components Cần Thêm

Cài thêm Shadcn components:
```bash
npx shadcn@latest add form
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add separator
npx shadcn@latest add command
npx shadcn@latest add sheet
```

## 📦 Packages Có Thể Cần

```bash
# Rich text editor
npm install @tiptap/react @tiptap/starter-kit

# PDF generation (server-side)
npm install jspdf-autotable

# Date formatting
# (đã có date-fns)

# File upload to S3 (nếu production)
npm install @aws-sdk/client-s3
```

## 🔧 Utility Functions Cần Tạo

1. **formatCurrency** - ✅ Đã có trong `src/lib/utils.ts`
2. **formatDate** - ✅ Đã có
3. **cn** (className merge) - ✅ Đã có

CẦN THÊM:
```typescript
// src/lib/utils.ts
export function calculateTotalDonations(donor: DonorWithRelations) {
  // Tính tổng giá trị tất cả loại donations
}

export function replaceEmailVariables(template: string, data: any) {
  // Replace {tên}, {số_tiền}, etc.
}

export function generatePDF(data: any) {
  // Generate PDF report
}

export function exportToExcel(data: any) {
  // Export to Excel using xlsx
}
```

## 📝 Validation Schemas

Tạo Zod schemas cho forms:
```typescript
// src/lib/validations/donor.ts
import { z } from "zod";

export const donorSchema = z.object({
  fullName: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại không hợp lệ").optional(),
  type: z.enum(["INDIVIDUAL", "COMPANY", "ORGANIZATION", "COMMUNITY"]),
  tier: z.enum(["VIP", "REGULAR", "NEW", "POTENTIAL"]),
  // ... other fields
});

// Tương tự cho:
// - cashDonationSchema
// - inKindDonationSchema
// - volunteerDonationSchema
// - interactionSchema
// - emailTemplateSchema
```

## 🎯 Next Steps (Từng bước)

### Bước 1: Hoàn thiện Donors Module
1. Tạo DonorTable component
2. Tạo Donors List Page
3. Tạo Donor Form với validation
4. Tạo Donor Detail Page
5. Test CRUD operations

### Bước 2: Donations Module
1. Tạo API routes cho 3 loại
2. Tạo Forms cho từng loại
3. Tạo List pages
4. Link với Donors

### Bước 3: Dashboard
1. Tạo stats API
2. Fetch real data
3. Render charts
4. Add filters

### Bước 4: Gratitude Module
1. Email templates CRUD
2. Send email feature
3. Reminders system
4. Auto-generate reminders

### Bước 5: Reports
1. Export Excel
2. Export PDF
3. Print features

## 🐛 Common Issues & Solutions

### Issue: Prisma Client not generated
```bash
npx prisma generate
```

### Issue: Database connection error
```bash
docker-compose ps  # Check if container running
docker-compose logs postgres
```

### Issue: NextAuth session error
- Check NEXTAUTH_SECRET in .env
- Check NEXTAUTH_URL matches your dev URL

### Issue: TypeScript errors
```bash
npm run lint
```

## 📚 Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Shadcn/ui: https://ui.shadcn.com
- TanStack Table: https://tanstack.com/table
- React Hook Form: https://react-hook-form.com
- Recharts: https://recharts.org

## 💡 Tips

1. **Sử dụng React Query** cho data fetching:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['donors', page, search],
  queryFn: () => fetch('/api/donors?page=' + page).then(r => r.json())
});
```

2. **Sử dụng React Hook Form** cho forms:
```typescript
const form = useForm<DonorFormData>({
  resolver: zodResolver(donorSchema),
  defaultValues: { ... }
});
```

3. **Soft Delete**: Luôn kiểm tra `deletedAt: null` trong queries

4. **Server vs Client Components**:
   - Dùng "use client" cho interactive components
   - Dùng Server Components cho data fetching khi có thể

5. **Error Handling**: Luôn có try-catch và toast notifications

---

**Good luck với development! 🚀**
