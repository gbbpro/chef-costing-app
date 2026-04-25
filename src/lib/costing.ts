import Decimal from "decimal.js"
import { buildConversionGraph, convert } from "./conversions"

export interface CostIngredient {
  id: string
  siteItemId: string | null
  subRecipeId: string | null
  quantity: number
  unit: string
  siteItem?: {
    name: string
    conversions: {
      id: string
      fromUnit: string
      fromQty: number
      toUnit: string
      toQty: number
      isSystem: boolean
    }[]
    invoiceItems: {
      purchaseUnit: string
      priceHistory: { unitPrice: number; qty: number }[]
    }[]
  } | null
  subRecipe?: {
    name: string
    yieldQty: number
    yieldUnit: string
    totalCost: number | null // pre-calculated
  } | null
}

export interface CostLineResult {
  ingredientId: string
  unitCost: number | null
  totalCost: number | null
  error: string | null
}

export interface RecipeCostResult {
  lines: CostLineResult[]
  totalCost: number | null
  isComplete: boolean
  errors: string[]
}

export function costIngredient(
  ingredient: CostIngredient,
  systemConversions: { fromUnit: string; fromQty: number; toUnit: string; toQty: number }[]
): CostLineResult {
  const base: CostLineResult = {
    ingredientId: ingredient.id,
    unitCost: null,
    totalCost: null,
    error: null,
  }

  // Sub-recipe costing
// Sub-recipe costing
  if (ingredient.subRecipeId && ingredient.subRecipe) {
    const sub = ingredient.subRecipe
    if (sub.totalCost === null) {
      return { ...base, error: "Sub-recipe cost incomplete" }
    }

    const costPerYieldUnit = new Decimal(sub.totalCost).div(sub.yieldQty)

    // Build graph from system conversions to allow unit traversal
    const graph = buildConversionGraph(
      systemConversions.map((c) => ({ ...c, id: "sys", isSystem: true }))
    )

    let qty = ingredient.quantity
    if (ingredient.unit !== sub.yieldUnit) {
      const converted = convert(ingredient.quantity, ingredient.unit, sub.yieldUnit, graph)
      if (converted === null) {
        return {
          ...base,
          error: `Cannot convert ${ingredient.unit} to ${sub.yieldUnit} for ${sub.name}`,
        }
      }
      qty = converted
    }

    const totalCost = costPerYieldUnit.mul(qty)
    return {
      ingredientId: ingredient.id,
      unitCost: costPerYieldUnit.toNumber(),
      totalCost: totalCost.toNumber(),
      error: null,
    }
  }
  // Site item costing
  if (!ingredient.siteItem) {
    return { ...base, error: "Ingredient not found" }
  }

  const { siteItem } = ingredient

  // Get most recent invoice price
  const invoiceItem = siteItem.invoiceItems[0]
  if (!invoiceItem || !invoiceItem.priceHistory[0]) {
    return { ...base, error: "No price data available" }
  }

  const { unitPrice, qty: invoiceQty } = invoiceItem.priceHistory[0]
  const purchaseUnit = invoiceItem.purchaseUnit

  // Build conversion graph from item conversions + system conversions
  const allConversions = [
    ...systemConversions.map((c) => ({ ...c, id: "sys", isSystem: true })),
    ...siteItem.conversions.map((c) => ({
      ...c,
      fromQty: Number(c.fromQty),
      toQty: Number(c.toQty),
    })),
  ]

  const graph = buildConversionGraph(allConversions)

  // Price per purchase unit
  const pricePerPurchaseUnit = new Decimal(unitPrice)

  // Convert recipe unit to purchase unit
  const conversionFactor = convert(1, ingredient.unit, purchaseUnit, graph)
  if (conversionFactor === null) {
    return {
      ...base,
      error: `Cannot convert ${ingredient.unit} to ${purchaseUnit} for ${siteItem.name}`,
    }
  }

  // Cost = (qty in recipe unit) × (conversion to purchase unit) × (price per purchase unit)
  const unitCost = pricePerPurchaseUnit.mul(conversionFactor)
  const totalCost = unitCost.mul(ingredient.quantity)

  return {
    ingredientId: ingredient.id,
    unitCost: unitCost.toNumber(),
    totalCost: totalCost.toNumber(),
    error: null,
  }
}

export function costRecipe(
  ingredients: CostIngredient[],
  systemConversions: { fromUnit: string; fromQty: number; toUnit: string; toQty: number }[]
): RecipeCostResult {
  const lines = ingredients.map((i) => costIngredient(i, systemConversions))
  const errors = lines.filter((l) => l.error).map((l) => l.error!)
  const isComplete = errors.length === 0
  const totalCost = isComplete
    ? lines.reduce((sum, l) => sum + (l.totalCost ?? 0), 0)
    : null

  return { lines, totalCost, isComplete, errors }
}

export function formatCurrency(n: number | null): string {
  if (n === null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n)
}

export function calcCostPct(cost: number, menuPrice: number): number {
  return (cost / menuPrice) * 100
}

export function calcSuggestedPrice(cost: number, targetPct: number): number {
  return cost / (targetPct / 100)
}
