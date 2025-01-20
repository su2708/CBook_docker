"use client"

import * as React from "react"
import { Clock } from 'lucide-react'
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  label: string;
  value?: string;
  onChange: (time: string) => void;
}

export function TimePicker({ label, value, onChange }: TimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<string>(value || "12:00");

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    onChange(newTime);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[120px] justify-start text-left font-normal",
            !selectedTime && "text-muted-foreground"
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {selectedTime || "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-2">
          <Label htmlFor={`${label}-time-picker`}>{label}</Label>
          <Input
            id={`${label}-time-picker`}
            type="time"
            value={selectedTime}
            onChange={handleTimeChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
