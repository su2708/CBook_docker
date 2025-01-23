import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/time-picker"

interface EditReminderModalProps {
  reminderSettings: {
    start_hour: number
    start_minute: number
    end_hour: number
    end_minute: number
  }
  onClose: () => void
  onSave: (newSettings: {
    start_hour: number
    start_minute: number
    end_hour: number
    end_minute: number
  }) => void
}

export function EditReminderModal({ reminderSettings, onClose, onSave }: EditReminderModalProps) {
  const [newSettings, setNewSettings] = useState(reminderSettings)

  const handleSave = () => {
    onSave(newSettings)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>알림 시간 수정</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4 justify-center">
            <span>시작</span>
            <TimePicker
              value={`${newSettings.start_hour.toString().padStart(2, "0")}:${newSettings.start_minute.toString().padStart(2, "0")}`}
              onChange={(time) => {
                const [hour, minute] = time.split(":").map(Number)
                setNewSettings((prev) => ({ ...prev, start_hour: hour, start_minute: minute }))
              }}
            />
            <span>종료</span>
            <TimePicker
              value={`${newSettings.end_hour.toString().padStart(2, "0")}:${newSettings.end_minute.toString().padStart(2, "0")}`}
              onChange={(time) => {
                const [hour, minute] = time.split(":").map(Number)
                setNewSettings((prev) => ({ ...prev, end_hour: hour, end_minute: minute }))
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            취소
          </Button>
          <Button onClick={handleSave}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
