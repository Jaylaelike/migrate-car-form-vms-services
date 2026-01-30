"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Fuel, Gauge, MapPin, Navigation, User } from "lucide-react"
import { formatDateThai } from "@/lib/format-utils"
import { EditFuelLogDialog } from "@/components/edit-fuel-log-dialog"
import { DeleteFuelLogAlert } from "@/components/delete-fuel-log-alert"
import { CreateFuelLogDialog } from "@/components/create-fuel-log-dialog"

// Define a type that matches the structure we expect
// We can use Prisma generated types, but for a reused component, an explicit interface is often cleaner to avoid deep import chains if not strict.
// However, exact Prisma types are better for consistency.
// However, exact Prisma types are better for consistency.
import { Prisma } from "@prisma/client"
import { getApiPath } from "@/lib/utils"
import CountUp from "./count-up"

type TripWithDetails = Omit<Prisma.TripGetPayload<{
    include: {
        vehicle: true,
        driver: true,
        fuelLogs: true
    }
}>, "fuelLogs"> & {
    fuelLogs: (Omit<Prisma.FuelLogGetPayload<true>, "liter" | "price"> & {
        liter: number
        price: number
    })[]
}

interface TripInfoDisplayProps {
    trip: TripWithDetails
    onRefresh?: () => void
}

export function TripInfoDisplay({ trip, onRefresh }: TripInfoDisplayProps) {

    const duration = trip.returnDate
        ? Math.abs(new Date(trip.returnDate).getTime() - new Date(trip.departureDate).getTime()) / 36e5
        : null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Trip Info */}
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Car className="h-4 w-4 text-blue-500" />
                            ยานพาหนะ & ผู้ขับขี่
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-400 font-medium uppercase">รถยนต์</p>
                                <div className="font-semibold text-slate-900">{trip.vehicle.licensePlate}</div>
                                <div className="text-sm text-slate-500">{trip.vehicle.brand} {trip.vehicle.model}</div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <p className="text-xs text-slate-400 font-medium uppercase mb-1">ผู้ขับขี่</p>
                                <div className="flex items-center gap-2">
                                    <div className="font-medium text-slate-900">{trip.driver?.ThaiName || trip.driver?.EngName || "-"}</div>
                                    {trip.driver?.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={getApiPath(trip.driver.image_url)} alt="Driver" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-slate-500">{trip.driver?.Section || "-"}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4 text-red-500" />
                            เส้นทาง
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8">
                        <div className="relative">
                            <span className="absolute -left-[2.35rem] top-1.5 h-3 w-3 rounded-full border-2 border-slate-50 bg-green-500" />
                            <p className="text-xs text-slate-400 font-medium uppercase">ต้นทาง</p>
                            <p className="font-medium text-slate-900">{trip.origin}</p>
                            <p className="text-sm text-slate-500 mt-1">{formatDateThai(trip.departureDate)}</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[2.35rem] top-1.5 h-3 w-3 rounded-full border-2 border-slate-50 bg-red-500" />
                            <p className="text-xs text-slate-400 font-medium uppercase">ปลายทาง</p>
                            <p className="font-medium text-slate-900">{trip.destination}</p>
                            {trip.returnDate ? (
                                <p className="text-sm text-slate-500 mt-1">{formatDateThai(trip.returnDate)}</p>
                            ) : (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block">กำลังเดินทาง</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Stats & Fuel */}
            <div className="space-y-6">
                <Card>
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Gauge className="h-4 w-4 text-emerald-500" />
                            สถิติการใช้งาน
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase">ระยะทางรวม</p>
                            <div className="text-xl font-bold text-slate-900">
                                {trip.totalDistance ? <CountUp to={trip.totalDistance} separator="," duration={0.5} /> : "-"} <span className="text-sm font-normal text-slate-500">km</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase">ระยะเวลา</p>
                            <div className="text-xl font-bold text-slate-900">
                                {duration ? <CountUp to={duration} separator="." duration={0.5} /> : "-"} <span className="text-sm font-normal text-slate-500">ชม.</span>
                            </div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">ไมล์เริ่มต้น:</span>
                                <span className="font-mono"><CountUp to={trip.mileageStart} separator="," duration={0.5} /></span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-500">ไมล์สิ้นสุด:</span>
                                <span className="font-mono">{trip.mileageEnd ? <CountUp to={trip.mileageEnd} separator="," duration={0.5} /> : "-"}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {trip.fuelLogs.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Fuel className="h-4 w-4 text-orange-500" />
                                ประวัติการเติมน้ำมัน
                            </CardTitle>
                            <CreateFuelLogDialog tripId={trip.id} onSuccess={onRefresh} />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 mb-4 grid grid-cols-2 gap-4 border border-orange-100 dark:border-orange-900/50">
                                <div>
                                    <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium uppercase">รวมเป็นเงิน</p>
                                    <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                        <CountUp to={trip.fuelLogs.reduce((acc, log) => acc + Number(log.price), 0)} separator="," duration={0.5} /> <span className="text-sm font-normal">บาท</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium uppercase">รวมจำนวนลิตร</p>
                                    <div className="text-lg font-bold text-orange-700 dark:text-orange-400">
                                        <CountUp to={trip.fuelLogs.reduce((acc, log) => acc + Number(log.liter), 0)} separator="," duration={0.5} /> <span className="text-sm font-normal">ลิตร</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {trip.fuelLogs.map((log) => (
                                    <div key={log.id} className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                                        <div>
                                            <div className="font-semibold text-slate-800 dark:text-orange-200">{log.station || "ปั๊มน้ำมันทั่วไป"}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>เลขไมล์: {log.odometer.toLocaleString()}</span>
                                                {log.location && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{log.location}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <div>
                                                <div className="font-bold text-orange-600 dark:text-orange-400">{Number(log.price).toLocaleString()} ฿</div>
                                                <div className="text-xs text-slate-500">{Number(log.liter).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} ลิตร</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <EditFuelLogDialog log={log} onSuccess={onRefresh} />
                                                <DeleteFuelLogAlert logId={log.id} tripId={trip.id} onSuccess={onRefresh} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {trip.description && (
                    <Card>
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Navigation className="h-4 w-4 text-purple-500" />
                                รายละเอียดงาน
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                                {trip.description}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
