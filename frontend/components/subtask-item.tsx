"use client"

import { useState } from "react"
import type { Subtask } from "@/types/todo"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, X, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubtaskItemProps {
  subtask: Subtask
  onToggle: () => void
  onDelete: () => void
  onEdit: (title: string) => void
}

export function SubtaskItem({ subtask, onToggle, onDelete, onEdit }: SubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(subtask.title)

  const handleSave = () => {
    const value = text.trim()
    if (!value || value === subtask.title) {
      setIsEditing(false)
      return
    }
    onEdit(value)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        checked={subtask.isCompleted === "yes"}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
                if (e.key === "Escape") {
                  setText(subtask.title)
                  setIsEditing(false)
                }
              }}
              className="bg-input border-border"
              autoFocus
            />
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleSave} aria-label="Simpan">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setText(subtask.title)
                setIsEditing(false)
              }}
              aria-label="Batal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span
            className={cn(
              "text-sm",
              subtask.isCompleted === "yes" ? "line-through text-muted-foreground" : "text-foreground",
            )}
          >
            {subtask.title}
          </span>
        )}
      </div>
      {!isEditing && (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Hapus" className="hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
