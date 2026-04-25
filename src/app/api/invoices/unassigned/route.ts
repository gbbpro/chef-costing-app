import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items = await prisma.$queryRaw`
    SELECT 
      ii.id,
      ii."itemCode",
      ii.description,
      ii."purchaseUnit",
      ii."createdAt",
      v.name as "vendorName",
      ip."unitPrice",
      ip."invoiceDate"
    FROM "InvoiceItem" ii
    JOIN "Vendor" v ON v.id = ii."vendorId"
    LEFT JOIN LATERAL (
      SELECT "unitPrice", "invoiceDate"
      FROM "InvoicePrice"
      WHERE "invoiceItemId" = ii.id
      ORDER BY "invoiceDate" DESC
      LIMIT 1
    ) ip ON true
    WHERE ii."organizationId" = ${session.user.organizationId}
    AND ii."siteItemId" IS NULL
    ORDER BY ii."createdAt" DESC
  `

  // Reshape to match the expected interface
  const shaped = (items as any[]).map((i) => ({
    id: i.id,
    itemCode: i.itemCode,
    description: i.description,
    purchaseUnit: i.purchaseUnit,
    createdAt: i.createdAt,
    vendor: { name: i.vendorName },
    priceHistory: i.unitPrice ? [{ unitPrice: i.unitPrice, invoiceDate: i.invoiceDate }] : [],
  }))

  return NextResponse.json(shaped)
}
