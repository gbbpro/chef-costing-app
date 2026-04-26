"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Upload, AlertTriangle, CheckCircle2,
  FileText, ChevronRight
} from "lucide-react"

interface UnassignedItem {
  id: string
  itemCode: string
  description: string
  purchaseUnit: string
  vendor: { name: string }
  priceHistory: { unitPrice: number; invoiceDate: string }[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  totalAmount: number
  lineItemCount: number
  createdAt: string
  vendor: { name: string }
}

interface SiteItem { id: string; name: string }

export default function InvoicesPage() {
  const [unassigned, setUnassigned] = useState<UnassignedItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [query, setQuery] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, SiteItem[]>>({})
  const [saving, setSaving] = useState<string | null>(null)

  async function load() {
    const [unassignedRes, historyRes] = await Promise.all([
      fetch("/api/invoices/unassigned"),
      fetch("/api/invoices/history"),
    ])
    const [unassignedData, historyData] = await Promise.all([
      unassignedRes.json(),
      historyRes.json(),
    ])
    setUnassigned(unassignedData)
    setInvoices(historyData)
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
            <span className="text-xs text-stone-400">
              — assign to an ingredient to track pricing
            </span>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden divide-y divide-stone-100">
            {unassigned.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 border-l-2 border-amber-400"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {item.description}
                  </p>
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

      {/* Invoice history */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Import history</h2>
        {loading ? (
          <div className="text-stone-400 text-sm">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-medium">No invoices imported yet</p>
            <p className="text-sm text-stone-400 mt-1">
              Import your first invoice to start tracking prices
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-5 py-3 font-medium text-stone-500">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">
                    Vendor
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-stone-500">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-stone-500">
                    Line items
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-stone-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-stone-300" />
                        <span className="font-mono text-xs text-stone-600">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {invoice.vendor.name}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-500">
                      {invoice.lineItemCount}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-stone-900">
                      ${Number(invoice.totalAmount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-stone-200 bg-stone-50">
                  <td
                    colSpan={4}
                    className="px-5 py-3 text-right text-sm font-medium text-stone-500"
                  >
                    All-time total
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-stone-900">
                    ${invoices
                      .reduce((sum, i) => sum + Number(i.totalAmount), 0)
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* All clear state */}
      {!loading && unassigned.length === 0 && invoices.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          All SKUs assigned
        </div>
      )}
    </div>
  )
}
