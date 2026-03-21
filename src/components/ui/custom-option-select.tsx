"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Plus, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomOptionSelectProps {
  type: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  protectedValues?: string[];
  multiple?: boolean;
}

export function CustomOptionSelect({ type, value, onChange, placeholder = "Chọn hoặc thêm mới...", disabled, protectedValues = [], multiple = false }: CustomOptionSelectProps) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const queryClient = useQueryClient();

  // Normalize value for multi-select
  const selectedValues: string[] = multiple
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : [];

  const toggleValue = (label: string) => {
    if (!multiple) return;
    const newValues = selectedValues.includes(label)
      ? selectedValues.filter(v => v !== label)
      : [...selectedValues, label];
    (onChange as (value: string[]) => void)(newValues);
  };

  const { data: options = [] } = useQuery<{ id: string; label: string }[]>({
    queryKey: ["custom-options", type],
    queryFn: async () => {
      const res = await fetch(`/api/custom-options?type=${type}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (label: string) => {
      const res = await fetch("/api/custom-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: (newOption) => {
      queryClient.invalidateQueries({ queryKey: ["custom-options", type] });
      if (multiple) {
        (onChange as (value: string[]) => void)([...selectedValues, newOption.label]);
      } else {
        (onChange as (value: string) => void)(newOption.label);
      }
      setNewLabel("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/custom-options/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-options", type] });
    },
  });

  const handleAdd = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", (!value || (Array.isArray(value) && value.length === 0)) && "text-muted-foreground")}
        >
          <span className="truncate">
            {multiple
              ? (selectedValues.length > 0 ? selectedValues.join(", ") : placeholder)
              : (value || placeholder)}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Tìm..." value={newLabel} onValueChange={setNewLabel} />
          <CommandList>
            <CommandEmpty>
              <span className="text-sm text-muted-foreground">Không có kết quả</span>
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter(o => !newLabel || o.label.toLowerCase().includes(newLabel.toLowerCase()))
                .map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      if (multiple) {
                        toggleValue(option.label);
                      } else {
                        (onChange as (value: string) => void)(option.label);
                        setOpen(false);
                        setNewLabel("");
                      }
                    }}
                    className="flex items-center justify-between pr-1"
                  >
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", (multiple ? selectedValues.includes(option.label) : value === option.label) ? "opacity-100" : "opacity-0")} />
                      {option.label}
                    </div>
                    {!protectedValues.includes(option.label) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(option.id); }}
                        className="ml-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <div className="flex gap-1 p-1">
                <Input
                  placeholder="Thêm mục mới..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                  className="h-7 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={handleAdd}
                  disabled={!newLabel.trim() || addMutation.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
