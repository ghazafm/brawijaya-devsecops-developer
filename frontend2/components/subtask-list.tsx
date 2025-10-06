"use client"

import { useState } from "react"
import type { Subtask } from "@/types/todo"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SubtaskItem } from "./subtask-item"
import { Plus } from "lucide-react"

interface SubtaskListProps {
  subtasks: Subtask[]
  onAdd: (title: string) => void
  onToggle: (subtaskId: number) => void
  onDelete: (subtaskId: number) => void
  onEdit: (subtaskId: number, title: string) => void
}

export function SubtaskList({ subtasks, onAdd, onToggle, onDelete, onEdit }: SubtaskListProps) {
  const [text, setText] = useState("")

  const handleAdd = () => {
    const value = text.trim()
    if (!value) return
    onAdd(value)
    setText("")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {subtasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada subtugas.</p>
        ) : (
          subtasks.map((st) => (
            <SubtaskItem
              key={st.id}
              subtask={st}
              onToggle={() => onToggle(st.id)}
              onDelete={() => onDelete(st.id)}
              onEdit={(title) => onEdit(st.id, title)}
            />
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Tambah subtugas..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd()
          }}
          className="bg-input border-border"
        />
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Tambah
        </Button>
      </div>
    </div>
  )
}
