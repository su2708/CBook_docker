import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from 'lucide-react'

export function LoadingMessage() {
  return (
    <div className="w-full p-4 bg-primary">
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="AI" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">
              AI
            </div>
            <div className="text-white flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              답변을 생성하고 있습니다...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
