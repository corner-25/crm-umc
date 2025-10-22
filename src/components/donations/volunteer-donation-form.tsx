"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volunteerDonationSchema, VolunteerDonationFormValues, volunteerWorkTypeLabels } from "@/lib/validations/donation";

// Re-export types for external use
export type { VolunteerDonationFormValues };
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface VolunteerDonationFormProps {
  defaultValues?: Partial<VolunteerDonationFormValues>;
  onSubmit: (values: VolunteerDonationFormValues) => void;
  isLoading?: boolean;
}

export function VolunteerDonationForm({ defaultValues, onSubmit, isLoading }: VolunteerDonationFormProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  const form = useForm<VolunteerDonationFormValues>({
    resolver: zodResolver(volunteerDonationSchema),
    defaultValues: {
      donorId: "",
      workType: "MEDICAL",
      skills: "",
      startDate: new Date(),
      endDate: new Date(),
      hours: defaultValues?.hours || undefined,
      hourlyRate: defaultValues?.hourlyRate || 100000,
      rating: null,
      reviewNotes: "",
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

  // Watch hours and hourlyRate to calculate total
  const hours = form.watch("hours");
  const hourlyRate = form.watch("hourlyRate");
  const totalValue = Number(hours) * Number(hourlyRate);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Chọn tình nguyện viên */}
        <FormField
          control={form.control}
          name="donorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tình nguyện viên *</FormLabel>
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
                      {selectedDonor ? selectedDonor.fullName : "Chọn tình nguyện viên"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Tìm tình nguyện viên..."
                      value={donorSearch}
                      onValueChange={setDonorSearch}
                    />
                    <CommandEmpty>Không tìm thấy</CommandEmpty>
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

        {/* Thông tin công việc */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin công việc</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="workType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại công việc *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại công việc" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(volunteerWorkTypeLabels).map(([key, label]) => (
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

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kỹ năng/Chuyên môn *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Bác sĩ tim mạch, 15 năm kinh nghiệm..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Thời gian */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thời gian</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày bắt đầu *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày kết thúc *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số giờ *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="40"
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
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá trị quy đổi/giờ (VNĐ) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Tổng giá trị quy đổi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalValue)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Đánh giá */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Đánh giá (tùy chọn)</h3>

          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đánh giá (1-5 sao)</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => field.onChange(star)}
                        className="text-2xl"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8",
                            field.value && star <= field.value
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reviewNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú đánh giá</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Nhận xét về công việc tình nguyện..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
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
