"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { patientStatusLabels, patientGenderLabels, patientSubStatusLabels, sponsorPolicyLabels } from "@/types/cancer-support";
import { Plus, Calendar, DollarSign, Building2, CheckCircle2, Clock, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { vi } from "date-fns/locale";

interface Patient {
  id: string;
  patientCode: string;
  name: string;
  gender: string;
  yearOfBirth: number;
  phone: string | null;
  cccd: string | null;
  status: string;
  subStatus: string | null;
  treatments: Treatment[];
}

interface Treatment {
  id: string;
  cycleNumber: number;
  treatmentDate: string;
  nextCycleDate: string;
  isSponsored: boolean;
  donationAmount: number | null;
  status: string;
  notes: string | null;
  medication: {
    id: string;
    name: string;
    cycleDays: number;
    unitPrice: number;
    sponsorPolicy: string;
  };
  sponsor: {
    id: string;
    fullName: string;
    company: string | null;
  } | null;
}

interface Medication {
  id: string;
  name: string;
  cycleDays: number;
  unitPrice: number;
  sponsorPolicy: string;
  sponsors: any[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedMedicationId, setSelectedMedicationId] = useState("");
  const [treatmentDate, setTreatmentDate] = useState<Date>(new Date());
  const [selectedSponsorId, setSelectedSponsorId] = useState("");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newSubStatus, setNewSubStatus] = useState<string | null>(null);

  const selectedMedication = medications.find((m) => m.id === selectedMedicationId);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cancer-support/patients/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setPatient(data);
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể tải thông tin bệnh nhân",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin bệnh nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await fetch("/api/cancer-support/medications?limit=100");
      const data = await response.json();
      if (response.ok) {
        setMedications(data.medications || []);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  useEffect(() => {
    fetchPatient();
    fetchMedications();
  }, [params.id]);

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn tình trạng",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/cancer-support/patients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          subStatus: newSubStatus === "" ? null : newSubStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã cập nhật tình trạng người bệnh",
        });
        setIsStatusDialogOpen(false);
        fetchPatient();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể cập nhật tình trạng",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tình trạng",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTreatment = async () => {
    if (!selectedMedicationId || !treatmentDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn thuốc và ngày điều trị",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/cancer-support/treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: params.id,
          medicationId: selectedMedicationId,
          treatmentDate: treatmentDate.toISOString(),
          sponsorId: selectedSponsorId || undefined,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Thành công",
          description: "Đã thêm chu kỳ điều trị mới",
        });
        setIsDialogOpen(false);
        setSelectedMedicationId("");
        setTreatmentDate(new Date());
        setSelectedSponsorId("");
        setNotes("");
        fetchPatient();
      } else {
        toast({
          title: "Lỗi",
          description: data.error || "Không thể thêm chu kỳ điều trị",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating treatment:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm chu kỳ điều trị",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const groupTreatmentsByMedication = (treatments: Treatment[]) => {
    const grouped: { [key: string]: Treatment[] } = {};
    treatments.forEach((treatment) => {
      const medName = treatment.medication.name;
      if (!grouped[medName]) {
        grouped[medName] = [];
      }
      grouped[medName].push(treatment);
    });
    return grouped;
  };

  const getDaysUntilNext = (nextDate: string) => {
    const days = differenceInDays(new Date(nextDate), new Date());
    if (days < 0) return `Đã quá ${Math.abs(days)} ngày`;
    if (days === 0) return "Hôm nay";
    return `Còn ${days} ngày`;
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center">Không tìm thấy bệnh nhân</div>;
  }

  const groupedTreatments = groupTreatmentsByMedication(patient.treatments);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{patient.name}</h1>
          <p className="text-muted-foreground mt-1">Mã BN: {patient.patientCode}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"}>
              {patientStatusLabels[patient.status as keyof typeof patientStatusLabels]}
            </Badge>
            {patient.subStatus && (
              <Badge variant="outline" className="text-xs">
                {patientSubStatusLabels[patient.subStatus as keyof typeof patientSubStatusLabels]}
              </Badge>
            )}
          </div>
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => {
                setNewStatus(patient.status);
                setNewSubStatus(patient.subStatus);
              }}>
                Cập nhật tình trạng
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cập nhật tình trạng người bệnh</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tình trạng *</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tình trạng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(patientStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trạng thái phụ</Label>
                  <Select value={newSubStatus || "NONE"} onValueChange={(value) => setNewSubStatus(value === "NONE" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái phụ (nếu có)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Không có</SelectItem>
                      {Object.entries(patientSubStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsStatusDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button onClick={handleUpdateStatus} disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu..." : "Cập nhật"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="treatments">Lịch sử điều trị</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bệnh nhân</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Giới tính</p>
                <p className="font-medium">
                  {patientGenderLabels[patient.gender as keyof typeof patientGenderLabels]}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Năm sinh</p>
                <p className="font-medium">{patient.yearOfBirth}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{patient.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CCCD</p>
                <p className="font-medium">{patient.cccd || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm chu kỳ mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm chu kỳ điều trị</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Thuốc *</Label>
                    <Select
                      value={selectedMedicationId}
                      onValueChange={setSelectedMedicationId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thuốc" />
                      </SelectTrigger>
                      <SelectContent>
                        {medications.map((med) => (
                          <SelectItem key={med.id} value={med.id}>
                            {med.name} - {med.cycleDays} ngày - {formatCurrency(Number(med.unitPrice))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Ngày thực hiện *</Label>
                    <DatePicker
                      value={treatmentDate}
                      onChange={(date) => date && setTreatmentDate(date)}
                    />
                  </div>

                  {selectedMedication && (
                    <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                      <h4 className="font-medium">Thông tin tự động</h4>
                      <div className="grid gap-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Chu kỳ số:</span>{" "}
                          <span className="font-medium">
                            {patient.treatments.filter(
                              (t) => t.medication.id === selectedMedicationId
                            ).length + 1}
                          </span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Chính sách:</span>{" "}
                          <span className="font-medium">
                            {sponsorPolicyLabels[selectedMedication.sponsorPolicy as keyof typeof sponsorPolicyLabels]}
                          </span>
                        </p>
                      </div>

                      {selectedMedication.sponsors.length > 0 && (
                        <div>
                          <Label>Nhà tài trợ</Label>
                          <Select
                            value={selectedSponsorId}
                            onValueChange={setSelectedSponsorId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nhà tài trợ" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedMedication.sponsors.map((ms) => (
                                <SelectItem key={ms.sponsor.id} value={ms.sponsor.id}>
                                  {ms.sponsor.company || ms.sponsor.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú thêm..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleAddTreatment} disabled={isSubmitting}>
                      {isSubmitting ? "Đang lưu..." : "Lưu chu kỳ"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {Object.keys(groupedTreatments).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chưa có chu kỳ điều trị nào
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedTreatments).map(([medName, treatments]) => (
              <Card key={medName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Thuốc: {medName}</span>
                    <Badge variant="outline">{treatments.length} chu kỳ</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            Chu kỳ {treatment.cycleNumber}
                            {treatment.status === "COMPLETED" && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {treatment.status === "UPCOMING" && (
                              <Clock className="h-4 w-4 text-orange-600" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {treatment.medication.cycleDays} ngày - {sponsorPolicyLabels[treatment.medication.sponsorPolicy as keyof typeof sponsorPolicyLabels]}
                          </p>
                        </div>
                        {treatment.isSponsored && (
                          <Badge variant="default" className="gap-1">
                            <Gift className="h-3 w-3" />
                            Được tài trợ
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ngày thực hiện:</span>
                          <span className="font-medium">
                            {format(new Date(treatment.treatmentDate), "dd/MM/yyyy", { locale: vi })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Dự kiến tiếp theo:</span>
                          <span className="font-medium">
                            {format(new Date(treatment.nextCycleDate), "dd/MM/yyyy", { locale: vi })}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getDaysUntilNext(treatment.nextCycleDate)}
                          </Badge>
                        </div>
                        {treatment.isSponsored && treatment.sponsor && (
                          <>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>Nhà tài trợ:</span>
                              <span className="font-medium">
                                {treatment.sponsor.company || treatment.sponsor.fullName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>Số tiền tài trợ:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(Number(treatment.donationAmount))}
                              </span>
                            </div>
                          </>
                        )}
                        {treatment.notes && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="text-muted-foreground">Ghi chú:</span> {treatment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
