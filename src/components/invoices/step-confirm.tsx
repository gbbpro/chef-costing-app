"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import type { ParsedRow } from "@/app/(dashboard)/invoices/import/page"

interface StepConfirmProps {
  rows: ParsedRow[]
  vendorId: string
  importing: boolean
  importResult: { created: number; updated: number } | null
  onBack: () => void
  onImport: () => void
  onDone: () => void
}

export function StepConfirm({
  rows,
  importing,
  importResult,
  onBack,
  onImport,
  onDone,
}: StepConfirmProps) {
  const assigned = rows.filter((r) => !!r.siteItemId)
  const unassigned = rows.filter((r) => !r.siteItemId)
  const total = rows.reduce((sum, r) => sum + r.extendedPrice, 0)

  if (importResult) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Import complete</h2>
          <p className="text-stone-500 text-sm mt-1">
            {importResult.created} item{importResult.created !== 1 ? "s" : ""} created,{" "}
            {importResult.updated} updated
          </p>
        </div>
        {unassigned.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            {unassigned.length} item{unassigned.length !== 1 ? "s were" : " was"} skipped — no site item assigned.
            You can assign them from the Ingredients page.
          </div>
        )}
        <Button onClick={onDone} className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          Done
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{rows.length}</p>
          <p className="text-xs text-stone-500 mt-1">Total line items</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{assigned.length}</p>
          <p className="text-xs text-stone-500 mt-1">Ready to import</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{unassigned.length}</p>
          <p className="text-xs text-stone-500 mt-1">Will be skipped</p>
        </div>
      </div>

      {/* Invoice total */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-stone-700">Invoice total</span>
        <span className="text-lg font-bold text-stone-900">${total.toFixed(2)}</span>
      </div>

      {unassigned.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            {unassigned.length} item{unassigned.length !== 1 ? "s" : ""} without a site item assignment will be skipped.
            Their price history won&apos;t be tracked until assigned.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button
          onClick={onImport}
          disabled={importing || assigned.length === 0}
          className="bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          {importing ? "Importing..." : `Import ${assigned.length} item${assigned.length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  )
}
