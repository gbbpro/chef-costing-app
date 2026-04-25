import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""

  const items = await prisma.siteItem.findMany({
    where: {
      organizationId: session.user.organizationId,
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 10,
  })

  return NextResponse.json(items)
}
