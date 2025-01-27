"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface StudyPlanItemProps {
  id: string;
  task: string;
  isDeleteMode: boolean;
  onDelete: () => void;
}

export function StudyPlanItem({
  id,
  task,
  isDeleteMode,
  onDelete,
}: StudyPlanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isDeleteMode,
    data: {
      type: "task",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...(isDeleteMode ? {} : { ...attributes, ...listeners })}
      className="flex items-center bg-secondary py-2 px-4 rounded-md mb-2 mx-8 cursor-grab group"
    >
      <span className="mr-2 flex-grow">{task}</span>
      <div className="flex items-center">
        {!isDeleteMode && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="p-4 h-4 w-4 text-gray-400" />
          </div>
        )}
        {isDeleteMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="-mr-2"
          >
            <Trash2 className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
    </li>
  );
}
