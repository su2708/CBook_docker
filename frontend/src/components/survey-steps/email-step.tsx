"use client"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface EmailStepProps {
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

export function EmailStep({ value, onChange, onNext }: EmailStepProps) {
  const isValidEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(email)
  }

  const isValid = isValidEmail(value)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">이메일 입력</h1>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            className="bg-background border-None"
            placeholder="example@email.com"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>

      <Button 
        className="w-full py-6 text-lg"
        onClick={onNext}
        disabled={!isValid}
      >
        다음
      </Button>
    </div>
  )
}
