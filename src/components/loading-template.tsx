import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            {/* Stats Overview Skeleton */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-12" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Vehicle Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                        <div className="bg-slate-50/30 dark:bg-slate-900/30 p-4 flex gap-2">
                            <Skeleton className="h-9 w-32" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
