"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChefHat,
  UtensilsCrossed,
  Package,
  FileText,
  Truck,
  Settings,
  BookOpen,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChefHat, roles: ["ADMIN", "CHEF", "ASSOCIATE"] },
  { href: "/recipes", label: "Recipes", icon: UtensilsCrossed, roles: ["ADMIN", "CHEF", "ASSOCIATE"] },
  { href: "/ingredients", label: "Ingredients", icon: Package, roles: ["ADMIN", "CHEF"] },
  { href: "/invoices", label: "Invoices", icon: FileText, roles: ["ADMIN", "CHEF"] },
  { href: "/vendors", label: "Vendors", icon: Truck, roles: ["ADMIN", "CHEF"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
  { href: "/best-practices", label: "Best Practices", icon: BookOpen, roles: ["ADMIN", "CHEF", "ASSOCIATE"] },
]

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()

  const filtered = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-60 bg-stone-900 text-stone-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-amber-400" />
          <span className="font-semibold text-lg tracking-tight text-white">
            Chef Costing
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? "bg-amber-500 text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Version */}
      <div className="px-6 py-3 border-t border-stone-700">
        <p className="text-xs text-stone-500">v0.1.0</p>
      </div>
    </aside>
  )
}
