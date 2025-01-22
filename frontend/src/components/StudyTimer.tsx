import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { PlayCircle, RotateCcw } from "lucide-react"
import { Input } from "./ui/input"

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
            alert("시간이 다 되었습니다!") // 사용자에게 알림
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

  const handleStart = () => {
    const totalTimeInSeconds = hours * 3600 + minutes * 60 + seconds
    setTotalSeconds(totalTimeInSeconds)
    setRemainingSeconds(totalTimeInSeconds)
    setIsRunning(true)
  }

  const handleReset = () => {
    setIsRunning(false)
    setRemainingSeconds(0)
    setProgress(0)
  }

  const handleTimeInput = (value: string, setter: React.Dispatch<React.SetStateAction<number>>, max: number) => {
    const num = Number.parseInt(value, 10)
    setter(Math.max(0, Math.min(num, max)))
  }

  useEffect(() => {
    if (remainingSeconds > 0 && totalSeconds > 0) {
      const progressPercentage = (1 - remainingSeconds / totalSeconds) * 100
      setProgress(progressPercentage)
    }
  }, [remainingSeconds, totalSeconds])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col items-center space-y-6 relative w-full h-full">
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-bold flex-grow">학습 타이머</h2>
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
    </div>
  )
}

