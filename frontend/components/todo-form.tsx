"use client"

import type React from "react"
import type { Category, Priority } from "@/types/todo"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

interface TodoFormProps {
  onAddTodo: (
    title: string,
    category: Category,
    priority: Priority,
    description: string,
    dueDate?: string | null,
  ) => void
}

export function TodoForm({ onAddTodo }: TodoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("personal")
  const [priority, setPriority] = useState<Priority>("medium")
  const [dueDate, setDueDate] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAddTodo(title.trim(), category, priority, description, dueDate || null)
      setTitle("")
      setDescription("")
      setCategory("personal")
      setPriority("medium")
      setDueDate("")
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-4">
          <div>
            <Input
              type="text"
              placeholder="Judul tugas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input border-border"
              required
            />
          </div>

          <div>
            <Input
              type="text"
              placeholder="Deskripsi (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-input border-border"
            />
            <div className="mt-2 prose hidden">
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
              <SelectTrigger className="w-full md:w-48 bg-input border-border">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Kantor</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="shopping">Belanja</SelectItem>
                <SelectItem value="health">Kesehatan</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
              <SelectTrigger className="w-full md:w-40 bg-input border-border">
                <SelectValue placeholder="Prioritas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah</SelectItem>
                <SelectItem value="medium">Sedang</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full md:w-44 bg-input border-border"
            />

            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
