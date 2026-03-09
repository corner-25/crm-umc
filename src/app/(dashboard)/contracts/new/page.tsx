"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ContractForm, ContractFormValues } from "@/components/contracts/contract-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewContractPage() {
  const router = useRouter();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create contract");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Tạo hợp đồng thành công" });
      router.push("/contracts");
    },
    onError: () => {
      toast({ title: "Lỗi khi tạo hợp đồng", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tạo hợp đồng mới</h2>
        <p className="text-muted-foreground">Ghi nhận hợp đồng tài trợ với nhà tài trợ</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm onSubmit={mutation.mutate} isLoading={mutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
