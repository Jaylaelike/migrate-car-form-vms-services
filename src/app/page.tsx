
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { FleetDashboard } from "@/components/fleet-dashboard"
import { handleSignOut } from "./actions"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { DashboardExportButton } from "@/components/dashboard-export-button"
import { getApiPath } from "@/lib/utils"

const prisma = new PrismaClient()

async function getVehicles(section?: string | null) {
  const whereClause: any = {};
  if (section) {
    whereClause.section = section;
  }

  return await prisma.vehicle.findMany({
    where: whereClause,
    orderBy: { licensePlate: 'asc' },
    include: {
      trips: {
        where: { status: "ONGOING" },
        take: 1,
        select: {
          id: true,
          mileageStart: true,
          status: true,
          departureDate: true,
          driver: {
            select: {
              ThaiName: true,
              EngName: true,
              image_url: true
            }
          }
        }
      }
    }
  })
}

export default async function Home() {
  const session = await auth()
  const userSection = session?.user?.section;
  const vehicles = await getVehicles(userSection)

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              VMS <span className="text-slate-400 font-normal">| ระบบจัดการยานพาหนะ</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              {(session?.user as any)?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getApiPath((session?.user as any).image_url)}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                  {((session?.user as any)?.ThaiName?.[0] || session?.user?.name?.[0] || "U")}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-slate-100 leading-none">
                  {(session?.user as any)?.ThaiName || session?.user?.name}
                </span>
                <span className="text-xs text-slate-400">
                  {session?.user?.section || "Employee"}
                </span>
              </div>
            </div>
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">สถานะยานพาหนะ</h2>
            <p className="text-slate-500">ภาพรวมสถานะและการใช้งานยานพาหนะแบบเรียลไทม์</p>
          </div>

          <DashboardExportButton section={userSection || undefined} />

        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <p className="text-slate-500 mb-4">ไม่พบข้อมูลยานพาหนะในระบบ</p>
            <Button variant="outline">Initialize Fleet Data</Button>
          </div>
        ) : (
          <FleetDashboard vehicles={vehicles} />
        )}
      </main>
    </div>
  )
}
