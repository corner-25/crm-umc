"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const emailTemplateSchema = z.object({
  name: z.string().min(1, "Tên mẫu email là bắt buộc"),
  type: z.enum(["THANK_YOU", "RECEIPT", "BIRTHDAY", "ANNIVERSARY", "REMINDER", "NEWSLETTER"]),
  subject: z.string().min(1, "Tiêu đề email là bắt buộc"),
  body: z.string().min(10, "Nội dung email phải có ít nhất 10 ký tự"),
  description: z.string().optional(),
});

export type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;

const templateTypeLabels = {
  THANK_YOU: "Cảm ơn",
  RECEIPT: "Biên nhận",
  BIRTHDAY: "Sinh nhật",
  ANNIVERSARY: "Kỷ niệm",
  REMINDER: "Nhắc nhở",
  NEWSLETTER: "Bản tin",
};

const availableVariables = [
  { key: "{tên}", description: "Tên nhà tài trợ" },
  { key: "{số_tiền}", description: "Số tiền quyên góp" },
  { key: "{ngày}", description: "Ngày quyên góp" },
  { key: "{loại_tài_trợ}", description: "Loại tài trợ (tiền mặt, hiện vật, tình nguyện)" },
  { key: "{tổng_quyên_góp}", description: "Tổng số tiền đã quyên góp" },
  { key: "{hạng}", description: "Hạng nhà tài trợ (VIP, Regular, v.v.)" },
];

interface EmailTemplateFormProps {
  defaultValues?: Partial<EmailTemplateFormValues>;
  onSubmit: (values: EmailTemplateFormValues) => void;
  isLoading?: boolean;
}

export function EmailTemplateForm({ defaultValues, onSubmit, isLoading }: EmailTemplateFormProps) {
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: "",
      type: "THANK_YOU",
      subject: "",
      body: "",
      description: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Biến số có thể sử dụng trong email:</p>
            <div className="grid gap-1 text-sm">
              {availableVariables.map((variable) => (
                <div key={variable.key} className="flex gap-2">
                  <code className="bg-muted px-1 rounded">{variable.key}</code>
                  <span className="text-muted-foreground">- {variable.description}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên mẫu email *</FormLabel>
              <FormControl>
                <Input placeholder="VD: Email cảm ơn nhà tài trợ VIP" {...field} />
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
              <FormLabel>Loại mẫu email *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại mẫu email" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(templateTypeLabels).map(([key, label]) => (
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Input placeholder="Mô tả ngắn về mẫu email này" {...field} />
              </FormControl>
              <FormDescription>
                Giúp phân biệt các mẫu email cùng loại
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề email *</FormLabel>
              <FormControl>
                <Input
                  placeholder="VD: Cảm ơn {tên} đã đồng hành cùng bệnh viện"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Có thể sử dụng các biến số như {"{tên}"}, {"{số_tiền}"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung email *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Kính gửi {tên},

Bệnh viện chúng tôi xin chân thành cảm ơn sự đóng góp {số_tiền} vào ngày {ngày}.

Sự hỗ trợ của quý vị đã giúp chúng tôi...

Trân trọng,
Bệnh viện`}
                  rows={12}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Sử dụng các biến số để tự động điền thông tin nhà tài trợ
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu mẫu email"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
