"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getApiPath } from "@/lib/utils"

interface VehicleExportButtonProps {
    vehicleId: number
}

export function VehicleExportButton({ vehicleId }: VehicleExportButtonProps) {
    const handleExport = () => {
        // Trigger download
        window.location.href = getApiPath(`/api/admin/trips?vehicleId=${vehicleId}&export=csv`)
    }

    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
        </Button>
    )
}
