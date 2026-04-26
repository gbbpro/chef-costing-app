"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Users, Mail, Trash2, Shield } from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "CHEF" | "ASSOCIATE"
  createdAt: string
}

const roleColors = {
  ADMIN: "bg-red-50 text-red-600 border-red-200",
  CHEF: "bg-amber-50 text-amber-700 border-amber-200",
  ASSOCIATE: "bg-stone-100 text-stone-500 border-stone-200",
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [orgName, setOrgName] = useState("")
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgSuccess, setOrgSuccess] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"CHEF" | "ASSOCIATE">("ASSOCIATE")
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    success?: boolean
    error?: string
    inviteUrl?: string
  }>({})
  const [deleteModal, setDeleteModal] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = session?.user.role === "ADMIN"

  async function loadOrg() {
    const res = await fetch("/api/settings/org")
    const data = await res.json()
    setOrgName(data.name)
  }

  async function loadUsers() {
    const res = await fetch("/api/settings/users")
    const data = await res.json()
    setUsers(data)
  }

  useEffect(() => {
    loadOrg()
    if (isAdmin) loadUsers()
  }, [isAdmin])

  async function saveOrg() {
    setOrgSaving(true)
    setOrgSuccess(false)
    await fetch("/api/settings/org", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName }),
    })
    setOrgSaving(false)
    setOrgSuccess(true)
    setTimeout(() => setOrgSuccess(false), 2000)
  }

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/settings/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    loadUsers()
  }

  async function deleteUser() {
    if (!deleteModal) return
    setDeleting(true)
    await fetch(`/api/settings/users/${deleteModal.id}`, { method: "DELETE" })
    setDeleting(false)
    setDeleteModal(null)
    loadUsers()
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteResult({})

    const res = await fetch("/api/settings/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    })

    const data = await res.json()
    setInviting(false)

    if (!res.ok) {
      setInviteResult({ error: data.error })
      return
    }

    setInviteResult({
      success: true,
      inviteUrl: data.inviteUrl,
    })
    setInviteEmail("")
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-0.5">Manage your organization and team</p>
      </div>

      {/* Organization */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-stone-400" />
          <h2 className="font-semibold text-stone-900">Organization</h2>
        </div>
        <div className="space-y-1.5">
          <Label>Restaurant name</Label>
          <div className="flex gap-2">
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              onKeyDown={(e) => e.key === "Enter" && saveOrg()}
            />
            {isAdmin && (
              <Button
                onClick={saveOrg}
                disabled={orgSaving}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900 shrink-0"
              >
                {orgSuccess ? "Saved!" : orgSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Team */}
      {isAdmin && (
        <>
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-stone-100">
              <Users className="w-4 h-4 text-stone-400" />
              <h2 className="font-semibold text-stone-900">Team members</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {user.name ?? "—"}
                      {user.id === session?.user.id && (
                        <span className="ml-2 text-xs text-stone-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                  </div>
                  <select
                    className="border border-stone-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    disabled={user.id === session?.user.id}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="CHEF">Chef</option>
                    <option value="ASSOCIATE">Associate</option>
                  </select>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteModal(user)}
                    disabled={user.id === session?.user.id}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Invite */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-stone-400" />
              <h2 className="font-semibold text-stone-900">Invite a team member</h2>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="chef@restaurant.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                className="flex-1"
              />
              <select
                className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "CHEF" | "ASSOCIATE")}
              >
                <option value="CHEF">Chef</option>
                <option value="ASSOCIATE">Associate</option>
              </select>
              <Button
                onClick={sendInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900 shrink-0"
              >
                {inviting ? "Sending..." : "Send invite"}
              </Button>
            </div>

            {inviteResult.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-green-700 font-medium">Invite created!</p>
                <p className="text-xs text-green-600">
                  Share this link with your team member — it expires in 7 days:
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono bg-white border border-green-200 rounded px-2 py-1.5 break-all text-stone-600 flex-1">
                    {inviteResult.inviteUrl}
                  </p>
                  <button
                        onClick={() => {
                        const url = inviteResult.inviteUrl ?? ""
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(url)
                        } else {
                          // Fallback for non-secure contexts
                          const el = document.createElement("textarea")
                          el.value = url
                          document.body.appendChild(el)
                          el.select()
                          document.execCommand("copy")
                          document.body.removeChild(el)
                        }
                      }}
                    className="text-xs text-green-700 hover:text-green-900 border border-green-200 bg-white rounded px-2 py-1.5 shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 text-xs text-stone-400">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>
                Invites expire after 7 days. Admins have full access.
                Chefs can manage recipes and import invoices.
                Associates can view recipes only.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Delete user modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Remove team member?</h2>
            <p className="text-sm text-stone-500 mb-6">
              <span className="font-medium text-stone-700">
                {deleteModal.name ?? deleteModal.email}
              </span>{" "}
              will lose access to your organization immediately.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
              <Button
                onClick={deleteUser}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? "Removing..." : "Remove member"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
