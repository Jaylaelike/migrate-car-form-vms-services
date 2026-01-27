"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query" // Import useQueryClient
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { VehicleForm } from "./vehicle-form"
import { Car, Pencil } from "lucide-react"

export function RegisterVehicleDialog({ vehicle }: { vehicle?: any }) {
    const queryClient = useQueryClient()
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {vehicle ? (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                ) : (
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
                        <Car className="mr-2 h-4 w-4" />
                        ลงทะเบียนรถใหม่
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{vehicle ? "แก้ไขข้อมูลรถ" : "ลงทะเบียนรถใหม่"}</DialogTitle>
                    <DialogDescription>
                        {vehicle ? "แก้ไขรายละเอียดข้อมูลรถในระบบ" : "เพิ่มข้อมูลรถใหม่เข้าสู่ระบบ"}
                    </DialogDescription>
                </DialogHeader>
                <VehicleForm
                    initialData={vehicle}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ["admin-vehicles"] })
                        setOpen(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
