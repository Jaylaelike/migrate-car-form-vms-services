"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, Gauge, PlayCircle, Fuel, Timer, Navigation, MapPin, ChevronRight, History } from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StartTripForm, EndTripForm } from "./trip-forms"
import { FuelLogForm } from "./fuel-form"
import { VehiclePastTripDialog } from "./vehicle-past-trip-dialog"

import { formatDateThai } from "@/lib/format-utils"
import { TripDetailsTabContent } from "./trip-details-tab-content"
import { cn, getApiPath } from "@/lib/utils"
import CountUp from "./count-up"

interface Vehicle {
    id: number
    licensePlate: string
    status: string
    currentOdometer: number
    type: string | null
    brand: string | null
    model: string | null
    trips: {
        id: number,
        mileageStart: number,
        status: string,
        departureDate: Date,
        driver: { ThaiName: string | null, EngName: string | null, image_url: string | null } | null
    }[]
}

interface FleetDashboardProps {
    vehicles: Vehicle[]
}

export function FleetDashboard({ vehicles }: FleetDashboardProps) {
    const [openId, setOpenId] = useState<number | null>(null)

    const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length
    const busyCount = vehicles.filter(v => v.status === "IN_USE").length

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">รถทั้งหมด</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            <CountUp to={vehicles.length} separator="," />
                        </p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">ว่าง</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500 mt-1">
                            <CountUp to={availableCount} separator="," />
                        </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">ใช้งานอยู่</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-500 mt-1">
                            <CountUp to={busyCount} separator="," />
                        </p>
                    </div>
                </div>

            </div>
            {/* Vehicle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => {
                    const activeTrip = vehicle.trips.find(t => t.status === "ONGOING")
                    const isAvailable = vehicle.status === "AVAILABLE" || vehicle.status === "ใช้งาน" || vehicle.status === "Stand By"

                    return (
                        <Card key={vehicle.id} className={cn(
                            "group overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4",
                            isAvailable ? "border-l-emerald-500 hover:border-emerald-500" : "border-l-blue-500 hover:border-blue-500"
                        )}>
                            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                                            <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-2 hover:underline decoration-blue-500/30 underline-offset-4">
                                                {vehicle.licensePlate}
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400" />
                                            </Link>
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full w-fit">
                                            {vehicle.brand} {vehicle.model}
                                        </div>
                                    </div>
                                    <Badge
                                        className={cn(
                                            "uppercase text-[10px] font-bold tracking-wider px-2 py-1",
                                            vehicle.status === "ใช้งาน" || vehicle.status === "AVAILABLE" || vehicle.status === "Stand By"
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                                                : vehicle.status === "เลิกใช้งาน"
                                                    ? "bg-slate-100 text-slate-500 hover:bg-slate-100 border-slate-200"
                                                    : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 animate-pulse"
                                        )}
                                        variant="secondary"
                                    >
                                        {vehicle.status === "AVAILABLE" || vehicle.status === "Stand By" ? "ใช้งาน" : vehicle.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 font-medium">เลขไมล์ปัจจุบัน</p>
                                        <div className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            <Gauge className="mr-1.5 h-4 w-4 text-slate-400" />
                                            <CountUp to={vehicle.currentOdometer} separator="," />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400 font-medium">ประเภท</p>
                                        <div className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            <Car className="mr-1.5 h-4 w-4 text-slate-400" />
                                            {vehicle.type || "รถยนต์"}
                                        </div>
                                    </div>
                                </div>

                                {activeTrip && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center">
                                                    <Timer className="mr-1.5 h-3.5 w-3.5 animate-spin-slow" />
                                                    งานปัจจุบัน #{activeTrip.id}
                                                </div>
                                                {activeTrip.driver && (
                                                    <div className="flex items-center gap-1.5 pl-2 border-l border-blue-200 dark:border-blue-800">
                                                        {activeTrip.driver.image_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={getApiPath(activeTrip.driver.image_url)} alt="Driver" className="h-5 w-5 rounded-full object-cover border border-blue-200" />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                                                {activeTrip.driver.ThaiName?.[0] || "U"}
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {activeTrip.driver.ThaiName || "Unknown"}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-normal text-slate-500">{formatDateThai(activeTrip.departureDate)}</span>
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            กำลังดำเนินการ
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="bg-slate-50/30 dark:bg-slate-900/30 pt-4 pb-4 grid grid-cols-[auto_1fr] gap-2">
                                <VehiclePastTripDialog
                                    vehicleId={vehicle.id}
                                    trigger={
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            title="บันทึกการเดินทางย้อนหลัง"
                                            disabled={vehicle.status === "IN_USE"}
                                        >
                                            <History className="mr-2 h-4 w-4" />
                                            บันทึกการเดินทางย้อนหลัง
                                        </Button>
                                    }
                                />
                                <Dialog open={openId === vehicle.id} onOpenChange={(open) => setOpenId(open ? vehicle.id : null)}>
                                    <DialogTrigger asChild>
                                        <Button
                                            disabled={vehicle.status === "เลิกใช้งาน"}
                                            className={cn(
                                                "w-full font-medium shadow-sm transition-all",
                                                vehicle.status === "เลิกใช้งาน"
                                                    ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                                            )}
                                            variant={vehicle.status === "เลิกใช้งาน" ? "outline" : "default"}
                                        >
                                            {vehicle.status === "เลิกใช้งาน" ? (
                                                <>
                                                    <span className="mr-2">⛔</span>
                                                    เลิกใช้งาน
                                                </>
                                            ) : isAvailable ? (
                                                <>
                                                    <Navigation className="mr-2 h-4 w-4" />
                                                    เริ่มงานใหม่
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin className="mr-2 h-4 w-4" />
                                                    จัดการงาน
                                                </>
                                            )}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px]">
                                        <DialogHeader>
                                            <DialogTitle className="flex items-center gap-2 text-xl">
                                                {isAvailable ? <PlayCircle className="text-emerald-500" /> : <Timer className="text-blue-500" />}
                                                {isAvailable ? "เริ่มภารกิจใหม่" : "ควบคุมภารกิจ"}
                                            </DialogTitle>
                                            <DialogDescription className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit mt-1">
                                                {vehicle.licensePlate} • {vehicle.brand} {vehicle.model}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="mt-4">
                                            {isAvailable ? (
                                                <StartTripForm
                                                    vehicleId={vehicle.id}
                                                    licensePlate={vehicle.licensePlate}
                                                    currentOdometer={vehicle.currentOdometer}
                                                    onSuccess={() => setOpenId(null)}
                                                />
                                            ) : (
                                                <div>
                                                    {activeTrip ? (
                                                        <Tabs defaultValue="end" className="w-full">
                                                            <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-slate-100 dark:bg-slate-800 h-auto">
                                                                <TabsTrigger value="end" className="py-2">จบงาน</TabsTrigger>

                                                                <TabsTrigger value="info" className="py-2">รายละเอียด</TabsTrigger>
                                                                <TabsTrigger value="fuel" className="py-2">บันทึกน้ำมัน</TabsTrigger>
                                                            </TabsList>
                                                            <TabsContent value="end" className="mt-0">
                                                                <EndTripForm
                                                                    tripId={activeTrip.id}
                                                                    mileageStart={activeTrip.mileageStart}
                                                                    onSuccess={() => {
                                                                        console.log("FleetDashboard: Closing dialog")
                                                                        setOpenId(null)
                                                                    }}
                                                                />
                                                            </TabsContent>
                                                            <TabsContent value="fuel" className="mt-0">
                                                                <FuelLogForm
                                                                    tripId={activeTrip.id}
                                                                    onSuccess={() => console.log("Fuel Log saved (parent callback)")}
                                                                />
                                                            </TabsContent>
                                                            <TabsContent value="info" className="mt-0">
                                                                <TripDetailsTabContent tripId={activeTrip.id} />
                                                            </TabsContent>
                                                        </Tabs>
                                                    ) : (
                                                        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                                                            System Error: Vehicle marked IN_USE but trip data is missing.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
