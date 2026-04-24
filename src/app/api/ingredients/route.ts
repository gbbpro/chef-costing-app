import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const items = await prisma.siteItem.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      conversions: true,
      _count: { select: { invoiceItems: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const existing = await prisma.siteItem.findUnique({
    where: { name_organizationId: { name: name.trim(), organizationId: session.user.organizationId } },
  })
  if (existing) return NextResponse.json({ error: "An ingredient with this name already exists" }, { status: 409 })

  const item = await prisma.siteItem.create({
    data: {
      name: name.trim(),
      organizationId: session.user.organizationId,
      conversionsPending: true,
    },
    include: { conversions: true, _count: { select: { invoiceItems: true } } },
  })

  return NextResponse.json(item, { status: 201 })
}
