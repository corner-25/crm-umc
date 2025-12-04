"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PatientForm } from "@/components/cancer-support/patient-form";
import { PatientFormValues } from "@/lib/validations/cancer-support";
import { patientStatusLabels, patientGenderLabels, patientSubStatusLabels } from "@/types/cancer-support";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  patientCode: string;
  name: string;
  gender: string;
  yearOfBirth: number;
  phone: string | null;
  status: string;
  subStatus: string | null;
  _count: {
    treatments: number;
  };
}

export default function PatientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("limit", "100");

      const response = await fetch(`/api/cancer-support/patients?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPatients(data.patients || []);
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể tải danh sách bệnh nhân",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bệnh nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, statusFilter]);

  const handleSubmit = async (values: PatientFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/cancer-support/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã thêm bệnh nhân mới",
        });
        setIsDialogOpen(false);
        fetchPatients();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể thêm bệnh nhân",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm bệnh nhân",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "DECEASED":
        return "destructive";
      case "LOST_CONTACT":
        return "secondary";
      case "TRANSFERRED_OUT":
        return "outline";
      case "DISCONTINUED":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Người bệnh</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin bệnh nhân ung thư
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm bệnh nhân
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
            </DialogHeader>
            <PatientForm onSubmit={handleSubmit} isLoading={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, mã BN, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo tình trạng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(patientStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã BN</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Giới tính</TableHead>
              <TableHead>Năm sinh</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Số chu kỳ</TableHead>
              <TableHead>Tình trạng</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Không có bệnh nhân nào
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.patientCode}
                  </TableCell>
                  <TableCell>{patient.name}</TableCell>
                  <TableCell>{patientGenderLabels[patient.gender as keyof typeof patientGenderLabels]}</TableCell>
                  <TableCell>{patient.yearOfBirth}</TableCell>
                  <TableCell>{patient.phone || "-"}</TableCell>
                  <TableCell>{patient._count.treatments}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={getStatusBadgeVariant(patient.status) as any} className="text-xs px-2 py-0.5 justify-center min-w-[80px]">
                        {patientStatusLabels[patient.status as keyof typeof patientStatusLabels]}
                      </Badge>
                      {patient.subStatus && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 justify-center min-w-[80px]">
                          {patientSubStatusLabels[patient.subStatus as keyof typeof patientSubStatusLabels]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/cancer-support/patients/${patient.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
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
