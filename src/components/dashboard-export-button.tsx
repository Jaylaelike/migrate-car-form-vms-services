"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getApiPath } from "@/lib/utils"

interface DashboardExportButtonProps {
    section?: string
}

export function DashboardExportButton({ section }: DashboardExportButtonProps) {
    const handleExport = () => {
        const queryParams = new URLSearchParams()
        queryParams.set("export", "csv")
        if (section) {
            queryParams.set("section", section)
        }

        window.location.href = getApiPath(`/api/admin/trips?${queryParams.toString()}`)
    }

    return (
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export Data
        </Button>
    )
}
