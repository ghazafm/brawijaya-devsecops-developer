export type Priority = "low" | "medium" | "high"
export type Category = "work" | "personal" | "shopping" | "health" | "other"
export type Status = "todo" | "inprogress" | "done"
export type CompletionStatus = "yes" | "no"

export interface Subtask {
  id: number
  todoId: number
  title: string
  isCompleted: CompletionStatus // default: 'no'
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Todo {
  id: string
  userId?: number
  categoryId?: number | null
  title: string
  description?: string
  priority: Priority // default: 'medium'
  category: Category // default: 'personal'
  status: Status // default: 'todo'
  dueDate?: string | null // ISO date (yyyy-mm-dd)
  createdAt: string
  updatedAt: string
  subtasks?: Subtask[]
}

export const nowISO = () => new Date().toISOString()

export function makeNewTodo(partial: Partial<Todo>): Todo {
  const timestamp = nowISO()
  return {
    id: partial.id ?? Date.now().toString(),
    userId: partial.userId ?? 0,
    categoryId: partial.categoryId ?? null,
    title: partial.title ?? "",
    description: partial.description ?? "",
    priority: partial.priority ?? "medium",
    category: partial.category ?? "personal",
    status: partial.status ?? "todo",
    dueDate: partial.dueDate ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    subtasks: partial.subtasks ?? [],
  }
}
