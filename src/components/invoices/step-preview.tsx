"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Scale } from "lucide-react"
import type { ParsedRow } from "@/app/(dashboard)/invoices/import/page"

interface StepPreviewProps {
  rows: ParsedRow[]
  catchWeightRows: ParsedRow[]
  onRowsChange: (rows: ParsedRow[]) => void
  onBack: () => void
  onNext: () => void
}

export function StepPreview({ rows, catchWeightRows, onRowsChange, onBack, onNext }: StepPreviewProps) {
  const [catchWeightUnit, setCatchWeightUnit] = useState<"lb" | "cs">("lb")

  function applyCatchWeightUnit(unit: "lb" | "cs") {
    setCatchWeightUnit(unit)
    onRowsChange(rows.map((r) =>
      r.isCatchWeight ? { ...r, purchaseUnit: unit } : r
    ))
  }

  function updatePurchaseUnit(itemCode: string, unit: string) {
    onRowsChange(rows.map((r) =>
      r.itemCode === itemCode ? { ...r, purchaseUnit: unit } : r
    ))
  }

  return (
    <div className="space-y-4">
      {/* Catch weight banner */}
      {catchWeightRows.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {catchWeightRows.length} catch-weight item{catchWeightRows.length !== 1 ? "s" : ""} detected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                These items are priced by weight. How should the purchase unit be recorded?
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => applyCatchWeightUnit("lb")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    catchWeightUnit === "lb"
                      ? "bg-amber-500 border-amber-500 text-stone-900"
                      : "bg-white border-stone-200 text-stone-600 hover:border-amber-400"
                  }`}
                >
                  Price per lb (recommended)
                </button>
                <button
                  onClick={() => applyCatchWeightUnit("cs")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    catchWeightUnit === "cs"
                      ? "bg-amber-500 border-amber-500 text-stone-900"
                      : "bg-white border-stone-200 text-stone-600 hover:border-amber-400"
                  }`}
                >
                  Price per case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50">
                <th className="text-left px-4 py-3 font-medium text-stone-500">Item Code</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Description</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Qty</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Unit Price</th>
                <th className="text-right px-4 py-3 font-medium text-stone-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Purchase Unit</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.itemCode} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-stone-500">{row.itemCode}</td>
                  <td className="px-4 py-2.5 text-stone-800 max-w-xs truncate">{row.description}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">
                    {row.isCatchWeight ? `${row.catchWeight} lb` : row.qty}
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-600">
                    ${row.unitPrice.toFixed(4)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-stone-800">
                    ${row.extendedPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      className="w-20 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      value={row.purchaseUnit}
                      onChange={(e) => updatePurchaseUnit(row.itemCode, e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {row.isKnown ? (
                      <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        Known
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> New
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <Button onClick={onNext} className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          Next →
        </Button>
      </div>
    </div>
  )
}
