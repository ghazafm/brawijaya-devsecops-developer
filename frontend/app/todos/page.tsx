"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Category, Priority, Status, Todo } from "@/types/todo"
import { makeNewTodo, nowISO } from "@/types/todo"
import { loadTodos, saveTodos, deleteTodoById } from "@/lib/todos-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Trash2, Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const categories: Category[] = ["work", "personal", "shopping", "health", "other"]
const priorities: Priority[] = ["low", "medium", "high"]

export default function TodoNoSubtasksPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")

  // form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("personal")
  const [priority, setPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState<string | "">("")

  const router = useRouter()

  // init from storage
  useEffect(() => {
    setTodos(loadTodos())
  }, [])

  // persist on change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  const filtered = useMemo(() => {
    if (filter === "active") return todos.filter((t) => t.status !== "done")
    if (filter === "completed") return todos.filter((t) => t.status === "done")
    return todos
  }, [todos, filter])

  const addTodo = () => {
    const name = title.trim()
    if (!name) return
    const newTodo = makeNewTodo({
      title: name,
      description: description.trim(),
      category,
      priority,
      status: "todo" as Status,
      dueDate: dueDate || null,
    })
    setTodos((prev) => [newTodo, ...prev])
    setTitle("")
    setDescription("")
    setCategory("personal")
    setPriority("medium")
    setDueDate("")
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done", updatedAt: nowISO() } : t)),
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    // keep storage in sync in case state isn't saved yet
    deleteTodoById(id)
  }

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => t.status !== "done"))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-pretty">Daftar Tugas (tanpa subtugas)</h1>
          <div className="flex gap-2">
            <Link href="/" className="text-sm underline text-muted-foreground">
              Kembali ke halaman utama
            </Link>
          </div>
        </header>

        <Card className="p-4 bg-card border-border">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm">Judul</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masukkan judul tugas..." />
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
                placeholder="Tambahkan deskripsi singkat..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={addTodo} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Tambah Tugas
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                Semua
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                Aktif
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Selesai
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-muted-foreground">
              Hapus yang selesai
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-6xl mb-3">📝</div>
              Belum ada tugas
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((todo) => (
                <Card
                  key={todo.id}
                  className={cn(
                    "p-4 bg-card border-border transition-all duration-200 hover:shadow-md",
                    todo.status === "done" && "opacity-75",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={todo.status === "done"}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />

                    <div className="flex-1 min-w-0">
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

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleTodo(todo.id)}
                          aria-label={todo.status === "done" ? "Tandai belum selesai" : "Tandai selesai"}
                          className={todo.status === "done" ? "text-muted-foreground" : "text-primary"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/todos/${todo.id}`)}
                          aria-label="Detail"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                        {/* Lihat detail (teks) */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/todos/${todo.id}`)}
                          aria-label="Lihat detail"
                          className="text-foreground"
                        >
                          Lihat detail
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {todo.dueDate && (
                        <span className="text-xs text-muted-foreground">Jatuh tempo: {todo.dueDate}</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
