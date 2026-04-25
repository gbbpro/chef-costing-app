import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

  const text = await file.text()

  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (errors.length > 0 && data.length === 0) {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 })
  }

  // Map Sysco columns → normalized rows
  // Skip rows with Current Quantity = 0
  const rows = (data as any[])
    .filter((row) => {
      const qty = parseFloat(row["Current Quantity"] ?? "0")
      return qty > 0
    })
    .map((row) => {
      const weight = parseFloat(row["Weight"] ?? "0")
      const isCatchWeight = weight > 0
      const unitPrice = parseFloat(row["Unit Price"] ?? "0")
      const totalAmount = parseFloat(row["Total Amount"] ?? "0")
      const currentQty = parseFloat(row["Current Quantity"] ?? "1")

      return {
        itemCode: row["Line Item"]?.trim() ?? "",
        description: row["Item Description"]?.trim() ?? "",
        qty: currentQty,
        unitPrice,
        extendedPrice: totalAmount,
        invoiceNumber: row["Invoice"]?.trim() ?? "",
        invoiceDate: row["Invoice Date"]?.trim() ?? "",
        isCatchWeight,
        catchWeight: isCatchWeight ? weight : null,
        // Default purchase unit — will be confirmed by user
        purchaseUnit: isCatchWeight ? "lb" : "cs",
      }
    })

  // Check which item codes already exist in this org
  const itemCodes = rows.map((r) => r.itemCode)
  const existingItems = await prisma.invoiceItem.findMany({
    where: {
      itemCode: { in: itemCodes },
      organizationId: session.user.organizationId,
    },
    include: { siteItem: true },
  })

  const existingMap = new Map(existingItems.map((i) => [i.itemCode, i]))

  const enriched = rows.map((row) => {
    const existing = existingMap.get(row.itemCode)
    return {
      ...row,
      isKnown: !!existing,
      siteItemId: existing?.siteItemId ?? null,
      siteItemName: existing?.siteItem?.name ?? null,
    }
  })

  return NextResponse.json({ rows: enriched })
}
