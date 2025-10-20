"use client";

import { Bell } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();

  // Fetch pending reminders count
  const { data: remindersData } = useQuery({
    queryKey: ["reminders-count"],
    queryFn: async () => {
      const res = await fetch("/api/reminders?completed=false");
      if (!res.ok) return { reminders: [] };
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const pendingCount = remindersData?.reminders?.length || 0;

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
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.jpg"
          alt="Hospital Logo"
          width={200}
          height={200}
          className="rounded-md"
        />
        <h1 className="text-xl font-semibold text-slate-800">
          {process.env.NEXT_PUBLIC_HOSPITAL_NAME || "Phòng Công tác xã hội - Bệnh viện Đại học Y Dược TP. Hồ Chí Minh"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/gratitude/reminders">
            <Bell className="h-5 w-5" />
            {pendingCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </Badge>
            )}
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(session?.user?.name || null)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
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
