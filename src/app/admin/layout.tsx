
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Car, Map, LayoutDashboard, LogOut, BarChart3 } from "lucide-react"
import { handleSignOut } from "../actions"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    // Strict Role Check
    if (session?.user?.role !== "ADMIN") {
        redirect("/")
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        VMS Admin
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Vehicle Management System</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 dark:text-slate-300">
                            <LayoutDashboard className="h-4 w-4" />
                            Overview
                        </Button>
                    </Link>
                    <Link href="/admin/analytics">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 dark:text-slate-300">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 dark:text-slate-300">
                            <Users className="h-4 w-4" />
                            Users
                        </Button>
                    </Link>
                    <Link href="/admin/trips">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 dark:text-slate-300">
                            <Map className="h-4 w-4" />
                            Trips
                        </Button>
                    </Link>
                    <Link href="/admin/vehicles">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-600 dark:text-slate-300">
                            <Car className="h-4 w-4" />
                            Vehicles
                        </Button>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="mb-4 px-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{session.user.name}</div>
                        <div className="text-xs text-slate-500">{session.user.email} from {session.user.section || "N/A"}</div>
                    </div>
                    <form action={handleSignOut}>
                        <Button variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
