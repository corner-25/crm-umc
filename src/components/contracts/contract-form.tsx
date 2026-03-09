"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageUpload } from "@/components/ui/image-upload";

const contractSchema = z.object({
  contractNumber: z.string().min(1, "Vui lòng nhập số hợp đồng"),
  donorId: z.string().min(1, "Vui lòng chọn nhà tài trợ"),
  signedDate: z.date({ required_error: "Vui lòng chọn ngày ký" }),
  startDate: z.date({ required_error: "Vui lòng chọn ngày hiệu lực" }),
  endDate: z.date().optional().nullable(),
  committedAmount: z.number().positive("Giá trị phải lớn hơn 0"),
  currency: z.enum(["VND", "USD", "EUR"]),
  purpose: z.string().min(1, "Vui lòng nhập mục đích"),
  terms: z.string().optional(),
  fileUrl: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]),
  notes: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractSchema>;

const statusLabels = {
  DRAFT: "Nháp",
  ACTIVE: "Đang hiệu lực",
  EXPIRED: "Hết hạn",
  TERMINATED: "Đã thanh lý",
};

interface ContractFormProps {
  defaultValues?: Partial<ContractFormValues>;
  onSubmit: (values: ContractFormValues) => void;
  isLoading?: boolean;
}

export function ContractForm({ defaultValues, onSubmit, isLoading }: ContractFormProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractNumber: "",
      donorId: "",
      currency: "VND",
      status: "ACTIVE",
      purpose: "",
      terms: "",
      notes: "",
      fileUrl: "",
      ...defaultValues,
    },
  });

  const { data: donorsData } = useQuery({
    queryKey: ["donors-search", donorSearch],
    queryFn: async () => {
      const res = await fetch(`/api/donors?search=${donorSearch}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch donors");
      return res.json();
    },
  });

  const selectedDonorId = form.watch("donorId");
  const selectedDonor = donorsData?.donors?.find((d: any) => d.id === selectedDonorId);

  const DatePickerField = ({ name, label, required }: { name: any; label: string; required?: boolean }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}{required && " *"}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                >
                  {field.value ? format(field.value, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ?? undefined}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Số hợp đồng + Trạng thái */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contractNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số hợp đồng *</FormLabel>
                <FormControl>
                  <Input placeholder="HĐ-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nhà tài trợ */}
        <FormField
          control={form.control}
          name="donorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nhà tài trợ *</FormLabel>
              <Popover open={donorSearchOpen} onOpenChange={setDonorSearchOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                    >
                      {selectedDonor ? selectedDonor.fullName : "Chọn nhà tài trợ"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Tìm nhà tài trợ..." value={donorSearch} onValueChange={setDonorSearch} />
                    <CommandEmpty>Không tìm thấy</CommandEmpty>
                    <CommandGroup>
                      {donorsData?.donors?.map((donor: any) => (
                        <CommandItem
                          key={donor.id}
                          value={donor.id}
                          onSelect={() => { field.onChange(donor.id); setDonorSearchOpen(false); }}
                        >
                          <div>
                            <p className="font-medium">{donor.fullName}</p>
                            <p className="text-sm text-muted-foreground">{donor.email || donor.phone}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ngày ký, ngày hiệu lực, ngày hết hạn */}
        <div className="grid gap-4 md:grid-cols-3">
          <DatePickerField name="signedDate" label="Ngày ký" required />
          <DatePickerField name="startDate" label="Ngày hiệu lực" required />
          <DatePickerField name="endDate" label="Ngày hết hạn (để trống = vô thời hạn)" />
        </div>

        {/* Giá trị cam kết + Loại tiền */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="committedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá trị cam kết *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10000000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại tiền *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="VND">VNĐ</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Mục đích */}
        <FormField
          control={form.control}
          name="purpose"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mục đích hợp đồng *</FormLabel>
              <FormControl>
                <Textarea placeholder="Hỗ trợ thuốc điều trị ung thư cho bệnh nhân nghèo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Điều khoản */}
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Điều khoản</FormLabel>
              <FormControl>
                <Textarea placeholder="Các điều khoản, cam kết trong hợp đồng..." rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File hợp đồng */}
        <FormField
          control={form.control}
          name="fileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File hợp đồng (PDF/ảnh)</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  multiple={false}
                  maxSize={10}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ghi chú */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea placeholder="Ghi chú thêm..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu hợp đồng"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
