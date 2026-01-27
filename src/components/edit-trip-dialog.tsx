"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateTrip } from "@/app/actions/trip-crud-actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Pencil } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const formSchema = z.object({
    origin: z.string().min(1, "กรุณาระบุต้นทาง"),
    destination: z.string().min(1, "กรุณาระบุปลายทาง"),
    description: z.string().optional(),
    mileageStart: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
    mileageEnd: z.coerce.number().optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface EditTripDialogProps {
    trip: {
        id: number
        origin: string | null
        destination: string | null
        description: string | null
        mileageStart: number
        mileageEnd: number | null
    }
}

export function EditTripDialog({ trip }: EditTripDialogProps) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            origin: trip.origin || "",
            destination: trip.destination || "",
            description: trip.description || "",
            mileageStart: trip.mileageStart,
            mileageEnd: trip.mileageEnd,
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const formData = new FormData()
            formData.append("tripId", trip.id.toString())
            formData.append("origin", data.origin)
            formData.append("destination", data.destination)
            formData.append("description", data.description || "")
            formData.append("mileageStart", data.mileageStart.toString())
            if (data.mileageEnd !== null && data.mileageEnd !== undefined) {
                formData.append("mileageEnd", data.mileageEnd.toString())
            }

            const result = await updateTrip(formData)

            if (result.error) {
                const errorMessage = typeof result.error === "string"
                    ? result.error
                    : "Validation failed"
                throw new Error(errorMessage)
            }
            return result
        },
        onSuccess: () => {
            toast.success("แก้ไขข้อมูลการเดินทางเรียบร้อยแล้ว")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            setOpen(false)
        },
        onError: (error: Error) => {
            console.error(error)
            toast.error(error.message || "Failed to update trip")
        }
    })

    function onSubmit(data: FormValues) {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    แก้ไข
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>แก้ไขข้อมูลการเดินทาง</DialogTitle>
                    <DialogDescription>
                        แก้ไขรายละเอียดการเดินทาง Trip #{trip.id}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="origin">สถานที่ต้นทาง</Label>
                        <Input id="origin" {...form.register("origin")} />
                        {form.formState.errors.origin && <p className="text-xs text-red-500">{form.formState.errors.origin.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="destination">สถานที่ปลายทาง</Label>
                        <Input id="destination" {...form.register("destination")} />
                        {form.formState.errors.destination && <p className="text-xs text-red-500">{form.formState.errors.destination.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">รายละเอียดงาน</Label>
                        <Input id="description" {...form.register("description")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="mileageStart">ไมล์เริ่มต้น</Label>
                            <Input id="mileageStart" type="number" {...form.register("mileageStart")} />
                            {form.formState.errors.mileageStart && <p className="text-xs text-red-500">{form.formState.errors.mileageStart.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="mileageEnd">ไมล์สิ้นสุด (ถ้ามี)</Label>
                            <Input id="mileageEnd" type="number" {...form.register("mileageEnd")} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
