import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const body = await req.json()
  console.log("Accept invite body:", body)
  const { token, name, password } = body

  if (!token || !name?.trim() || !password) {
    console.log("Validation failed:", { token: !!token, name: !!name?.trim(), password: !!password })
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const invite = await prisma.invite.findUnique({ where: { token } })

  if (!invite) return NextResponse.json({ error: "Invalid invite link" }, { status: 404 })
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 })
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } })
  if (existing) return NextResponse.json({ error: "Account already exists for this email" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name: name.trim(),
      email: invite.email,
      password: hashed,
      role: invite.role,
      organizationId: invite.organizationId,
    },
  })

  await prisma.invite.delete({ where: { token } })

  return NextResponse.json({ success: true })
}
