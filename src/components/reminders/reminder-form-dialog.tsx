"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

const reminderSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  description: z.string().optional(),
  type: z.enum(["BIRTHDAY", "DONATION_ANNIVERSARY", "SEND_REPORT", "FOLLOW_UP", "OTHER"]),
  dueDate: z.date(),
  donorId: z.string().optional(),
});

export type ReminderFormValues = z.infer<typeof reminderSchema>;

const reminderTypeLabels = {
  BIRTHDAY: "Sinh nhật",
  DONATION_ANNIVERSARY: "Kỷ niệm tài trợ",
  SEND_REPORT: "Gửi báo cáo",
  FOLLOW_UP: "Theo dõi",
  OTHER: "Khác",
};

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ReminderFormValues) => void;
  isLoading?: boolean;
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ReminderFormDialogProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "FOLLOW_UP",
      dueDate: new Date(),
      donorId: undefined,
    },
  });

  const { data: donorsData } = useQuery({
    queryKey: ["donors-search", donorSearch],
    queryFn: async () => {
      const res = await fetch(`/api/donors?search=${donorSearch}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch donors");
      return res.json();
    },
    enabled: open,
  });

  const selectedDonorId = form.watch("donorId");
  const selectedDonor = donorsData?.donors?.find((d: any) => d.id === selectedDonorId);

  const handleSubmit = (values: ReminderFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo nhắc nhở mới</DialogTitle>
          <DialogDescription>
            Tạo nhắc nhở cho các công việc và sự kiện liên quan đến nhà tài trợ
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Gửi email chúc mừng sinh nhật" {...field} />
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
                  <FormLabel>Loại nhắc nhở *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại nhắc nhở" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(reminderTypeLabels).map(([key, label]) => (
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày đến hạn *</FormLabel>
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
              name="donorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhà tài trợ (tùy chọn)</FormLabel>
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
                      <Command>
                        <CommandInput
                          placeholder="Tìm nhà tài trợ..."
                          value={donorSearch}
                          onValueChange={setDonorSearch}
                        />
                        <CommandEmpty>Không tìm thấy</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="NO_DONOR"
                            onSelect={() => {
                              field.onChange(undefined);
                              setDonorSearchOpen(false);
                            }}
                          >
                            <span className="text-muted-foreground">Không chọn nhà tài trợ</span>
                          </CommandItem>
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả (tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú chi tiết về nhắc nhở này..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Tạo nhắc nhở"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
