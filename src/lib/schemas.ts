import { z } from "zod"

export const startTripSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Invalid vehicle ID"),
  origin: z.string().min(1, "กรุณาระบุสถานที่ต้นทาง"), // "Origin is required"
  destination: z.string().min(1, "กรุณาระบุสถานที่ปลายทาง"), // "Destination is required"
  description: z.string().optional(),
  mileageStart: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"), // "Invalid mileage"
})

export const endTripSchema = z.object({
  tripId: z.coerce.number().int().positive("Invalid trip ID"),
  mileageEnd: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
})

export const fuelLogSchema = z.object({
  tripId: z.coerce.number().int().positive("Invalid trip ID"),
  odometer: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
  liter: z.coerce.number().min(0.1, "จำนวนลิตรต้องมากกว่า 0"),
  price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
  station: z.string().optional(),
  location: z.string().optional(),
})

export type StartTripValues = z.infer<typeof startTripSchema>
export type EndTripValues = z.infer<typeof endTripSchema>
export type FuelLogValues = z.infer<typeof fuelLogSchema>

export const registerVehicleSchema = z.object({
  licensePlate: z.string().min(1, "กรุณาระบุทะเบียนรถ"),
  brand: z.string().optional(),
  model: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "เลิกใช้งาน", "Stand By"]),
  currentOdometer: z.coerce.number().min(0, "Odometer must be positive").default(0),
  section: z.string().optional(),
  imageUrl: z.string().optional(),
})

export type RegisterVehicleValues = z.infer<typeof registerVehicleSchema>

export const pastTripSchema = z.object({
  vehicleId: z.coerce.number().int().positive("Invalid vehicle ID"),
  origin: z.string().min(1, "กรุณาระบุสถานที่ต้นทาง"),
  destination: z.string().min(1, "กรุณาระบุสถานที่ปลายทาง"),
  description: z.string().optional(),
  mileageStart: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
  mileageEnd: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  hasFuelLog: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false).optional(),
  fuelLogs: z.array(z.object({
    liter: z.coerce.number().min(0, "จำนวนลิตรต้องไม่ติดลบ"),
    price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
    odometer: z.coerce.number().min(0, "เลขไมล์ต้องไม่ติดลบ"),
    station: z.string().optional(),
    location: z.string().optional(),
  })).optional().default([]),

}).refine((data) => data.mileageEnd >= data.mileageStart, {
  message: "เลขไมล์สิ้นสุดต้องมากกว่าหรือเท่ากับเลขไมล์เริ่มต้น",
  path: ["mileageEnd"],
}).refine((data) => data.returnDate >= data.departureDate, {
  message: "วันที่สิ้นสุดต้องหลังจากวันที่เริ่มต้น",
  path: ["returnDate"],
})

export type PastTripValues = z.infer<typeof pastTripSchema>

