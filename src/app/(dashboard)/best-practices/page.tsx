import { BookOpen, AlertTriangle, CheckCircle2, Scale, GitBranch, Package } from "lucide-react"

const sections = [
  {
    icon: Package,
    title: "Choosing the right purchase unit",
    color: "amber",
    items: [
      {
        type: "do",
        text: "Use 'case' or 'cs' when ordering a full case of a product where the case is the natural unit — e.g. a case of canned tomatoes.",
      },
      {
        type: "do",
        text: "Use 'box' when a case contains multiple retail boxes and you track usage by the box — e.g. 24 boxes of grits in a case. Entering 'each' here would make 1 unit = 1 box of grits, which is correct.",
      },
      {
        type: "do",
        text: "Use 'lb' for catch-weight items like beef, chicken, or seafood that are priced per pound. The system will automatically detect these on import.",
      },
      {
        type: "caution",
        text: "Be careful with 'each' for large cases. A case of 88 oranges is fine as 'each' if you cost recipes per orange. But a case of 24 boxes of grits should use 'box' — not 'each' — so your conversions and recipe costs reflect the actual usable unit.",
      },
      {
        type: "caution",
        text: "Be consistent. If you enter 'cs' for one invoice and 'case' for the next, the system treats them as different units. Pick one and stick with it. We recommend abbreviations: cs, lb, oz, gal, qt.",
      },
    ],
  },
  {
    icon: Scale,
    title: "Defining conversions",
    color: "blue",
    items: [
      {
        type: "do",
        text: "You only need a few conversions per ingredient to unlock the full chain. For example: '1 cs = 40 lb' combined with system conversions gives you lb, oz, kg, and g automatically.",
      },
      {
        type: "do",
        text: "To link weight and volume for an ingredient, add one bridge conversion — e.g. '1 cup = 8 oz' for heavy cream. This connects the entire weight chain to the entire volume chain.",
      },
      {
        type: "do",
        text: "Add conversions as soon as a new item is imported. Items with missing conversions will show a warning on recipe cost views and won't contribute to total cost.",
      },
      {
        type: "caution",
        text: "Weight-to-volume conversions are ingredient-specific. 1 cup of flour weighs about 4.5 oz, but 1 cup of water weighs 8 oz. Never assume — always measure or look up the specific density for each ingredient.",
      },
      {
        type: "caution",
        text: "Conversions can be added at any time, but recipe costs won't be accurate until they're complete. Check the Ingredients page filter for items marked 'Conversions pending'.",
      },
    ],
  },
  {
    icon: GitBranch,
    title: "Recipe versioning",
    color: "purple",
    items: [
      {
        type: "do",
        text: "When editing a recipe, choose 'Save as new version' to preserve the original. This is especially important when ingredient prices have changed — the old version records what the cost was at that time.",
      },
      {
        type: "do",
        text: "Use versions to track recipe development. v1.0 might be your opening menu, v1.1 after a technique tweak, v2.0 after a full reformulation.",
      },
      {
        type: "caution",
        text: "'Overwrite current version' should only be used for minor corrections like a typo in an ingredient name or a quantity entry error — not for actual recipe changes.",
      },
    ],
  },
  {
    icon: BookOpen,
    title: "Sub-recipes",
    color: "green",
    items: [
      {
        type: "do",
        text: "Use sub-recipes for any preparation used across multiple dishes — stocks, sauces, doughs, spice blends, marinades. Cost them once and they update everywhere automatically.",
      },
      {
        type: "do",
        text: "Always keep sub-recipe yields accurate. If your brown chicken stock yields 2 gallons, enter 2 gal — not 1 batch. Parent recipes cost against the yield unit, so an incorrect yield means incorrect costs throughout.",
      },
      {
        type: "do",
        text: "When using a sub-recipe as an ingredient, you can pick any unit in the same chain as the yield unit. A sub-recipe that yields in gallons can be used in cups, quarts, or fluid ounces in a parent recipe.",
      },
      {
        type: "caution",
        text: "If a sub-recipe has incomplete costs (missing ingredient prices or conversions), any parent recipe using it will also show as cost incomplete. Fix sub-recipe costs first.",
      },
    ],
  },
]

const colorMap = {
  amber: {
    icon: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    heading: "text-amber-800",
  },
  blue: {
    icon: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
    heading: "text-blue-800",
  },
  purple: {
    icon: "bg-purple-100 text-purple-600",
    border: "border-purple-200",
    heading: "text-purple-800",
  },
  green: {
    icon: "bg-green-100 text-green-600",
    border: "border-green-200",
    heading: "text-green-800",
  },
}

export default function BestPracticesPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Best Practices</h1>
        <p className="text-stone-500 text-sm mt-1">
          Guidelines for getting the most accurate costs out of Chef Costing.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon
          const colors = colorMap[section.color as keyof typeof colorMap]

          return (
            <div
              key={section.title}
              className={`bg-white rounded-xl border ${colors.border} overflow-hidden`}
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b border-stone-100">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className={`font-semibold ${colors.heading}`}>{section.title}</h2>
              </div>

              <div className="divide-y divide-stone-50">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-6 py-4">
                    {item.type === "do" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-stone-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-stone-50 border border-stone-200 rounded-xl px-6 py-5">
        <p className="text-xs text-stone-400 leading-relaxed">
          These guidelines reflect common patterns in professional kitchen costing.
          Every operation is different — adapt these to fit your purchasing habits and
          recipe conventions. When in doubt, consistency beats precision: a system
          used consistently will always out-perform a more accurate system used
          inconsistently.
        </p>
      </div>
    </div>
  )
}
