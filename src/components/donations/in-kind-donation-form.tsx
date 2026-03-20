"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inKindDonationSchema, InKindDonationFormValues, inKindCategoryLabels, itemConditionLabels } from "@/lib/validations/donation";

// Re-export types for external use
export type { InKindDonationFormValues };
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
import { CustomOptionSelect } from "@/components/ui/custom-option-select";

interface InKindDonationFormProps {
  defaultValues?: Partial<InKindDonationFormValues> & { items?: any[] };
  onSubmit: (values: any) => void;
  isLoading?: boolean;
}

export function InKindDonationForm({ defaultValues, onSubmit, isLoading }: InKindDonationFormProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");
  // Extra items (ngoài itemName chính)
  const [extraItems, setExtraItems] = useState<{ name: string; quantity: string; unit: string }[]>(
    defaultValues?.items && Array.isArray(defaultValues.items) && defaultValues.items.length > 0
      ? defaultValues.items.map((i: any) => ({ name: i.name || "", quantity: String(i.quantity || ""), unit: i.unit || "" }))
      : []
  );

  const form = useForm<InKindDonationFormValues>({
    resolver: zodResolver(inKindDonationSchema),
    defaultValues: {
      donorId: "",
      itemName: "",
      category: "MEDICAL_EQUIPMENT",
      quantity: defaultValues?.quantity || undefined,
      unit: "",
      condition: "NEW",
      expiryDate: null,
      estimatedValue: defaultValues?.estimatedValue || undefined,
      imageUrls: [],
      receivingLocation: "",
      storageLocation: "",
      usedQuantity: 0,
      usedPurpose: "",
      distributionStatus: "PENDING",
      notes: "",
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

  const handleFormSubmit = (values: InKindDonationFormValues) => {
    // Gắn extraItems vào data
    const items = extraItems
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name, quantity: parseInt(i.quantity) || 0, unit: i.unit }));
    onSubmit({ ...values, items });
  };

  const addExtraItem = () => {
    setExtraItems((prev) => [...prev, { name: "", quantity: "", unit: "" }]);
  };

  const updateExtraItem = (idx: number, field: string, value: string) => {
    setExtraItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeExtraItem = (idx: number) => {
    setExtraItems((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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

        {/* Thông tin vật phẩm chính */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Vật phẩm chính</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên vật phẩm *</FormLabel>
                  <FormControl>
                    <Input placeholder="Máy thở hô hấp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh mục *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(inKindCategoryLabels).map(([key, label]) => (
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đơn vị tính *</FormLabel>
                  <FormControl>
                    <Input placeholder="cái, hộp, kg..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Extra items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Vật phẩm kèm theo</h3>
            <Button type="button" variant="outline" size="sm" onClick={addExtraItem}>
              <Plus className="h-4 w-4 mr-1" />Thêm món
            </Button>
          </div>
          {extraItems.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có vật phẩm kèm theo. Bấm "Thêm món" nếu đợt tài trợ có nhiều món đồ khác nhau.</p>
          )}
          {extraItems.map((item, idx) => (
            <div key={idx} className="flex items-end gap-2 p-3 border rounded-md bg-muted/30">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Tên</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateExtraItem(idx, "name", e.target.value)}
                  placeholder="Tên vật phẩm"
                  className="h-8 text-sm"
                />
              </div>
              <div className="w-20 space-y-1">
                <Label className="text-xs">Số lượng</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateExtraItem(idx, "quantity", e.target.value)}
                  placeholder="0"
                  className="h-8 text-sm"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Đơn vị</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateExtraItem(idx, "unit", e.target.value)}
                  placeholder="cái, hộp..."
                  className="h-8 text-sm"
                />
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeExtraItem(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Thông tin bổ sung */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin bổ sung</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tình trạng *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tình trạng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(itemConditionLabels).map(([key, label]) => (
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
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá trị ước tính (VNĐ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Tổng giá trị tất cả vật phẩm"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạn sử dụng</FormLabel>
                  <FormControl>
                    <DateInput
                      value={field.value || undefined}
                      onChange={field.onChange}
                      disabled={(date) => date < new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Địa điểm */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Địa điểm</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="receivingLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa điểm nhận *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kho tổng - Tầng 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kho lưu trữ *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kho B - Tầng 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Upload hình ảnh */}
        <FormField
          control={form.control}
          name="imageUrls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hình ảnh vật phẩm</FormLabel>
              <FormControl>
                <ImageUpload
                  value={field.value || []}
                  onChange={field.onChange}
                  multiple={true}
                  maxSize={5}
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
                <Textarea
                  placeholder="Ghi chú thêm về hiện vật..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
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
