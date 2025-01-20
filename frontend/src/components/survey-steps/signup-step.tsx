"use client"

import { useState } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SignupStepProps {
  values: {
    username: string
    password: string
    passwordConfirm: string
  }
  onChange: (field: string, value: string) => void
  onNext: () => void
}

export function SignupStep({ values, onChange, onNext }: SignupStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const isValid = 
    values.username.trim() !== "" && 
    values.password.length >= 8 &&
    values.password === values.passwordConfirm

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">회원가입</h1>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">사용자 이름</Label>
          <Input
            id="username"
            className="bg-background border-None"
            placeholder="ex) username"
            value={values.username}
            onChange={(e) => onChange("username", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              className="bg-background border-None"
              type={showPassword ? "text" : "password"}
              placeholder="ex) qwer1234"
              value={values.password}
              onChange={(e) => onChange("password", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">영문 및 숫자, 8자 이상</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
          <div className="relative">
            <Input
              id="passwordConfirm"
              className="bg-background border-None"
              type={showPasswordConfirm ? "text" : "password"}
              value={values.passwordConfirm}
              onChange={(e) => onChange("passwordConfirm", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            >
              {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">위에서 입력한 비밀번호 다시 입력</p>
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
