"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart } from "@/components/charts/bar-chart"
import { DonutChart } from "@/components/charts/donut-chart"
import { AreaChart } from "@/components/charts/area-chart"
import { Car, MapPin, Activity, Calendar, Download, Droplets, Gauge } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { getApiPath } from "@/lib/utils"
import CountUp from "@/components/count-up"

type StatsData = {
    totalTrips: number
    topVehicles: { name: string, count: number }[]
    statusDistribution: { status: string, count: number }[]
    sectionDistribution: { name: string, count: number }[]
    trendData: { date: string, count: number }[]
    totalDistance: number
    oilConsumptionRate: string // "10.50"
}

export default function AnalyticsPage() {
    const [date, setDate] = useState<DateRange | undefined>(undefined)
    const [selectedSection, setSelectedSection] = useState<string>("all")

    // Construct query parameter string
    const getQueryParams = () => {
        const params = new URLSearchParams()
        if (date?.from) params.set("start", date.from.toISOString())
        if (date?.to) params.set("end", date.to.toISOString())
        if (selectedSection && selectedSection !== "all") params.set("section", selectedSection)
        return params.toString()
    }

    // Fetch Statistics with filters
    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ["admin-stats", date, selectedSection],
        queryFn: async () => {
            const queryString = getQueryParams()
            const res = await fetch(getApiPath(`/api/admin/stats?${queryString}`))
            if (!res.ok) throw new Error("Failed to fetch stats")
            return res.json()
        }
    })

    const handleExport = () => {
        const queryString = getQueryParams()
        window.open(getApiPath(`/api/admin/analytics/export?${queryString}`), "_blank")
    }

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading analytics...</div>
    }

    if (!stats) return null

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Car Usage Analytics</h1>
                    <p className="text-slate-500">Overview of vehicle usage, trip trends, and distribution.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row gap-4 lg:items-end">

                    {/* Date Range Group */}
                    <div className="space-y-2 w-full md:w-auto">
                        <label className="text-sm font-medium text-slate-700 block">Date Range</label>
                        <DateRangePicker date={date} setDate={setDate} />
                    </div>

                    {/* Section Group */}
                    <div className="space-y-2 w-full md:w-auto">
                        <label className="text-sm font-medium text-slate-700 block">Section</label>
                        <div className="w-full md:w-[200px]">
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {stats.sectionDistribution.map(s => (
                                        <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <div className="w-full md:w-auto md:ml-auto pb-0.5">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setDate(undefined)
                                setSelectedSection("all")
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Trips</p>
                            <h3 className="text-2xl font-bold">
                                <CountUp to={stats.totalTrips} separator="," />
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Gauge className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Distance</p>
                            <h3 className="text-2xl font-bold">
                                <CountUp to={stats.totalDistance} separator="," /> <span className="text-base font-normal">km</span>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-full">
                            <Droplets className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Consumption Rate</p>
                            <h3 className="text-2xl font-bold">
                                <CountUp to={parseFloat(stats.oilConsumptionRate)} separator="." /> <span className="text-base font-normal">km/L</span>
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-lg border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg. Trips/Day</p>
                            {/* Simple approximation based on trends or total count / ranges */}
                            <h3 className="text-2xl font-bold">
                                <CountUp
                                    to={stats.trendData.length > 0 ? (stats.totalTrips / stats.trendData.length) : 0}
                                    separator="."
                                />
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">

                {/* Monthly Trip Trends */}
                <div className="md:col-span-2">
                    <AreaChart
                        title="Trip Trends"
                        data={stats.trendData}
                        color="#3b82f6"
                    />
                </div>

                {/* Status Distribution */}
                <DonutChart
                    title="Trips by Status"
                    data={stats.statusDistribution.map(d => ({ name: d.status, count: d.count }))}
                />

                {/* Section Distribution */}
                <DonutChart
                    title="Trips by Section (Top 5 visible)"
                    data={stats.sectionDistribution}
                />

                {/* Top Vehicles */}
                <div className="md:col-span-2">
                    <BarChart
                        title="Top 10 Most Used Vehicles"
                        data={stats.topVehicles}
                        color="#8b5cf6"
                    />
                </div>
            </div>
        </div>
    )
}
