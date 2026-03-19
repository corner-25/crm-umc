"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Gift, Eye, Clock, CheckCircle2, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { patientStatusLabels } from "@/types/cancer-support";

interface PatientWithTreatment {
  id: string;
  patientCode: string;
  name: string;
  phone: string | null;
  status: string;
  treatments: {
    id: string;
    cycleNumber: number;
    treatmentDate: string;
    nextCycleDate: string;
    isSponsored: boolean;
    donationAmount: number | null;
    status: string;
    medication: {
      name: string;
      cycleDays: number;
    };
    sponsor: {
      fullName: string;
      company: string | null;
    } | null;
  }[];
}

interface Stats {
  totalPatients: number;
  activePatients: number;
  upcomingTreatments: number;
  totalDonations: number;
}

export default function TrackingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientWithTreatment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    activePatients: 0,
    upcomingTreatments: 0,
    totalDonations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, treatmentsRes] = await Promise.all([
        fetch("/api/cancer-support/patients?limit=100"),
        fetch("/api/cancer-support/treatments"),
      ]);

      const patientsData = await patientsRes.json();
      const treatmentsData = await treatmentsRes.json();

      if (patientsRes.ok && treatmentsRes.ok) {
        const patientsWithTreatments: PatientWithTreatment[] = patientsData.patients.map((patient: any) => {
          const patientTreatments = treatmentsData.treatments.filter(
            (t: any) => t.patientId === patient.id
          );
          return {
            ...patient,
            treatments: patientTreatments,
          };
        });

        setPatients(patientsWithTreatments);

        // Calculate stats
        const activePatients = patientsWithTreatments.filter(
          (p) => p.status === "ACTIVE"
        ).length;

        const upcomingTreatments = treatmentsData.treatments.filter((t: any) => {
          const nextDate = new Date(t.nextCycleDate);
          const now = new Date();
          const daysUntil = differenceInDays(nextDate, now);
          return daysUntil >= 0 && daysUntil <= 7 && t.status === "UPCOMING";
        }).length;

        const totalDonations = treatmentsData.treatments
          .filter((t: any) => t.isSponsored && t.donationAmount)
          .reduce((sum: number, t: any) => sum + Number(t.donationAmount), 0);

        setStats({
          totalPatients: patientsWithTreatments.length,
          activePatients,
          upcomingTreatments,
          totalDonations,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getDaysUntilNext = (nextDate: string) => {
    const days = differenceInDays(new Date(nextDate), new Date());
    if (days < 0) return { text: `Quá hạn ${Math.abs(days)} ngày`, urgent: true };
    if (days === 0) return { text: "Hôm nay", urgent: true };
    if (days <= 3) return { text: `Còn ${days} ngày`, urgent: true };
    return { text: `Còn ${days} ngày`, urgent: false };
  };

  const getUpcomingTreatments = () => {
    const upcomingList: Array<{
      patient: PatientWithTreatment;
      treatment: PatientWithTreatment["treatments"][0];
    }> = [];

    patients.forEach((patient) => {
      // Get the latest upcoming treatment for each medication
      const medicationGroups: { [key: string]: PatientWithTreatment["treatments"][0] } = {};

      patient.treatments
        .filter((t) => t.status === "UPCOMING")
        .forEach((treatment) => {
          const medName = treatment.medication.name;
          if (
            !medicationGroups[medName] ||
            new Date(treatment.nextCycleDate) < new Date(medicationGroups[medName].nextCycleDate)
          ) {
            medicationGroups[medName] = treatment;
          }
        });

      Object.values(medicationGroups).forEach((treatment) => {
        const daysUntil = differenceInDays(new Date(treatment.nextCycleDate), new Date());
        if (daysUntil >= -7 && daysUntil <= 30) {
          upcomingList.push({ patient, treatment });
        }
      });
    });

    // Sort by next cycle date
    return upcomingList.sort(
      (a, b) =>
        new Date(a.treatment.nextCycleDate).getTime() -
        new Date(b.treatment.nextCycleDate).getTime()
    );
  };

  const filteredUpcoming = getUpcomingTreatments().filter((item) =>
    search
      ? item.patient.name.toLowerCase().includes(search.toLowerCase()) ||
        item.patient.patientCode.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const getStatusByPatientStatus = (status: string) => {
    const counts = patients.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return counts;
  };

  const statusCounts = getStatusByPatientStatus("");

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Theo dõi Chương trình</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi và quản lý chu kỳ điều trị của bệnh nhân
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bệnh nhân</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang điều trị</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chu kỳ sắp đến (7 ngày)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingTreatments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tài trợ</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalDonations)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tình trạng bệnh nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <Badge variant="outline">
                  {patientStatusLabels[status as keyof typeof patientStatusLabels]}
                </Badge>
                <span className="text-2xl font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Treatments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Chu kỳ sắp đến</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bệnh nhân..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredUpcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có chu kỳ nào sắp đến
            </div>
          ) : (
            filteredUpcoming.map(({ patient, treatment }) => {
              const daysInfo = getDaysUntilNext(treatment.nextCycleDate);
              return (
                <div
                  key={`${patient.id}-${treatment.id}`}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{patient.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {patient.patientCode}
                        </Badge>
                        {patient.phone && (
                          <span className="text-sm text-muted-foreground">
                            {patient.phone}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{treatment.medication.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Chu kỳ {treatment.cycleNumber}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Dự kiến:</span>
                          <span className="font-medium">
                            {format(new Date(treatment.nextCycleDate), "dd/MM/yyyy")}
                          </span>
                          <Badge
                            variant={daysInfo.urgent ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {daysInfo.text}
                          </Badge>
                        </div>

                        {treatment.isSponsored && treatment.sponsor && (
                          <div className="flex items-center gap-2 text-green-600">
                            <Gift className="h-4 w-4" />
                            <span>
                              Tài trợ: {treatment.sponsor.company || treatment.sponsor.fullName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/cancer-support/patients/${patient.id}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Chi tiết
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
