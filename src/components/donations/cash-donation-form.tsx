"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { cashDonationSchema, CashDonationFormValues, paymentMethodLabels } from "@/lib/validations/donation";

// Re-export types for external use
export type { CashDonationFormValues };
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";
import { CustomOptionSelect } from "@/components/ui/custom-option-select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ImageUpload } from "@/components/ui/image-upload";

interface CashDonationFormProps {
  defaultValues?: Partial<CashDonationFormValues>;
  onSubmit: (values: CashDonationFormValues) => void;
  isLoading?: boolean;
}

export function CashDonationForm({ defaultValues, onSubmit, isLoading }: CashDonationFormProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  const form = useForm<CashDonationFormValues>({
    resolver: zodResolver(cashDonationSchema) as any,
    defaultValues: {
      donorId: "",
      amount: undefined,
      currency: "VND",
      paymentMethod: "BANK_TRANSFER",
      receivedDate: new Date(),
      purpose: "",
      purposeOther: "",
      receiptUrl: "",
      status: "RECEIVED",
      custodian: "Uỷ quyền cho phòng CTXH",
      voucherCode: "",
      usageItems: [],
      usageNote: "",
      ...defaultValues,
    },
  });

  const { fields: usageFields, append: appendUsage, remove: removeUsage } = useFieldArray({
    control: form.control,
    name: "usageItems",
  });

  const watchedAmount = form.watch("amount");
  const watchedUsageItems = form.watch("usageItems");
  const watchedCustodian = form.watch("custodian");
  const watchedPaymentMethod = form.watch("paymentMethod");
  const totalUsed = watchedUsageItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remainingAmount = (watchedAmount || 0) - totalUsed;

  // Auto-sync status based on usage
  useEffect(() => {
    const computedStatus = totalUsed <= 0 ? "RECEIVED" : remainingAmount > 0 ? "IN_USE" : "REPORTED";
    form.setValue("status", computedStatus);
  }, [totalUsed, remainingAmount, form]);

  // Fetch donors for selection
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Chọn nhà tài trợ */}
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
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selectedDonor ? selectedDonor.fullName : "Chọn nhà tài trợ"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Tìm nhà tài trợ..."
                      value={donorSearch}
                      onValueChange={setDonorSearch}
                    />
                    <CommandEmpty>Không tìm thấy nhà tài trợ</CommandEmpty>
                    <CommandGroup>
                      {donorsData?.donors?.map((donor: any) => (
                        <CommandItem
                          key={donor.id}
                          value={donor.id}
                          onSelect={() => {
                            field.onChange(donor.id);
                            setDonorSearchOpen(false);
                          }}
                        >
                          <div>
                            <p className="font-medium">{donor.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              {donor.email || donor.phone}
                            </p>
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

        <div className="grid gap-4 md:grid-cols-3">
          {/* Số tiền */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số tiền *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1000000"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Loại tiền */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại tiền *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại tiền" />
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

          {/* Phương thức */}
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phương thức *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phương thức" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Ngày nhận */}
          <FormField
            control={form.control}
            name="receivedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày nhận *</FormLabel>
                <FormControl>
                  <DateInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={(date) => date > new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Trạng thái - tự động theo tình trạng sử dụng */}
          <FormItem>
            <FormLabel>Trạng thái</FormLabel>
            <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
              {totalUsed <= 0
                ? "Đã nhận"
                : remainingAmount > 0
                ? "Sử dụng một phần"
                : "Đã sử dụng"}
            </div>
          </FormItem>
        </div>

        {/* Mục đích (dropdown) */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nội dung/Mục đích *</FormLabel>
                <FormControl>
                  <CustomOptionSelect
                    type="cash_purpose"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn hoặc thêm mục đích..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Quản lý tiền */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium text-sm">Quản lý tiền</h3>
          <FormField
            control={form.control}
            name="custodian"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiền đang do ai giữ *</FormLabel>
                <FormControl>
                  <CustomOptionSelect
                    type="custodian"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Chọn người giữ tiền..."
                    protectedValues={["Kế toán đang giữ"]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedCustodian === "Kế toán đang giữ" && (
            <FormField
              control={form.control}
              name="voucherCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedPaymentMethod === "CASH" ? "Mã phiếu thu" : "Mã lệnh chuyển khoản"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={watchedPaymentMethod === "CASH" ? "PT-2025-001" : "CK-2025-001"}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Tình trạng sử dụng (multi-item) */}
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Tình trạng sử dụng tiền</h3>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Số dư còn lại</p>
              <p className={`text-base font-semibold ${remainingAmount < 0 ? "text-destructive" : remainingAmount === 0 ? "text-muted-foreground" : "text-green-600"}`}>
                {remainingAmount.toLocaleString("vi-VN")} {form.watch("currency") === "VND" ? "đ" : form.watch("currency")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {usageFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="flex-1">
                  <FormField
                    control={form.control}
                    name={`usageItems.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Nội dung sử dụng</FormLabel>}
                        <FormControl>
                          <Input placeholder="VD: Hỗ trợ bệnh nhi A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-36">
                  <FormField
                    control={form.control}
                    name={`usageItems.${index}.amount`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Số tiền</FormLabel>}
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10000000"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-44">
                  <FormField
                    control={form.control}
                    name={`usageItems.${index}.date`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Ngày sử dụng</FormLabel>}
                        <FormControl>
                          <DateInput
                            value={field.value}
                            onChange={field.onChange}
                            disabled={(date) => date > new Date()}
                            size="sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="w-52">
                  <FormField
                    control={form.control}
                    name={`usageItems.${index}.method`}
                    render={({ field }) => (
                      <FormItem>
                        {index === 0 && <FormLabel className="text-xs">Hình thức trao</FormLabel>}
                        <FormControl>
                          <CustomOptionSelect
                            type="usage_method"
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Chọn hình thức..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`${index === 0 ? "mt-6" : ""} text-destructive hover:text-destructive`}
                  onClick={() => removeUsage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={remainingAmount <= 0 && usageFields.length > 0}
            onClick={() => appendUsage({ description: "", amount: undefined as any, date: new Date() })}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm khoản sử dụng
          </Button>

          <FormField
            control={form.control}
            name="usageNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú thêm</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ghi chú về tình trạng sử dụng..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Upload biên lai */}
        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hình ảnh biên lai</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  multiple={false}
                  maxSize={5}
                />
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
            {isLoading ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
