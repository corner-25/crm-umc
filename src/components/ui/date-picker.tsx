"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  placeholder = "Chọn ngày",
  className,
  yearRange,
}: DatePickerProps) {
  const [month, setMonth] = React.useState<Date>(value || new Date());

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
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthIndex));
    setMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <Select
            value={month.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={month}
          onMonthChange={setMonth}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
