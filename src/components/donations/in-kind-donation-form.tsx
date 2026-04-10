"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inKindDonationSchema, InKindDonationFormValues, inKindCategoryLabels, itemConditionLabels } from "@/lib/validations/donation";

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
import { Label } from "@/components/ui/label";
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

interface InKindDonationFormProps {
  defaultValues?: Partial<InKindDonationFormValues> & { items?: any[] };
  onSubmit: (values: any) => void;
  isLoading?: boolean;
}

type ItemRow = { name: string; quantity: string; unit: string };

export function InKindDonationForm({ defaultValues, onSubmit, isLoading }: InKindDonationFormProps) {
  const [donorSearchOpen, setDonorSearchOpen] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  // Danh sách các món trong gói tài trợ
  const initItems = (): ItemRow[] => {
    // Nếu có items array → dùng luôn
    if (defaultValues?.items && Array.isArray(defaultValues.items) && defaultValues.items.length > 0) {
      return defaultValues.items.map((i: any) => ({
        name: i.name || "", quantity: String(i.quantity || ""), unit: i.unit || "",
      }));
    }
    // Nếu có itemName cũ → convert thành 1 item
    if (defaultValues?.itemName) {
      return [{
        name: defaultValues.itemName,
        quantity: String(defaultValues.quantity || ""),
        unit: defaultValues.unit || "",
      }];
    }
    return [{ name: "", quantity: "", unit: "" }];
  };

  const [itemRows, setItemRows] = useState<ItemRow[]>(initItems);

  const form = useForm<InKindDonationFormValues>({
    resolver: zodResolver(inKindDonationSchema),
    defaultValues: {
      donorId: "",
      itemName: defaultValues?.itemName || "—",
      category: "MEDICAL_EQUIPMENT",
      quantity: defaultValues?.quantity || 1,
      unit: defaultValues?.unit || "—",
      condition: "NEW",
      receivedDate: new Date(),
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
    const validItems = itemRows.filter((i) => i.name.trim());
    if (validItems.length === 0) return;

    // itemName, quantity, unit = tổng hợp từ items (để backward compatible với DB)
    const itemsSummary = validItems.map((i) => `${i.name} x${i.quantity} ${i.unit}`).join(", ");
    const totalQty = validItems.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);
    const firstUnit = validItems[0]?.unit || "món";

    const items = validItems.map((i) => ({
      name: i.name,
      quantity: parseInt(i.quantity) || 0,
      unit: i.unit,
    }));

    onSubmit({
      ...values,
      itemName: itemsSummary,
      quantity: totalQty,
      unit: validItems.length === 1 ? firstUnit : "món",
      items,
    });
  };

  const addItem = () => {
    setItemRows((prev) => [...prev, { name: "", quantity: "", unit: "" }]);
  };

  const updateItem = (idx: number, field: string, value: string) => {
    setItemRows((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const removeItem = (idx: number) => {
    if (itemRows.length <= 1) return;
    setItemRows((prev) => prev.filter((_, i) => i !== idx));
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

        {/* Danh sách vật phẩm trong gói */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Danh sách vật phẩm</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />Thêm món
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Liệt kê tất cả các món trong gói tài trợ</p>

          {itemRows.map((item, idx) => (
            <div key={idx} className="flex items-end gap-2 p-3 border rounded-md bg-muted/30">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Tên vật phẩm</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  placeholder="VD: Mì tôm, Nước suối..."
                  className="h-9"
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs">Số lượng</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  placeholder="500"
                  className="h-9"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label className="text-xs">Đơn vị</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(idx, "unit", e.target.value)}
                  placeholder="thùng, hộp..."
                  className="h-9"
                />
              </div>
              {itemRows.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-500 shrink-0" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Danh mục + Tình trạng + Giá trị */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin chung</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
                  <FormLabel>Tổng giá trị ước tính (VNĐ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Giá trị toàn bộ gói"
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
              name="receivedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày nhận tài trợ *</FormLabel>
                  <FormControl>
                    <DateInput
                      value={field.value || undefined}
                      onChange={field.onChange}
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
              <FormLabel>Hình ảnh</FormLabel>
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
                  placeholder="Ghi chú thêm..."
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
