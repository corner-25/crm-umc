"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MedicationForm } from "@/components/cancer-support/medication-form";
import { MedicationFormValues } from "@/lib/validations/cancer-support";
import { sponsorPolicyLabels } from "@/types/cancer-support";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Medication {
  id: string;
  name: string;
  unitPrice: number;
  cycleDays: number;
  sponsorPolicy: string;
  sponsors: any[];
  _count: {
    treatments: number;
  };
}

export default function MedicationsPage() {
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", "100");

      const response = await fetch(`/api/cancer-support/medications?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMedications(data.medications || []);
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể tải danh sách thuốc",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thuốc",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [search]);

  const handleSubmit = async (values: MedicationFormValues) => {
    try {
      setIsSubmitting(true);

      const url = editingMedication
        ? `/api/cancer-support/medications/${editingMedication.id}`
        : "/api/cancer-support/medications";

      const method = editingMedication ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: editingMedication ? "Đã cập nhật thuốc" : "Đã thêm thuốc mới",
        });
        setIsDialogOpen(false);
        setEditingMedication(null);
        fetchMedications();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể lưu thuốc",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving medication:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thuốc",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMedication(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Thuốc</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin thuốc và chính sách tài trợ
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm thuốc
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMedication ? "Sửa thuốc" : "Thêm thuốc mới"}</DialogTitle>
            </DialogHeader>
            <MedicationForm
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              defaultValues={editingMedication ? {
                name: editingMedication.name,
                description: "",
                unitPrice: Number(editingMedication.unitPrice),
                cycleDays: editingMedication.cycleDays,
                sponsorPolicy: editingMedication.sponsorPolicy as any,
                sponsorIds: editingMedication.sponsors.map(s => s.sponsor.id),
              } : undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên thuốc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên thuốc</TableHead>
              <TableHead>Đơn giá</TableHead>
              <TableHead>Chu kỳ</TableHead>
              <TableHead>Chính sách</TableHead>
              <TableHead>Nhà tài trợ</TableHead>
              <TableHead>Số chu kỳ đã dùng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : medications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Không có thuốc nào
                </TableCell>
              </TableRow>
            ) : (
              medications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">
                    {medication.name}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(medication.unitPrice))}</TableCell>
                  <TableCell>{medication.cycleDays} ngày</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sponsorPolicyLabels[medication.sponsorPolicy as keyof typeof sponsorPolicyLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {medication.sponsors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {medication.sponsors.map((ms) => (
                          <Badge key={ms.id} variant="secondary" className="text-xs">
                            {ms.sponsor.company || ms.sponsor.fullName}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Chưa có
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{medication._count.treatments}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(medication)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
