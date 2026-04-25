"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react"
import type { ParsedRow } from "@/app/(dashboard)/invoices/import/page"

interface SiteItem { id: string; name: string }

interface StepOnboardingProps {
  rows: ParsedRow[]
  onRowsChange: (rows: ParsedRow[]) => void
  onBack: () => void
  onNext: () => void
}

function SiteItemSearch({
  rowIndex,
  description,
  current,
  onAssign,
}: {
  rowIndex: number
  description: string
  current: { siteItemId: string | null; siteItemName: string | null }
  onAssign: (id: string, name: string) => void
}) {
  const [query, setQuery] = useState(current.siteItemName ?? "")
  const [results, setResults] = useState<SiteItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmExisting, setConfirmExisting] = useState<SiteItem | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) { setResults([]); return }
    const res = await fetch(`/api/invoices/site-items/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setShowDropdown(true)
  }

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  async function createAndAssign(name: string) {
    setCreating(true)
    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      onAssign(data.id, data.name)
      setQuery(data.name)
      setShowDropdown(false)
    }
  }

  function handleSelect(item: SiteItem) {
    // Check if exact match — if user typed something slightly different, just assign
    const exactMatch = results.find(
      (r) => r.name.toLowerCase() === query.trim().toLowerCase()
    )
    if (exactMatch && exactMatch.id !== item.id) {
      setConfirmExisting(item)
      return
    }
    onAssign(item.id, item.name)
    setQuery(item.name)
    setShowDropdown(false)
  }

  function handleBlur() {
    setTimeout(() => setShowDropdown(false), 150)
  }

  const assigned = !!current.siteItemId

  return (
    <div className="space-y-2">
      {confirmExisting && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-medium">"{confirmExisting.name}" already exists.</p>
          <p className="mt-1">Assign this SKU to it, or create a new site item?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                onAssign(confirmExisting.id, confirmExisting.name)
                setQuery(confirmExisting.name)
                setConfirmExisting(null)
                setShowDropdown(false)
              }}
              className="px-2 py-1 bg-amber-500 text-stone-900 rounded font-medium"
            >
              Assign to existing
            </button>
            <button
              onClick={() => {
                createAndAssign(query.trim())
                setConfirmExisting(null)
              }}
              className="px-2 py-1 bg-white border border-stone-200 text-stone-700 rounded"
            >
              Create new
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query && search(query)}
          onBlur={handleBlur}
          placeholder="Type to search or create site item..."
          className={assigned ? "border-green-300 bg-green-50" : ""}
        />
        {assigned && (
          <CheckCircle2 className="absolute right-3 top-2.5 w-4 h-4 text-green-500" />
        )}

        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
            {results.map((item) => (
              <button
                key={item.id}
                onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 hover:text-amber-900"
              >
                {item.name}
              </button>
            ))}
            {query.trim() && !results.find((r) => r.name.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                onMouseDown={() => createAndAssign(query.trim())}
                disabled={creating}
                className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2 border-t border-stone-100"
              >
                <Plus className="w-3.5 h-3.5" />
                {creating ? "Creating..." : `Create "${query.trim()}"`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function StepOnboarding({ rows, onRowsChange, onBack, onNext }: StepOnboardingProps) {
  const unknownRows = rows.filter((r) => !r.isKnown || !r.siteItemId)
  const allAssigned = unknownRows.every((r) => !!r.siteItemId)

  function handleAssign(itemCode: string, siteItemId: string, siteItemName: string) {
    onRowsChange(rows.map((r) =>
      r.itemCode === itemCode
        ? { ...r, siteItemId, siteItemName, isKnown: true }
        : r
    ))
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            {unknownRows.length} new item{unknownRows.length !== 1 ? "s" : ""} need to be assigned
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Search for an existing ingredient or create a new one. You can add conversions later.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
        {unknownRows.map((row) => (
          <div key={row.itemCode} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">{row.description}</p>
                <p className="text-xs text-stone-400 font-mono">{row.itemCode}</p>
              </div>
              <span className="text-xs text-stone-500">
                {row.qty} × ${row.unitPrice.toFixed(2)}
              </span>
            </div>
            <SiteItemSearch
              rowIndex={rows.indexOf(row)}
              description={row.description}
              current={{ siteItemId: row.siteItemId, siteItemName: row.siteItemName }}
              onAssign={(id, name) => handleAssign(row.itemCode, id, name)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <div className="flex items-center gap-3">
          {!allAssigned && (
            <p className="text-xs text-stone-400">
              {unknownRows.filter((r) => !r.siteItemId).length} item{unknownRows.filter((r) => !r.siteItemId).length !== 1 ? "s" : ""} still unassigned
            </p>
          )}
          <Button
            onClick={onNext}
            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            {allAssigned ? "Next →" : "Skip unassigned →"}
          </Button>
        </div>
      </div>
    </div>
  )
}
