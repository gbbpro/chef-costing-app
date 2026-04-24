import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">
          Good to see you, {session?.user.name?.split(" ")[0] ?? "Chef"}
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Here&apos;s what&apos;s happening in your kitchen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Recipes", href: "/recipes", description: "Create and manage recipes", emoji: "🍽️" },
          { label: "Ingredients", href: "/ingredients", description: "Site items & conversions", emoji: "🧂" },
          { label: "Invoices", href: "/invoices", description: "Import & track invoices", emoji: "📋" },
          { label: "Vendors", href: "/vendors", description: "Manage your vendors", emoji: "🚚" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block p-6 bg-white rounded-xl border border-stone-200 hover:border-amber-400 hover:shadow-sm transition-all group"
          >
            <div className="text-2xl mb-3">{item.emoji}</div>
            <h2 className="font-semibold text-stone-900 group-hover:text-amber-600 transition-colors">
              {item.label}
            </h2>
            <p className="text-sm text-stone-500 mt-1">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
