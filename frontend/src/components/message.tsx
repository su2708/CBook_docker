import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

interface MessageProps {
  isUser: boolean
  plan: boolean
  content: string
  userName: string
  children?: React.ReactNode
}

export function Message({ isUser, plan, content, userName, children }: MessageProps) {
  const renderContent = () => {
    if (children) {
      return children;
    }

    if (plan) {
      try {
        const planData = JSON.parse(content);
        const { book_title, test_day, total_plan } = planData;

        return (
          <div>
            <p>시험 날짜: {test_day.substring(0, 4)}-{test_day.substring(4, 6)}-{test_day.substring(6, 8)}</p>
            <p>책 제목: {book_title}</p>
            <p>학습 계획이 생성되었습니다. 아래 버튼을 클릭하여 자세히 볼 수 있습니다.</p>
          </div>
        );
      } catch (error) {
        console.error("Error parsing plan data:", error);
        return <p>계획 데이터를 표시하는 중 오류가 발생했습니다.</p>;
      }
    }
    return content;
  }

  return (
    <div className={`w-full p-4 ${isUser ? 'bg-background' : 'bg-primary'}`}>
      <div className="container max-w-4xl mx-auto">
        <div className="flex items-start gap-3">
          <Avatar>
            {isUser ? (
              <AvatarImage src="/placeholder.svg" alt="User" />
            ) : (
              <AvatarImage src="/placeholder.svg" alt="AI" />
            )}
            <AvatarFallback>{isUser ? '나' : 'AI'}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className={`text-sm font-medium ${isUser ? 'text-foreground' : 'text-white'}`}>
              {userName}
            </div>
            <div className={`${isUser ? 'text-foreground' : 'text-white'}`}>
              {renderContent()}
            </div>
            {plan && (
              <Link href="/plan-preview">
                <Button 
                  variant="secondary"
                  className="w-full my-2 py-6"
                >
                  시험 계획 미리보기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
