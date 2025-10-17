"use client"

import { useState, useEffect } from "react"
import { TodoHeader } from "@/components/todo-header"
import { TodoForm } from "@/components/todo-form"
import { TodoList } from "@/components/todo-list"
import { TodoStats } from "@/components/todo-stats"
import { useRouter } from "next/navigation"
import type { Todo, Category, Priority, Status, Subtask, CompletionStatus } from "@/types/todo"
import { makeNewTodo, nowISO } from "@/types/todo"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "YOUR_API_URL"

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token")
    }
    return null
  }

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

  // Fetch todos saat component mount
  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      setLoading(true)
      const response = await authFetch(`${API_URL}/todos/`)
      
      if (!response.ok) {
        throw new Error("Gagal memuat todos")
      }

      const data = await response.json()
      // Sesuaikan dengan struktur response API Anda
      setTodos(data.data || data)
    } catch (error) {
      if (error instanceof Error && error.message !== "No token found" && error.message !== "Unauthorized") {
        toast.error("Gagal memuat daftar tugas")
      }
    } finally {
      setLoading(false)
    }
  }

  const addTodo = async (
    title: string,
    category: Category,
    priority: Priority,
    description: string,
    dueDate?: string | null,
  ) => {
    try {
      // Pastikan dueDate valid ISO (tambahkan waktu 23:59:59)
      const formattedDate = dueDate
        ? new Date(`${dueDate}T23:59:59Z`).toISOString()
        : null;

      console.log("Tanggal dikirim:", formattedDate);

      const response = await authFetch(`${API_URL}/todos/`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          due_date: formattedDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menambahkan tugas");
      }

      const data = await response.json();
      const newTodo = data.data || data;
      setTodos([newTodo, ...todos]);
      toast.success("Tugas berhasil ditambahkan");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menambahkan tugas");
      }
    }
  }

  const toggleTodo = async (id: string) => {
    // Cari todo yang akan diupdate
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newStatus: Status = todo.status === "done" ? "todo" : "done"

    try {
      const response = await authFetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: todo.title,
          description: todo.description,
          category: todo.category,
          priority: todo.priority,
          status: newStatus,
          due_date: todo.dueDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal mengupdate status tugas")
      }

      // Update state lokal
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      )
    } catch (error) {
      toast.error("Gagal mengupdate status tugas")
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      const response = await authFetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Gagal menghapus tugas")
      }

      setTodos(todos.filter((todo) => todo.id !== id))
      toast.success("Tugas berhasil dihapus")
    } catch (error) {
      toast.error("Gagal menghapus tugas")
    }
  }

  const editTodo = async (id: string, newTitle: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    try {
      const response = await authFetch(`${API_URL}/todos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: newTitle.trim(),
          description: todo.description,
          category: todo.category,
          priority: todo.priority,
          status: todo.status,
          due_date: todo.dueDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Gagal mengupdate tugas")
      }

      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: newTitle, updatedAt: new Date().toISOString() } : t)),
      )
      toast.success("Tugas berhasil diupdate")
    } catch (error) {
      toast.error("Gagal mengupdate tugas")
    }
  }

  const clearCompleted = async () => {
    const completedTodos = todos.filter((t) => t.status === "done")
    
    try {
      // Hapus semua completed todos
      await Promise.all(
        completedTodos.map((todo) =>
          authFetch(`${API_URL}/todos/${todo.id}`, {
            method: "DELETE",
          })
        )
      )

      setTodos((prev) => prev.filter((t) => t.status !== "done"))
      toast.success("Tugas selesai berhasil dihapus")
    } catch (error) {
      toast.error("Gagal menghapus tugas selesai")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setTodos([])
    toast.success("Berhasil logout")
    router.push("/login")
  }

  // Fungsi subtask tetap menggunakan state lokal karena tidak ada endpoint API untuk subtask
  const addSubtask = (todoId: string, title: string) => {
    if (!title.trim()) return
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== todoId) return t
        const newSubtask = {
          id: Date.now(),
          todoId: 0,
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat tugas...</div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}