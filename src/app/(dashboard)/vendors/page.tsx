"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { VendorForm } from "@/components/vendors/vendor-form"
import { Plus, Pencil, Trash2, Truck } from "lucide-react"

interface Vendor {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null)
  const [selected, setSelected] = useState<Vendor | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function load() {
    const res = await fetch("/api/vendors")
    const data = await res.json()
    setVendors(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openEdit(vendor: Vendor) {
    setSelected(vendor)
    setModal("edit")
  }

  function openDelete(vendor: Vendor) {
    setSelected(vendor)
    setModal("delete")
  }

  function closeModal() {
    setModal(null)
    setSelected(null)
  }

  async function handleDelete() {
    if (!selected) return
    setDeleteLoading(true)
    await fetch(`/api/vendors/${selected.id}`, { method: "DELETE" })
    setDeleteLoading(false)
    closeModal()
    load()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Vendors</h1>
          <p className="text-sm text-stone-500 mt-0.5">Manage your suppliers and distributors</p>
        </div>
        <Button onClick={() => setModal("create")} className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          <Plus className="w-4 h-4 mr-2" />
          Add vendor
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : vendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Truck className="w-10 h-10 text-stone-300 mb-3" />
          <p className="text-stone-500 font-medium">No vendors yet</p>
          <p className="text-stone-400 text-sm mt-1">Add your first vendor to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Phone</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-900">{vendor.name}</td>
                  <td className="px-4 py-3 text-stone-600">{vendor.contactName ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{vendor.email ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{vendor.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(vendor)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDelete(vendor)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {modal === "create" ? "Add vendor" : "Edit vendor"}
            </h2>
            <VendorForm
              initial={modal === "edit" && selected ? selected : undefined}
              onSuccess={() => { closeModal(); load() }}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {modal === "delete" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Delete vendor?</h2>
            <p className="text-sm text-stone-500 mb-6">
              <span className="font-medium text-stone-700">{selected.name}</span> will be permanently deleted.
              This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteLoading ? "Deleting..." : "Delete vendor"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
