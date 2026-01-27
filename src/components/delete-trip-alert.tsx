"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteTrip } from "@/app/actions/trip-crud-actions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface DeleteTripAlertProps {
    tripId: number
}

export function DeleteTripAlert({ tripId }: DeleteTripAlertProps) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async () => {
            const result = await deleteTrip(tripId)
            if (result?.error) {
                throw new Error(result.error)
            }
            return result
        },
        onSuccess: () => {
            toast.success("ลบข้อมูลการเดินทางเรียบร้อยแล้ว")
            queryClient.invalidateQueries({ queryKey: ["trips"] })
            // Invalidate vehicles too as status might change if trip deleted (unlikely but safe)
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete trip")
        }
    })

    function handleDelete() {
        mutation.mutate()
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>ยืนยันการลบ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        คุณต้องการลบข้อมูลการเดินทาง Trip #{tripId} ใช่หรือไม่?
                        <br />
                        การกระทำนี้ไม่สามารถย้อนกลับได้
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "กำลังลบ..." : "ยืนยันลบ"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
