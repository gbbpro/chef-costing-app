import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface ImportRow {
  itemCode: string
  description: string
  qty: number
  unitPrice: number
  extendedPrice: number
  invoiceNumber: string
  invoiceDate: string
  purchaseUnit: string
  isCatchWeight: boolean
  catchWeight: number | null
  siteItemId: string | null
  vendorId: string
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { rows, vendorId } = await req.json() as { rows: ImportRow[], vendorId: string }

  if (!rows?.length || !vendorId) {
    return NextResponse.json({ error: "Missing rows or vendor" }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, organizationId: session.user.organizationId },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

  // Only import rows that have a siteItemId
  const assignedRows = rows.filter((r) => r.siteItemId)

  if (assignedRows.length === 0) {
    return NextResponse.json({ error: "No assigned rows to import" }, { status: 400 })
  }

  // Create the invoice record
  const totalAmount = assignedRows.reduce((sum, r) => sum + r.extendedPrice, 0)
  const invoiceNumber = assignedRows[0]?.invoiceNumber ?? "UNKNOWN"
  const invoiceDate = new Date(assignedRows[0]?.invoiceDate ?? new Date())

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      invoiceDate,
      vendorId,
      organizationId: session.user.organizationId,
      totalAmount,
      lineItemCount: assignedRows.length,
      createdBy: session.user.id,
    },
  })

  let created = 0
  let updated = 0

  for (const row of assignedRows) {
    const existing = await prisma.invoiceItem.findUnique({
      where: { itemCode_vendorId: { itemCode: row.itemCode, vendorId } },
    })

    let invoiceItemId: string

    if (existing) {
      await prisma.invoiceItem.update({
        where: { id: existing.id },
        data: {
          description: row.description,
          purchaseUnit: row.purchaseUnit,
          siteItemId: row.siteItemId,
        },
      })
      invoiceItemId = existing.id
      updated++
    } else {
      const created_ = await prisma.invoiceItem.create({
        data: {
          itemCode: row.itemCode,
          description: row.description,
          purchaseUnit: row.purchaseUnit,
          siteItemId: row.siteItemId!,
          vendorId,
          organizationId: session.user.organizationId,
        },
      })
      invoiceItemId = created_.id
      created++
    }

    await prisma.invoicePrice.create({
      data: {
        invoiceItemId,
        invoiceId: invoice.id,
        unitPrice: row.isCatchWeight && row.catchWeight
          ? row.unitPrice
          : row.unitPrice,
        extendedPrice: row.extendedPrice,
        qty: row.isCatchWeight && row.catchWeight
          ? row.catchWeight
          : row.qty,
        invoiceDate,
      },
    })
  }

  return NextResponse.json({ success: true, created, updated, invoiceId: invoice.id })
}
