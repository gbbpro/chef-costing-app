import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { email, role } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: "Email is required" }, { status: 400 })

  // Check if user already exists in org
  const existing = await prisma.user.findUnique({ where: { email: email.trim() } })
  if (existing) return NextResponse.json({ error: "User already has an account" }, { status: 409 })

  // Get org name
  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  })

  // Create invite — expires in 7 days
  const invite = await prisma.invite.create({
    data: {
      email: email.trim(),
      role: role ?? "ASSOCIATE",
      organizationId: session.user.organizationId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invite?token=${invite.token}`

  // Send email
  try {
    const result = await resend.emails.send({
      from: "Chef Costing <onboarding@resend.dev>",
      to: email.trim(),
      subject: `You've been invited to ${org?.name ?? "Chef Costing"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You've been invited</h2>
          <p>${session.user.name ?? "An admin"} has invited you to join <strong>${org?.name}</strong> on Chef Costing as a <strong>${role ?? "Associate"}</strong>.</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #f59e0b; color: #1c1917; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
            Accept invitation
          </a>
          <p style="color: #78716c; font-size: 14px;">This invitation expires in 7 days. If you didn't expect this, you can ignore it.</p>
        </div>
      `,
    })
    console.log("resend result:", JSON.stringify(result))
  } catch (e) {
    console.error("Email send failed:", e)
    // Don't fail the invite if email fails — return the link
    return NextResponse.json({ success: true, inviteUrl, emailFailed: true })
  }

  return NextResponse.json({ success: true , inviteUrl})
}
