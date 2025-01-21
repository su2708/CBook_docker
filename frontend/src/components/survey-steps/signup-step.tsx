"use client"

import { useState } from "react"
import { Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi } from "@/hooks/useApi"

interface SignupStepProps {
  values: {
    username: string
    password: string
    passwordConfirm: string
  }
  onChange: (field: string, value: string) => void
  onNext: () => void
}

interface ValidationResult {
  isValid: boolean
  message: string
}

export function SignupStep({ values, onChange, onNext }: SignupStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [validationResults, setValidationResults] = useState<{ [key: string]: ValidationResult }>({
    username: { isValid: false, message: "" },
    password: { isValid: false, message: "" },
  })
  const { apiCall } = useApi()

  const isValid =
    validationResults.username.isValid &&
    validationResults.password.isValid &&
    values.password === values.passwordConfirm

  const validateField = async (field: string) => {
    try {
      const { error, data } = await apiCall<{ [key: string]: string[] }>("/api/v1/accounts/", "POST", {
        [field]: values[field as keyof typeof values],
      })

      if (data && !(field in data)) {
        setValidationResults((prev) => ({
          ...prev,
          [field]: { isValid: true, message: "유효성 검사를 통과했습니다." },
        }))
      } else if (data && field in data) {
        setValidationResults((prev) => ({
          ...prev,
          [field]: { isValid: false, message: data[field][0] },
        }))
      } else if (error) {
        console.log(data)
        console.error(`유효성 검사 실패: ${field}`)
        setValidationResults((prev) => ({
          ...prev,
          [field]: { isValid: false, message: "서버 오류가 발생했습니다." },
        }))
      }
    } catch (error) {
      console.error(`유효성 검사 중 오류 발생: ${field}`, error)
      setValidationResults((prev) => ({
        ...prev,
        [field]: { isValid: false, message: "오류가 발생했습니다. 다시 시도해 주세요." },
      }))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">회원가입</h1>
      <p className="text-sm text-gray-500 text-center">사용자 이름과 비밀번호를 입력 후 <br />각각 체크 표시를 눌러 주세요.</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="username">사용자 이름</Label>
            <span className="text-sm text-gray-500">(한글도 가능)</span>
          </div>
          <div className="relative">
            <Input
              id="username"
              className="bg-background border-None pr-10"
              placeholder="ex) username"
              value={values.username}
              onChange={(e) => onChange("username", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => validateField("username")}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
          {validationResults.username.message && (
            <p className={`text-xs ${validationResults.username.isValid ? "text-green-500" : "text-rose-500"}`}>
              {validationResults.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">비밀번호</Label>
            <span className="text-sm text-gray-500">(영문 및 숫자, 8자 이상)</span>
          </div>
          <div className="relative">
            <Input
              id="password"
              className="bg-background border-None pr-20"
              type={showPassword ? "text" : "password"}
              placeholder="ex) qwer1234"
              value={values.password}
              onChange={(e) => onChange("password", e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-10 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => validateField("password")}
            >
              <Check className="h-4 w-4" />
            </Button>
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
          {validationResults.password.message && (
            <p className={`text-xs ${validationResults.password.isValid ? "text-green-500" : "text-red-500"}`}>
              {validationResults.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <span className="text-sm text-gray-500">(비밀번호 한 번 더 입력)</span>
          </div>
          <div className="relative">
            <Input
              id="passwordConfirm"
              className="bg-background border-None pr-10"
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
          {values.password !== values.passwordConfirm && values.passwordConfirm !== "" && (
            <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
          )}
        </div>
      </div>

      <Button className="w-full py-6 text-lg" onClick={onNext} disabled={!isValid}>
        다음
      </Button>
    </div>
  )
}
