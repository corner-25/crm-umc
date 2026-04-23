import { redirect } from "next/navigation";

// Trang "nhập nhanh" cũ đã được gộp vào /charity-medicine.
// Redirect sang trang chính để tránh 2 form chồng chéo.
export default function SimpleRedirect() {
  redirect("/charity-medicine");
}
