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
import { Badge } from "@/components/ui/badge"
import { RegisterVehicleDialog } from "@/components/register-vehicle-dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Car, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getApiPath } from "@/lib/utils"


import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Vehicle = {
    id: number
    licensePlate: string
    brand: string
    model: string
    status: string
    section: string | null
    currentOdometer: number
}

export default function VehiclesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")

    const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
        queryKey: ["admin-vehicles", search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (search) params.append("search", search)
            if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter)

            const res = await fetch(getApiPath(`/api/admin/vehicles?${params.toString()}`))
            if (!res.ok) throw new Error("Failed to fetch vehicles")
            return res.json()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(getApiPath(`/api/admin/vehicles?id=${id}`), { method: "DELETE" })
            if (!res.ok) throw new Error("Failed to delete")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
            toast.success("Vehicle deleted successfully")
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete vehicle")
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h1 className="text-2xl font-bold">Vehicle Management</h1>
                <RegisterVehicleDialog />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-lg border">
                <div className="w-full sm:w-64">
                    <Input
                        placeholder="Search vehicles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                            <SelectItem value="IN_USE">In Use</SelectItem>
                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            <SelectItem value="Stand By">Stand By</SelectItem>
                            <SelectItem value="เลิกใช้งาน">Decommissioned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>License Plate</TableHead>
                            <TableHead>Make/Model</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead className="text-right">Odometer</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : vehicles?.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                                <TableCell className="font-medium font-mono">
                                    <div className="flex items-center gap-2">
                                        <Car className="h-4 w-4 text-slate-400" />
                                        {vehicle.licensePlate}
                                    </div>
                                </TableCell>
                                <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                                <TableCell>
                                    <Badge variant={vehicle.status === "AVAILABLE" ? "success" : "secondary"}>
                                        {vehicle.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{vehicle.section || "-"}</TableCell>
                                <TableCell className="text-right font-mono">
                                    {vehicle.currentOdometer.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <RegisterVehicleDialog vehicle={vehicle} />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete the vehicle
                                                    with license plate <span className="font-mono font-bold">{vehicle.licensePlate}</span> from the system.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteMutation.mutate(vehicle.id)}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
