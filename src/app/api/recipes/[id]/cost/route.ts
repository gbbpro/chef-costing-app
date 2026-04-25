import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { costRecipe } from "@/lib/costing"

async function getRecipeCost(
  recipeId: string,
  organizationId: string,
  systemConversions: { fromUnit: string; fromQty: number; toUnit: string; toQty: number }[]
): Promise<{ totalCost: number | null; yieldQty: number; yieldUnit: string }> {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId, organizationId },
    include: {
      ingredients: {
        include: {
          siteItem: {
            include: {
              conversions: true,
              invoiceItems: {
                include: {
                  priceHistory: {
                    orderBy: { invoiceDate: "desc" },
                    take: 1,
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!recipe) return { totalCost: null, yieldQty: 1, yieldUnit: "" }

  // Recursively cost sub-recipe ingredients
  const enriched = await Promise.all(
    recipe.ingredients.map(async (ing) => {
      if (ing.subRecipeId) {
        const subCost = await getRecipeCost(ing.subRecipeId, organizationId, systemConversions)
        const subRecipe = await prisma.recipe.findUnique({
          where: { id: ing.subRecipeId },
        })
        return {
          ...ing,
          quantity: Number(ing.quantity),
          subRecipe: subRecipe
            ? {
                name: subRecipe.name,
                yieldQty: Number(subRecipe.yieldQty),
                yieldUnit: subRecipe.yieldUnit,
                totalCost: subCost.totalCost,
              }
            : null,
        }
      }
      return {
        ...ing,
        quantity: Number(ing.quantity),
        siteItem: ing.siteItem
          ? {
              ...ing.siteItem,
              conversions: ing.siteItem.conversions.map((c) => ({
                ...c,
                fromQty: Number(c.fromQty),
                toQty: Number(c.toQty),
              })),
              invoiceItems: ing.siteItem.invoiceItems.map((ii) => ({
                ...ii,
                priceHistory: ii.priceHistory.map((p) => ({
                  unitPrice: Number(p.unitPrice),
                  qty: Number(p.qty),
                })),
              })),
            }
          : null,
      }
    })
  )

  const result = costRecipe(enriched, systemConversions)
  return {
    totalCost: result.totalCost,
    yieldQty: Number(recipe.yieldQty),
    yieldUnit: recipe.yieldUnit,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const systemConversions = await prisma.conversion.findMany({
    where: { isSystem: true },
  })

  const sysConv = systemConversions.map((c) => ({
    fromUnit: c.fromUnit,
    fromQty: Number(c.fromQty),
    toUnit: c.toUnit,
    toQty: Number(c.toQty),
  }))

  const recipe = await prisma.recipe.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      ingredients: {
        include: {
          siteItem: {
            include: {
              conversions: true,
              invoiceItems: {
                include: {
                  priceHistory: {
                    orderBy: { invoiceDate: "desc" },
                    take: 1,
                  },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const enriched = await Promise.all(
    recipe.ingredients.map(async (ing) => {
      if (ing.subRecipeId) {
        const subCost = await getRecipeCost(
          ing.subRecipeId,
          session.user.organizationId,
          sysConv
        )
        const subRecipe = await prisma.recipe.findUnique({
          where: { id: ing.subRecipeId },
        })
        return {
          ...ing,
          quantity: Number(ing.quantity),
          subRecipe: subRecipe
            ? {
                name: subRecipe.name,
                yieldQty: Number(subRecipe.yieldQty),
                yieldUnit: subRecipe.yieldUnit,
                totalCost: subCost.totalCost,
              }
            : null,
        }
      }
      return {
        ...ing,
        quantity: Number(ing.quantity),
        siteItem: ing.siteItem
          ? {
              ...ing.siteItem,
              conversions: ing.siteItem.conversions.map((c) => ({
                ...c,
                fromQty: Number(c.fromQty),
                toQty: Number(c.toQty),
              })),
              invoiceItems: ing.siteItem.invoiceItems.map((ii) => ({
                ...ii,
                priceHistory: ii.priceHistory.map((p) => ({
                  unitPrice: Number(p.unitPrice),
                  qty: Number(p.qty),
                })),
              })),
            }
          : null,
      }
    })
  )

  const result = costRecipe(enriched, sysConv)

  return NextResponse.json({
    ...result,
    yieldQty: Number(recipe.yieldQty),
    yieldUnit: recipe.yieldUnit,
    menuPrice: recipe.menuPrice ? Number(recipe.menuPrice) : null,
    targetCostPct: recipe.targetCostPct ? Number(recipe.targetCostPct) : null,
  })
}
