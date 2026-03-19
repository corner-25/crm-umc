"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  yearRange?: { start: number; end: number };
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "dd-mm-yyyy",
  className,
  yearRange,
}: DatePickerProps) {
  const [inputText, setInputText] = React.useState(
    value ? format(value, "dd-MM-yyyy") : ""
  );
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value || new Date());

  // Sync inputText khi value thay đổi từ bên ngoài
  React.useEffect(() => {
    setInputText(value ? format(value, "dd-MM-yyyy") : "");
    if (value) setMonth(value);
  }, [value]);

  const currentYear = new Date().getFullYear();
  const startYear = yearRange?.start || 1940;
  const endYear = yearRange?.end || currentYear;
  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse();
  const months = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, "");
    // Auto-insert dashes: dd-mm-yyyy
    if (raw.length > 2) raw = raw.slice(0, 2) + "-" + raw.slice(2);
    if (raw.length > 5) raw = raw.slice(0, 5) + "-" + raw.slice(5);
    raw = raw.slice(0, 10);
    setInputText(raw);

    if (raw.length === 10) {
      const parsed = parse(raw, "dd-MM-yyyy", new Date());
      if (isValid(parsed)) {
        onChange(parsed);
        setMonth(parsed);
      }
    } else if (raw.length === 0) {
      onChange(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setInputText(format(date, "dd-MM-yyyy"));
      setMonth(date);
    }
    setOpen(false);
  };

  return (
    <div className={cn("flex gap-1", className)}>
      <Input
        value={inputText}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex items-center justify-between gap-2 border-b p-3">
            <Select
              value={month.getMonth().toString()}
              onValueChange={(v) => {
                const d = new Date(month);
                d.setMonth(parseInt(v));
                setMonth(d);
              }}
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={month.getFullYear().toString()}
              onValueChange={(v) => {
                const d = new Date(month);
                d.setFullYear(parseInt(v));
                setMonth(d);
              }}
            >
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
