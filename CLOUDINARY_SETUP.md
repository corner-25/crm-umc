# ☁️ HƯỚNG DẪN CÀI ĐẶT CLOUDINARY CHO UPLOAD ẢNH

## ⚠️ VẤN ĐỀ

Railway sử dụng **ephemeral filesystem** → Ảnh upload sẽ **bị mất** sau mỗi lần deploy/restart.

## ✅ GIẢI PHÁP: CLOUDINARY

**Cloudinary** cung cấp:
- ✅ Free 25GB storage
- ✅ 25GB bandwidth/tháng
- ✅ Image optimization tự động
- ✅ CDN global
- ✅ Dễ tích hợp

---

## 🚀 BƯỚC 1: TẠO TÀI KHOẢN CLOUDINARY

1. Vào: https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí
3. Verify email

---

## 🔑 BƯỚC 2: LẤY API CREDENTIALS

1. Login vào Dashboard
2. Copy các thông tin sau:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## 📦 BƯỚC 3: CÀI ĐẶT PACKAGE

```bash
npm install cloudinary next-cloudinary
```

---

## ⚙️ BƯỚC 4: CẤU HÌNH

### 4.1 Thêm vào `.env.local` (local dev)
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4.2 Thêm vào Railway Variables (production)
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4.3 Update `.env.example`
```bash
# Cloudinary (Image Storage)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 💻 BƯỚC 5: TẠO CLOUDINARY CONFIG

### File: `src/lib/cloudinary.ts`
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
```

---

## 🔧 BƯỚC 6: TẠO UPLOAD API

### File: `src/app/api/upload/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'hospital-crm', // Organize by folder
      resource_type: 'auto'
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Delete image
export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'No public ID provided' },
        { status: 400 }
      );
    }

    await cloudinary.uploader.destroy(publicId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 BƯỚC 7: CẬP NHẬT IMAGE UPLOAD COMPONENT

### File: `src/components/ui/image-upload.tsx`

Thay thế logic upload hiện tại:

```typescript
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  multiple = false,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);

      if (multiple) {
        const currentUrls = Array.isArray(value) ? value : [];
        onChange([...currentUrls, ...urls]);
      } else {
        onChange(urls[0]);
      }

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    multiple,
    disabled: disabled || uploading
  });

  const removeImage = (url: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v) => v !== url));
    } else {
      onChange('');
    }
  };

  const images = multiple
    ? Array.isArray(value) ? value : []
    : value ? [value] : [];

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive
                  ? 'Drop the files here'
                  : 'Drag & drop images here, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(url)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 BƯỚC 8: TEST

### Local Test
```bash
npm run dev
```

1. Vào trang tạo In-Kind Donation
2. Upload ảnh
3. Check Network tab → POST /api/upload
4. Verify ảnh xuất hiện trong Cloudinary Dashboard

### Production Test
1. Deploy lên Railway
2. Test upload
3. Restart app → ảnh vẫn còn ✅

---

## 📊 QUẢN LÝ ẢNH

### Cloudinary Dashboard
- View all uploaded images
- Organize by folders
- Analytics & usage
- Image transformations

### URL Format
```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
```

### Optimizations (Tự động)
- Auto format (WebP cho browser hỗ trợ)
- Responsive images
- Lazy loading
- CDN delivery

---

## 💰 PRICING

### Free Tier
- ✅ 25GB storage
- ✅ 25GB bandwidth/month
- ✅ 25k transformations/month
- ✅ No credit card required

### Khi nào cần upgrade?
- Khi vượt 25GB storage
- Cần video upload
- Cần advanced features

---

## 🔐 BẢO MẬT

### Upload Presets (Recommended)
1. Vào Settings → Upload
2. Tạo Upload Preset:
   - Name: `hospital-crm`
   - Signing Mode: Unsigned
   - Folder: `hospital-crm`
   - Max file size: 10MB

### Client-Side Upload (Alternative)
```typescript
// Sử dụng unsigned upload preset
const response = await fetch(
  `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
  {
    method: 'POST',
    body: formData
  }
);
```

---

## 🎯 BEST PRACTICES

1. **Organize by folders:**
   - `/hospital-crm/receipts`
   - `/hospital-crm/donations`
   - `/hospital-crm/avatars`

2. **Image transformations:**
   ```typescript
   // Resize on-the-fly
   const thumbnailUrl = url.replace('/upload/', '/upload/w_300,h_300,c_fill/');
   ```

3. **Cleanup old images:**
   - Delete unused images
   - Monitor usage

4. **Error handling:**
   - Retry on failure
   - Show user-friendly errors
   - Fallback to default image

---

## ✅ MIGRATION PLAN

### Nếu đã có ảnh trong filesystem:

```typescript
// Script to migrate existing images
import cloudinary from './lib/cloudinary';
import fs from 'fs';
import path from 'path';

async function migrateImages() {
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  const files = fs.readdirSync(uploadDir);

  for (const file of files) {
    const filePath = path.join(uploadDir, file);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'hospital-crm/migrated'
    });
    console.log(`Migrated: ${file} -> ${result.secure_url}`);
  }
}

migrateImages();
```

---

## 📞 SUPPORT

- Docs: https://cloudinary.com/documentation
- Dashboard: https://cloudinary.com/console
- Support: support@cloudinary.com

---

**Updated:** 20/10/2025
**Status:** Production Ready ✅
