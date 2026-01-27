"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateFuelLog } from "@/app/actions/fuel-actions"
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
    odometer: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
    liter: z.coerce.number().min(0, "จำนวนลิตรต้องไม่ติดลบ"),
    price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
    station: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditFuelLogDialogProps {
    log: {
        id: number
        odometer: number
        liter: number
        price: number
        station: string | null
        tripId: number
    }
    onSuccess?: () => void
}

export function EditFuelLogDialog({ log, onSuccess }: EditFuelLogDialogProps) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            odometer: log.odometer,
            liter: log.liter,
            price: log.price,
            station: log.station || "",
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const formData = new FormData()
            formData.append("logId", log.id.toString())
            formData.append("tripId", log.tripId.toString())
            formData.append("odometer", data.odometer.toString())
            formData.append("liter", data.liter.toString())
            formData.append("price", data.price.toString())
            formData.append("station", data.station || "")

            const result = await updateFuelLog(formData)

            if (result.error) {
                const errorMessage = typeof result.error === "string"
                    ? result.error
                    : "Validation failed"
                throw new Error(errorMessage)
            }
            return result
        },
        onSuccess: () => {
            toast.success("แก้ไขรายการเติมน้ำมันเรียบร้อยแล้ว")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            setOpen(false)
            onSuccess?.()
        },
        onError: (error: Error) => {
            console.error(error)
            toast.error(error.message || "Failed to update fuel log")
        }
    })

    function onSubmit(data: FormValues) {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>แก้ไขรายการเติมน้ำมัน</DialogTitle>
                    <DialogDescription>
                        แก้ไขข้อมูลการเติมน้ำมัน
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="station">สถานที่/ปั๊ม</Label>
                        <Input id="station" {...form.register("station")} placeholder="ระบุชื่อปั๊ม..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="odometer">เลขไมล์</Label>
                        <Input id="odometer" type="number" {...form.register("odometer")} />
                        {form.formState.errors.odometer && <p className="text-xs text-red-500">{form.formState.errors.odometer.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="liter">จำนวนลิตร</Label>
                            <Input id="liter" type="number" step="any" {...form.register("liter")} />
                            {form.formState.errors.liter && <p className="text-xs text-red-500">{form.formState.errors.liter.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">ราคา (บาท)</Label>
                            <Input id="price" type="number" step="any" {...form.register("price")} />
                            {form.formState.errors.price && <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>}
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
