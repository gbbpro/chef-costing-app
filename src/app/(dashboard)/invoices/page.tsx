"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, AlertTriangle, CheckCircle2 } from "lucide-react"

interface UnassignedItem {
  id: string
  itemCode: string
  description: string
  purchaseUnit: string
  vendor: { name: string }
  priceHistory: { unitPrice: number; invoiceDate: string }[]
}

interface SiteItem { id: string; name: string }

export default function InvoicesPage() {
  const [unassigned, setUnassigned] = useState<UnassignedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [query, setQuery] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, SiteItem[]>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const res = await fetch("/api/invoices/unassigned")
    const data = await res.json()
    setUnassigned(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function search(id: string, q: string) {
    setQuery((prev) => ({ ...prev, [id]: q }))
    if (!q.trim()) { setResults((prev) => ({ ...prev, [id]: [] })); return }
    const res = await fetch(`/api/invoices/site-items/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults((prev) => ({ ...prev, [id]: data }))
  }

  async function assign(invoiceItemId: string, siteItemId: string, siteItemName: string) {
    setSaving(invoiceItemId)
    await fetch(`/api/invoices/unassigned/${invoiceItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteItemId }),
    })
    setSaving(null)
    setAssigning(null)
    setQuery((prev) => ({ ...prev, [invoiceItemId]: siteItemName }))
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Invoices</h1>
          <p className="text-sm text-stone-500 mt-0.5">Import and track vendor invoices</p>
        </div>
        <Link href="/invoices/import">
          <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900">
            <Upload className="w-4 h-4 mr-2" />
            Import invoice
          </Button>
        </Link>
      </div>

      {/* Unassigned items */}
      {!loading && unassigned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-700">
              {unassigned.length} unassigned SKU{unassigned.length !== 1 ? "s" : ""}
            </h2>
            <span className="text-xs text-stone-400">— assign to an ingredient to track pricing</span>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden divide-y divide-stone-100">
            {unassigned.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 border-l-2 border-amber-400">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{item.description}</p>
                  <p className="text-xs text-stone-400 font-mono">
                    {item.itemCode} · {item.vendor.name} · {item.purchaseUnit}
                    {item.priceHistory[0] && (
                      <> · ${Number(item.priceHistory[0].unitPrice).toFixed(2)}</>
                    )}
                  </p>
                </div>

                {assigning === item.id ? (
                  <div className="relative w-64">
                    <input
                      autoFocus
                      className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Search ingredients..."
                      value={query[item.id] ?? ""}
                      onChange={(e) => search(item.id, e.target.value)}
                      onBlur={() => setTimeout(() => setAssigning(null), 200)}
                    />
                    {(results[item.id]?.length ?? 0) > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
                        {results[item.id].map((si) => (
                          <button
                            key={si.id}
                            onMouseDown={() => assign(item.id, si.id, si.name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50"
                          >
                            {si.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAssigning(item.id)}
                    disabled={saving === item.id}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 shrink-0"
                  >
                    {saving === item.id ? "Saving..." : "Assign ingredient"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : unassigned.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-stone-500 font-medium">All SKUs assigned</p>
          <p className="text-sm text-stone-400 mt-1">Import another invoice to add more items</p>
        </div>
      ) : null}
    </div>
  )
}
