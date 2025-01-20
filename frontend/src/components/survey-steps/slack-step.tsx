"use client"

import { Button } from "@/components/ui/button"
import { Slack } from 'lucide-react'

interface SlackStepProps {
  email: string
  onSubmit: () => void
}

export function SlackStep({ email, onSubmit }: SlackStepProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-center">Slack 안내</h1>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">📢 Slack은 필수입니다!</h2>
        <p>"Slack을 통해 학습 목표를 매일 알림받아 성공적인 공부 습관을 만드세요."</p>
        <Button 
          variant="default" 
          className="w-full py-2 text-lg flex items-center justify-center space-x-2"
          onClick={() => window.open("https://join.slack.com/t/studymait/shared_invite/zt-2xt7ue69w-hKs0B_cmOkzif_Qjk5cLiQ", "_blank")}
        >
          <Slack className="w-5 h-5" />
          <span>StudyMAIT Slack 참여하기</span>
        </Button>
        <hr></hr>
        <h2 className="text-xl font-semibold">⚠️ 주의 사항</h2>
        <p>Slack 계정의 이메일과 StudyMAIT에 가입하고자 하시는 이메일({email})이 동일해야 합니다.</p>
        <p>그렇지 않은 경우, 알림 서비스를 정상적으로 이용할 수 없습니다.</p>
        <hr></hr>
        <p className="font-semibold">🚀 Slack 계정이 없다면?</p>
        <Button 
          variant="secondary"
          className="w-full py-2 text-base flex items-center justify-center space-x-2"
          onClick={() => window.open("https://slack.com/get-started#/createnew", "_blank")}
        >
          <Slack className="w-5 h-5" />
          <span>Slack에 가입하기</span>
        </Button>
      </div>

      <Button 
        className="w-full py-6 text-lg"
        onClick={onSubmit}
      >
        다음
      </Button>
    </div>
  )
}
