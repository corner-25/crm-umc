import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/**
 * Setup API - Tạo admin user đầu tiên
 * ⚠️ CHỈ DÙNG 1 LẦN SAU KHI DEPLOY
 * ⚠️ XÓA ROUTE NÀY SAU KHI TẠO ADMIN XONG
 *
 * Usage: GET https://your-app.railway.app/api/setup
 */
export async function GET() {
  try {
    // Kiểm tra xem đã có admin chưa
    const adminExists = await prisma.user.findFirst({
      where: {
        email: 'admin@hospital.com'
      }
    });

    if (adminExists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin already exists. Please delete this API route for security.'
        },
        { status: 400 }
      );
    }

    // Tạo admin user
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
      success: true,
      message: 'Admin user created successfully!',
      data: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      warning: '⚠️ PLEASE DELETE /src/app/api/setup FOLDER NOW FOR SECURITY!'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
