import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(vendors)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, contactName, email, phone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })

  const vendor = await prisma.vendor.create({
    data: {
      name: name.trim(),
      contactName: contactName?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      organizationId: session.user.organizationId,
    },
  })

  return NextResponse.json(vendor, { status: 201 })
}
