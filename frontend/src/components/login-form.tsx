"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useAuth } from "../contexts/AuthContext"
import { useApi } from "../hooks/useApi"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

const signInSchema = z.object({
  username: z.string().min(1, "사용자 이름을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
})

type SignInData = z.infer<typeof signInSchema>

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const { login } = useAuth()
  const { apiCall } = useApi()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInData) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await apiCall<{ access: string; refresh: string }>("/api/v1/accounts/login/", "POST", data)

      if (response.error) {
        setError(response.error)
      } else if (response.data) {
        login(response.data.access, response.data.refresh)
        router.push("/profile")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>사용자 이름과 비밀번호를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">사용자 이름</Label>
              <Input id="username" type="text" {...register("username")} placeholder="StudyMAIT" />
              {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" {...register("password")} placeholder="비밀번호" />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            처음이신가요?{" "}
            <a href="/register" className="underline underline-offset-4">
              회원가입하기
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
