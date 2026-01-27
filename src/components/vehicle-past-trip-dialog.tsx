"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PastTripForm } from "@/components/past-trip-form"
import { History } from "lucide-react"
import { useRouter } from "next/navigation"

interface VehiclePastTripDialogProps {
    vehicleId: number
    trigger?: React.ReactNode
}

export function VehiclePastTripDialog({ vehicleId, trigger }: VehiclePastTripDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline">
                        <History className="mr-2 h-4 w-4" />
                        บันทึกย้อนหลัง
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>บันทึกการเดินทางย้อนหลัง</DialogTitle>
                </DialogHeader>
                <PastTripForm
                    defaultVehicleId={vehicleId}
                    onSuccess={() => {
                        setOpen(false)
                        router.refresh()
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
