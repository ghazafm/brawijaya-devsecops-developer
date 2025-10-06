"use client"

import { CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TodoHeaderProps {
  onLogout?: () => void
}

export function TodoHeader({ onLogout }: TodoHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-xl">
            <CheckSquare className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Daftar Tugas</h1>
        </div>
        {onLogout && (
          <Button variant="outline" onClick={onLogout} aria-label="Logout">
            Keluar
          </Button>
        )}
      </div>
      <p className="text-muted-foreground text-lg">Kelola tugas harian Anda dengan mudah dan efisien</p>
    </div>
  )
}
