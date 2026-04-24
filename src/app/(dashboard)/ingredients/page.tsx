"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConversionPanel } from "@/components/ingredients/conversion-panel"
import {
  Plus, Pencil, Trash2, Package,
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle
} from "lucide-react"

interface Conversion {
  id: string
  fromQty: number
  fromUnit: string
  toQty: number
  toUnit: string
  isSystem: boolean
}

interface SiteItem {
  id: string
  name: string
  conversionsPending: boolean
  conversions: Conversion[]
  _count: { invoiceItems: number }
}

export default function IngredientsPage() {
  const [items, setItems] = useState<SiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null)
  const [selected, setSelected] = useState<SiteItem | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [nameError, setNameError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function load() {
    const res = await fetch("/api/ingredients")
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setNameInput("")
    setNameError("")
    setModal("create")
  }

  function openEdit(item: SiteItem) {
    setSelected(item)
    setNameInput(item.name)
    setNameError("")
    setModal("edit")
  }

  function openDelete(item: SiteItem) {
    setSelected(item)
    setModal("delete")
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
    setNameInput("")
    setNameError("")
  }

  async function handleSave() {
    if (!nameInput.trim()) {
      setNameError("Name is required")
      return
    }
    setSaving(true)
    setNameError("")

    const res = await fetch(
      modal === "edit" && selected ? `/api/ingredients/${selected.id}` : "/api/ingredients",
      {
        method: modal === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      }
    )

    const data = await res.json()
    if (!res.ok) {
      setNameError(data.error ?? "Something went wrong")
      setSaving(false)
      return
    }

    setSaving(false)
    closeModal()
    load()
  }

  async function handleDelete() {
    if (!selected) return
    setDeleteLoading(true)
    await fetch(`/api/ingredients/${selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    closeModal()
    load()
  }

  function toggleExpand(id: string) {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Ingredients</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage site items and their unit conversions
          </p>
        </div>
        <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          <Plus className="w-4 h-4 mr-2" />
          Add ingredient
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-10 h-10 text-stone-300 mb-3" />
          <p className="text-stone-500 font-medium">No ingredients yet</p>
          <p className="text-stone-400 text-sm mt-1">Add your first ingredient to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.id}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  {expanded === item.id
                    ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  }
                  <span className="font-medium text-stone-900">{item.name}</span>
                  {item.conversionsPending || item.conversions.length === 0 ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      Conversions pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.conversions.length} conversion{item.conversions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {item._count.invoiceItems > 0 && (
                    <span className="text-xs text-stone-400">
                      {item._count.invoiceItems} SKU{item._count.invoiceItems !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDelete(item)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded conversion panel */}
              {expanded === item.id && (
                <div className="px-10 py-4 bg-stone-50 border-t border-stone-100">
                  <ConversionPanel
                    siteItemId={item.id}
                    conversions={item.conversions}
                    onChange={load}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {modal === "create" ? "Add ingredient" : "Edit ingredient"}
            </h2>
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-stone-700">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Heavy Cream"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              {nameError && <p className="text-sm text-red-500">{nameError}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                {saving ? "Saving..." : modal === "create" ? "Add ingredient" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === "delete" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Delete ingredient?</h2>
            <p className="text-sm text-stone-500 mb-6">
              <span className="font-medium text-stone-700">{selected.name}</span> and all its
              conversions will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteLoading ? "Deleting..." : "Delete ingredient"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
