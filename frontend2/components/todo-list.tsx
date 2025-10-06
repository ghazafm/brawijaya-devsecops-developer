"use client"

import { TodoItem } from "./todo-item"
import { Card } from "@/components/ui/card"
import type { Todo } from "@/types/todo"

interface TodoListProps {
  todos: Todo[]
  onToggleTodo: (id: string) => void
  onDeleteTodo: (id: string) => void
  onEditTodo: (id: string, newText: string) => void
  onAddSubtask: (todoId: string, title: string) => void
  onToggleSubtask: (todoId: string, subtaskId: number) => void
  onDeleteSubtask: (todoId: string, subtaskId: number) => void
  onEditSubtask: (todoId: string, subtaskId: number, title: string) => void
}

export function TodoList({
  todos,
  onToggleTodo,
  onDeleteTodo,
  onEditTodo,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <Card className="p-12 text-center bg-card border-border">
        <div className="text-muted-foreground">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Belum ada tugas</h3>
          <p>Tambahkan tugas pertama Anda untuk memulai!</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggleTodo}
          onDelete={onDeleteTodo}
          onEdit={onEditTodo}
          onAddSubtask={(title) => onAddSubtask(todo.id, title)}
          onToggleSubtask={(subtaskId) => onToggleSubtask(todo.id, subtaskId)}
          onDeleteSubtask={(subtaskId) => onDeleteSubtask(todo.id, subtaskId)}
          onEditSubtask={(subtaskId, title) => onEditSubtask(todo.id, subtaskId, title)}
        />
      ))}
    </div>
  )
}
