import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { name, contactName, email, phone } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Vendor name is required" }, { status: 400 })

  const vendor = await prisma.vendor.update({
    where: { id, organizationId: session.user.organizationId },
    data: {
      name: name.trim(),
      contactName: contactName?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    },
  })

  return NextResponse.json(vendor)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  await prisma.vendor.delete({
    where: { id, organizationId: session.user.organizationId },
  })

  return NextResponse.json({ success: true })
}
