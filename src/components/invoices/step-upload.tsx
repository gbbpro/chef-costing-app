"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Plus } from "lucide-react"

interface Vendor { id: string; name: string }

interface StepUploadProps {
  vendorId: string
  onVendorChange: (id: string) => void
  onParsed: (rows: any[]) => void
}

export function StepUpload({ vendorId, onVendorChange, onParsed }: StepUploadProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState("")
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState("")
  const [creatingVendor, setCreatingVendor] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadVendors() {
    setLoadingVendors(true)
    const res = await fetch("/api/vendors")
    const data = await res.json()
    setVendors(data)
    setLoadingVendors(false)
  }

  useState(() => { loadVendors() }, [])

  async function createVendor() {
    if (!newVendorName.trim()) return
    setCreatingVendor(true)
    const res = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newVendorName.trim() }),
    })
    const data = await res.json()
    setCreatingVendor(false)
    if (res.ok) {
      setVendors((v) => [...v, data].sort((a, b) => a.name.localeCompare(b.name)))
      onVendorChange(data.id)
      setShowNewVendor(false)
      setNewVendorName("")
    }
  }

  async function handleParse() {
    if (!file || !vendorId) return
    setParsing(true)
    setError("")

    const form = new FormData()
    form.append("file", file)

    const res = await fetch("/api/invoices/parse", { method: "POST", body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Failed to parse file")
      setParsing(false)
      return
    }

    setParsing(false)
    onParsed(data.rows)
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
      {/* Vendor select */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Select vendor <span className="text-red-500">*</span>
        </label>
        {loadingVendors ? (
          <p className="text-sm text-stone-400">Loading vendors...</p>
        ) : (
          <div className="space-y-2">
            <select
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={vendorId}
              onChange={(e) => onVendorChange(e.target.value)}
            >
              <option value="">— Select a vendor —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {!showNewVendor ? (
              <button
                onClick={() => setShowNewVendor(true)}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
              >
                <Plus className="w-3 h-3" /> Add new vendor
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Vendor name"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createVendor()}
                  autoFocus
                />
                <Button size="sm" onClick={createVendor} disabled={creatingVendor}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900">
                  {creatingVendor ? "..." : "Add"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewVendor(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Invoice CSV <span className="text-red-500">*</span>
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
        >
          <Upload className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-medium text-stone-700">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-stone-500">Click to upload or drag and drop</p>
              <p className="text-xs text-stone-400 mt-1">CSV files only</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <Button
          onClick={handleParse}
          disabled={!file || !vendorId || parsing}
          className="bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          {parsing ? "Parsing..." : "Parse invoice →"}
        </Button>
      </div>
    </div>
  )
}
