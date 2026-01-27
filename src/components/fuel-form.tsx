"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { logFuel } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { fuelLogSchema, type FuelLogValues } from "@/lib/schemas"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface FuelLogFormProps {
    tripId: number
    onSuccess?: () => void
}

export function FuelLogForm({ tripId, onSuccess }: FuelLogFormProps) {
    const queryClient = useQueryClient()
    const form = useForm<FuelLogValues>({
        resolver: zodResolver(fuelLogSchema.omit({ tripId: true })) as any,
        defaultValues: {
            station: "",
        }
    })

    const [showSuccess, setShowSuccess] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const mutation = useMutation({
        mutationFn: async (data: FuelLogValues) => {
            console.log("FuelLogForm: Submitting...")
            const formData = new FormData()
            formData.append("tripId", tripId.toString())
            formData.append("odometer", data.odometer.toString())
            formData.append("liter", data.liter.toString())
            formData.append("price", data.price.toString())
            formData.append("station", data.station || "")
            formData.append("location", data.location || "")

            const result = await logFuel(formData)
            console.log("FuelLogForm: Result", result)

            if (result?.error) {
                throw new Error(result.error)
            }

            return result
        },
        onSuccess: () => {
            console.log("FuelLogForm: Setting showSuccess true")
            setShowSuccess(true)
            form.reset()
            queryClient.invalidateQueries({ queryKey: ["trips"] }) // Assuming fuel logs affect trip details or list
        },
        onError: (err: Error) => {
            console.error("Client submission error:", err)
            setFormError("Submission Failed: " + (err.message || "Unknown error"))
            toast.error(err.message || "Failed to log fuel")
        }
    })

    function onSubmit(data: FuelLogValues) {
        setFormError(null)
        mutation.mutate(data)
    }

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
                    <div className="h-8 w-8 text-emerald-600 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">บันทึกข้อมูลเรียบร้อย</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        ข้อมูลการเติมน้ำมันถูกบันทึกเข้าสู่ระบบแล้ว
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setShowSuccess(false)
                        onSuccess?.()
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[120px]"
                >
                    ตกลง
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
            <h4 className="font-semibold text-sm">บันทึกการเติมน้ำมัน</h4>
            {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {formError}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="odometer">เลขไมล์ (ตอนเติม)</Label>
                    <Input {...form.register("odometer")} type="number" />
                    {form.formState.errors.odometer && <p className="text-sm text-red-500">{form.formState.errors.odometer.message}</p>}
                </div>
                <div>
                    <Label htmlFor="liter">จำนวนลิตร</Label>
                    <Input {...form.register("liter")} type="number" step="any" />
                    {form.formState.errors.liter && <p className="text-sm text-red-500">{form.formState.errors.liter.message}</p>}
                </div>
                <div>
                    <Label htmlFor="price">ราคารวม (บาท)</Label>
                    <Input {...form.register("price")} type="number" step="any" />
                    {form.formState.errors.price && <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>}
                </div>
                <div>
                    <Label htmlFor="station">สถานีบริการ</Label>
                    <Input {...form.register("station")} placeholder="ปตท, บางจาก..." />
                </div>
                <div>
                    <Label htmlFor="location">จังหวัด</Label>
                    <Input {...form.register("location")} placeholder="กทม, ชลบุรี..." />
                </div>
            </div>
            <Button type="submit" size="sm" variant="secondary" disabled={mutation.isPending} className="w-full">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
            </Button>
        </form>
    )
}
