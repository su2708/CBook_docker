"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { SignupStep } from "@/components/survey-steps/signup-step"
import { EmailStep } from "@/components/survey-steps/email-step"
import { SlackStep } from "@/components/survey-steps/slack-step"
import { SuccessStep } from "@/components/survey-steps/success-step"
import { useApi } from "@/hooks/useApi"
import { ChevronLeft } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    email: "",
  })
  const router = useRouter()
  const { apiCall } = useApi()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async () => {
    try {
      const { data, error } = await apiCall<{ message: string }>("/api/v1/accounts/", "POST", {
        username: formData.username,
        password: formData.password,
        password2: formData.passwordConfirm,
        email: formData.email,
      })

      if (error) {
        console.error("회원가입 실패:", error)
        // 에러 처리 로직 추가
      } else if (data) {
        handleNext() // 성공 화면으로 이동
      }
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error)
      // 에러 처리 로직 추가
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <Progress value={(step * 100) / 4} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          {step > 1 && step < 4 ? (
            <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
          ) : (
            <div></div> // Empty div to maintain layout when there's no back button
          )}
          <div className="mr-4">
            {step} / {4}
          </div>
        </div>

        {step === 1 && (
          <SignupStep
            values={{
              username: formData.username,
              password: formData.password,
              passwordConfirm: formData.passwordConfirm,
            }}
            onChange={handleChange}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <EmailStep value={formData.email} onChange={(value) => handleChange("email", value)} onNext={handleNext} />
        )}

        {step === 3 && <SlackStep email={formData.email} onSubmit={handleSubmit} />}

        {step === 4 && <SuccessStep onLogin={() => router.push("/login")} />}
      </Card>
    </div>
  )
}
