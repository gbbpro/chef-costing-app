"use client"

import { signOut } from "next-auth/react"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  user: {
    name?: string | null
    email: string
    role: string
  }
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <User className="w-4 h-4" />
          <span>{user.name ?? user.email}</span>
          <span className="px-1.5 py-0.5 rounded text-xs bg-stone-100 text-stone-500 uppercase tracking-wide">
            {user.role}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-stone-500 hover:text-stone-900"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Sign out
        </Button>
      </div>
    </header>
  )
}
