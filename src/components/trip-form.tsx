"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getApiPath } from "@/lib/utils"

type Trip = {
    id: number
    vehicleId: number
    driverId: string | null
    departureDate: string
    returnDate: string | null
    origin: string
    destination: string
    description: string | null
    mileageStart: number
    mileageEnd: number | null
    status: string
}

type TripFormProps = {
    trip?: Trip
    onSuccess: () => void
}

export function TripForm({ trip, onSuccess }: TripFormProps) {
    const [formData, setFormData] = useState({
        vehicleId: trip?.vehicleId?.toString() || "",
        driverId: trip?.driverId || "",
        departureDate: trip?.departureDate ? new Date(trip.departureDate).toISOString().slice(0, 16) : "",
        returnDate: trip?.returnDate ? new Date(trip.returnDate).toISOString().slice(0, 16) : "",
        origin: trip?.origin || "",
        destination: trip?.destination || "",
        description: trip?.description || "",
        mileageStart: trip?.mileageStart?.toString() || "",
        mileageEnd: trip?.mileageEnd?.toString() || "",
        status: trip?.status || "ONGOING"
    })

    const { data: vehicles } = useQuery<any[]>({
        queryKey: ["vehicles-list"],
        queryFn: async () => {
            const res = await fetch(getApiPath("/api/admin/vehicles?limit=100")) // get list
            if (!res.ok) return []
            const json = await res.json()
            return json.data || json // handle paginated or simple response
        }
    })

    const { data: users } = useQuery<any[]>({
        queryKey: ["users-list"],
        queryFn: async () => {
            const res = await fetch(getApiPath("/api/admin/users?role=ALL"))
            if (!res.ok) return []
            return res.json()
        }
    })

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const method = trip ? "PUT" : "POST"
            const body = trip ? { ...data, id: trip.id } : data

            // Convert types
            const payload = {
                ...body,
                vehicleId: parseInt(body.vehicleId),
                mileageStart: parseInt(body.mileageStart),
                mileageEnd: body.mileageEnd ? parseInt(body.mileageEnd) : null,
                driverId: body.driverId || null // ensure null if empty
            }

            const res = await fetch(getApiPath("/api/admin/trips"), {
                method,
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" }
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to save trip")
            }
        },
        onSuccess: () => {
            toast.success(trip ? "Trip updated successfully" : "Trip created successfully")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            onSuccess()
        },
        onError: (error) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <Select
                        value={formData.vehicleId}
                        onValueChange={v => setFormData({ ...formData, vehicleId: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                            {vehicles?.map(v => (
                                <SelectItem key={v.id} value={v.id.toString()}>
                                    {v.licensePlate} ({v.brand} {v.model})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Driver</Label>
                    <Select
                        value={formData.driverId}
                        onValueChange={v => setFormData({ ...formData, driverId: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                            {users?.map(u => (
                                <SelectItem key={u.id} value={u.id}>
                                    {u.ThaiName || u.username} ({u.section || "No Section"})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Departure Time</Label>
                    <Input
                        type="datetime-local"
                        value={formData.departureDate}
                        onChange={e => setFormData({ ...formData, departureDate: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Return Time</Label>
                    <Input
                        type="datetime-local"
                        value={formData.returnDate}
                        onChange={e => setFormData({ ...formData, returnDate: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Origin</Label>
                    <Input
                        value={formData.origin}
                        onChange={e => setFormData({ ...formData, origin: e.target.value })}
                        placeholder="Start location"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input
                        value={formData.destination}
                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                        placeholder="End location"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Start Mileage</Label>
                    <Input
                        type="number"
                        value={formData.mileageStart}
                        onChange={e => setFormData({ ...formData, mileageStart: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>End Mileage</Label>
                    <Input
                        type="number"
                        value={formData.mileageEnd}
                        onChange={e => setFormData({ ...formData, mileageEnd: e.target.value })}
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={v => setFormData({ ...formData, status: v })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ONGOING">Ongoing</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Job details or purpose..."
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Trip"}
                </Button>
            </div>
        </form>
    )
}
