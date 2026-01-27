"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerVehicleSchema, RegisterVehicleValues } from "@/lib/schemas"
import { getApiPath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface VehicleFormProps {
    initialData?: any
    onSuccess: () => void
}

export function VehicleForm({ initialData, onSuccess }: VehicleFormProps) {
    const queryClient = useQueryClient()

    const form = useForm({
        resolver: zodResolver(registerVehicleSchema),
        defaultValues: {
            licensePlate: initialData?.licensePlate || "",
            brand: initialData?.brand || "",
            model: initialData?.model || "",
            type: initialData?.type || "รถยนต์",
            status: (initialData?.status as any) || "AVAILABLE",
            currentOdometer: initialData?.currentOdometer || 0,
            section: initialData?.section || "",
            imageUrl: initialData?.imageUrl || ""
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: RegisterVehicleValues) => {
            const method = initialData ? "PUT" : "POST"
            const body = initialData ? { ...data, id: initialData.id } : data

            const res = await fetch(getApiPath("/api/admin/vehicles"), {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to save")
            }

            return res.json()
        },
        onSuccess: (data) => {
            form.reset()
            toast.success(initialData ? "Vehicle updated successfully" : "Vehicle registered successfully")
            queryClient.invalidateQueries({ queryKey: ["vehicles"] })
            onSuccess()
        },
        onError: (err: Error) => {
            const errorMessage = err.message || "Something went wrong. Please try again."
            toast.error(errorMessage)
        }
    })

    function onSubmit(data: RegisterVehicleValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {mutation.isError && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                        {mutation.error.message}
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ทะเบียนรถ <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="99-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ยี่ห้อ</FormLabel>
                                <FormControl>
                                    <Input placeholder="Toyota" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>รุ่น</FormLabel>
                                <FormControl>
                                    <Input placeholder="Corolla" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ประเภท</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกประเภท" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="รถยนต์">รถยนต์</SelectItem>
                                        <SelectItem value="รถกระบะ">รถกระบะ</SelectItem>
                                        <SelectItem value="รถตู้">รถตู้</SelectItem>
                                        <SelectItem value="รถจักรยานยนต์">รถจักรยานยนต์</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="currentOdometer"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>เลขไมล์ปัจจุบัน</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} value={field.value as number} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สถานะ</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกสถานะ" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="AVAILABLE">พร้อมใช้งาน</SelectItem>
                                        <SelectItem value="IN_USE">กำลังใช้งาน</SelectItem>
                                        <SelectItem value="MAINTENANCE">ซ่อมบำรุง</SelectItem>
                                        <SelectItem value="Stand By">Stand By</SelectItem>
                                        <SelectItem value="เลิกใช้งาน">เลิกใช้งาน</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สังกัด / แผนก</FormLabel>
                                <FormControl>
                                    <Input placeholder="ระบุแผนก..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            กำลังบันทึก...
                        </>
                    ) : (
                        initialData ? "บันทึกการแก้ไข" : "ลงทะเบียนรถใหม่"
                    )}
                </Button>
            </form>
        </Form>
    )
}
