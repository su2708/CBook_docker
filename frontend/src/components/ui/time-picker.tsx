"use client"

import * as React from "react"
import { Label } from "./label"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  maxTime?: string
  minTime?: string
}

export function TimePicker({ value, onChange, maxTime, minTime }: TimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<string>(value || "12:00")
  const [open, setOpen] = React.useState(false)

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    if ((minTime && newTime < minTime) || (maxTime && newTime > maxTime)) {
      return
    }
    setSelectedTime(newTime)
    onChange(newTime)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[90px] justify-center text-center font-normal", !selectedTime && "text-muted-foreground")}
        >
          {selectedTime || "시간 선택"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div className="p-4 space-y-2">
          <Label htmlFor="time-picker">시간 선택</Label>
          <Input
            id="time-picker"
            type="time"
            value={selectedTime}
            onChange={handleTimeChange}
            min={minTime}
            max={maxTime}
            className="text-center"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
