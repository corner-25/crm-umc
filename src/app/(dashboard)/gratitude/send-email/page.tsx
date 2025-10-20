"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, Mail, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const templateTypeLabels = {
  THANK_YOU: "Cảm ơn",
  RECEIPT: "Biên nhận",
  BIRTHDAY: "Sinh nhật",
  ANNIVERSARY: "Kỷ niệm",
  REMINDER: "Nhắc nhở",
  NEWSLETTER: "Bản tin",
};

export default function SendEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("NO_TEMPLATE");
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [donorSearch, setDonorSearch] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [previewDonor, setPreviewDonor] = useState<any>(null);
  const { toast } = useToast();

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await fetch("/api/emails/templates");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Fetch donors
  const { data: donorsData } = useQuery({
    queryKey: ["donors-for-email", donorSearch],
    queryFn: async () => {
      const res = await fetch(`/api/donors?search=${donorSearch}&limit=100`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate === "NO_TEMPLATE" ? null : selectedTemplate,
          donorIds: selectedDonors,
          customSubject,
          customBody,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Thành công",
        description: `Đã gửi ${data.count} email`,
      });
      // Reset form
      setSelectedDonors([]);
      setCustomSubject("");
      setCustomBody("");
      setSelectedTemplate("NO_TEMPLATE");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi email. Vui lòng thử lại.",
      });
    },
  });

  const selectedTemplateData = templatesData?.templates?.find(
    (t: any) => t.id === selectedTemplate
  );

  const toggleDonor = (donorId: string) => {
    setSelectedDonors((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const toggleAll = () => {
    if (selectedDonors.length === donorsData?.donors?.length) {
      setSelectedDonors([]);
    } else {
      setSelectedDonors(donorsData?.donors?.map((d: any) => d.id) || []);
    }
  };

  const filterByTier = (tier: string) => {
    const filtered = donorsData?.donors?.filter((d: any) => d.tier === tier) || [];
    setSelectedDonors(filtered.map((d: any) => d.id));
  };

  // Generate preview
  const generatePreview = () => {
    if (!previewDonor) return { subject: "", body: "" };

    const template = selectedTemplateData;
    let subject = customSubject || template?.subject || "";
    let body = customBody || template?.body || "";

    // Replace variables
    subject = subject.replace(/\{tên\}/g, previewDonor.fullName);
    body = body
      .replace(/\{tên\}/g, previewDonor.fullName)
      .replace(/\{hạng\}/g, previewDonor.tier || "")
      .replace(/\{email\}/g, previewDonor.email || "")
      .replace(/\{phone\}/g, previewDonor.phone || "");

    return { subject, body };
  };

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gửi Email</h2>
        <p className="text-muted-foreground">
          Gửi email tri ân cho nhiều nhà tài trợ cùng lúc
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Compose */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Soạn Email</CardTitle>
              <CardDescription>Chọn mẫu hoặc tự viết nội dung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chọn mẫu email (tùy chọn)</Label>
                <Select value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  const template = templatesData?.templates?.find((t: any) => t.id === value);
                  if (template) {
                    setCustomSubject(template.subject);
                    setCustomBody(template.body);
                  } else if (value === "NO_TEMPLATE") {
                    setCustomSubject("");
                    setCustomBody("");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mẫu email" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_TEMPLATE">Không sử dụng mẫu</SelectItem>
                    {templatesData?.templates?.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tiêu đề email *</Label>
                <Input
                  placeholder="VD: Cảm ơn {tên} đã đồng hành cùng bệnh viện"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>

              <div>
                <Label>Nội dung email *</Label>
                <Textarea
                  placeholder="Kính gửi {tên}..."
                  rows={12}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Biến số: {"{tên}"}, {"{số_tiền}"}, {"{ngày}"}, {"{hạng}"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Xem trước</CardTitle>
              <CardDescription>
                Chọn nhà tài trợ để xem email sau khi thay thế biến số
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nhà tài trợ mẫu</Label>
                <Select
                  value={previewDonor?.id || ""}
                  onValueChange={(value) => {
                    const donor = donorsData?.donors?.find((d: any) => d.id === value);
                    setPreviewDonor(donor);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà tài trợ" />
                  </SelectTrigger>
                  <SelectContent>
                    {donorsData?.donors?.slice(0, 10).map((donor: any) => (
                      <SelectItem key={donor.id} value={donor.id}>
                        {donor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {previewDonor && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tiêu đề:</p>
                    <p className="font-medium">{preview.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nội dung:</p>
                    <p className="whitespace-pre-wrap text-sm">{preview.body}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recipients */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chọn người nhận</CardTitle>
                  <CardDescription>
                    Đã chọn: {selectedDonors.length} nhà tài trợ
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Users className="mr-1 h-3 w-3" />
                  {selectedDonors.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tìm kiếm nhà tài trợ</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  Chọn tất cả
                </Button>
                <Button variant="outline" size="sm" onClick={() => filterByTier("VIP")}>
                  Chỉ VIP
                </Button>
                <Button variant="outline" size="sm" onClick={() => filterByTier("GOLD")}>
                  Chỉ Gold
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDonors([])}>
                  Bỏ chọn
                </Button>
              </div>

              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                {donorsData?.donors?.map((donor: any) => (
                  <div
                    key={donor.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleDonor(donor.id)}
                  >
                    <Checkbox
                      checked={selectedDonors.includes(donor.id)}
                      onCheckedChange={() => toggleDonor(donor.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{donor.fullName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {donor.email || donor.phone}
                      </p>
                    </div>
                    <Badge variant="outline">{donor.tier}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Email sẽ được gửi đến {selectedDonors.length} nhà tài trợ. Kiểm tra kỹ nội dung trước khi gửi.
            </AlertDescription>
          </Alert>

          <Button
            className="w-full"
            size="lg"
            onClick={() => sendMutation.mutate()}
            disabled={selectedDonors.length === 0 || !customSubject || !customBody || sendMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendMutation.isPending ? "Đang gửi..." : `Gửi ${selectedDonors.length} Email`}
          </Button>
        </div>
      </div>
    </div>
  );
}
