"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react"

export function StudyTimer() {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, remainingSeconds])

  useEffect(() => {
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100
    setProgress(progress || 0)
  }, [remainingSeconds, totalSeconds])

  const handleStart = () => {
    if (!isRunning && (hours > 0 || minutes > 0 || seconds > 0)) {
      const total = hours * 3600 + minutes * 60 + seconds
      setTotalSeconds(total)
      setRemainingSeconds(total)
      setIsRunning(true)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setRemainingSeconds(0)
    setProgress(0)
  }

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600)
    const m = Math.floor((time % 3600) / 60)
    const s = time % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handleTimeInput = (value: string, setter: (value: number) => void, max: number) => {
    let num = Number.parseInt(value)
    if (isNaN(num)) num = 0
    if (num > max) num = max
    if (num < 0) num = 0
    setter(num)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold">학습 타이머</h2>

      {!isRunning ? (
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={(e) => handleTimeInput(e.target.value, setHours, 23)}
            className="w-16 text-center"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => handleTimeInput(e.target.value, setMinutes, 59)}
            className="w-16 text-center"
          />
          <span>:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={(e) => handleTimeInput(e.target.value, setSeconds, 59)}
            className="w-16 text-center"
          />
        </div>
      ) : (
        <div className="text-4xl font-bold">{formatTime(remainingSeconds)}</div>
      )}

      <div className="bg-chart-1 w-full rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-primary h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex space-x-2">
        <Button onClick={isRunning ? handleReset : handleStart}>
          {isRunning ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              리셋
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              시작
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
