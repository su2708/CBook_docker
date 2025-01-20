"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from 'next/navigation'
import { Message } from "@/components/message"
import { MessageInput } from "@/components/message-input"
import { useApi } from "@/hooks/useApi"
import { useAuth } from "@/contexts/AuthContext"
import { BookSearchResult } from "@/components/book-search-result"
import { TypingEffect } from "@/components/typing-effect"
import { ModeToggle } from "@/components/theme-toggle"
import { LoadingMessage } from "@/components/loading-message"

interface ChatMessage {
  id: number;
  message_id: number;
  message_content: string;
  action: string;
  sent_by: 'user' | 'ai';
  sent_at: string;
  chat_id: number;
  user_id: number;
}

interface AIResponse {
  action: string;
  content: string | BookSearchResult[];
}

interface BookSearchResult {
  title: string;
  author: string;
  categoryName: string;
  pubDate: string;
  toc?: string;
}

function cleanJsonString(originalString: string) {
  const cleanedString = originalString.split("시험 계획:")[1].trim();
  const formattedString = cleanedString.replace(/'''([\s\S]*?)'''/, '"$1"')
                                       .replace(/(\n|\r)/g, '')
                                       .replace(/ {4}/g, '');
  return formattedString;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [loadingMessageId, setLoadingMessageId] = useState<number | null>(null)
  const { apiCall } = useApi()
  const { checkAuth } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  const chatId = params.chatId as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login')
      return
    }

    fetchMessages()
    // URL 정보를 로컬 스토리지에 저장
    localStorage.setItem('chatUrl', window.location.pathname)
    
  }, [chatId, userId, apiCall, checkAuth, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    const { data, error, status } = await apiCall<ChatMessage[] | { message: string }>(`/api/v1/chatrooms/${userId}/?chatroom_id=${chatId}`)
    if (status === 204 || (data && 'message' in data && data.message === "아직 대화가 시작되지 않았습니다.")) {
      setMessages([])
    } else if (error) {
      console.error('Failed to fetch messages:', error)
    } else if (Array.isArray(data)) {
      const sortedMessages = data.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      setMessages(sortedMessages)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!checkAuth()) {
      router.push('/login')
      return
    }

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      message_id: Date.now(),
      message_content: content,
      action: "",
      sent_by: 'user',
      sent_at: new Date().toISOString(),
      chat_id: parseInt(chatId),
      user_id: parseInt(userId)
    }

    const loadingMessageId = Date.now() + 1
    setMessages(prev => [...prev, newUserMessage, {
      id: loadingMessageId,
      message_id: loadingMessageId,
      message_content: "",
      action: "loading",
      sent_by: 'ai',
      sent_at: new Date().toISOString(),
      chat_id: parseInt(chatId),
      user_id: parseInt(userId)
    }])
    setLoadingMessageId(loadingMessageId)

    try {
      const { data, error } = await apiCall<{
        message: string;
        user_msg: string;
        ai_response: AIResponse;
      }>(`/api/v1/chatrooms/${userId}/?chatroom_id=${chatId}`, 'POST', { user_msg: content })

      if (error) {
        console.error('Failed to send message:', error)
      } else if (data) {
        const newAiMessage: ChatMessage = {
          id: loadingMessageId,
          message_id: loadingMessageId,
          message_content: JSON.stringify(data.ai_response),
          action: data.ai_response.action,
          sent_by: 'ai',
          sent_at: new Date().toISOString(),
          chat_id: parseInt(chatId),
          user_id: parseInt(userId)
        }

        setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? newAiMessage : msg))
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoadingMessageId(null)
    }
  }

  const renderMessage = (message: ChatMessage) => {
    if (message.sent_by === 'ai') {
      if (message.action === 'loading') {
        return <LoadingMessage key={message.id} />
      }

      try {
        let aiResponse;
        
        try {
          aiResponse = JSON.parse(message.message_content);
        } catch (error) {
          aiResponse = { action: message.action, content: message.message_content };
        }
        
        if (aiResponse.action === 'search_books') {
          return (
            <Message
              key={message.id}
              isUser={false}
              plan={false}
              content=""
              userName="책을 찾음"
            >
              <BookSearchResult 
                books={aiResponse.content as BookSearchResult[]} 
              />
            </Message>
          );
        } else if (aiResponse.action === 'make_plans') {
          const cleanedString = cleanJsonString(aiResponse.content as string);
          const jsonObject = JSON.parse(cleanedString);
          localStorage.setItem('studyPlan', JSON.stringify(jsonObject));
          
          return (
            <Message
              key={message.id}
              isUser={false}
              plan={true}
              content={JSON.stringify(jsonObject)}
              userName="계획을 세움"
            />
          );
        } else {
          return (
            <Message
              key={message.id}
              isUser={false}
              plan={false}
              content=""
              userName="일상 대화"
            >
              <TypingEffect text={aiResponse.content as string} />
            </Message>
          );
        }
      } catch (error) {
        console.error("Error parsing AI message:", error);
        return (
          <Message
            key={message.id}
            isUser={false}
            plan={false}
            content=""
            userName="대충 오류"
          >
            <TypingEffect text={"문제가 발생했습니다. 다시 시도해 주세요."} />
          </Message>
        );
      }
    }
    return (
      <Message
        key={message.id}
        isUser={true}
        plan={false}
        content={message.message_content}
        userName="나"
      />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 bg-background z-10 border-b">
        <div className="container max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between relative">
            <button 
              onClick={() => window.history.back()} 
              className="hover:text-primary"
            >
              {"<--"} 이전 화면
            </button>
            <h1 className="text-xl font-bold absolute left-1/2 -translate-x-1/2">
              채팅
            </h1>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-4">
          {messages.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              아직 대화가 시작되지 않았습니다. 첫 메시지를 보내보세요!
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
    </div>
  )
}
