export interface ConversionRow {
  id: string
  fromUnit: string
  fromQty: number
  toUnit: string
  toQty: number
  isSystem: boolean
}

// Build a graph of unit relationships from a list of conversions
// Each edge represents: fromQty of fromUnit = toQty of toUnit
export function buildConversionGraph(conversions: ConversionRow[]): Map<string, Map<string, number>> {
  const graph = new Map<string, Map<string, number>>()

  function addEdge(from: string, to: string, rate: number) {
    if (!graph.has(from)) graph.set(from, new Map())
    graph.get(from)!.set(to, rate)
  }

  for (const c of conversions) {
    // 1 fromUnit = (toQty / fromQty) toUnits
    const forwardRate = c.toQty / c.fromQty
    const backwardRate = c.fromQty / c.toQty
    addEdge(c.fromUnit, c.toUnit, forwardRate)
    addEdge(c.toUnit, c.fromUnit, backwardRate)
  }

  return graph
}

// Find all units reachable from a starting unit using BFS
export function getReachableUnits(startUnit: string, graph: Map<string, Map<string, number>>): Set<string> {
  const visited = new Set<string>()
  const queue = [startUnit]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    const neighbors = graph.get(current)
    if (neighbors) {
      for (const neighbor of neighbors.keys()) {
        if (!visited.has(neighbor)) queue.push(neighbor)
      }
    }
  }

  return visited
}

// Get ALL resolvable units from a full set of conversions
export function getResolvableUnits(conversions: ConversionRow[]): Set<string> {
  if (conversions.length === 0) return new Set()
  const graph = buildConversionGraph(conversions)
  // Start from the first unit and find everything reachable
  const allUnits = new Set<string>()
  for (const c of conversions) {
    allUnits.add(c.fromUnit)
    allUnits.add(c.toUnit)
  }
  // BFS from every unit, union all reachable sets
  const reachable = new Set<string>()
  for (const unit of allUnits) {
    const reached = getReachableUnits(unit, graph)
    for (const u of reached) reachable.add(u)
  }
  return reachable
}

// Convert qty from one unit to another using the graph
// Returns null if no path exists
export function convert(
  qty: number,
  fromUnit: string,
  toUnit: string,
  graph: Map<string, Map<string, number>>
): number | null {
  if (fromUnit === toUnit) return qty

  // BFS to find conversion path
  const queue: Array<{ unit: string; factor: number }> = [{ unit: fromUnit, factor: 1 }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { unit, factor } = queue.shift()!
    if (visited.has(unit)) continue
    visited.add(unit)

    const neighbors = graph.get(unit)
    if (!neighbors) continue

    for (const [neighbor, rate] of neighbors) {
      const newFactor = factor * rate
      if (neighbor === toUnit) return qty * newFactor
      if (!visited.has(neighbor)) {
        queue.push({ unit: neighbor, factor: newFactor })
      }
    }
  }

  return null
}

// Detect if weight and volume chains exist but aren't bridged
const WEIGHT_UNITS = new Set(["oz", "lb", "g", "kg"])
const VOLUME_UNITS = new Set(["tsp", "tbsp", "cup", "fl oz", "qt", "gal", "ml", "l"])

export function analyzeConversions(conversions: ConversionRow[]): {
  resolvableUnits: Set<string>
  hasWeightChain: boolean
  hasVolumeChain: boolean
  isBridged: boolean
  warning: string | null
} {
  const graph = buildConversionGraph(conversions)
  const resolvableUnits = getResolvableUnits(conversions)

  const hasWeightChain = [...resolvableUnits].some((u) => WEIGHT_UNITS.has(u))
  const hasVolumeChain = [...resolvableUnits].some((u) => VOLUME_UNITS.has(u))

  // Check if weight and volume are in the same connected component
  let isBridged = false
  if (hasWeightChain && hasVolumeChain) {
    // Pick one weight unit and see if we can reach a volume unit
    const weightUnit = [...resolvableUnits].find((u) => WEIGHT_UNITS.has(u))!
    const reachable = getReachableUnits(weightUnit, graph)
    isBridged = [...reachable].some((u) => VOLUME_UNITS.has(u))
  } else {
    isBridged = true // no bridge needed if only one chain exists
  }

  let warning: string | null = null
  if (hasWeightChain && hasVolumeChain && !isBridged) {
    warning =
      "Weight and volume conversions are defined but not connected. Add a conversion like '1 cup = X oz' to link them."
  }

  return { resolvableUnits, hasWeightChain, hasVolumeChain, isBridged, warning }
}

// Friendly unit display order
export const UNIT_DISPLAY_ORDER = [
  "cs", "box", "bag", "each",
  "lb", "oz", "kg", "g",
  "gal", "qt", "cup", "fl oz", "tbsp", "tsp",
  "ml", "l",
]

export function sortUnits(units: Set<string>): string[] {
  const ordered = UNIT_DISPLAY_ORDER.filter((u) => units.has(u))
  const rest = [...units].filter((u) => !UNIT_DISPLAY_ORDER.includes(u)).sort()
  return [...ordered, ...rest]
}
