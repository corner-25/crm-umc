"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Zap } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { useToast } from "@/hooks/use-toast";
import { paymentMethodLabels } from "@/lib/validations/donation";
import { CustomOptionSelect } from "@/components/ui/custom-option-select";
import Link from "next/link";

const quickEntrySchema = z.object({
  // Donor
  isAnonymous: z.boolean().default(false),
  fullName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  // Donation
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  currency: z.enum(["VND", "USD", "EUR"]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "E_WALLET"]),
  receivedDate: z.date(),
  purpose: z.array(z.string()).min(1, "Vui lòng chọn mục đích"),
  status: z.enum(["COMMITTED", "RECEIVED", "IN_USE", "REPORTED"]),
  custodian: z.string().min(1, "Vui lòng chọn người giữ tiền"),
  voucherCode: z.string().optional(),
  usageItems: z.array(z.object({
    description: z.string().min(1, "Vui lòng nhập nội dung"),
    amount: z.number().positive("Số tiền phải lớn hơn 0"),
    date: z.date(),
    method: z.string().optional(),
  })).default([]),
  usageNote: z.string().optional(),
}).refine((data) => data.isAnonymous || (data.fullName && data.fullName.trim().length > 0), {
  message: "Vui lòng nhập họ tên nhà tài trợ",
  path: ["fullName"],
});

type QuickEntryValues = z.infer<typeof quickEntrySchema>;

export default function QuickEntryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<QuickEntryValues>({
    resolver: zodResolver(quickEntrySchema) as any,
    defaultValues: {
      isAnonymous: false,
      fullName: "",
      phone: "",
      email: "",
      amount: undefined,
      currency: "VND",
      paymentMethod: "CASH",
      receivedDate: new Date(),
      purpose: [],
      status: "RECEIVED",
      custodian: "Uỷ quyền cho phòng CTXH",
      voucherCode: "",
      usageItems: [],
      usageNote: "",
    },
  });

  const { fields: usageFields, append: appendUsage, remove: removeUsage } = useFieldArray({
    control: form.control,
    name: "usageItems",
  });

  const isAnonymous = form.watch("isAnonymous");
  const watchedAmount = form.watch("amount");
  const watchedUsageItems = form.watch("usageItems");
  const watchedCustodian = form.watch("custodian");
  const watchedPaymentMethod = form.watch("paymentMethod");
  const totalUsed = watchedUsageItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remainingAmount = (watchedAmount || 0) - totalUsed;

  useEffect(() => {
    const computedStatus = totalUsed <= 0 ? "RECEIVED" : remainingAmount > 0 ? "IN_USE" : "REPORTED";
    form.setValue("status", computedStatus);
  }, [totalUsed, remainingAmount, form]);

  const mutation = useMutation({
    mutationFn: async (values: QuickEntryValues) => {
      const res = await fetch("/api/donations/quick-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor: {
            isAnonymous: values.isAnonymous,
            fullName: values.fullName,
            phone: values.phone,
            email: values.email,
          },
          donation: {
            amount: values.amount,
            currency: values.currency,
            paymentMethod: values.paymentMethod,
            receivedDate: values.receivedDate,
            purpose: values.purpose,
            status: values.status,
            custodian: values.custodian,
            voucherCode: values.voucherCode,
            usageItems: values.usageItems,
            usageNote: values.usageNote,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Đã lưu thành công", description: `Nhà tài trợ: ${data.donor.fullName}` });
      router.push("/donations/cash");
    },
    onError: () => toast({ variant: "destructive", title: "Lỗi", description: "Không thể lưu. Vui lòng thử lại." }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            <h2 className="text-3xl font-bold tracking-tight">Nhập nhanh tài trợ</h2>
          </div>
          <p className="text-muted-foreground">Tạo nhà tài trợ và khoản tài trợ tiền mặt trong một bước</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/donations/cash">Quay lại</Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          {/* === THÔNG TIN NHÀ TÀI TRỢ === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin nhà tài trợ</CardTitle>
              <CardDescription>Thông tin sẽ được tạo mới trong danh sách nhà tài trợ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ẩn danh */}
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-lg border p-4 bg-amber-50 border-amber-200">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-base font-medium cursor-pointer">
                        Mạnh thường quân ẩn danh
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Không có thông tin liên lạc. Nếu để trống tên, hệ thống tự cấp: Mạnh thường quân ẩn danh 0001, 0002,...
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {isAnonymous ? (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ tên (nếu biết)</FormLabel>
                      <FormControl>
                        <Input placeholder="Để trống nếu không biết tên" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nguyễn Văn A" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0901234567" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@email.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* === THÔNG TIN KHOẢN TÀI TRỢ === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin khoản tài trợ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
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
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
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
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phương thức *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(paymentMethodLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                          disabled={(d) => d > new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                    {totalUsed <= 0 ? "Đã nhận" : remainingAmount > 0 ? "Sử dụng một phần" : "Đã sử dụng"}
                  </div>
                </FormItem>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mục đích *</FormLabel>
                      <FormControl>
                        <CustomOptionSelect
                          type="cash_purpose"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Chọn mục đích tài trợ"
                          multiple
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quản lý tiền */}
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Quản lý tiền</p>
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
                        <FormLabel>{watchedPaymentMethod === "CASH" ? "Mã phiếu thu" : "Mã lệnh chuyển khoản"}</FormLabel>
                        <FormControl>
                          <Input placeholder={watchedPaymentMethod === "CASH" ? "PT-2025-001" : "CK-2025-001"} {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* === TÌNH TRẠNG SỬ DỤNG === */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Tình trạng sử dụng tiền</CardTitle>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Số dư còn lại</p>
                  <p className={`text-base font-semibold ${remainingAmount < 0 ? "text-destructive" : remainingAmount === 0 && totalUsed > 0 ? "text-muted-foreground" : "text-green-600"}`}>
                    {remainingAmount.toLocaleString("vi-VN")} {form.watch("currency") === "VND" ? "đ" : form.watch("currency")}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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
                              disabled={(d) => d > new Date()}
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
