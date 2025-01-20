"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SignupStep } from "@/components/survey-steps/signup-step"
import { EmailStep } from "@/components/survey-steps/email-step"
import { SlackStep } from "@/components/survey-steps/slack-step"
import { SuccessStep } from "@/components/survey-steps/success-step"
import { useApi } from "@/hooks/useApi"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    email: ""
  })
  const router = useRouter()
  const { apiCall } = useApi()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    setStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    try {
      const { data, error } = await apiCall<{ message: string }>(
        '/api/v1/accounts/',
        'POST',
        {
          username: formData.username,
          password: formData.password,
          password2: formData.passwordConfirm,
          email: formData.email
        }
      )

      if (error) {
        console.error('회원가입 실패:', error)
        // 에러 처리 로직 추가
      } else if (data) {
        handleNext() // 성공 화면으로 이동
      }
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error)
      // 에러 처리 로직 추가
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <Card className="max-w-md mx-auto p-6 space-y-6">
        <Progress value={step * 100 / 4} className="h-2" />
        <div className="text-sm text-center">
          {step} / {4}
        </div>

        {step === 1 && (
          <SignupStep
            values={{
              username: formData.username,
              password: formData.password,
              passwordConfirm: formData.passwordConfirm
            }}
            onChange={handleChange}
            onNext={handleNext}
          />
        )}

        {step === 2 && (
          <EmailStep
            value={formData.email}
            onChange={(value) => handleChange("email", value)}
            onNext={handleNext}
          />
        )}

        {step === 3 && (
          <SlackStep
            email={formData.email}
            onSubmit={handleSubmit}
          />
        )}

        {step === 4 && (
          <SuccessStep
            onLogin={() => router.push('/login')}
          />
        )}
      </Card>
    </div>
  )
}
