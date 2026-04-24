"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface VendorFormProps {
  initial?: {
    id: string
    name: string
    contactName: string | null
    email: string | null
    phone: string | null
  }
  onSuccess: () => void
  onCancel: () => void
}

export function VendorForm({ initial, onSuccess, onCancel }: VendorFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get("name"),
      contactName: form.get("contactName"),
      email: form.get("email"),
      phone: form.get("phone"),
    }

    const res = await fetch(
      initial ? `/api/vendors/${initial.id}` : "/api/vendors",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Something went wrong")
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vendor name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" defaultValue={initial?.name} placeholder="US Foods" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactName">Contact name</Label>
        <Input id="contactName" name="contactName" defaultValue={initial?.contactName ?? ""} placeholder="John Smith" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} placeholder="orders@usfoods.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={initial?.phone ?? ""} placeholder="555-555-5555" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initial ? "Save changes" : "Add vendor"}
        </Button>
      </div>
    </form>
  )
}
