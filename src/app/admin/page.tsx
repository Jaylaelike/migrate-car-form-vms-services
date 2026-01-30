
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, Map, Fuel } from "lucide-react"
import prisma from "@/lib/db"
import { DatabaseManager } from "@/components/admin/database-manager"
import { getApiPath } from "@/lib/utils"
import CountUp from "@/components/count-up"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    // Fetch summary stats directly from DB for the overview
    const [userCount, vehicleCount, tripCount, ongoingTrips] = await Promise.all([
        prisma.user.count(),
        prisma.vehicle.count(),
        prisma.trip.count(),
        prisma.trip.count({ where: { status: "ONGOING" } })
    ])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500">Welcome back, Admin!</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <CountUp to={userCount} separator="," />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <CountUp to={vehicleCount} separator="," />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                        <Map className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <CountUp to={tripCount} separator="," />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                        <Car className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            <CountUp to={ongoingTrips} separator="," />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <DatabaseManager />
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Recent Activity</h3>
                <RecentTripsTable />
            </div>
        </div>
    )
}

async function RecentTripsTable() {
    const recentTrips = await prisma.trip.findMany({
        take: 5,
        orderBy: { departureDate: "desc" },
        include: {
            vehicle: true,
            driver: true
        }
    })

    return (
        <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Trip ID</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Vehicle</th>
                            <th className="px-6 py-3">Driver</th>
                            <th className="px-6 py-3">Route</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {recentTrips.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No recent trips found.
                                </td>
                            </tr>
                        ) : (
                            recentTrips.map((trip) => (
                                <tr key={trip.id} className="bg-white hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">#{trip.id}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(trip.departureDate).toLocaleDateString('th-TH', {
                                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{trip.vehicle.licensePlate}</div>
                                        <div className="text-xs text-slate-500">{trip.vehicle.brand}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {trip.driver?.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={getApiPath(trip.driver.image_url)} alt="" className="h-6 w-6 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                    {trip.driver?.username?.[0] || "?"}
                                                </div>
                                            )}
                                            <span className="text-slate-700">{trip.driver?.ThaiName || trip.driver?.username || "Unknown"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs">
                                            <div className="flex items-center gap-1 text-slate-600"><span className="text-green-500">●</span> {trip.origin}</div>
                                            <div className="flex items-center gap-1 text-slate-600"><span className="text-red-500">●</span> {trip.destination}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trip.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                                            trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                            {trip.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
