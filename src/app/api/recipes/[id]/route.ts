import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const recipe = await prisma.recipe.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      category: true,
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

  return NextResponse.json(recipe)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const {
    name, categoryId, isSubRecipe, yieldQty, yieldUnit,
    menuPrice, targetCostPct, ingredients, newVersion,
  } = body

  if (newVersion) {
    // Get current recipe to copy from
    const current = await prisma.recipe.findUnique({
      where: { id, organizationId: session.user.organizationId },
      include: { ingredients: true },
    })
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Parse and increment version
    const parts = current.version.split(".")
    const minor = parseInt(parts[1] ?? "0") + 1
    const newVer = `${parts[0]}.${minor}`

    const newRecipe = await prisma.recipe.create({
      data: {
        name: name?.trim() ?? current.name,
        categoryId: categoryId ?? current.categoryId,
        isSubRecipe: isSubRecipe ?? current.isSubRecipe,
        yieldQty: yieldQty ? parseFloat(yieldQty) : Number(current.yieldQty),
        yieldUnit: yieldUnit ?? current.yieldUnit,
        menuPrice: menuPrice !== undefined ? parseFloat(menuPrice) : current.menuPrice ? Number(current.menuPrice) : null,
        targetCostPct: targetCostPct !== undefined ? parseFloat(targetCostPct) : current.targetCostPct ? Number(current.targetCostPct) : null,
        organizationId: session.user.organizationId,
        version: newVer,
        parentVersionId: id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        ingredients: {
          create: (ingredients ?? current.ingredients).map((ing: any, i: number) => ({
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

    return NextResponse.json(newRecipe, { status: 201 })
  }

  // Regular update (no versioning)
  const updated = await prisma.recipe.update({
    where: { id, organizationId: session.user.organizationId },
    data: {
      name: name?.trim(),
      categoryId,
      isSubRecipe,
      yieldQty: yieldQty ? parseFloat(yieldQty) : undefined,
      yieldUnit,
      menuPrice: menuPrice !== undefined ? parseFloat(menuPrice) : undefined,
      targetCostPct: targetCostPct !== undefined ? parseFloat(targetCostPct) : undefined,
      updatedBy: session.user.id,
      ...(ingredients !== undefined ? {
        ingredients: {
          deleteMany: {},
          create: ingredients.map((ing: any, i: number) => ({
            siteItemId: ing.siteItemId ?? null,
            subRecipeId: ing.subRecipeId ?? null,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
            sortOrder: i,
          })),
        },
      } : {}),
    },
    include: {
      category: true,
      ingredients: {
        include: { siteItem: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "ASSOCIATE") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  await prisma.recipe.delete({
    where: { id, organizationId: session.user.organizationId },
  })

  return NextResponse.json({ success: true })
}
