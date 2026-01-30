
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Car, Gauge, MapPin, Calendar, User, ChevronRight } from "lucide-react"
import Link from "next/link"
import { formatDateThai } from "@/lib/format-utils"
import { TripRow } from "@/components/trip-row"
import { VehicleExportButton } from "@/components/vehicle-export-button"
import { VehiclePastTripDialog } from "@/components/vehicle-past-trip-dialog"
import CountUp from "@/components/count-up"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function VehicleDetailPage({ params }: PageProps) {
    const session = await auth()
    if (!session) redirect("/login")

    const resolvedParams = await params
    const vehicleId = parseInt(resolvedParams.id)
    if (isNaN(vehicleId)) notFound()

    const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
            trips: {
                orderBy: { departureDate: "desc" },
                include: {
                    driver: {
                        select: { ThaiName: true, EngName: true, email: true, image_url: true }
                    }
                }
            }
        }
    })

    if (!vehicle) notFound()

    // Check section access if user has a section
    if (session.user?.section && vehicle.section && session.user.section !== vehicle.section) {
        // Optional: you might want to redirect or show unauthorized
        // For now allowing view but maybe we strictly enforce it?
        // The dashboard filters it, so direct access should probably be blocked too.
        // Let's implement strict check.
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
                    <p className="text-slate-500 mt-2">คุณไม่มีสิทธิ์เข้าถึงข้อมูลยานพาหนะของแผนกอื่น</p>
                    <Link href="/">
                        <Button className="mt-4" variant="outline">กลับสู่หน้าหลัก</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans p-4 sm:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header / Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {vehicle.licensePlate}
                                <Badge variant={vehicle.status === "AVAILABLE" ? "success" : vehicle.status === "IN_USE" ? "default" : "secondary"}>
                                    {vehicle.status === "AVAILABLE" ? "ใช้งาน" : vehicle.status}
                                </Badge>
                            </h1>
                            <p className="text-slate-500 text-sm">{vehicle.brand} {vehicle.model} • {vehicle.type || "รถยนต์"}</p>
                        </div>
                    </div>

                    {(session?.user?.role === "ADMIN" || session?.user?.role === "USER") && (
                        <div className="flex items-center gap-2">
                            <VehiclePastTripDialog vehicleId={vehicle.id} />
                            <VehicleExportButton vehicleId={vehicle.id} />
                        </div>
                    )}

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">เลขไมล์ปัจจุบัน</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-2xl font-bold text-slate-900">
                                <Gauge className="mr-2 h-5 w-5 text-slate-400" />
                                <CountUp to={vehicle.currentOdometer} separator="," duration={0.2} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">สังกัด / แผนก</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">
                                {vehicle.section || "-"}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">รวมระยะทางวิ่ง</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">
                                <CountUp to={vehicle.trips.reduce((acc, t) => acc + (t.totalDistance || 0), 0)} separator="," duration={0.5} /> <span className="text-sm font-normal text-slate-500">km</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Trip History Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            ประวัติการเดินทาง
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>วันที่ใช้รถ</TableHead>
                                    <TableHead>ผู้ขับขี่</TableHead>
                                    <TableHead>เส้นทาง</TableHead>
                                    <TableHead>ระยะทาง (km)</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicle.trips.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                            ยังไม่มีประวัติการใช้งาน
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    vehicle.trips.map((trip) => (
                                        <TripRow key={trip.id} trip={trip} />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
