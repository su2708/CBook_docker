"use client"

import { Button } from "@/components/ui/button"

interface SuccessStepProps {
  onLogin: () => void
}

export function SuccessStep({ onLogin }: SuccessStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">회원가입 완료</h1>
      
      <div className="space-y-4">
        <p>
          회원가입이 성공적으로 완료되었습니다.
        </p>
        <p>
          로그인 화면으로 이동하여 로그인해주세요.
        </p>
      </div>

      <Button 
        className="w-full py-6 text-lg"
        onClick={onLogin}
      >
        로그인 화면으로 돌아가기
      </Button>
    </div>
  )
}
