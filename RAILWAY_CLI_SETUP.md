# 🚂 CÀI ĐẶT RAILWAY CLI ĐỂ CHẠY MIGRATION

## BƯỚC 1: Cài đặt Railway CLI

```bash
# Mac/Linux
brew install railway

# Hoặc dùng npm
npm install -g @railway/cli
```

## BƯỚC 2: Login Railway

```bash
railway login
```

Browser sẽ mở → Login → Authorize

## BƯỚC 3: Link project

```bash
cd /Users/quang/Desktop/crm-system
railway link
```

Chọn project của bạn

## BƯỚC 4: Chạy migration

```bash
# Connect vào Railway database và chạy migration
railway run prisma migrate deploy

# Hoặc chạy SQL trực tiếp
railway run psql < railway-migration.sql
```

## BƯỚC 5: Verify

```bash
railway run psql -c "SELECT email, name, role FROM users;"
```

Phải thấy admin user!

---

**Done!** Giờ có thể login vào app.
