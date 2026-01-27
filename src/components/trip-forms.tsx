"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { startTrip, endTrip } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { startTripSchema, endTripSchema, type StartTripValues, type EndTripValues } from "@/lib/schemas"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface StartTripFormProps {
    vehicleId: number
    licensePlate: string
    currentOdometer: number
    onSuccess?: () => void
}

export function StartTripForm({ vehicleId, licensePlate, currentOdometer, onSuccess }: StartTripFormProps) {
    const queryClient = useQueryClient()
    const [formError, setFormError] = useState<string | null>(null)

    const form = useForm<StartTripValues>({
        resolver: zodResolver(startTripSchema.omit({ vehicleId: true })) as any,
        defaultValues: {
            mileageStart: currentOdometer,
            origin: "",
            destination: "",
            description: ""
        }
    })

    const mutation = useMutation({
        mutationFn: async (data: StartTripValues) => {
            console.log("Submitting Start Trip for vehicle:", vehicleId)
            const formData = new FormData()
            formData.append("vehicleId", vehicleId.toString())
            formData.append("origin", data.origin)
            formData.append("destination", data.destination)
            formData.append("description", data.description || "")
            formData.append("mileageStart", data.mileageStart.toString())

            const result = await startTrip(formData)
            console.log("Start Trip Result:", result)

            if (result?.error) {
                throw new Error(result.error)
            }
            return result
        },
        onSuccess: () => {
            toast.success("เริ่มการเดินทางเรียบร้อยแล้ว")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            queryClient.invalidateQueries({ queryKey: ["vehicles"] })
            onSuccess?.()
        },
        onError: (err: Error) => {
            console.error("Client submission error:", err)
            setFormError("Submission Failed: " + (err.message || "Unknown error"))
            toast.error(err.message || "Failed to start trip")
        }
    })

    function onSubmit(data: StartTripValues) {
        setFormError(null)
        if (data.mileageStart < currentOdometer) {
            form.setError("mileageStart", { message: "เลขไมล์ต้องไม่ต่ำกว่าเลขไมล์ปัจจุบัน (" + currentOdometer + ")" })
            return
        }
        mutation.mutate(data)
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {formError}
                </div>
            )}
            <div>
                <Label>ทะเบียนรถ</Label>
                <Input disabled value={licensePlate} className="bg-slate-100 dark:bg-slate-800" />
            </div>
            <div>
                <Label htmlFor="mileageStart">เลขไมล์เริ่มต้น</Label>
                <Input {...form.register("mileageStart")} type="number" />
                {form.formState.errors.mileageStart && <p className="text-sm text-red-500">{form.formState.errors.mileageStart.message}</p>}
            </div>
            <div>
                <Label htmlFor="origin">สถานที่ต้นทาง</Label>
                <Input {...form.register("origin")} placeholder="เช่น สนง.ใหญ่, บ้านพัก..." />
                {form.formState.errors.origin && <p className="text-sm text-red-500">{form.formState.errors.origin.message}</p>}
            </div>
            <div>
                <Label htmlFor="destination">สถานที่ปลายทาง</Label>
                <Input {...form.register("destination")} placeholder="เช่น ทำงานที่..." />
                {form.formState.errors.destination && <p className="text-sm text-red-500">{form.formState.errors.destination.message}</p>}
            </div>
            <div>
                <Label htmlFor="description">รายละเอียดงาน</Label>
                <Input {...form.register("description")} placeholder="รายละเอียด..." />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ยืนยันการเริ่มงาน
            </Button>
        </form>
    )
}

interface EndTripFormProps {
    tripId: number
    mileageStart: number
    onSuccess?: () => void
}

export function EndTripForm({ tripId, mileageStart, onSuccess }: EndTripFormProps) {
    const queryClient = useQueryClient()
    const form = useForm<EndTripValues>({
        resolver: zodResolver(endTripSchema) as any,
        defaultValues: {
            tripId: tripId,
            mileageEnd: undefined as any
        }
    })

    const mutation = useMutation({
        mutationFn: async (data: EndTripValues) => {
            console.log("EndTripForm: Submitting...")
            const formData = new FormData()
            formData.append("tripId", tripId.toString())
            formData.append("mileageEnd", data.mileageEnd.toString())

            const result = await endTrip(formData)
            console.log("EndTripForm: Result received", result)

            if (result?.error) {
                throw new Error(result.error)
            }
            return result
        },
        onSuccess: () => {
            toast.success("จบการเดินทางเรียบร้อยแล้ว")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            queryClient.invalidateQueries({ queryKey: ["vehicles"] })
            // Use setTimeout to ensure this runs after any re-renders/unmounts caused by revalidatePath
            setTimeout(() => {
                onSuccess?.()
            }, 0)
        },
        onError: (err: Error) => {
            alert(err.message)
            toast.error(err.message || "Failed to end trip")
        }
    })

    function onSubmit(data: EndTripValues) {
        if (data.mileageEnd <= mileageStart) {
            form.setError("mileageEnd", { message: "เลขไมล์ต้องมากกว่าเลขไมล์เริ่มต้น (" + mileageStart + ")" })
            return
        }
        mutation.mutate(data)
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <Label htmlFor="mileageEnd">เลขไมล์สิ้นสุด (เริ่มต้น: {mileageStart})</Label>
                <Input {...form.register("mileageEnd")} type="number" placeholder={(mileageStart + 1).toString()} />
                {form.formState.errors.mileageEnd && <p className="text-sm text-red-500">{form.formState.errors.mileageEnd.message}</p>}
            </div>
            <Button type="submit" variant="destructive" disabled={mutation.isPending} className="w-full">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                จบการเดินทาง
            </Button>
        </form>
    )
}
