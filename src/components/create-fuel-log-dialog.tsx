"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { FuelLogForm } from "./fuel-form"

interface CreateFuelLogDialogProps {
    tripId: number
    onSuccess?: () => void
}

export function CreateFuelLogDialog({ tripId, onSuccess }: CreateFuelLogDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        เพิ่มข้อมูล
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>เพิ่มข้อมูลการเติมน้ำมัน</DialogTitle>
                    <DialogDescription>
                        บันทึกรายละเอียดการเติมน้ำมันสำหรับ Trip #{tripId}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <FuelLogForm
                        tripId={tripId}
                        onSuccess={() => {
                            setOpen(false)
                            onSuccess?.()
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
