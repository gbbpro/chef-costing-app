"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { StepUpload } from "@/components/invoices/step-upload"
import { StepPreview } from "@/components/invoices/step-preview"
import { StepOnboarding } from "@/components/invoices/step-onboarding"
import { StepConfirm } from "@/components/invoices/step-confirm"

export interface ParsedRow {
  itemCode: string
  description: string
  qty: number
  unitPrice: number
  extendedPrice: number
  invoiceNumber: string
  invoiceDate: string
  isCatchWeight: boolean
  catchWeight: number | null
  purchaseUnit: string
  isKnown: boolean
  siteItemId: string | null
  siteItemName: string | null
}

export type ImportStep = "upload" | "preview" | "onboarding" | "confirm"

export default function InvoiceImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<ImportStep>("upload")
  const [vendorId, setVendorId] = useState<string>("")
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number } | null>(null)

  const unknownRows = rows.filter((r) => !r.isKnown || !r.siteItemId)
  const catchWeightRows = rows.filter((r) => r.isCatchWeight)

  async function handleImport() {
    setImporting(true)
    const res = await fetch("/api/invoices/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, vendorId }),
    })
    const data = await res.json()
    setImporting(false)
    if (res.ok) {
      setImportResult(data)
    }
  }

  const steps: ImportStep[] = ["upload", "preview", "onboarding", "confirm"]
  const stepLabels = ["Upload", "Preview", "New Items", "Confirm"]
  const currentIndex = steps.indexOf(step)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Import Invoice</h1>
        <p className="text-sm text-stone-500 mt-0.5">Import line items from a vendor invoice CSV</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              i === currentIndex
                ? "bg-amber-500 text-stone-900"
                : i < currentIndex
                ? "text-green-600"
                : "text-stone-400"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                i < currentIndex
                  ? "bg-green-100 text-green-600"
                  : i === currentIndex
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-400"
              }`}>
                {i < currentIndex ? "✓" : i + 1}
              </span>
              {label}
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`h-px w-8 ${i < currentIndex ? "bg-green-300" : "bg-stone-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === "upload" && (
        <StepUpload
          vendorId={vendorId}
          onVendorChange={setVendorId}
          onParsed={(parsed) => {
            setRows(parsed)
            setStep("preview")
          }}
        />
      )}

      {step === "preview" && (
        <StepPreview
          rows={rows}
          catchWeightRows={catchWeightRows}
          onRowsChange={setRows}
          onBack={() => setStep("upload")}
          onNext={() => {
            if (unknownRows.length > 0) {
              setStep("onboarding")
            } else {
              setStep("confirm")
            }
          }}
        />
      )}

      {step === "onboarding" && (
        <StepOnboarding
          rows={rows}
          onRowsChange={setRows}
          onBack={() => setStep("preview")}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && (
        <StepConfirm
          rows={rows}
          vendorId={vendorId}
          importing={importing}
          importResult={importResult}
          onBack={() => setStep(unknownRows.length > 0 ? "onboarding" : "preview")}
          onImport={handleImport}
          onDone={() => router.push("/invoices")}
        />
      )}
    </div>
  )
}
