"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { UtensilsCrossed, Layers, AlertTriangle } from "lucide-react"

interface SearchResult {
  type: "siteItem" | "subRecipe"
  id: string
  name: string
  units: string[]
  conversionsPending?: boolean
  yieldQty?: number
  yieldUnit?: string
}

interface IngredientSearchProps {
  onSelect: (result: SearchResult) => void
  placeholder?: string
}

export function IngredientSearch({ onSelect, placeholder }: IngredientSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) { setResults([]); return }
    const res = await fetch(`/api/recipes/ingredients/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setOpen(true)
  }

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 250)
  }

  function handleSelect(result: SearchResult) {
    onSelect(result)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "Search ingredients or sub-recipes..."}
        className="text-sm"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onMouseDown={() => handleSelect(r)}
              className="w-full text-left px-3 py-2.5 hover:bg-amber-50 flex items-center gap-3 border-b border-stone-50 last:border-0"
            >
              {r.type === "subRecipe" ? (
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <UtensilsCrossed className="w-4 h-4 text-stone-300 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">{r.name}</p>
                <p className="text-xs text-stone-400">
                  {r.type === "subRecipe"
                    ? `Sub-recipe · yields ${r.yieldQty} ${r.yieldUnit}`
                    : r.units.length > 0
                    ? `Units: ${r.units.slice(0, 5).join(", ")}${r.units.length > 5 ? "…" : ""}`
                    : "No conversions defined"
                  }
                </p>
              </div>
              {r.conversionsPending && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
