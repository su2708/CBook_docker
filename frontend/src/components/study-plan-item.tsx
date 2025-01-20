'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface StudyPlanItemProps {
  id: string;
  task: string;
}

export function StudyPlanItem({ id, task }: StudyPlanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center bg-secondary py-2 px-4 rounded-md mb-2 mx-8 cursor-grab `}
    >
      <span className="mr-2 text-gray-500">○</span>
      {task}
    </li>
  );
}
