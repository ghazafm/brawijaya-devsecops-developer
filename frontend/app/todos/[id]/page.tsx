"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Category, Priority, Status, Todo, Subtask, CompletionStatus } from "@/types/todo"
import { getTodoById, updateTodoById, deleteTodoById } from "@/lib/todos-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubtaskList } from "@/components/subtask-list"
import { nowISO } from "@/types/todo"

const categories: Category[] = ["work", "personal", "shopping", "health", "other"]
const priorities: Priority[] = ["low", "medium", "high"]

export default function TodoDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [todo, setTodo] = useState<Todo | null>(null)
  const [notFound, setNotFound] = useState(false)

  // local edit state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("personal")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<Status>("todo")
  const [dueDate, setDueDate] = useState<string | "">("")

  useEffect(() => {
    if (!id) return
    const t = getTodoById(id)
    if (!t) {
      setNotFound(true)
      return
    }
    setTodo(t)
    setTitle(t.title)
    setDescription(t.description ?? "")
    setCategory(t.category)
    setPriority(t.priority)
    setStatus(t.status)
    setDueDate(t.dueDate || "")
  }, [id])

  const save = () => {
    if (!todo) return
    const updated = updateTodoById(todo.id, (prev) => ({
      ...prev,
      title: title.trim() || prev.title,
      description: description,
      category,
      priority,
      status,
      dueDate: dueDate || null,
      updatedAt: new Date().toISOString(),
    }))
    if (updated) setTodo(updated)
  }

  const remove = () => {
    if (!todo) return
    deleteTodoById(todo.id)
    router.push("/")
  }

  const toggleStatus = () => {
    if (!todo) return
    const next = status === "done" ? "todo" : "done"
    setStatus(next)
  }

  const addSubtask = (title: string) => {
    if (!todo) return
    const updated = updateTodoById(todo.id, (prev) => {
      const nextSubtasks: Subtask[] = [
        ...(prev.subtasks ?? []),
        {
          id: Date.now(),
          todoId: Number(todo.id),
          title: title.trim(),
          isCompleted: "no",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      return { ...prev, subtasks: nextSubtasks, updatedAt: nowISO() }
    })
    if (updated) setTodo(updated)
  }

  const toggleSubtask = (subtaskId: number) => {
    if (!todo) return
    const updated = updateTodoById(todo.id, (prev) => {
      const nextSubtasks = (prev.subtasks ?? []).map((st) => {
        if (st.id !== subtaskId) return st
        const nextCompleted = (st.isCompleted === "yes" ? "no" : "yes") as CompletionStatus
        return { ...st, isCompleted: nextCompleted, updatedAt: nowISO() }
      })
      return { ...prev, subtasks: nextSubtasks, updatedAt: nowISO() }
    })
    if (updated) setTodo(updated)
  }

  const deleteSubtask = (subtaskId: number) => {
    if (!todo) return
    const updated = updateTodoById(todo.id, (prev) => {
      const nextSubtasks = (prev.subtasks ?? []).filter((st) => st.id !== subtaskId)
      return { ...prev, subtasks: nextSubtasks, updatedAt: nowISO() }
    })
    if (updated) setTodo(updated)
  }

  const editSubtask = (subtaskId: number, title: string) => {
    if (!todo) return
    const updated = updateTodoById(todo.id, (prev) => {
      const nextSubtasks = (prev.subtasks ?? []).map((st) =>
        st.id === subtaskId ? { ...st, title: title.trim(), updatedAt: nowISO() } : st,
      )
      return { ...prev, subtasks: nextSubtasks, updatedAt: nowISO() }
    })
    if (updated) setTodo(updated)
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Card className="p-8 text-center space-y-4">
            <div className="text-6xl">🔍</div>
            <div className="text-lg">Tugas tidak ditemukan</div>
            <Link href="/" className="underline text-muted-foreground">
              Kembali ke daftar
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  if (!todo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl px-4 py-12">
          <Card className="p-8 text-center">Memuat...</Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-pretty">Detail Tugas</h1>
          <Link href="/" className="text-sm underline text-muted-foreground">
            Kembali ke daftar
          </Link>
        </header>

        <Card className="p-6 bg-card border-border space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm">Judul</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Jatuh tempo</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Kategori</label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Prioritas</label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm">Deskripsi</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tambahkan deskripsi detail..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
              <Badge variant="outline">{priority}</Badge>
              <Badge variant="secondary">{status}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={toggleStatus}>
                {status === "done" ? "Tandai Belum Selesai" : "Tandai Selesai"}
              </Button>
              <Button onClick={save} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Simpan
              </Button>
              <Button variant="destructive" onClick={remove}>
                Hapus
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Subtugas</h2>
            <span className="text-sm text-muted-foreground">
              {todo.subtasks?.length ? `${todo.subtasks.length} item` : "Belum ada subtugas"}
            </span>
          </div>
          <div className="pt-2 border-t border-border">
            <SubtaskList
              subtasks={todo.subtasks ?? []}
              onAdd={addSubtask}
              onToggle={toggleSubtask}
              onDelete={deleteSubtask}
              onEdit={editSubtask}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
