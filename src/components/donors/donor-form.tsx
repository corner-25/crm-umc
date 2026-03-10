"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { donorSchema, DonorFormValues } from "@/lib/validations/donor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { donorTypeLabels, donorTierLabels } from "@/types/donor";
import { DonorType, DonorTier } from "@prisma/client";

interface DonorFormProps {
  defaultValues?: Partial<DonorFormValues>;
  onSubmit: (values: DonorFormValues) => void;
  isLoading?: boolean;
}

const areasOfInterestOptions = [
  "Thiết bị y tế",
  "Thuốc men",
  "Hỗ trợ bệnh nhân nghèo",
  "Xây dựng cơ sở vật chất",
  "Đào tạo y bác sĩ",
  "Y tế cộng đồng",
  "Chăm sóc trẻ em",
  "Chăm sóc người cao tuổi",
];

export function DonorForm({ defaultValues, onSubmit, isLoading }: DonorFormProps) {
  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorSchema) as any,
    defaultValues: {
      fullName: "",
      isAnonymous: false,
      email: "",
      phone: "",
      address: "",
      type: "INDIVIDUAL",
      tier: "NEW",
      occupation: "",
      company: "",
      position: "",
      birthday: null,
      firstDonationDate: null,
      personalInterests: "",
      areasOfInterest: [],
      notes: "",
      isPatient: false,
      isPatientFamily: false,
      contactMethod: "",
      contactName: "",
      ...defaultValues,
    },
  });

  const isAnonymous = form.watch("isAnonymous");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Mạnh thường quân giấu tên */}
        <FormField
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 rounded-lg border p-4 bg-amber-50 border-amber-200">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div>
                <FormLabel className="text-base font-medium cursor-pointer">
                  Mạnh thường quân giấu tên
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Tích vào nếu người tài trợ không muốn tiết lộ danh tính. Hệ thống sẽ tự cấp mã định danh (Mạnh thường quân 01, 02,...).
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin cơ bản</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAnonymous ? "Họ tên (tuỳ chọn)" : "Họ tên *"}</FormLabel>
                  <FormControl>
                    <Input placeholder={isAnonymous ? "Để trống nếu không muốn ghi" : "Nguyễn Văn A"} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(donorTypeLabels).map(([key, label]) => (
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

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cấp độ *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn cấp độ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(donorTierLabels).map(([key, label]) => (
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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      {...field}
                      value={field.value || ""}
                    />
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
                    <Input
                      placeholder="0901234567"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem className="flex flex-col justify-end">
              <FormLabel>Phân loại</FormLabel>
              <div className="flex items-center gap-4 h-10">
                <FormField
                  control={form.control}
                  name="isPatient"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm">Người bệnh</span>
                    </label>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPatientFamily"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm">Người nhà người bệnh</span>
                    </label>
                  )}
                />
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phương thức liên lạc</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Zalo, Facebook, Viber..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tài khoản liên lạc</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Nguyễn Văn A (Zalo)" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123 Lê Lợi, Quận 1, TP.HCM"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Thông tin nghề nghiệp - ẩn khi giấu tên */}
        {!isAnonymous && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Thông tin nghề nghiệp</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nghề nghiệp</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doanh nhân"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Công ty</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC Corp"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chức vụ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CEO"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Ngày tháng - ẩn khi giấu tên */}
        {!isAnonymous && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Ngày quan trọng</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày sinh</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value || undefined}
                        onChange={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        placeholder="Chọn ngày sinh"
                        yearRange={{ start: 1940, end: new Date().getFullYear() }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstDonationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày tài trợ lần đầu</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value || undefined}
                        onChange={field.onChange}
                        disabled={(date) => date > new Date()}
                        placeholder="Chọn ngày"
                        yearRange={{ start: 2000, end: new Date().getFullYear() }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Sở thích và ghi chú */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin bổ sung</h3>

          {!isAnonymous && (
            <FormField
              control={form.control}
              name="personalInterests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sở thích cá nhân</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Golf, du lịch, từ thiện..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ghi chú về nhà tài trợ..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Thông tin nội bộ, không hiển thị với nhà tài trợ
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
