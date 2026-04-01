import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 34 tỉnh thành theo bản đồ hành chính mới 2025
const PROVINCES_2025 = [
  { province: "An Giang", notes: "Sáp nhập: An Giang, Kiên Giang" },
  { province: "Bắc Ninh", notes: "Sáp nhập: Bắc Ninh, Bắc Giang" },
  { province: "Cà Mau", notes: "Sáp nhập: Cà Mau, Bạc Liêu" },
  { province: "Cần Thơ", notes: "Sáp nhập: Cần Thơ, Sóc Trăng, Hậu Giang" },
  { province: "Cao Bằng", notes: "" },
  { province: "Đà Nẵng", notes: "Sáp nhập: Đà Nẵng, Quảng Nam" },
  { province: "Đắk Lắk", notes: "Sáp nhập: Đắk Lắk, Phú Yên" },
  { province: "Điện Biên", notes: "" },
  { province: "Đồng Nai", notes: "Sáp nhập: Đồng Nai, Bình Phước" },
  { province: "Đồng Tháp", notes: "Sáp nhập: Tiền Giang, Đồng Tháp" },
  { province: "Gia Lai", notes: "Sáp nhập: Gia Lai, Bình Định" },
  { province: "Hà Nội", notes: "Sáp nhập: Hà Nội, Hòa Bình, Vĩnh Phúc" },
  { province: "Hà Tĩnh", notes: "Sáp nhập: Hà Tĩnh, Quảng Bình" },
  { province: "Hải Phòng", notes: "Sáp nhập: Hải Phòng, Hải Dương" },
  { province: "Huế", notes: "Sáp nhập: Thừa Thiên Huế, Quảng Trị một phần" },
  { province: "Hưng Yên", notes: "Sáp nhập: Hưng Yên, Thái Bình" },
  { province: "Khánh Hòa", notes: "Sáp nhập: Khánh Hòa, Ninh Thuận" },
  { province: "Lai Châu", notes: "" },
  { province: "Lâm Đồng", notes: "Sáp nhập: Lâm Đồng, Bình Thuận" },
  { province: "Lạng Sơn", notes: "Sáp nhập: Lạng Sơn, Bắc Kạn" },
  { province: "Lào Cai", notes: "Sáp nhập: Lào Cai, Yên Bái" },
  { province: "Nghệ An", notes: "Sáp nhập: Nghệ An, Thanh Hóa một phần" },
  { province: "Ninh Bình", notes: "Sáp nhập: Ninh Bình, Nam Định" },
  { province: "Phú Thọ", notes: "Sáp nhập: Phú Thọ, Tuyên Quang, Hà Giang" },
  { province: "Quảng Ngãi", notes: "Sáp nhập: Quảng Ngãi, Kon Tum" },
  { province: "Quảng Ninh", notes: "Sáp nhập: Quảng Ninh, Lạng Sơn một phần" },
  { province: "Quảng Trị", notes: "Sáp nhập: Quảng Trị một phần" },
  { province: "Sơn La", notes: "Sáp nhập: Sơn La, Hòa Bình một phần" },
  { province: "Tây Ninh", notes: "Sáp nhập: Tây Ninh, Bình Dương, Long An" },
  { province: "Thanh Hóa", notes: "Sáp nhập: Thanh Hóa, Ninh Bình một phần" },
  { province: "Thái Nguyên", notes: "Sáp nhập: Thái Nguyên, Bắc Kạn một phần" },
  { province: "TP. Hồ Chí Minh", notes: "Sáp nhập: TP. HCM, Bà Rịa - Vũng Tàu" },
  { province: "Tuyên Quang", notes: "Sáp nhập: Tuyên Quang, Hà Giang" },
  { province: "Vĩnh Long", notes: "Sáp nhập: Vĩnh Long, Bến Tre, Trà Vinh" },
];

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Xoá tất cả location cũ không có chuyến đi liên kết
    const deleted = await prisma.charityLocation.deleteMany({
      where: {
        district: null,
        trips: { none: {} },
      },
    });

    let created = 0;

    for (const p of PROVINCES_2025) {
      const exists = await prisma.charityLocation.findFirst({
        where: { province: p.province, district: null },
      });
      if (exists) {
        // Cập nhật notes nếu cần
        await prisma.charityLocation.update({
          where: { id: exists.id },
          data: { notes: p.notes || null, deletedAt: null },
        });
        continue;
      }

      await prisma.charityLocation.create({
        data: {
          province: p.province,
          notes: p.notes || null,
        },
      });
      created++;
    }

    return NextResponse.json({ success: true, created, deletedOld: deleted.count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
