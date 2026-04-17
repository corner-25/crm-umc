"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { InactiveSponsorsDropdown } from "./inactive-sponsors-dropdown";
import { NotificationsDropdown } from "./notifications-dropdown";
import { GratitudeIndividualDropdown } from "./gratitude-individual-dropdown";
import { GratitudeOrgDropdown } from "./gratitude-org-dropdown";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Image
          src="/logo.jpg"
          alt="Hospital Logo"
          width={200}
          height={200}
          className="hidden sm:block rounded-md"
        />
        <h1 className="text-sm sm:text-lg md:text-xl font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-none">
          {process.env.NEXT_PUBLIC_HOSPITAL_NAME || "CRM UMC"}
        </h1>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* 1. Nhà tài trợ lâu chưa quay lại */}
        <InactiveSponsorsDropdown />

        {/* 2. Tri ân nhà tài trợ cá nhân (sinh nhật) */}
        <GratitudeIndividualDropdown />

        {/* 3. Tri ân doanh nghiệp / tổ chức (ngày thành lập) */}
        <GratitudeOrgDropdown />

        {/* Hệ thống (hợp đồng, kho, fanpage, chu kỳ) */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(session?.user?.name || null)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">
                {session?.user?.name || session?.user?.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-sm">
                Role: <span className="font-medium">{session?.user?.role}</span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
