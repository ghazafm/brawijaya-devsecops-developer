"use client"

import { useState } from "react"
import { TodoHeader } from "@/components/todo-header"
import { TodoForm } from "@/components/todo-form"
import { TodoList } from "@/components/todo-list"
import { TodoStats } from "@/components/todo-stats"
import { useRouter } from "next/navigation"
import type { Todo, Category, Priority, Status, Subtask, CompletionStatus } from "@/types/todo"
import { makeNewTodo, nowISO } from "@/types/todo"

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const router = useRouter()

  const addTodo = (
    title: string,
    category: Category,
    priority: Priority,
    description: string,
    dueDate?: string | null,
  ) => {
    const newTodo = makeNewTodo({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: "todo" satisfies Status,
      dueDate: dueDate || null,
    })
    setTodos([newTodo, ...todos])
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "done" ? "todo" : "done",
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const editTodo = (id: string, newTitle: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle, updatedAt: new Date().toISOString() } : t)),
    )
  }

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => t.status !== "done"))
  }

  const handleLogout = () => {
    setTodos([])
    router.push("/login")
  }

  const addSubtask = (todoId: string, title: string) => {
    if (!title.trim()) return
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t
        const newSubtask = {
          id: Date.now(),
          todoId: 0, // placeholder in client-only state
          title: title.trim(),
          isCompleted: "no" as const,
          completedAt: null,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        }
        return { ...t, subtasks: [...(t.subtasks ?? []), newSubtask], updatedAt: nowISO() }
      }),
    )
  }

  const toggleSubtask = (todoId: string, subtaskId: number) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t
        const updated: Subtask[] = (t.subtasks ?? []).map((st): Subtask => {
          if (st.id !== subtaskId) return st
          const nextIsCompleted: CompletionStatus = st.isCompleted === "yes" ? "no" : "yes"
          const nextCompletedAt = nextIsCompleted === "yes" ? nowISO() : null
          return {
            ...st,
            isCompleted: nextIsCompleted,
            completedAt: nextCompletedAt,
            updatedAt: nowISO(),
          }
        })
        return { ...t, subtasks: updated, updatedAt: nowISO() }
      }),
    )
  }

  const deleteSubtask = (todoId: string, subtaskId: number) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, subtasks: (t.subtasks ?? []).filter((st) => st.id !== subtaskId), updatedAt: nowISO() }
          : t,
      ),
    )
  }

  const editSubtask = (todoId: string, subtaskId: number, newTitle: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t
        const updated = (t.subtasks ?? []).map((st) =>
          st.id === subtaskId ? { ...st, title: newTitle.trim(), updatedAt: nowISO() } : st,
        )
        return { ...t, subtasks: updated, updatedAt: nowISO() }
      }),
    )
  }

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return t.status !== "done"
    if (filter === "completed") return t.status === "done"
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <TodoHeader onLogout={handleLogout} />
        <div className="space-y-8">
          <TodoForm onAddTodo={addTodo} />
          <TodoStats todos={todos} filter={filter} onFilterChange={setFilter} onClearCompleted={clearCompleted} />
          <TodoList
            todos={filteredTodos}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onEditTodo={editTodo}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            onEditSubtask={editSubtask}
          />
        </div>
      </div>
    </div>
  )
}