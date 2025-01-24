"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useRouter } from "next/navigation"
import { EditReminderModal } from "../../components/EditReminderModal"

import {
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  MessageSquare,
  AlarmClockIcon as Alarm,
  ChevronDown,
} from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ProgressDot } from "../../components/progress-dot"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import { ModeToggle } from "../../components/theme-toggle"
import { calculateDaysRemaining, formatDate } from "../../utils/date"
import { useApi } from "../../hooks/useApi"
import { Switch } from "../../components/ui/switch"
import { StudyTimer } from "../../components/StudyTimer"

function CircularProgress({ value }: { value: number }) {
  const radius = 60
  const fullCircumference = 2 * Math.PI * radius
  const circumference = fullCircumference * 0.75
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center h-40 w-40">
      <svg className="w-40 h-40 transform rotate-[135deg]">
        <circle
          className="text-chart-2"
          strokeWidth="11.9"
          stroke="currentColor"
          fill="transparent"
          r="70"
          cx="80"
          cy="80"
          strokeDasharray={`${circumference} ${fullCircumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          pathLength={fullCircumference}
        />
        <circle
          className="text-primary"
          strokeWidth="12"
          strokeDasharray={`${strokeDasharray} ${fullCircumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="70"
          cx="80"
          cy="80"
          pathLength={fullCircumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-m">진도율</span>
        <span className="text-4xl font-semibold">{value}%</span>
      </div>
    </div>
  )
}

interface ExamData {
  id: number
  plan_id: number
  ctrm_id: number
  test_name: string
  test_date: string
  test_place: string
  test_plan: {
    total_plan: {
      [key: string]: Array<{ task: string; is_done: boolean }>
    }
  }
  created_at: string
  updated_at: string
  on_progress: boolean
  chatroom: number
  user_id: number
}

interface ReminderSettings {
  reminder_id: number
  test_plan: number
  start_hour: number
  start_minute: number
  end_hour: number
  end_minute: number
  interval_hours: number
  message_style: string
  is_active: boolean
}

export default function Page() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { checkAuth } = useAuth()
  const router = useRouter()
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [daysRemaining, setDaysRemaining] = useState<number>(0)
  const [progressRate, setProgressRate] = useState<number>(0)
  const [currentWeek, setCurrentWeek] = useState<string>("")
  const [weeklyProgress, setWeeklyProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 })
  const [currentTask, setCurrentTask] = useState<{
    week: string
    task: string
    index: number
    is_done: boolean
  } | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [tempReminderSettings, setTempReminderSettings] = useState<ReminderSettings | null>(null)
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings | null>(null)
  const [isAllTasksCompleted, setIsAllTasksCompleted] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const { apiCall } = useApi()

  useEffect(() => {
    const auth = checkAuth()
    if (!auth) {
      router.push("/login")
    } else {
      fetchExamData()
    }
  }, [])

  useEffect(() => {
    if (examData) {
      fetchReminderSettings()
      checkAllTasksCompleted()
    }
  }, [examData])

  const fetchExamData = async () => {
    setIsLoading(true)
    try {
      const storedExamId = localStorage.getItem("selectedExamId")
      if (!storedExamId) {
        throw new Error("No exam selected")
      }
      const [userId, planId] = storedExamId.split(":")
      const { data, error, status } = await apiCall<ExamData>(
        `/api/v1/testplans/?user_id=${userId}&plan_id=${planId}`,
        "GET",
      )
      console.log(data)
      if (status === 200 && data) {
        setExamData(data)
        updateDashboardData(data)
      } else {
        throw new Error(error || "Failed to fetch exam data")
      }
    } catch (error) {
      console.error("Error fetching exam data:", error)
      setCompletionError("Failed to load exam data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReminderSettings = async () => {
    try {
      const { data, error, status } = await apiCall<ReminderSettings[]>("/api/v1/reminder/settings/", "GET")
      if (status === 200 && data) {
        const matchedSetting = data.find((setting) => setting.test_plan === examData?.id)
        if (matchedSetting) {
          setReminderSettings(matchedSetting)
        } else {
          await createReminderSettings()
        }
      } else {
        throw new Error(error || "Failed to fetch reminder settings")
      }
    } catch (error) {
      console.error("Error fetching reminder settings:", error)
    }
  }

  const createReminderSettings = async () => {
    try {
      const { data, error, status } = await apiCall<ReminderSettings>("/api/v1/reminder/settings/", "POST", {
        test_plan: examData?.id,
        start_hour: 9,
        start_minute: 0,
        end_hour: 18,
        end_minute: 0,
      })
      if (status === 201 && data) {
        setReminderSettings(data)
      } else {
        throw new Error(error || "Failed to create reminder settings")
      }
    } catch (error) {
      console.error("Error creating reminder settings:", error)
    }
  }

  const updateDashboardData = (data: ExamData) => {
    const formattedTestDate = formatDate(data.test_date)
    const daysDiff = calculateDaysRemaining(formattedTestDate, new Date().toISOString())
    setDaysRemaining(daysDiff)

    const totalTasks = Object.values(data.test_plan.total_plan).flat().length
    const completedTasks = Object.values(data.test_plan.total_plan)
      .flat()
      .filter((task) => task.is_done).length
    const rate = Math.round((completedTasks / totalTasks) * 100)
    setProgressRate(rate)

    const weeks = Object.keys(data.test_plan.total_plan)
    setCurrentWeek(weeks[0])
  }

  const checkAllTasksCompleted = () => {
    if (examData) {
      const allTasks = Object.values(examData.test_plan.total_plan).flat()
      const allCompleted = allTasks.every((task) => task.is_done)
      setIsAllTasksCompleted(allCompleted)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (examData && currentWeek) {
      const weekTasks = examData.test_plan.total_plan[currentWeek]
      const completed = weekTasks.filter((task) => task.is_done).length
      setWeeklyProgress({ completed, total: weekTasks.length })

      // Update current task based on currentTaskIndex
      if (weekTasks && weekTasks.length > 0) {
        const taskIndex = Math.min(currentTaskIndex, weekTasks.length - 1)
        setCurrentTask({
          week: currentWeek,
          task: weekTasks[taskIndex].task,
          index: taskIndex,
          is_done: weekTasks[taskIndex].is_done,
        })
      }
    }
  }, [examData, currentWeek, currentTaskIndex])

  useEffect(() => {
    if (examData) {
      updateCurrentWeekAndTask(examData)
    }
  }, [examData])

  const handleWeekChange = (direction: "prev" | "next") => {
    if (examData) {
      const weeks = Object.keys(examData.test_plan.total_plan)
      const currentIndex = weeks.indexOf(currentWeek)
      if (direction === "prev" && currentIndex > 0) {
        setCurrentWeek(weeks[currentIndex - 1])
      } else if (direction === "next" && currentIndex < weeks.length - 1) {
        setCurrentWeek(weeks[currentIndex + 1])
      }
    }
  }

  const handleTaskCompletion = async () => {
    if (!currentTask || !examData) return

    setIsLoading(true)
    setCompletionError(null)

    try {
      const { status } = await apiCall(
        `/api/v1/testplans/?user_id=${examData.user_id}&plan_id=${examData.plan_id}`,
        "PATCH",
        {
          week: currentTask.week,
          task_idx: currentTask.index,
        },
      )

      if (status === 200) {
        // Fetch updated exam plan data
        const {
          data,
          error,
          status: getStatus,
        } = await apiCall<ExamData>(`/api/v1/testplans/?user_id=${examData.user_id}&plan_id=${examData.plan_id}`, "GET")

        if (getStatus === 200 && data) {
          setExamData(data)

          // Recalculate progress rate
          const totalTasks = Object.values(data.test_plan.total_plan).flat().length
          const completedTasks = Object.values(data.test_plan.total_plan)
            .flat()
            .filter((task) => task.is_done).length
          const rate = Math.round((completedTasks / totalTasks) * 100)
          setProgressRate(rate)

          // Update current week and task
          updateCurrentWeekAndTask(data)
          checkAllTasksCompleted()
        } else {
          setCompletionError("Failed to fetch updated exam plan data.")
        }
      } else {
        setCompletionError("Failed to complete the task. Please try again.")
      }
    } catch (error) {
      setCompletionError("An error occurred while completing the task.")
    } finally {
      setIsLoading(false)
    }
  }

  const updateCurrentWeekAndTask = (data: ExamData) => {
    const weeks = Object.keys(data.test_plan.total_plan)

    // If currentWeek is not set or invalid, set it to the first week
    if (!weeks.includes(currentWeek)) {
      setCurrentWeek(weeks[0])
    }

    const currentWeekTasks = data.test_plan.total_plan[currentWeek]

    if (currentWeekTasks && currentWeekTasks.length > 0) {
      const taskIndex = Math.min(currentTaskIndex, currentWeekTasks.length - 1)
      setCurrentTask({
        week: currentWeek,
        task: currentWeekTasks[taskIndex].task,
        index: taskIndex,
        is_done: currentWeekTasks[taskIndex].is_done,
      })
      setCurrentTaskIndex(taskIndex)
    } else {
      // If current week has no tasks, find the first week with tasks
      for (const week of weeks) {
        const tasks = data.test_plan.total_plan[week]
        if (tasks.length > 0) {
          setCurrentWeek(week)
          setCurrentTask({
            week: week,
            task: tasks[0].task,
            index: 0,
            is_done: tasks[0].is_done,
          })
          setCurrentTaskIndex(0)
          break
        }
      }
    }
  }

  const navigateTask = (direction: "prev" | "next") => {
    if (!examData) return

    const weeks = Object.keys(examData.test_plan.total_plan)
    let newIndex = currentTaskIndex + (direction === "next" ? 1 : -1)
    let newWeek = currentWeek

    const adjustWeekAndIndex = () => {
      if (newIndex < 0) {
        // Move to the previous week
        const prevWeekIndex = weeks.indexOf(newWeek) - 1
        if (prevWeekIndex < 0) {
          // Wrap around to the last week
          newWeek = weeks[weeks.length - 1]
        } else {
          newWeek = weeks[prevWeekIndex]
        }
        newIndex = examData.test_plan.total_plan[newWeek].length - 1
      } else if (newIndex >= examData.test_plan.total_plan[newWeek].length) {
        // Move to the next week
        const nextWeekIndex = weeks.indexOf(newWeek) + 1
        if (nextWeekIndex >= weeks.length) {
          // Wrap around to the first week
          newWeek = weeks[0]
        } else {
          newWeek = weeks[nextWeekIndex]
        }
        newIndex = 0
      }
    }

    adjustWeekAndIndex()

    setCurrentTaskIndex(newIndex)
    setCurrentWeek(newWeek)
    const task = examData.test_plan.total_plan[newWeek][newIndex]
    setCurrentTask({
      week: newWeek,
      task: task.task,
      index: newIndex,
      is_done: task.is_done,
    })
  }

  useEffect(() => {
    if (reminderSettings) {
      setTempReminderSettings(reminderSettings)
    }
  }, [reminderSettings])

  const updateReminderSettings = async (key: string, value: any) => {
    if (!reminderSettings) return

    try {
      const { status } = await apiCall(`/api/v1/reminder/settings/${reminderSettings.reminder_id}/`, "PATCH", {
        [key]: value,
      })

      if (status === 200) {
        setReminderSettings({ ...reminderSettings, [key]: value })
      } else {
        console.error("Failed to update reminder settings")
      }
    } catch (error) {
      console.error("Error updating reminder settings:", error)
    }
  }

  const handleCompleteExam = async () => {
    if (!examData) return;
  
    try {
      const { data, error, status } = await apiCall(
        `/api/v1/archievements/?user_id=${examData.user_id}&plan_id=${examData.plan_id}`,
        "POST"
      );
  
      if (status === 201 && data) {
        router.push("/profile");
      } else {
        console.error("Failed to complete exam plan:", error);
      }
    } catch (error) {
      console.error("Error completing exam plan:", error);
    }
  };

  const toggleNotificationSettings = () => {
    if (!reminderSettings) return
    setShowNotificationSettings(!showNotificationSettings)
  }

  if (!examData || !reminderSettings) {
    return <div>Loading...</div>
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{examData.test_name}</h1>
          <p className="text-sm">at {examData.test_place}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <ModeToggle />
          <button>
            <MessageCircle
              onClick={() => router.push(`/chat/${examData?.user_id}/${examData?.ctrm_id}`)}
              className="relative h-6 w-6"
            />
          </button>

          <div>
            <p className="text-sm">Now</p>
            <p className="text-2xl font-bold">
              {currentTime.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="flex flex-col justify-center p-4 h-36">
          <p className="text-m text-center mb-2">시험까지 앞으로</p>
          <p className="text-4xl font-bold text-center">{daysRemaining}일</p>
        </Card>

        <div className="flex justify-center items-center">
          <CircularProgress value={progressRate} />
        </div>

        <Card className="border-none shadow-none bg-background flex flex-col justify-center items-center p-4 h-40">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => handleWeekChange("prev")}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {examData.test_plan.total_plan[currentWeek].map((task, index) => (
                <ProgressDot
                  key={index}
                  status={task.is_done ? "completed" : "upcoming"}
                />
              ))}
            </div>
            <button onClick={() => handleWeekChange("next")}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-m">{currentWeek} 학습</h2>
          <p className="text-3xl font-semibold mb-4">
            {weeklyProgress.completed} / {weeklyProgress.total} 완료
          </p>
        </Card>
      </div>

      {/* Current Study */}
      <div className="relative group">
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => navigateTask("prev")}
          disabled={isLoading}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <Card className="p-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">이번 학습</h2>
            {currentTask && (
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-sm">{currentTask.task}</p>
                </div>
                <Button variant="default" onClick={handleTaskCompletion} disabled={isLoading}>
                  {isLoading ? "처리 중..." : currentTask.is_done ? "체크 취소" : "완료 체크"}
                </Button>
              </div>
            )}
          </div>
          {completionError && <p className="text-red-500 text-sm mt-2">{completionError}</p>}
        </Card>
        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => navigateTask("next")}
          disabled={isLoading}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Study Timer */}
      <Card className="p-6">
          <StudyTimer />
      </Card>

      {/* Schedule */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={toggleNotificationSettings}>
            <Bell className="w-5 h-5" />
            <span>학습 알림 (아직은 작동하지 않습니다)</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showNotificationSettings ? "transform rotate-180" : ""}`}
            />
          </div>
          <Switch
            checked={reminderSettings.is_active}
            onCheckedChange={async (checked) => {
              try {
                const { status } = await apiCall(`/api/v1/reminder/settings/${reminderSettings.reminder_id}/toggle_active/`, "POST")
                if (status === 200) {
                  setReminderSettings({ ...reminderSettings, is_active: checked })
                  if (checked) {
                    setShowNotificationSettings(true)
                  }
                } else {
                  console.error("Failed to toggle reminder settings")
                }
              } catch (error) {
                console.error("Error toggling reminder settings:", error)
              }
            }}
          />
        </div>

        {showNotificationSettings && (
          <div className={reminderSettings.is_active ? "" : "opacity-50 pointer-events-none"}>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>학습 알림 시간</span>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  {reminderSettings.start_hour.toString().padStart(2, '0')}:
                  {reminderSettings.start_minute.toString().padStart(2, '0')}
                  <span> ~ </span> 
                  {reminderSettings.end_hour.toString().padStart(2, '0')}:
                  {reminderSettings.end_minute.toString().padStart(2, '0')}
                </span>
                <Button onClick={() => setShowEditModal(true)} variant="outline" size="sm">
                  수정하기
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <Alarm className="w-5 h-5" />
                <span>학습 알림 주기</span>
              </div>
              <Select
                value={reminderSettings.interval_hours.toString()}
                onValueChange={(value) => {
                  updateReminderSettings("interval_hours", Number(value))
                }}
              >
                {
                  showEditModal && (
                    <EditReminderModal
                      reminderSettings={reminderSettings}
                      onClose={() => setShowEditModal(false)}
                      onSave={async (newSettings) => {
                        try {
                          const { status } = await apiCall(
                            `/api/v1/reminder/settings/${reminderSettings.reminder_id}/`,
                            "PATCH",
                            newSettings,
                          )
                          if (status === 200) {
                            setReminderSettings({ ...reminderSettings, ...newSettings })
                            setShowEditModal(false)
                          } else {
                            console.error("Failed to update reminder settings")
                          }
                        } catch (error) {
                          console.error("Error updating reminder settings:", error)
                        }
                      }}
                    />
                  )
                }
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="알림 주기" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1시간마다</SelectItem>
                  <SelectItem value="2">2시간마다</SelectItem>
                  <SelectItem value="3">3시간마다</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>리마인더 스타일</span>
              </div>
              <Select
                value={reminderSettings.message_style}
                onValueChange={(value) => {
                  updateReminderSettings("message_style", value)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="리마인더스타일" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="encourage">격려</SelectItem>
                  <SelectItem value="harsh">팩폭</SelectItem>
                  <SelectItem value="polite">정중</SelectItem>
                  <SelectItem value="witty">위트</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      

      {/* Bottom Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => router.push("/profile")} className="flex-1 py-6" variant="secondary">
          다른 시험 스케줄 관리하기
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="flex-1 py-6" variant="default" disabled={!isAllTasksCompleted}>
              계획 끝마치기
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>계획을 끝마치시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                - 시험 계획이 삭제되며 업적에 등록됩니다.
                <br />- 현재 계획에 대한 학습 알림이 비활성화되며 다른 계획에 대해서는 영향이 없습니다.
                <br />- 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleCompleteExam}>확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
