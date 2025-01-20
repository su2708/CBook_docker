'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DraggableStudyPlanProps {
  id: string
  week: string
  isFirstWeek?: boolean
}

export function DraggableStudyPlan({ 
  id, 
  week,
  isFirstWeek = false
}: DraggableStudyPlanProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isFirstWeek
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`select-none ${isDragging ? 'z-10' : ''} ${isFirstWeek ? 'cursor-default' : 'cursor-grab'} 
                  p-4 mb-4`}
    >
      <div className="flex items-center">
        <h3 className="text-lg font-semibold mr-2">{week}</h3>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div>
    </div>
  )
}
