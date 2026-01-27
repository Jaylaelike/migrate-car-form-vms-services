"use client"

import { useState, useRef } from "react"
import { Database, Download, Upload, AlertTriangle } from "lucide-react"
import { getApiPath } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function DatabaseManager() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const queryClient = useQueryClient()

    const handleBackup = () => {
        window.location.href = getApiPath("/api/admin/backup")
        toast.success("Backup download started")
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (!file.name.endsWith(".db") && !file.name.endsWith(".sqlite")) {
                toast.error("Invalid file type. Please upload a .db or .sqlite file.")
                return
            }
            setSelectedFile(file)
            setShowConfirmDialog(true)
        }
    }

    const mutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("file", file)

            const res = await fetch(getApiPath("/api/admin/backup"), {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to restore database")
            }
        },
        onSuccess: () => {
            toast.success("Database restored successfully")
            // Reload page to reflect data changes
            setTimeout(() => {
                window.location.reload()
            }, 1000)

            // Invalidate everything just in case, though reload handles it
            queryClient.invalidateQueries()
        },
        onError: (error: Error) => {
            console.error(error)
            toast.error(error.message || "Failed to restore database")
        },
        onSettled: () => {
            setShowConfirmDialog(false)
            setSelectedFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    })

    const handleRestore = () => {
        if (!selectedFile) return
        mutation.mutate(selectedFile)
    }

    return (
        <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <Database className="h-5 w-5" />
                    Database Management
                </CardTitle>
                <CardDescription className="text-orange-700/80">
                    Backup and restore the application database.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 border-orange-200 hover:bg-orange-100 hover:text-orange-800"
                    onClick={handleBackup}
                >
                    <Download className="h-4 w-4" />
                    Download Backup
                </Button>

                <div className="flex-1">
                    <input
                        type="file"
                        accept=".db,.sqlite"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={mutation.isPending}
                    >
                        <Upload className="h-4 w-4" />
                        {mutation.isPending ? "Restoring..." : "Restore Backup"}
                    </Button>
                </div>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" />
                                Warning: Irreversible Action
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to restore the database from a backup file.
                                <br /><br />
                                <strong>This will overwrite all existing data</strong> (users, trips, vehicles). This action cannot be undone.
                                <br /><br />
                                Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                                setSelectedFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ""
                            }}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRestore}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                Overwrite & Restore
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card >
    )
}
