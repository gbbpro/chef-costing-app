"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IngredientSearch } from "./ingredient-search"
import { Trash2, GripVertical, AlertTriangle, Layers, Plus } from "lucide-react"

interface Category { id: string; name: string; isSystem: boolean }

interface IngredientLine {
  tempId: string
  siteItemId: string | null
  subRecipeId: string | null
  name: string
  quantity: string
  unit: string
  availableUnits: string[]
  type: "siteItem" | "subRecipe"
}

interface RecipeFormProps {
  initial?: {
    id: string
    name: string
    categoryId: string
    isSubRecipe: boolean
    yieldQty: number
    yieldUnit: string
    menuPrice: number | null
    targetCostPct: number | null
    version: string
    ingredients: {
      id: string
      siteItemId: string | null
      subRecipeId: string | null
      quantity: number
      unit: string
      siteItem: { name: string } | null
    }[]
  }
}

export function RecipeForm({ initial }: RecipeFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState(initial?.name ?? "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [isSubRecipe, setIsSubRecipe] = useState(initial?.isSubRecipe ?? false)
  const [yieldQty, setYieldQty] = useState(String(initial?.yieldQty ?? ""))
  const [yieldUnit, setYieldUnit] = useState(initial?.yieldUnit ?? "")
  const [menuPrice, setMenuPrice] = useState(String(initial?.menuPrice ?? ""))
  const [targetCostPct, setTargetCostPct] = useState(String(initial?.targetCostPct ?? ""))
  const [ingredients, setIngredients] = useState<IngredientLine[]>(
    initial?.ingredients.map((ing) => ({
      tempId: ing.id,
      siteItemId: ing.siteItemId,
      subRecipeId: ing.subRecipeId,
      name: ing.siteItem?.name ?? "Sub-recipe",
      quantity: String(ing.quantity),
      unit: ing.unit,
      availableUnits: [ing.unit],
      type: ing.subRecipeId ? "subRecipe" : "siteItem",
    })) ?? []
  )
  const [newCategory, setNewCategory] = useState("")
  const [addingCategory, setAddingCategory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [showVersionPrompt, setShowVersionPrompt] = useState(false)

  useEffect(() => {
    fetch("/api/recipes/categories")
      .then((r) => r.json())
      .then(setCategories)
  }, [])

  function addIngredient(result: {
    type: "siteItem" | "subRecipe"
    id: string
    name: string
    units: string[]
  }) {
    setIngredients((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        siteItemId: result.type === "siteItem" ? result.id : null,
        subRecipeId: result.type === "subRecipe" ? result.id : null,
        name: result.name,
        quantity: "1",
        unit: result.units[0] ?? "",
        availableUnits: result.units,
        type: result.type,
      },
    ])
  }

  function updateIngredient(tempId: string, field: "quantity" | "unit", value: string) {
    setIngredients((prev) =>
      prev.map((ing) => (ing.tempId === tempId ? { ...ing, [field]: value } : ing))
    )
  }

  function removeIngredient(tempId: string) {
    setIngredients((prev) => prev.filter((ing) => ing.tempId !== tempId))
  }

  async function createCategory() {
    if (!newCategory.trim()) return
    const res = await fetch("/api/recipes/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setCategoryId(data.id)
      setNewCategory("")
      setAddingCategory(false)
    }
  }

  async function save(newVersion = false) {
    setSaving(true)
    setError("")

    const body = {
      name,
      categoryId,
      isSubRecipe,
      yieldQty,
      yieldUnit,
      menuPrice: menuPrice || null,
      targetCostPct: targetCostPct || null,
      newVersion,
      ingredients: ingredients.map((ing) => ({
        siteItemId: ing.siteItemId,
        subRecipeId: ing.subRecipeId,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
    }

    const res = await fetch(
      initial ? `/api/recipes/${initial.id}` : "/api/recipes",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? "Something went wrong")
      return
    }

    router.push(`/recipes/${data.id}`)
    router.refresh()
  }

  function handleSave() {
    if (initial) {
      setShowVersionPrompt(true)
    } else {
      save(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold text-stone-900">Recipe details</h2>

        {/* Sub-recipe toggle */}
        <label className="flex items-center gap-3 cursor-pointer w-fit">
          <div
            onClick={() => setIsSubRecipe(!isSubRecipe)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              isSubRecipe ? "bg-purple-500" : "bg-stone-200"
            }`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              isSubRecipe ? "translate-x-5" : ""
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Sub-recipe</p>
            <p className="text-xs text-stone-400">Can be used as an ingredient in other recipes</p>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Recipe name <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brown Chicken Stock" />
          </div>

          <div className="space-y-1.5">
            <Label>Category <span className="text-red-500">*</span></Label>
            {!addingCategory ? (
              <div className="space-y-1">
                <select
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setAddingCategory(true)}
                  className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add category
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  onKeyDown={(e) => e.key === "Enter" && createCategory()}
                />
                <Button size="sm" onClick={createCategory} className="bg-amber-500 hover:bg-amber-600 text-stone-900">Add</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingCategory(false)}>Cancel</Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Yield <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={yieldQty}
                onChange={(e) => setYieldQty(e.target.value)}
                placeholder="10"
                className="w-24"
              />
              <Input
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                placeholder="portions"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Menu price</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-stone-400 text-sm">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Target food cost %</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={targetCostPct}
                onChange={(e) => setTargetCostPct(e.target.value)}
                placeholder="28"
                className="pr-6"
              />
              <span className="absolute right-3 top-2 text-stone-400 text-sm">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold text-stone-900">Ingredients</h2>

        {ingredients.length > 0 && (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-2 text-xs font-medium text-stone-400 uppercase tracking-wide">
              <div className="col-span-5">Ingredient</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3">Unit</div>
              <div className="col-span-2" />
            </div>

            {ingredients.map((ing) => (
              <div key={ing.tempId} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <GripVertical className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                  <div className="flex items-center gap-1.5 min-w-0">
                    {ing.type === "subRecipe" && (
                      <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                    <span className="text-sm text-stone-800 truncate">{ing.name}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(ing.tempId, "quantity", e.target.value)}
                    className="text-center text-sm h-8"
                  />
                </div>
                <div className="col-span-3">
                  {ing.availableUnits.length > 0 ? (
                    <select
                      className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 h-8"
                      value={ing.unit}
                      onChange={(e) => updateIngredient(ing.tempId, "unit", e.target.value)}
                    >
                      {ing.availableUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      No units
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIngredient(ing.tempId)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <IngredientSearch onSelect={addIngredient} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 hover:bg-amber-600 text-stone-900"
        >
          {saving ? "Saving..." : initial ? "Save recipe" : "Create recipe"}
        </Button>
      </div>

      {/* Version prompt */}
      {showVersionPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Save changes</h2>
            <p className="text-sm text-stone-500 mb-6">
              Do you want to save as a new version (preserving the current one) or overwrite?
            </p>
            <div className="space-y-2">
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900"
                onClick={() => { setShowVersionPrompt(false); save(true) }}
              >
                Save as new version
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setShowVersionPrompt(false); save(false) }}
              >
                Overwrite current version
              </Button>
              <Button
                variant="ghost"
                className="w-full text-stone-400"
                onClick={() => setShowVersionPrompt(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
