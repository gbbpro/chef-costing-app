import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { fromQty, fromUnit, toQty, toUnit } = await req.json()

  if (!fromUnit || !toUnit || !fromQty || !toQty) {
    return NextResponse.json({ error: "All conversion fields are required" }, { status: 400 })
  }

  // Verify site item belongs to org
  const item = await prisma.siteItem.findUnique({
    where: { id, organizationId: session.user.organizationId },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const conversion = await prisma.conversion.create({
    data: {
      siteItemId: id,
      fromQty: parseFloat(fromQty),
      fromUnit: fromUnit.trim().toLowerCase(),
      toQty: parseFloat(toQty),
      toUnit: toUnit.trim().toLowerCase(),
      isSystem: false,
    },
  })

  // Mark conversions as no longer pending
  await prisma.siteItem.update({
    where: { id },
    data: { conversionsPending: false },
  })

  return NextResponse.json(conversion, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { conversionId } = await req.json()

  // Verify ownership via site item
  const conversion = await prisma.conversion.findUnique({
    where: { id: conversionId },
    include: { siteItem: true },
  })

  if (!conversion || conversion.siteItem?.organizationId !== session.user.organizationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.conversion.delete({ where: { id: conversionId } })

  // Check if any conversions remain
  const remaining = await prisma.conversion.count({ where: { siteItemId: id } })
  if (remaining === 0) {
    await prisma.siteItem.update({ where: { id }, data: { conversionsPending: true } })
  }

  return NextResponse.json({ success: true })
}
