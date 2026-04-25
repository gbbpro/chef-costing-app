"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Plus, UtensilsCrossed, ChevronRight,
  AlertCircle, CheckCircle2, Layers
} from "lucide-react"

interface Recipe {
  id: string
  name: string
  version: string
  isSubRecipe: boolean
  yieldQty: number
  yieldUnit: string
  menuPrice: number | null
  targetCostPct: number | null
  category: { name: string }
  ingredients: { id: string }[]
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "recipes" | "sub-recipes">("all")

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => { setRecipes(data); setLoading(false) })
  }, [])

  const displayed = recipes.filter((r) => {
    if (filter === "recipes") return !r.isSubRecipe
    if (filter === "sub-recipes") return r.isSubRecipe
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Recipes</h1>
          <p className="text-sm text-stone-500 mt-0.5">Build and cost your menu</p>
        </div>
        <Link href="/recipes/new">
          <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900">
            <Plus className="w-4 h-4 mr-2" />
            New recipe
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-stone-100 rounded-lg p-1 w-fit">
        {(["all", "recipes", "sub-recipes"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone-400 text-sm">Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UtensilsCrossed className="w-10 h-10 text-stone-300 mb-3" />
          <p className="text-stone-500 font-medium">No recipes yet</p>
          <p className="text-stone-400 text-sm mt-1">Create your first recipe to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {recipe.isSubRecipe && (
                      <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        <Layers className="w-3 h-3" />
                        Sub-recipe
                      </span>
                    )}
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {recipe.category.name}
                    </span>
                  </div>
                  <h2 className="font-semibold text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                    {recipe.name}
                  </h2>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 shrink-0 mt-1 transition-colors" />
              </div>

              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>
                  Yield: {Number(recipe.yieldQty)} {recipe.yieldUnit}
                </span>
                <span className="text-stone-400">v{recipe.version}</span>
              </div>

              {recipe.menuPrice && (
                <div className="mt-2 text-xs text-stone-500">
                  Menu price: ${Number(recipe.menuPrice).toFixed(2)}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center gap-1.5">
                {recipe.ingredients.length === 0 ? (
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <AlertCircle className="w-3 h-3" />
                    No ingredients
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-stone-500">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
