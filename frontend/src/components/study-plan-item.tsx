"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

interface StudyPlanItemProps {
  id: string
  task: string
}

export function StudyPlanItem({ id, task }: StudyPlanItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      type: "task",
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center bg-secondary py-2 px-4 rounded-md mb-2 mx-8 cursor-grab group"
    >
      <span className="mr-2 flex-grow">
        <span className="mr-2 text-gray-500">○</span>
        {task}
      </span>
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
    </li>
  )
}
