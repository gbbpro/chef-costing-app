"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Pencil, Trash2, AlertTriangle, CheckCircle2,
  Layers, Scale, ChevronRight
} from "lucide-react"
import { formatCurrency, calcCostPct, calcSuggestedPrice } from "@/lib/costing"
import { Input } from "@/components/ui/input"

interface CostLine {
  ingredientId: string
  unitCost: number | null
  totalCost: number | null
  error: string | null
}

interface CostResult {
  lines: CostLine[]
  totalCost: number | null
  isComplete: boolean
  errors: string[]
  yieldQty: number
  yieldUnit: string
  menuPrice: number | null
  targetCostPct: number | null
}

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
  ingredients: {
    id: string
    quantity: number
    unit: string
    sortOrder: number
    siteItemId: string | null
    subRecipeId: string | null
    siteItem: { name: string } | null
  }[]
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [cost, setCost] = useState<CostResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scaleFactor, setScaleFactor] = useState(1)
  const [targetYield, setTargetYield] = useState("")
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [promotions, setPromotions] = useState<Record<string, { qty: number; unit: string }>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/recipes/${id}`).then((r) => r.json()),
      fetch(`/api/recipes/${id}/cost`).then((r) => r.json()),
    ]).then(([r, c]) => {
      setRecipe(r)
      setCost(c)
      setTargetYield(String(Number(r.yieldQty)))
      setLoading(false)
    })
  }, [id])

  function handleTargetYieldChange(val: string) {
    setTargetYield(val)
    if (recipe && parseFloat(val) > 0) {
      setScaleFactor(parseFloat(val) / Number(recipe.yieldQty))
    }
  }

  function handleScaleFactorChange(val: string) {
    setScaleFactor(parseFloat(val) || 1)
    if (recipe) {
      setTargetYield(String((parseFloat(val) || 1) * Number(recipe.yieldQty)))
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/recipes/${id}`, { method: "DELETE" })
    router.push("/recipes")
  }

  if (loading) return <div className="text-stone-400 text-sm">Loading...</div>
  if (!recipe) return <div className="text-stone-400 text-sm">Recipe not found</div>

  const isScaled = scaleFactor !== 1
  const costPerPortion = cost?.totalCost ? cost.totalCost / Number(recipe.yieldQty) : null
  const scaledTotal = cost?.totalCost ? cost.totalCost * scaleFactor : null
  const costPct = cost?.totalCost && recipe.menuPrice
    ? calcCostPct(cost.totalCost, Number(recipe.menuPrice))
    : null
  const suggestedPrice = cost?.totalCost && recipe.targetCostPct
    ? calcSuggestedPrice(cost.totalCost, Number(recipe.targetCostPct))
    : null

  const costMap = new Map(cost?.lines.map((l) => [l.ingredientId, l]))

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/recipes" className="text-sm text-stone-400 hover:text-stone-600">
              Recipes
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
            <span className="text-sm text-stone-600">{recipe.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-stone-900">{recipe.name}</h1>
            {recipe.isSubRecipe && (
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full">
                <Layers className="w-3 h-3" /> Sub-recipe
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
            <span>{recipe.category.name}</span>
            <span>·</span>
            <span>Yields {Number(recipe.yieldQty)} {recipe.yieldUnit}</span>
            <span>·</span>
            <span>v{recipe.version}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/recipes/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteModal(true)}
            className="text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Cost incomplete banner */}
      {cost && !cost.isComplete && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Cost incomplete</p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
              {cost.errors.map((e, i) => <li key={i}>· {e}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Cost summary */}
        <div className="col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">
            Cost summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400">Total recipe cost</p>
              <p className="text-2xl font-bold text-stone-900 mt-0.5">
                {formatCurrency(cost?.totalCost ?? null)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Cost per {recipe.yieldUnit}</p>
              <p className="text-2xl font-bold text-stone-900 mt-0.5">
                {formatCurrency(costPerPortion)}
              </p>
            </div>
            {recipe.menuPrice && (
              <div>
                <p className="text-xs text-stone-400">Menu price</p>
                <p className="text-xl font-semibold text-stone-900 mt-0.5">
                  ${Number(recipe.menuPrice).toFixed(2)}
                </p>
              </div>
            )}
            {costPct !== null && (
              <div>
                <p className="text-xs text-stone-400">Food cost %</p>
                <p className={`text-xl font-semibold mt-0.5 ${
                  recipe.targetCostPct && costPct > Number(recipe.targetCostPct)
                    ? "text-red-500"
                    : "text-green-600"
                }`}>
                  {costPct.toFixed(1)}%
                </p>
              </div>
            )}
            {suggestedPrice !== null && (
              <div>
                <p className="text-xs text-stone-400">
                  Suggested price at {Number(recipe.targetCostPct)}% cost
                </p>
                <p className="text-xl font-semibold text-stone-900 mt-0.5">
                  {formatCurrency(suggestedPrice)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scale tool */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="w-4 h-4 text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
              Scale
            </h2>
          </div>
          {isScaled && (
            <div className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              View only — original not changed
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-400 block mb-1">Multiplier</label>
              <Input
                type="number"
                min="0.1"
                step="0.5"
                value={scaleFactor}
                onChange={(e) => handleScaleFactorChange(e.target.value)}
                className="text-sm h-8"
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 block mb-1">
                Target yield ({recipe.yieldUnit})
              </label>
              <Input
                type="number"
                min="0"
                value={targetYield}
                onChange={(e) => handleTargetYieldChange(e.target.value)}
                className="text-sm h-8"
              />
            </div>
            {isScaled && (
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-400">Scaled total cost</p>
                <p className="text-lg font-bold text-stone-900">
                  {formatCurrency(scaledTotal)}
                </p>
              </div>
            )}
            {scaleFactor !== 1 && (
              <button
                onClick={() => { setScaleFactor(1); setTargetYield(String(Number(recipe.yieldQty))) }}
                className="text-xs text-stone-400 hover:text-stone-600 underline"
              >
                Reset to original
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Ingredients</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-5 py-3 font-medium text-stone-500">Ingredient</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500">Qty</th>
              <th className="text-left px-4 py-3 font-medium text-stone-500">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-stone-500">Unit cost</th>
              <th className="text-right px-5 py-3 font-medium text-stone-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map((ing) => {
              const line = costMap.get(ing.id)
              const scaledQty = Number(ing.quantity) * scaleFactor
              const name = ing.siteItem?.name ?? "Sub-recipe"

              return (
                <tr key={ing.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {ing.subRecipeId && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                      <span className="font-medium text-stone-900">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-700">
                    {isScaled ? (
                      <span className="text-amber-700 font-medium">
                        {scaledQty % 1 === 0 ? scaledQty : scaledQty.toFixed(2)}
                      </span>
                    ) : (
                      Number(ing.quantity)
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{ing.unit}</td>
                  <td className="px-4 py-3 text-right">
                    {line?.error ? (
                      <span className="text-xs text-amber-500 flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {line.error}
                      </span>
                    ) : (
                      <span className="text-stone-700">{formatCurrency(line?.unitCost ?? null)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    {line?.error ? (
                      <span className="text-stone-300">—</span>
                    ) : (
                      <span className="text-stone-900">
                        {formatCurrency(
                          line?.totalCost != null ? line.totalCost * scaleFactor : null
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {cost?.totalCost != null && (
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50">
                <td colSpan={4} className="px-5 py-3 font-semibold text-stone-700 text-right">
                  Total
                </td>
                <td className="px-5 py-3 text-right font-bold text-stone-900">
                  {formatCurrency(scaledTotal ?? cost.totalCost)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Delete modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Delete recipe?</h2>
            <p className="text-sm text-stone-500 mb-6">
              <span className="font-medium text-stone-700">{recipe.name}</span> will be
              permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleting ? "Deleting..." : "Delete recipe"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
