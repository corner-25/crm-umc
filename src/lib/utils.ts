import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = "VND"): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (currency === "VND") {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numAmount);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(numAmount);
}

export function formatDate(date: Date | string, format: string = "dd/MM/yyyy"): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', String(year));
}
