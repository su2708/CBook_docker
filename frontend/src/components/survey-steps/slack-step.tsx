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
        <p className="text-center">"Slack을 통해 학습 목표를 매일 알림받아<br />성공적인 공부 습관을 만드세요."</p>
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
        <p>현재 입력하신 이메일은 아래와 같습니다.</p>
        <p className="text-lg font-semibold text-center">{email}</p>
        <p className="text-center">Slack 계정의 이메일과 StudyMAIT에 가입하실 이메일이<br/>동일해야 합니다.</p>
        <p className="text-rose-500">그렇지 않다면, 알림 서비스를 정상적으로 이용할 수 없습니다.</p>
        <hr></hr>
        <p className="font-semibold">🚀 Slack 계정이 없다면?</p>
        <Button 
          variant="secondary"
          className="w-full py-2 bg-white text-base flex items-center justify-center space-x-2"
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
