"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "default";
}

/**
 * Ô nhập ngày kết hợp: gõ tay (dd-mm-yyyy) hoặc chọn từ calendar.
 * Dùng thay thế cho pattern Popover + Calendar thủ công trong các form.
 */
export function DateInput({
  value,
  onChange,
  disabled,
  placeholder = "dd-mm-yyyy",
  className,
  inputClassName,
  size = "default",
}: DateInputProps) {
  const [inputText, setInputText] = React.useState(
    value ? format(value, "dd-MM-yyyy") : ""
  );
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value || new Date());

  React.useEffect(() => {
    setInputText(value ? format(value, "dd-MM-yyyy") : "");
    if (value) setMonth(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9]/g, "");
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

  const isSmall = size === "sm";

  return (
    <div className={cn("flex gap-1", className)}>
      <Input
        value={inputText}
        onChange={handleInputChange}
        placeholder={placeholder}
        maxLength={10}
        className={cn(isSmall && "h-9 text-xs", inputClassName)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={isSmall ? "sm" : "icon"}
            className={cn("shrink-0", isSmall && "h-9 w-9 px-0")}
          >
            <CalendarIcon className={cn("h-4 w-4", isSmall && "h-3 w-3")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
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
