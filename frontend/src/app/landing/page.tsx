"use client"

import { useRouter } from "next/navigation"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import Image from "next/image"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
    <Card className="w-full max-w-md p-24 space-y-6">
    <main className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        {/* Logo */}
        <Image
          src="/StudyMAIT_Logo.png"
          alt="StudyMAIT Logo"
          width={120}
          height={120}
          className="text-blue-300"
        />

        {/* Logo Text */}
        <h1 className="text-5xl font-bold tracking-tight">
          StudyM<span className="text-[#FF5733]">AI</span>T
        </h1>

        {/* Tagline */}
        <p
          className="text-xl text-gray-600"
          style={{
            fontFamily: "'Caveat', cursive",
          }}
        >
          Plan your study effectively
        </p>

        {/* Get Started Button */}
        <Button
          onClick={() => router.push("/login")}
          className="mt-8 px-12 py-6 text-xl rounded-full bg-[#2B547E] hover:bg-[#1E3F66] transition-colors"
        >
          Get Started
        </Button>
      </div>
    </main>
    </Card>
    </div>

  )
}
