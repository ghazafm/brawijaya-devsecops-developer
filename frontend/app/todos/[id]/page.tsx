"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Category, Priority, Status, Todo, Subtask, CompletionStatus } from "@/types/todo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SubtaskList } from "@/components/subtask-list"
import { nowISO } from "@/types/todo"
import { toast } from "sonner"

const categories: Category[] = ["work", "personal", "shopping", "health", "other"]
const priorities: Priority[] = ["low", "medium", "high"]

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_API_URL"

export default function TodoDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [todo, setTodo] = useState<Todo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("personal")
  const [priority, setPriority] = useState<Priority>("medium")
  const [status, setStatus] = useState<Status>("todo")
  const [dueDate, setDueDate] = useState<string | "">("")

  // Helper function untuk mendapatkan token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token")
    }
    return null
  }

  // Helper function untuk fetch dengan auth
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    
    if (!token) {
      toast.error("Sesi berakhir, silakan login kembali")
      router.push("/login")
      throw new Error("No token found")
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (response.status === 401) {
      toast.error("Sesi berakhir, silakan login kembali")
      localStorage.removeItem("token")
      router.push("/login")
      throw new Error("Unauthorized")
    }

    return response
  }

  // Fetch todo detail
  useEffect(() => {
    if (!id) return
    fetchTodoDetail()
  }, [id])

  const fetchTodoDetail = async () => {
    try {
      setLoading(true)
      const response = await authFetch(`${API_URL}/todos/public/${id}`)
      
      if (response.status === 404) {
        setNotFound(true)
        return
      }

      if (!response.ok) {
        throw new Error("Gagal memuat detail tugas")
      }

      const data = await response.json()
      const todoData = data.data || data
      console.log("ini data todo",todoData)
      
      setTodo(todoData)
      setTitle(todoData.title)
      setDescription(todoData.description ?? "")
      setCategory(todoData.category)
      setPriority(todoData.priority)
      setStatus(todoData.status)
      const dateValue = todoData.due_date 
        ? new Date(todoData.due_date).toISOString().split("T")[0]
        : ""
      console.log("Ini date value:",dateValue)
      setDueDate(dateValue)
    } catch (error) {
      if (error instanceof Error && error.message !== "No token found" && error.message !== "Unauthorized") {
        toast.error("Gagal memuat detail tugas")
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!todo) return;

    try {
      const response = await authFetch(`${API_URL}/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.trim() || todo.title,
          description,
          category,
          priority,
          status,
          due_date: dueDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan perubahan");
      }

      const data = await response.json();
      const updatedTodo = data.data || data;
      setTodo(updatedTodo);

      toast.success("Perubahan berhasil disimpan");
      router.push("/todos");
      router.refresh();
    } catch (error) {
      toast.error("Gagal menyimpan perubahan");
    }
  };

  const remove = async () => {
    if (!todo) return;

    try {
      const response = await authFetch(`${API_URL}/todos/${todo.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus tugas");
      }

      toast.success("Tugas berhasil dihapus");
      router.push("/todos");
      router.refresh();
    } catch (error) {
      toast.error("Gagal menghapus tugas");
    }
  };

  const toggleStatus = async () => {
    if (!todo) return
    
    const nextStatus: Status = status === "done" ? "todo" : "done"

    try {
      const response = await authFetch(`${API_URL}/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          status: nextStatus,
          due_date: dueDate || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal mengubah status")
      }

      setStatus(nextStatus)
      const data = await response.json()
      setTodo(data.data || data)
      toast.success(`Status diubah menjadi ${nextStatus === "done" ? "selesai" : "belum selesai"}`)
    } catch (error) {
      toast.error("Gagal mengubah status")
    }
  }

  // Fungsi subtask tetap menggunakan state lokal karena tidak ada endpoint API untuk subtask
  const addSubtask = (title: string) => {
    if (!todo) return
    const newSubtask: Subtask = {
      id: Date.now(),
      todoId: Number(todo.id),
      title: title.trim(),
      isCompleted: "no",
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const updatedTodo = {
      ...todo,
      subtasks: [...(todo.subtasks ?? []), newSubtask],
      updatedAt: nowISO(),
    }
    
    setTodo(updatedTodo)
    toast.success("Subtugas berhasil ditambahkan")
  }

  const toggleSubtask = (subtaskId: number) => {
    if (!todo) return
    
    const nextSubtasks = (todo.subtasks ?? []).map((st) => {
      if (st.id !== subtaskId) return st
      const nextCompleted = (st.isCompleted === "yes" ? "no" : "yes") as CompletionStatus
      const nextCompletedAt = nextCompleted === "yes" ? nowISO() : null
      return { ...st, isCompleted: nextCompleted, completedAt: nextCompletedAt, updatedAt: nowISO() }
    })
    
    setTodo({ ...todo, subtasks: nextSubtasks, updatedAt: nowISO() })
  }

  const deleteSubtask = (subtaskId: number) => {
    if (!todo) return
    
    const nextSubtasks = (todo.subtasks ?? []).filter((st) => st.id !== subtaskId)
    setTodo({ ...todo, subtasks: nextSubtasks, updatedAt: nowISO() })
    toast.success("Subtugas berhasil dihapus")
  }

  const editSubtask = (subtaskId: number, newTitle: string) => {
    if (!todo) return
    
    const nextSubtasks = (todo.subtasks ?? []).map((st) =>
      st.id === subtaskId ? { ...st, title: newTitle.trim(), updatedAt: nowISO() } : st,
    )
    
    setTodo({ ...todo, subtasks: nextSubtasks, updatedAt: nowISO() })
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

  if (loading || !todo) {
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
          <Link href="/todos" className="text-sm underline text-muted-foreground">
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
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
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
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
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