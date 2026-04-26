import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId

  const [
    recipeCount,
    subRecipeCount,
    ingredientCount,
    pendingConversions,
    vendorCount,
    recentRecipes,
    recentIngredients,
    unassignedRaw,
  ] = await Promise.all([
    prisma.recipe.count({
      where: { organizationId: orgId, isSubRecipe: false },
    }),
    prisma.recipe.count({
      where: { organizationId: orgId, isSubRecipe: true },
    }),
    prisma.siteItem.count({
      where: { organizationId: orgId },
    }),
    prisma.siteItem.count({
      where: {
        organizationId: orgId,
        OR: [
          { conversionsPending: true },
          { conversions: { none: {} } },
        ],
      },
    }),
    prisma.vendor.count({
      where: { organizationId: orgId },
    }),
    prisma.recipe.findMany({
      where: { organizationId: orgId, isSubRecipe: false },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        version: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    }),
    prisma.siteItem.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { conversionsPending: true },
          { conversions: { none: {} } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count
      FROM "InvoiceItem"
      WHERE "organizationId" = ${orgId}
      AND "siteItemId" IS NULL
    `,
  ])

  const unassignedSkus = unassignedRaw[0]?.count ?? 0

  return NextResponse.json({
    recipes: recipeCount,
    subRecipes: subRecipeCount,
    ingredients: ingredientCount,
    pendingConversions,
    vendors: vendorCount,
    unassignedSkus,
    recentRecipes,
    recentIngredients,
  })
}
