import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(req: NextRequest) {
  const { fromDate, toDate } = await req.json()
  const from = new Date(fromDate)
  const to = new Date(toDate)

  const workbook = new ExcelJS.Workbook()

  // Query sales and appointments in range
  // Note: Firestore date fields may be string or Timestamp; handle both
  const { collection, getDocs, query, where } = await import("firebase/firestore")
  const { db } = await import("@/lib/firebase")

  const salesSnap = await getDocs(collection(db, "sales"))
  const sales: any[] = []
  salesSnap.forEach(d => {
    const s = d.data()
    let saleDate: any = s.date
    if (typeof saleDate === 'string') saleDate = new Date(saleDate)
    else if (saleDate && saleDate.toDate) saleDate = saleDate.toDate()
    if (saleDate && saleDate >= from && saleDate <= to) {
      sales.push({ id: d.id, ...s, date: saleDate })
    }
  })

  const apptSnap = await getDocs(collection(db, "appointments"))
  const appts: any[] = []
  apptSnap.forEach(d => {
    const a = d.data()
    let when: any = a.scheduledAt || a.completedAt || a.createdAt || a.date
    if (typeof when === 'string') when = new Date(when)
    else if (when && when.toDate) when = when.toDate()
    if (when && when >= from && when <= to) {
      appts.push({ id: d.id, ...a, when })
    }
  })

  // Services Sheet - aggregate from sales
  const serviceSheet = workbook.addWorksheet("Services")
  serviceSheet.addRow(["Service Name", "Value"])
  const serviceMap: Record<string, number> = {}
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        if (it.type === 'service' || it.type === 'services') {
          const name = it.name || 'Service'
          const qty = typeof it.quantity === 'number' ? it.quantity : parseInt(it.quantity || '1')
          serviceMap[name] = (serviceMap[name] || 0) + (isNaN(qty) ? 1 : qty)
        }
      })
    }
  })
  Object.entries(serviceMap).forEach(([k, v]) => serviceSheet.addRow([k, v]))

  // Products Sheet
  const productSheet = workbook.addWorksheet("Products")
  productSheet.addRow(["Product Name", "Value"])
  const productMap: Record<string, number> = {}
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        if (it.type === 'product' || it.type === 'products') {
          const name = it.name || 'Product'
          const qty = typeof it.quantity === 'number' ? it.quantity : parseInt(it.quantity || '1')
          productMap[name] = (productMap[name] || 0) + (isNaN(qty) ? 1 : qty)
        }
      })
    }
  })
  Object.entries(productMap).forEach(([k, v]) => productSheet.addRow([k, v]))

  // Appointments Sheet
  const appointmentSheet = workbook.addWorksheet("Appointments")
  appointmentSheet.addRow(["Date", "Completed", "Cancelled"])
  const apptMap: Record<string, { completed: number; cancelled: number }> = {}
  appts.forEach(a => {
    const dateKey = new Date(a.when).toLocaleDateString()
    if (!apptMap[dateKey]) apptMap[dateKey] = { completed: 0, cancelled: 0 }
    const status = (a.status || '').toLowerCase()
    if (status === 'completed') apptMap[dateKey].completed += 1
    else if (status === 'cancelled') apptMap[dateKey].cancelled += 1
  })
  Object.entries(apptMap).forEach(([date, v]) => appointmentSheet.addRow([date, v.completed, v.cancelled]))

  // Barbers Sheet
  const barberSheet = workbook.addWorksheet("Barbers")
  barberSheet.addRow(["Name", "Clients", "Rating", "Revenue"])
  const barberMap: Record<string, { clients: number; revenue: number }> = {}
  sales.forEach(s => {
    const barber = (s.barber || s.barberName || 'Unknown').toString()
    if (!barberMap[barber]) barberMap[barber] = { clients: 0, revenue: 0 }
    barberMap[barber].clients += 1
    const tot = typeof s.total === 'number' ? s.total : parseFloat(s.total || '0')
    barberMap[barber].revenue += isNaN(tot) ? 0 : tot
  })
  Object.entries(barberMap).forEach(([k, v]) => barberSheet.addRow([k, v.clients, 0, v.revenue]))

  // Transactions Sheet
  const transactionSheet = workbook.addWorksheet("Transactions")
  transactionSheet.addRow(["Date", "Customer", "Amount", "Type", "Name"])
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        transactionSheet.addRow([
          new Date(s.date).toLocaleString(),
          s.customer?.name || s.customer?.email || 'Walk-in',
          (typeof it.price === 'number' ? it.price : parseFloat(it.price || '0')) * (it.quantity || 1),
          it.type || 'Unknown',
          it.name || 'Item',
        ])
      })
    } else {
      transactionSheet.addRow([new Date(s.date).toLocaleString(), s.customer?.name || s.customer?.email || 'Walk-in', typeof s.total === 'number' ? s.total : parseFloat(s.total || '0'), 'Sale', 'Sale'])
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reports.xlsx"',
    },
  })
}