import { DashboardSkeleton } from "@/components/loading-template"

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
            <header className="bg-white dark:bg-slate-900 border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <DashboardSkeleton />
            </main>
        </div>
    )
}
