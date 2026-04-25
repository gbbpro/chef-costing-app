import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const isSubRecipe = searchParams.get("subRecipe") === "true"
    ? true
    : searchParams.get("subRecipe") === "false"
    ? false
    : undefined

  const recipes = await prisma.recipe.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(isSubRecipe !== undefined ? { isSubRecipe } : {}),
    },
    include: {
      category: true,
      ingredients: {
        include: {
          siteItem: true,
        },
      },
    },
    orderBy: [{ isSubRecipe: "asc" }, { name: "asc" }],
  })

  return NextResponse.json(recipes)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const {
    name, categoryId, isSubRecipe, yieldQty, yieldUnit,
    menuPrice, targetCostPct, ingredients,
  } = body

  if (!name?.trim() || !categoryId || !yieldQty || !yieldUnit) {
    return NextResponse.json({ error: "Name, category, yield qty and unit are required" }, { status: 400 })
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: name.trim(),
      categoryId,
      isSubRecipe: isSubRecipe ?? false,
      yieldQty: parseFloat(yieldQty),
      yieldUnit: yieldUnit.trim(),
      menuPrice: menuPrice ? parseFloat(menuPrice) : null,
      targetCostPct: targetCostPct ? parseFloat(targetCostPct) : null,
      organizationId: session.user.organizationId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
      version: "1.0",
      ingredients: {
        create: (ingredients ?? []).map((ing: any, i: number) => ({
          siteItemId: ing.siteItemId ?? null,
          subRecipeId: ing.subRecipeId ?? null,
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          sortOrder: i,
        })),
      },
    },
    include: {
      category: true,
      ingredients: {
        include: { siteItem: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return NextResponse.json(recipe, { status: 201 })
}
