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
  siteItemId: string
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

  // Verify vendor belongs to org
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, organizationId: session.user.organizationId },
  })
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 })

  let created = 0
  let updated = 0

  for (const row of rows) {
    // Upsert invoice item
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
          siteItemId: row.siteItemId,
          vendorId,
          organizationId: session.user.organizationId,
        },
      })
      invoiceItemId = created_.id
      created++
    }

    // Always append a new price record
    await prisma.invoicePrice.create({
      data: {
        invoiceItemId,
        unitPrice: row.isCatchWeight && row.catchWeight
          ? row.unitPrice  // already per lb
          : row.unitPrice,
        extendedPrice: row.extendedPrice,
        qty: row.isCatchWeight && row.catchWeight
          ? row.catchWeight  // actual weight received
          : row.qty,
        invoiceDate: new Date(row.invoiceDate),
      },
    })
  }

  return NextResponse.json({ success: true, created, updated })
}
