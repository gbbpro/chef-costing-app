import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {session.user.name} — {session.user.organizationId}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Recipes", href: "/recipes", description: "Create and manage recipes" },
            { label: "Ingredients", href: "/ingredients", description: "Manage site items" },
            { label: "Invoices", href: "/invoices", description: "Import and track invoices" },
            { label: "Vendors", href: "/vendors", description: "Manage your vendors" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <h2 className="font-semibold text-slate-900">{item.label}</h2>
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
