import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { TopBar } from "@/components/top-bar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen bg-stone-50 font-sans overflow-hidden">
      <SidebarNav role={session.user.role} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
