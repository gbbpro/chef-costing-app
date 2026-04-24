"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, AlertTriangle, CheckCircle2 } from "lucide-react"
import { analyzeConversions, sortUnits } from "@/lib/conversions"

interface Conversion {
  id: string
  fromQty: number
  fromUnit: string
  toQty: number
  toUnit: string
  isSystem: boolean
}

interface ConversionPanelProps {
  siteItemId: string
  conversions: Conversion[]
  onChange: () => void
}

export function ConversionPanel({ siteItemId, conversions, onChange }: ConversionPanelProps) {
  const [fromQty, setFromQty] = useState("")
  const [fromUnit, setFromUnit] = useState("")
  const [toQty, setToQty] = useState("")
  const [toUnit, setToUnit] = useState("")
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState("")

  const analysis = analyzeConversions(
    conversions.map((c) => ({ ...c, fromQty: Number(c.fromQty), toQty: Number(c.toQty) }))
  )
  const sortedUnits = sortUnits(analysis.resolvableUnits)

  async function handleAdd() {
    if (!fromQty || !fromUnit || !toQty || !toUnit) {
      setError("All fields are required")
      return
    }
    setAdding(true)
    setError("")

    const res = await fetch(`/api/ingredients/${siteItemId}/conversions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromQty, fromUnit, toQty, toUnit }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "Failed to add conversion")
      setAdding(false)
      return
    }

    setFromQty("")
    setFromUnit("")
    setToQty("")
    setToUnit("")
    setAdding(false)
    onChange()
  }

  async function handleDelete(conversionId: string) {
    await fetch(`/api/ingredients/${siteItemId}/conversions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversionId }),
    })
    onChange()
  }

  return (
    <div className="space-y-4">
      {/* Existing conversions */}
      {conversions.length === 0 ? (
        <p className="text-sm text-stone-400 italic">No conversions defined yet.</p>
      ) : (
        <div className="space-y-1">
          {conversions.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm bg-stone-50 rounded-lg px-3 py-2">
              <span className="text-stone-700 flex-1">
                <span className="font-medium">{Number(c.fromQty)}</span> {c.fromUnit}
                <span className="text-stone-400 mx-2">=</span>
                <span className="font-medium">{Number(c.toQty)}</span> {c.toUnit}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(c.id)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new conversion */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Add conversion</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="1"
            value={fromQty}
            onChange={(e) => setFromQty(e.target.value)}
            className="w-16 text-center"
            type="number"
            min="0"
          />
          <Input
            placeholder="cs"
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-24"
          />
          <span className="text-stone-400 shrink-0">=</span>
          <Input
            placeholder="20"
            value={toQty}
            onChange={(e) => setToQty(e.target.value)}
            className="w-16 text-center"
            type="number"
            min="0"
          />
          <Input
            placeholder="lb"
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-24"
          />
          <Button
            onClick={handleAdd}
            disabled={adding}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-stone-900 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Analysis */}
      {analysis.resolvableUnits.size > 0 && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Resolvable units
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedUnits.map((unit) => (
              <span key={unit} className="px-2 py-0.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600">
                {unit}
              </span>
            ))}
          </div>
          {analysis.warning && (
            <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {analysis.warning}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
