"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDateThai } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Download } from "lucide-react"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TripForm } from "@/components/trip-form"
import { toast } from "sonner"
import { DateRangeFilter } from "@/components/date-range-filter"
import { getApiPath } from "@/lib/utils"

type Trip = {
    id: number
    vehicle: { licensePlate: string, brand: string, model: string }
    driver: { ThaiName: string, EngName: string, username: string } | null
    departureDate: string
    returnDate: string | null
    origin: string
    destination: string
    mileageStart: number
    mileageEnd: number | null
    status: string
    fuelLogs: {
        id: number
        liter: number
        price: number
    }[]
}

type TripResponse = {
    data: Trip[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export default function TripsPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [dateRange, setDateRange] = useState<{ from: Date, to: Date } | undefined>()
    const [section, setSection] = useState<string>("all")

    // Fetch Sections
    const { data: sections = [] } = useQuery<string[]>({
        queryKey: ["admin-sections"],
        queryFn: async () => {
            const res = await fetch(getApiPath("/api/admin/sections"))
            if (!res.ok) return []
            return res.json()
        }
    })

    // Fetch Trips with Pagination and Date Filter
    const { data, isLoading } = useQuery<TripResponse>({
        queryKey: ["admin-trips", page, dateRange, section],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.append("page", page.toString())
            params.append("limit", "25")
            if (dateRange?.from) params.append("startDate", dateRange.from.toISOString())
            if (dateRange?.to) params.append("endDate", dateRange.to.toISOString())
            if (section && section !== "all") params.append("section", section)

            const res = await fetch(getApiPath(`/api/admin/trips?${params.toString()}`))
            if (!res.ok) throw new Error("Failed to fetch trips")
            return res.json()
        },
    })

    const trips = data?.data || []
    const meta = data?.meta || { total: 0, page: 1, limit: 25, totalPages: 1 }

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(getApiPath(`/api/admin/trips?id=${id}`), { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete")
        },
        onSuccess: () => {
            toast.success("Trip deleted successfully")
            queryClient.invalidateQueries({ queryKey: ["admin-trips"] })
        },
        onError: () => toast.error("Failed to delete trip")
    })

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this trip record?")) {
            deleteMutation.mutate(id)
        }
    }

    const handleExport = () => {
        const params = new URLSearchParams()
        params.append("export", "csv")
        if (dateRange?.from) params.append("startDate", dateRange.from.toISOString())
        if (dateRange?.to) params.append("endDate", dateRange.to.toISOString())
        if (section && section !== "all") params.append("section", section)

        // Trigger download
        window.open(getApiPath(`/api/admin/trips?${params.toString()}`), "_blank")
    }

    return (
        <div className="space-y-6">
            {/* Header: Title and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Trip Management</h1>
                    <p className="text-slate-500 text-sm">Track vehicle usage and mileage</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingTrip(null)} className="w-full sm:w-auto">
                                <Plus className="mr-2 h-4 w-4" />
                                Log New Trip
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingTrip ? "Edit Trip Details" : "Log New Trip"}</DialogTitle>
                            </DialogHeader>
                            <TripForm
                                trip={editingTrip as any}
                                onSuccess={() => {
                                    setIsFormOpen(false)
                                    queryClient.invalidateQueries({ queryKey: ["admin-trips"] })
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 min-w-[60px]">
                    Filters:
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
                    <Select value={section} onValueChange={setSection}>
                        <SelectTrigger className="w-full sm:w-[250px] bg-white">
                            <SelectValue placeholder="All Sections" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sections.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-full sm:w-auto bg-white rounded-md">
                        <DateRangeFilter onFilter={setDateRange} />
                    </div>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Driver</TableHead>
                            <TableHead>Route</TableHead>
                            <TableHead>Departure</TableHead>
                            <TableHead>Mileage</TableHead>
                            <TableHead>Fuel Info</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : trips.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-slate-500">
                                    No trips found.
                                </TableCell>
                            </TableRow>
                        ) : trips.map((trip) => (
                            <TableRow key={trip.id}>
                                <TableCell>#{trip.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{trip.vehicle.licensePlate}</div>
                                    <div className="text-xs text-slate-500">{trip.vehicle.brand} {trip.vehicle.model}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">{trip.driver?.ThaiName || trip.driver?.username || "Unknown"}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <div className="flex items-center gap-1">
                                            <span className="w-8 text-slate-400">From:</span> {trip.origin}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="w-8 text-slate-400">To:</span> {trip.destination}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs whitespace-nowrap">
                                    {formatDateThai(new Date(trip.departureDate))}
                                </TableCell>
                                <TableCell className="text-xs">
                                    <div>Start: {trip.mileageStart}</div>
                                    {trip.mileageEnd && <div>End: {trip.mileageEnd}</div>}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {trip.fuelLogs && trip.fuelLogs.length > 0 ? (
                                        <div className="space-y-0.5">
                                            <div className="font-medium text-orange-600">
                                                ฿{trip.fuelLogs.reduce((acc, log) => acc + Number(log.price), 0).toLocaleString()}
                                            </div>
                                            <div className="text-slate-500">
                                                {trip.fuelLogs.reduce((acc, log) => acc + Number(log.liter), 0).toFixed(1)} L
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={trip.status === "ONGOING" ? "default" : trip.status === "COMPLETED" ? "secondary" : "destructive"}>
                                        {trip.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingTrip(trip)
                                        setIsFormOpen(true)
                                    }}>
                                        <Pencil className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Page {meta.page} of {meta.totalPages} ({meta.total} records)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                            disabled={page === meta.totalPages}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
