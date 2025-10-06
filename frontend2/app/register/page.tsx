"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Mail, Lock, User } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirm) {
      // toast({ title: "Form belum lengkap", description: "Mohon isi semua kolom yang diperlukan." })
      toast("Form belum lengkap")
      return
    }
    if (password.length < 6) {
      // toast({ title: "Kata sandi lemah", description: "Minimal 6 karakter." })
      toast("Kata sandi lemah")
      return
    }
    if (password !== confirm) {
      // toast({ title: "Konfirmasi salah", description: "Kata sandi dan konfirmasi tidak cocok." })
      toast("Konfirmasi salah")
      return
    }

    try {
      setLoading(true)
      await new Promise((r) => setTimeout(r, 900))
      // toast({ title: "Pendaftaran berhasil", description: "Silakan masuk menggunakan akun Anda." })
      toast("Pendaftaran berhasil")
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Daftar</CardTitle>
          <CardDescription>Buat akun untuk mulai mengelola tugas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama (opsional)</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Masuk
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
