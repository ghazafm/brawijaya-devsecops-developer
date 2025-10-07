"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Todo } from "@/types/todo"

interface TodoStatsProps {
  todos: Todo[]
  filter: "all" | "active" | "completed"
  onFilterChange: (filter: "all" | "active" | "completed") => void
  onClearCompleted: () => void
}

export function TodoStats({ todos, filter, onFilterChange, onClearCompleted }: TodoStatsProps) {
  const totalTodos = todos.length
  const completedTodos = todos.filter((todo) => todo.status === "done").length
  const activeTodos = totalTodos - completedTodos

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalTodos}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{activeTodos}</div>
            <div className="text-sm text-muted-foreground">Aktif</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-muted-foreground">{completedTodos}</div>
            <div className="text-sm text-muted-foreground">Selesai</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("all")}
            className={filter === "all" ? "bg-primary text-primary-foreground" : ""}
          >
            Semua
            <Badge variant="secondary" className="ml-2">
              {totalTodos}
            </Badge>
          </Button>
          <Button
            variant={filter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("active")}
            className={filter === "active" ? "bg-primary text-primary-foreground" : ""}
          >
            Aktif
            <Badge variant="secondary" className="ml-2">
              {activeTodos}
            </Badge>
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("completed")}
            className={filter === "completed" ? "bg-primary text-primary-foreground" : ""}
          >
            Selesai
            <Badge variant="secondary" className="ml-2">
              {completedTodos}
            </Badge>
          </Button>
          {completedTodos > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive bg-transparent"
            >
              Hapus Selesai
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
