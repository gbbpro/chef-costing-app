import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getResolvableUnits, sortUnits } from "@/lib/conversions"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""

  const systemConversions = await prisma.conversion.findMany({
    where: { isSystem: true },
  })

  const sysConv = systemConversions.map((c) => ({
    id: c.id,
    fromUnit: c.fromUnit,
    fromQty: Number(c.fromQty),
    toUnit: c.toUnit,
    toQty: Number(c.toQty),
    isSystem: true,
  }))

  const siteItems = await prisma.siteItem.findMany({
    where: {
      organizationId: session.user.organizationId,
      name: { contains: q, mode: "insensitive" },
    },
    include: { conversions: true },
    take: 8,
  })

  const subRecipes = await prisma.recipe.findMany({
    where: {
      organizationId: session.user.organizationId,
      isSubRecipe: true,
      name: { contains: q, mode: "insensitive" },
    },
    take: 4,
  })

  const siteItemResults = siteItems.map((item) => {
    const allConversions = [
      ...sysConv,
      ...item.conversions.map((c) => ({
        id: c.id,
        fromUnit: c.fromUnit,
        fromQty: Number(c.fromQty),
        toUnit: c.toUnit,
        toQty: Number(c.toQty),
        isSystem: false,
      })),
    ]
    const resolvable = getResolvableUnits(allConversions)
    const units = sortUnits(resolvable)
    return {
      type: "siteItem" as const,
      id: item.id,
      name: item.name,
      units,
      conversionsPending: item.conversionsPending || item.conversions.length === 0,
    }
  })

  // For sub-recipes, expand units using system conversions from the yield unit
  const subRecipeResults = subRecipes.map((r) => {
    // Seed a fake conversion set starting from yieldUnit using system conversions
    const seedConversions = sysConv.filter(
      (c) => c.fromUnit === r.yieldUnit || c.toUnit === r.yieldUnit
    )
    // Build resolvable units from yieldUnit through system chain
    const allUnits = getResolvableUnits(seedConversions)
    // Always include the yield unit itself
    allUnits.add(r.yieldUnit)
    const units = sortUnits(allUnits)

    return {
      type: "subRecipe" as const,
      id: r.id,
      name: r.name,
      units,
      yieldQty: Number(r.yieldQty),
      yieldUnit: r.yieldUnit,
    }
  })

  return NextResponse.json([...siteItemResults, ...subRecipeResults])
}
