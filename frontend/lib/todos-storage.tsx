"use client"

import type { Todo } from "@/types/todo"

const STORAGE_KEY = "todos:v1"

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Todo[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveTodos(todos: Todo[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {}
}

export function getTodoById(id: string): Todo | undefined {
  return loadTodos().find((t) => t.id === id)
}

export function upsertTodo(next: Todo): Todo[] {
  const list = loadTodos()
  const idx = list.findIndex((t) => t.id === next.id)
  if (idx >= 0) {
    list[idx] = next
  } else {
    list.unshift(next)
  }
  saveTodos(list)
  return list
}

export function updateTodoById(id: string, updater: (t: Todo) => Todo): Todo | undefined {
  const list = loadTodos()
  const idx = list.findIndex((t) => t.id === id)
  if (idx < 0) return undefined
  const updated = updater(list[idx])
  list[idx] = updated
  saveTodos(list)
  return updated
}

export function deleteTodoById(id: string): Todo[] {
  const list = loadTodos().filter((t) => t.id !== id)
  saveTodos(list)
  return list
}
