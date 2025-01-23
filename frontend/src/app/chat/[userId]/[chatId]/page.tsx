"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/contexts/AuthContext"
import { BookSearchResult } from "@/components/book-search-result"
import { TypingEffect } from "@/components/typing-effect"
import { ModeToggle } from "@/components/theme-toggle"
import { LoadingMessage } from "@/components/loading-message"
import { HelpCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ChatMessage {
  id: number
  message_id: number
  message_content: string
  action: string
  sent_by: "user" | "ai"
  sent_at: string
  chat_id: number
  user_id: number
}

interface AIResponse {
  action: string
  content: string | BookSearchResult[]
}

interface BookSearchResult {
  title: string
  author: string
  categoryName: string
  pubDate: string
  toc?: string
}

function cleanJsonString(originalString: string) {
  const cleanedString = originalString.split("시험 계획:")[1].trim()
  const formattedString = cleanedString
    .replace(/'''([\s\S]*?)'''/, '"$1"')
    .replace(/(\n|\r)/g, "")
    .replace(/ {4}/g, "")
  return formattedString
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [loadingMessageId, setLoadingMessageId] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const { apiCall } = useApi()
  const { checkAuth } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const chatId = params.chatId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!checkAuth()) {
      router.push("/login")
      return
    }

    fetchMessages()
    localStorage.setItem("chatUrl", window.location.pathname)
  }, [chatId, userId, apiCall, checkAuth, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    const { data, error, status } = await apiCall<ChatMessage[] | { message: string }>(
      `/api/v1/chatrooms/${userId}/?chatroom_id=${chatId}`, "GET"
    )
    if (status === 204 || (data && "message" in data && data.message === "아직 대화가 시작되지 않았습니다.")) {
      setMessages([])
    } else if (error) {
      console.error("Failed to fetch messages:", error)
    } else if (Array.isArray(data)) {
      const sortedMessages = data.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      setMessages(sortedMessages)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!checkAuth()) {
      router.push("/login")
      return
    }

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      message_id: Date.now(),
      message_content: content,
      action: "",
      sent_by: "user",
      sent_at: new Date().toISOString(),
      chat_id: Number.parseInt(chatId),
      user_id: Number.parseInt(userId),
    }

    const loadingMessageId = Date.now() + 1
    setMessages((prev) => [
      ...prev,
      newUserMessage,
      {
        id: loadingMessageId,
        message_id: loadingMessageId,
        message_content: "",
        action: "loading",
        sent_by: "ai",
        sent_at: new Date().toISOString(),
        chat_id: Number.parseInt(chatId),
        user_id: Number.parseInt(userId),
      },
    ])
    setLoadingMessageId(loadingMessageId)

    try {
      const { data, error } = await apiCall<{
        message: string
        user_msg: string
        ai_response: AIResponse
      }>(`/api/v1/chatrooms/${userId}/?chatroom_id=${chatId}`, "POST", { user_msg: content })

      if (error) {
        console.error("Failed to send message:", error)
      } else if (data) {
        const newAiMessage: ChatMessage = {
          id: loadingMessageId,
          message_id: loadingMessageId,
          message_content: JSON.stringify(data.ai_response),
          action: data.ai_response.action,
          sent_by: "ai",
          sent_at: new Date().toISOString(),
          chat_id: Number.parseInt(chatId),
          user_id: Number.parseInt(userId),
        }

        setMessages((prev) => prev.map((msg) => (msg.id === loadingMessageId ? newAiMessage : msg)))
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoadingMessageId(null)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.sent_by === "ai") {
      if (message.action === "loading") {
        return <LoadingMessage key={message.id} />
      }

      try {
        let aiResponse

        try {
          aiResponse = JSON.parse(message.message_content)
        } catch (error) {
          aiResponse = { action: message.action, content: message.message_content }
        }

        if (aiResponse.action === "search_books") {
          return (
            <Message key={message.id} isUser={false} plan={false} content="" userName="책 검색">
              <BookSearchResult books={aiResponse.content as BookSearchResult[]} />
            </Message>
          )
        } else if (aiResponse.action === "make_plans") {
          const cleanedString = cleanJsonString(aiResponse.content as string)
          const jsonObject = JSON.parse(cleanedString)
          localStorage.setItem("studyPlan", JSON.stringify(jsonObject))

          return (
            <Message
              key={message.id}
              isUser={false}
              plan={true}
              content={JSON.stringify(jsonObject)}
              userName="계획 세우기"
            />
          )
        } else {
          return (
            <Message key={message.id} isUser={false} plan={false} content="" userName="일상 대화">
              <TypingEffect text={aiResponse.content as string} />
            </Message>
          )
        }
      } catch (error) {
        console.error("Error parsing AI message:", error)
        return (
          <Message key={message.id} isUser={false} plan={false} content="" userName="오류">
            <TypingEffect text={"문제가 발생했습니다. 다시 시도해 주세요."} />
          </Message>
        )
      }
    }
    return <Message key={message.id} isUser={true} plan={false} content={message.message_content} userName="나" />
  }

  const Guide = () => (
    <AlertDialog open={showGuide} onOpenChange={setShowGuide}>
      <AlertDialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-2">📘 사용자 도움말</AlertDialogTitle>
          <AlertDialogDescription />
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="text-base font-semibold">수험서 검색</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>알라딘 API를 사용하여 제공됩니다.</li>
              <li>
                검색 결과는 아래 카테고리에 한정됩니다.<br/>
                초등학교/중학교/고등학교 참고서, 수험서/자격증, 외국어, 컴퓨터/모바일
              </li>
            </ul>

            <p className="text-base font-semibold">이용 방법</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>시험 준비</strong>
                  <ul className="list-disc pl-5">
                    <li>준비 중인 시험의 수험서를 검색하세요.</li>
                    <li>
                      예: <em>정보처리기사 수험서를 알려줘.</em>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>시험계획 설정</strong>
                  <ul className="list-disc pl-5">
                    <li>원하는 수험서와 시험 날짜를 입력하세요.</li>
                    <li>
                      예: <em>시험 일자는 ㅇㅇ월 ㅇㅇ일이야. ㅇㅇ 출판사 수험서를 바탕으로 계획을 짜줘.</em>
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>세부 사항 수정</strong>
                  <ul className="list-disc pl-5">
                    <li>시험계획 미리보기를 통해 수정 가능합니다.</li>
                  </ul>
                </li>
                <li>
                  <strong>계획 생성</strong>
                  <ul className="list-disc pl-5">
                    <li>
                      <strong>시험계획 생성하기</strong>를 클릭해 최종 저장합니다.
                    </li>
                  </ul>
                </li>
              </ol>
          </div>
        </AlertDialogHeader>
        <AlertDialogAction className="mt-4">닫기</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 bg-background z-10 border-b">
        <div className="container max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between relative">
            <button onClick={() => window.history.back()} className="hover:text-primary">
              {"<--"} 이전 화면
            </button>
            <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2">채팅</h1>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowGuide(true)} className="p-2 hover:text-primary" aria-label="Show guide">
                <HelpCircle size={20} />
              </button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-4">
          {messages.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              StudyMAIT는 책을 검색하고 시험 계획을 목차에 따라 자동으로 만들어줍니다.
              <br />
              (단, 시험 계획 생성 과정에서 시간이 다소 걸릴 수 있으며, 너무 오래 걸린다면 새로고침을 해주세요.)
              <br /><br />
              자세한 가이드는 우측 상단 도움말 아이콘을 누르면 확인할 수 있습니다.
            </div>
          )}
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="sticky bottom-0 bg-background z-10 border-t">
        <div className="container max-w-4xl mx-auto p-4">
          <MessageInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>

      <Guide />
    </div>
  )
}
