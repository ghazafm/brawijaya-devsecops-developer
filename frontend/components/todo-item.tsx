"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit3, Check, X } from "lucide-react"
import type { Todo } from "@/types/todo"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (subtaskId: number) => void
  onDeleteSubtask: (subtaskId: number) => void
  onEditSubtask: (subtaskId: number, title: string) => void
}

export function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.title)

  const handleEdit = () => {
    if (editText.trim() && editText !== todo.title) {
      onEdit(todo.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(todo.title)
    setIsEditing(false)
  }

  return (
    <Card
      className={cn(
        "p-4 bg-card border-border transition-all duration-200 hover:shadow-md",
        todo.status === "done" && "opacity-75",
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={todo.status === "done"}
          onCheckedChange={() => onToggle(todo.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEdit()
                  if (e.key === "Escape") handleCancel()
                }}
                className="flex-1 bg-input border-border"
                autoFocus
              />
              <Button size="sm" onClick={handleEdit} className="bg-primary hover:bg-primary/90">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-card-foreground text-pretty",
                    todo.status === "done" && "line-through text-muted-foreground",
                  )}
                >
                  {todo.title}
                </span>
                <Badge variant="secondary">{todo.category}</Badge>
                <Badge variant="outline">{todo.priority}</Badge>
                <Badge variant="secondary">{todo.status}</Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggle(todo.id)}
                aria-label={todo.status === "done" ? "Tandai belum selesai" : "Tandai selesai"}
                className={todo.status === "done" ? "text-muted-foreground" : "text-primary"}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Edit"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              {/* Lihat detail */}
              <Link href={`/todos/${todo.id}`} aria-label="Lihat detail">
                <Button size="sm" variant="outline" className="text-foreground bg-transparent">
                  Lihat detail
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(todo.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {todo.dueDate && <span className="text-xs text-muted-foreground">Jatuh tempo: {todo.dueDate}</span>}
        </div>
      </div>
    </Card>
  )
}
