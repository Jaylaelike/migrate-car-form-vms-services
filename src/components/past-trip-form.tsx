"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recordPastTrip } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CalendarIcon, Plus, Trash } from "lucide-react"
import { pastTripSchema, type PastTripValues } from "@/lib/schemas"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface Vehicle {
    id: number
    licensePlate: string
    brand: string | null
    model: string | null
}

interface PastTripFormProps {
    vehicles?: Vehicle[]
    defaultVehicleId?: number
    onSuccess?: () => void
}

export function PastTripForm({ vehicles = [], defaultVehicleId, onSuccess }: PastTripFormProps) {
    const [formError, setFormError] = useState<string | null>(null)

    const form = useForm<PastTripValues>({
        resolver: zodResolver(pastTripSchema) as any,
        defaultValues: {
            vehicleId: defaultVehicleId,
            origin: "",
            destination: "",
            description: "",
            mileageStart: 0,
            mileageEnd: 0,
            departureDate: undefined,
            returnDate: undefined,
            hasFuelLog: false,
            fuelLogs: [],
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fuelLogs"
    })

    const mutation = useMutation({
        mutationFn: async (data: PastTripValues) => {
            const formData = new FormData()
            formData.append("vehicleId", data.vehicleId.toString())
            formData.append("origin", data.origin)
            formData.append("destination", data.destination)
            formData.append("description", data.description || "")
            formData.append("mileageStart", data.mileageStart.toString())
            formData.append("mileageEnd", data.mileageEnd.toString())
            formData.append("departureDate", data.departureDate.toISOString())
            formData.append("returnDate", data.returnDate.toISOString())

            if (data.hasFuelLog) {
                formData.append("hasFuelLog", "true")
                // Send fuelLogs as JSON string
                formData.append("fuelLogs", JSON.stringify(data.fuelLogs))
            }

            const result = await recordPastTrip(formData)
            if (result?.error) {
                throw new Error(result.error)
            }
            return result
        },
        onSuccess: () => {
            toast.success("บันทึกข้อมูลย้อนหลังเรียบร้อยแล้ว")
            form.reset()
            onSuccess?.()
        },
        onError: (err: Error) => {
            console.error("Submission error:", err)
            setFormError("Submission Failed: " + (err.message || "Unknown error"))
            toast.error(err.message || "Failed to record trip")
        }
    })

    function onSubmit(data: PastTripValues) {
        setFormError(null)
        mutation.mutate(data)
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-2 mb-6">
                <h2 className="text-xl font-bold">บันทึกการเดินทางย้อนหลัง</h2>
                <p className="text-sm text-slate-500">กรอกข้อมูลสำหรับการเดินทางที่เกิดขึ้นแล้ว</p>
            </div>

            {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {formError}
                </div>
            )}

            <div className="grid gap-4">
                {!defaultVehicleId && (
                    <div className="grid gap-2">
                        <Label>เลือกรถ</Label>
                        <Select onValueChange={(val) => form.setValue("vehicleId", parseInt(val))} defaultValue={form.getValues("vehicleId")?.toString()}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- เลือกรถ --" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map((v) => (
                                    <SelectItem key={v.id} value={v.id.toString()}>
                                        {v.licensePlate} ({v.brand} {v.model})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.vehicleId && <p className="text-sm text-red-500">{form.formState.errors.vehicleId.message}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>วันที่เริ่มต้น</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !form.watch("departureDate") && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {form.watch("departureDate") ? (
                                        format(form.watch("departureDate"), "PPP", { locale: th })
                                    ) : (
                                        <span>เลือกวันที่</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.watch("departureDate")}
                                    onSelect={(date) => form.setValue("departureDate", date as Date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {form.formState.errors.departureDate && <p className="text-sm text-red-500">{form.formState.errors.departureDate.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label>วันที่สิ้นสุด</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !form.watch("returnDate") && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {form.watch("returnDate") ? (
                                        format(form.watch("returnDate"), "PPP", { locale: th })
                                    ) : (
                                        <span>เลือกวันที่</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.watch("returnDate")}
                                    onSelect={(date) => form.setValue("returnDate", date as Date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {form.formState.errors.returnDate && <p className="text-sm text-red-500">{form.formState.errors.returnDate.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="mileageStart">เลขไมล์เริ่มต้น</Label>
                        <Input {...form.register("mileageStart")} type="number" />
                        {form.formState.errors.mileageStart && <p className="text-sm text-red-500">{form.formState.errors.mileageStart.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mileageEnd">เลขไมล์สิ้นสุด</Label>
                        <Input {...form.register("mileageEnd")} type="number" />
                        {form.formState.errors.mileageEnd && <p className="text-sm text-red-500">{form.formState.errors.mileageEnd.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="origin">สถานที่ต้นทาง</Label>
                        <Input {...form.register("origin")} placeholder="เช่น สนง.ใหญ่, บ้านพัก..." />
                        {form.formState.errors.origin && <p className="text-sm text-red-500">{form.formState.errors.origin.message}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="destination">สถานที่ปลายทาง</Label>
                        <Input {...form.register("destination")} placeholder="เช่น ทำงานที่..." />
                        {form.formState.errors.destination && <p className="text-sm text-red-500">{form.formState.errors.destination.message}</p>}
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">รายละเอียดงาน</Label>
                    <Input {...form.register("description")} placeholder="รายละเอียด..." />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="checkbox"
                            id="hasFuelLog"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            {...form.register("hasFuelLog")}
                        />
                        <Label htmlFor="hasFuelLog" className="font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                            บันทึกการเติมน้ำมัน
                        </Label>
                    </div>

                    {form.watch("hasFuelLog") && (
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="grid gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 relative">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-sm font-medium text-slate-700">รายการที่ {index + 1}</h4>
                                        {fields.length > 0 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`fuelLogs.${index}.odometer`}>เลขไมล์</Label>
                                            <Input {...form.register(`fuelLogs.${index}.odometer` as const)} type="number" placeholder="เลขไมล์..." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`fuelLogs.${index}.liter`}>จำนวนลิตร</Label>
                                            <Input {...form.register(`fuelLogs.${index}.liter` as const)} type="number" step="any" placeholder="0.0" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`fuelLogs.${index}.price`}>ราคา</Label>
                                            <Input {...form.register(`fuelLogs.${index}.price` as const)} type="number" step="any" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor={`fuelLogs.${index}.station`}>สถานีบริการ</Label>
                                            <Input {...form.register(`fuelLogs.${index}.station` as const)} placeholder="ปตท, บางจาก..." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor={`fuelLogs.${index}.location`}>จังหวัด</Label>
                                            <Input {...form.register(`fuelLogs.${index}.location` as const)} placeholder="กทม, ชลบุรี..." />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({
                                    odometer: form.getValues("mileageEnd") || 0, // Default to trip end mileage
                                    liter: 0,
                                    price: 0,
                                    station: "",
                                    location: ""
                                })}
                                className="w-full border-dashed"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                เพิ่มรายการเติมน้ำมัน
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                บันทึกข้อมูล
            </Button>
        </form>
    )
}
