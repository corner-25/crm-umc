"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, MedicationFormValues } from "@/lib/validations/cancer-support";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { sponsorPolicyLabels } from "@/types/cancer-support";
import { SponsorPolicy } from "@prisma/client";
import { useEffect, useState } from "react";

interface Sponsor {
  id: string;
  fullName: string;
  company: string | null;
  type: string;
}

interface MedicationFormProps {
  defaultValues?: Partial<MedicationFormValues>;
  onSubmit: (values: MedicationFormValues) => void;
  isLoading?: boolean;
}

export function MedicationForm({ defaultValues, onSubmit, isLoading }: MedicationFormProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      description: "",
      unitPrice: 0,
      cycleDays: 14,
      sponsorPolicy: "BUY_1_GET_1",
      sponsorIds: [],
      ...defaultValues,
    },
  });

  useEffect(() => {
    // Fetch donors/sponsors
    fetch("/api/donors?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setSponsors(data.donors || []);
        setLoadingSponsors(false);
      })
      .catch((error) => {
        console.error("Error fetching sponsors:", error);
        setLoadingSponsors(false);
      });
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin Thuốc</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên thuốc *</FormLabel>
                <FormControl>
                  <Input placeholder="Herceptin" {...field} />
                </FormControl>
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
                  <Textarea
                    placeholder="Mô tả về thuốc..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn giá (VNĐ) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="15000000"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cycleDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chu kỳ (ngày) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="14"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Số ngày cho mỗi chu kỳ điều trị
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="sponsorPolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chính sách tài trợ *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chính sách" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(sponsorPolicyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
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
            name="sponsorIds"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Nhà tài trợ</FormLabel>
                  <FormDescription>
                    Chọn các công ty/tổ chức tài trợ cho loại thuốc này
                  </FormDescription>
                </div>
                {loadingSponsors ? (
                  <div className="text-sm text-muted-foreground">Đang tải...</div>
                ) : sponsors.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Chưa có nhà tài trợ nào. Vui lòng thêm nhà tài trợ trước.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sponsors.map((sponsor) => (
                      <FormField
                        key={sponsor.id}
                        control={form.control}
                        name="sponsorIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={sponsor.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sponsor.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), sponsor.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== sponsor.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal cursor-pointer">
                                  {sponsor.fullName}
                                </FormLabel>
                                {sponsor.company && (
                                  <p className="text-sm text-muted-foreground">
                                    {sponsor.company}
                                  </p>
                                )}
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu thuốc"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
