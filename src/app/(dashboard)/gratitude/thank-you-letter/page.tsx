"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { donorTierLabels, donorTierColors } from "@/types/donor";
import { DonorTier } from "@prisma/client";
import { ThankYouLetterButton } from "@/components/donors/thank-you-letter-button";
import { cn } from "@/lib/utils";

export default function ThankYouLetterPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["donors-for-letter", searchDebounced],
    queryFn: async () => {
      const res = await fetch(`/api/donors?search=${searchDebounced}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._letterSearchTimer);
    (window as any)._letterSearchTimer = setTimeout(() => setSearchDebounced(val), 350);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">In thư cảm ơn</h2>
        <p className="text-muted-foreground">
          Tìm nhà tài trợ và in thư cảm ơn theo đúng mẫu bệnh viện
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tìm nhà tài trợ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, email, công ty..."
              className="pl-9"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground text-sm">Đang tải...</div>
          ) : (
            <div className="divide-y rounded-lg border">
              {data?.donors?.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  Không tìm thấy nhà tài trợ
                </div>
              ) : (
                data?.donors?.map((donor: any) => (
                  <div key={donor.id} className="flex items-center justify-between gap-4 p-3 hover:bg-muted/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{donor.fullName}</span>
                        <Badge variant="outline" className={cn("text-xs shrink-0", donorTierColors[donor.tier as DonorTier])}>
                          {donorTierLabels[donor.tier as DonorTier]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {donor.company ? `${donor.company} · ` : ""}{donor.email || donor.phone || ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/donors/${donor.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <ThankYouLetterButton donor={donor} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
