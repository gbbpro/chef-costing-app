import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { siteItemId } = await req.json()

  const item = await prisma.invoiceItem.update({
    where: { id, organizationId: session.user.organizationId },
    data: { siteItemId },
  })

  return NextResponse.json(item)
}
