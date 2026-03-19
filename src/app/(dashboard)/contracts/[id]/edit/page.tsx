"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractForm, ContractFormValues } from "@/components/contracts/contract-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ContractFormValues) => {
      const res = await fetch(`/api/contracts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Cập nhật hợp đồng thành công" });
      router.push("/contracts");
    },
    onError: () => {
      toast({ title: "Lỗi khi cập nhật", variant: "destructive" });
    },
  });

  if (isLoading) return <div className="py-8 text-center">Đang tải...</div>;
  if (!contract) return <div className="py-8 text-center">Không tìm thấy hợp đồng</div>;

  const defaultValues: Partial<ContractFormValues> = {
    ...contract,
    signedDate: new Date(contract.signedDate),
    startDate: new Date(contract.startDate),
    endDate: contract.endDate ? new Date(contract.endDate) : null,
    committedAmount: Number(contract.committedAmount),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chỉnh sửa hợp đồng</h2>
        <p className="text-muted-foreground">{contract.contractNumber}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            defaultValues={defaultValues}
            onSubmit={mutation.mutate}
            isLoading={mutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
