import { RecipeForm } from "@/components/recipes/recipe-form"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { id } = await params

  const recipe = await prisma.recipe.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: {
      category: true,
      ingredients: {
        include: { siteItem: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!recipe) redirect("/recipes")

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Edit recipe</h1>
        <p className="text-sm text-stone-500 mt-0.5">{recipe.name} · v{recipe.version}</p>
      </div>
      <RecipeForm
        initial={{
          id: recipe.id,
          name: recipe.name,
          categoryId: recipe.categoryId,
          isSubRecipe: recipe.isSubRecipe,
          yieldQty: Number(recipe.yieldQty),
          yieldUnit: recipe.yieldUnit,
          menuPrice: recipe.menuPrice ? Number(recipe.menuPrice) : null,
          targetCostPct: recipe.targetCostPct ? Number(recipe.targetCostPct) : null,
          version: recipe.version,
          ingredients: recipe.ingredients.map((ing) => ({
            id: ing.id,
            siteItemId: ing.siteItemId,
            subRecipeId: ing.subRecipeId,
            quantity: Number(ing.quantity),
            unit: ing.unit,
            siteItem: ing.siteItem ? { name: ing.siteItem.name } : null,
          })),
        }}
      />
    </div>
  )
}
