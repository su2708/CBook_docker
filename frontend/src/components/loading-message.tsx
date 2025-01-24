import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Loader2 } from 'lucide-react'

export function LoadingMessage() {
  const [showAdditionalText, setShowAdditionalText] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAdditionalText(true)
    }, 15000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full p-4 bg-primary">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>···</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">
              답변 생성 중
            </div>
            <div className="text-white flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              답변을 생성하고 있습니다...
            </div>
            {showAdditionalText && <div className="text-white">만약 답변이 오지 않는다면 잠시 후에 새로고침을 해주세요.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
