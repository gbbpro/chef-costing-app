"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  UtensilsCrossed, Package, Truck, AlertCircle,
  AlertTriangle, ChevronRight, Layers, Clock
} from "lucide-react"

interface Stats {
  recipes: number
  subRecipes: number
  ingredients: number
  pendingConversions: number
  vendors: number
  unassignedSkus: number
  recentRecipes: {
    id: string
    name: string
    version: string
    updatedAt: string
    category: { name: string }
  }[]
  recentIngredients: {
    id: string
    name: string
    createdAt: string
  }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
  }, [])

  const firstName = session?.user.name?.split(" ")[0] ?? "Chef"

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">
          Good to see you, {firstName}
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Here&apos;s what&apos;s happening in your kitchen.
        </p>
      </div>

      {/* Alerts */}
      {!loading && stats && (stats.pendingConversions > 0 || stats.unassignedSkus > 0) && (
        <div className="space-y-2 mb-6">
          {stats.pendingConversions > 0 && (
            <Link
              href="/ingredients"
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                <span className="font-medium">{stats.pendingConversions} ingredient{stats.pendingConversions !== 1 ? "s" : ""}</span>
                {" "}missing conversions — recipe costs may be incomplete
              </p>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
            </Link>
          )}
          {stats.unassignedSkus > 0 && (
            <Link
              href="/invoices"
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors group"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                <span className="font-medium">{stats.unassignedSkus} SKU{stats.unassignedSkus !== 1 ? "s" : ""}</span>
                {" "}not assigned to an ingredient — price history won&apos;t be tracked
              </p>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
            </Link>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Recipes",
            value: loading ? "—" : stats?.recipes ?? 0,
            sub: loading ? "" : `${stats?.subRecipes ?? 0} sub-recipe${stats?.subRecipes !== 1 ? "s" : ""}`,
            icon: UtensilsCrossed,
            href: "/recipes",
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "Ingredients",
            value: loading ? "—" : stats?.ingredients ?? 0,
            sub: loading ? "" : stats?.pendingConversions
              ? `${stats.pendingConversions} pending conversions`
              : "All conversions complete",
            icon: Package,
            href: "/ingredients",
            color: "text-blue-600 bg-blue-50",
            alert: !loading && (stats?.pendingConversions ?? 0) > 0,
          },
          {
            label: "Vendors",
            value: loading ? "—" : stats?.vendors ?? 0,
            sub: "Active suppliers",
            icon: Truck,
            href: "/vendors",
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Unassigned SKUs",
            value: loading ? "—" : stats?.unassignedSkus ?? 0,
            sub: loading ? "" : stats?.unassignedSkus
              ? "Need ingredient assignment"
              : "All SKUs assigned",
            icon: AlertCircle,
            href: "/invoices",
            color: "text-purple-600 bg-purple-50",
            alert: !loading && (stats?.unassignedSkus ?? 0) > 0,
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {card.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1" />
                )}
              </div>
              <p className="text-2xl font-bold text-stone-900">{card.value}</p>
              <p className="text-sm text-stone-500 mt-0.5">{card.label}</p>
              <p className={`text-xs mt-1 ${card.alert ? "text-amber-500" : "text-stone-400"}`}>
                {card.sub}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent recipes */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <h2 className="font-semibold text-stone-900 text-sm">Recently updated recipes</h2>
            </div>
            <Link href="/recipes" className="text-xs text-amber-600 hover:text-amber-700">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">Loading...</div>
          ) : !stats?.recentRecipes.length ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">No recipes yet</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {stats.recentRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors group"
                >
                  <UtensilsCrossed className="w-4 h-4 text-stone-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate group-hover:text-amber-700 transition-colors">
                      {recipe.name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {recipe.category.name} · v{recipe.version}
                    </p>
                  </div>
                  <p className="text-xs text-stone-300 shrink-0">
                    {new Date(recipe.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ingredients needing conversions */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-stone-900 text-sm">Ingredients needing conversions</h2>
            </div>
            <Link href="/ingredients" className="text-xs text-amber-600 hover:text-amber-700">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-stone-400 text-sm">Loading...</div>
          ) : !stats?.recentIngredients.length ? (
            <div className="px-5 py-8 text-center">
              <p className="text-stone-400 text-sm">All ingredients have conversions</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {stats.recentIngredients.map((item) => (
                <Link
                  key={item.id}
                  href="/ingredients"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 transition-colors group"
                >
                  <Package className="w-4 h-4 text-stone-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-amber-500">Conversions pending</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
                </Link>
              ))}
              {(stats.pendingConversions ?? 0) > 5 && (
                <div className="px-5 py-3 text-xs text-stone-400 text-center">
                  +{stats!.pendingConversions - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
