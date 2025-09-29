import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

function safeNumber(v: any) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const p = parseFloat(v.replace(/[^0-9.-]+/g, ''))
    return isNaN(p) ? 0 : p
  }
  return 0
}

function parseQuantity(q: any) {
  if (typeof q === 'number') return q
  if (typeof q === 'string') {
    const p = parseInt(q.replace(/[^0-9]+/g, ''))
    return isNaN(p) ? 1 : p
  }
  return 1
}

async function generateWorkbookBuffer(fromDate: string | number | Date, toDate: string | number | Date) {
  const from = new Date(fromDate)
  const to = new Date(toDate)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Christians Barbershop'
  workbook.created = new Date()

  // Query sales and appointments in range
  // Note: Firestore date fields may be string or Timestamp; handle both
  const { collection, getDocs } = await import("firebase/firestore")
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

  // compute total sales for the selected date range
  const totalSales = sales.reduce((sum, s) => sum + safeNumber(s.total), 0)

  // compute total amount of services and products
  let totalServicesAmount = 0
  let totalProductsAmount = 0
  
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        const price = safeNumber(it.price)
        const qty = parseQuantity(it.quantity)
        const amount = price * qty
        
        if (it.type === 'service' || it.type === 'services') {
          totalServicesAmount += amount
        } else if (it.type === 'product' || it.type === 'products') {
          totalProductsAmount += amount
        }
      })
    }
  })

  // ---------------- Summary Sheet ----------------
  const summarySheet = workbook.addWorksheet("Summary")
  // Title
  summarySheet.mergeCells('A1:B1')
  const title = summarySheet.getCell('A1')
  title.value = `Sales Report`
  title.font = { size: 14, bold: true }
  title.alignment = { horizontal: 'center' }

  summarySheet.addRow([])
  summarySheet.addRow(["Report Range", `${from.toDateString()} - ${to.toDateString()}`])
  summarySheet.addRow(["Total Sales", totalSales])
  summarySheet.addRow(["Total Services Amount", totalServicesAmount])
  summarySheet.addRow(["Total Products Amount", totalProductsAmount])
  summarySheet.addRow(["Total Transactions (sales records)", sales.length])
  summarySheet.addRow(["Total Appointments in range", appts.length])

  // style summary
  summarySheet.getColumn(1).width = 36
  summarySheet.getColumn(2).width = 32
  // format currency cells for Total Sales, Services, and Products
  const totalSalesCell = summarySheet.getCell(`B${4}`)
  totalSalesCell.numFmt = '"Php"#,##0.00'
  
  const totalServicesCell = summarySheet.getCell(`B${5}`)
  totalServicesCell.numFmt = '"Php"#,##0.00'
  
  const totalProductsCell = summarySheet.getCell(`B${6}`)
  totalProductsCell.numFmt = '"Php"#,##0.00'

  // ---------------- Services Sheet ----------------
  const serviceSheet = workbook.addWorksheet("Services")
  serviceSheet.columns = [
    { header: 'Service Name', key: 'name', width: 40 },
    { header: 'Quantity', key: 'qty', width: 12 },
  ]
  const serviceMap: Record<string, number> = {}
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        if (it.type === 'service' || it.type === 'services') {
          const name = it.name || 'Service'
          const qty = parseQuantity(it.quantity)
          serviceMap[name] = (serviceMap[name] || 0) + qty
        }
      })
    }
  })
  Object.entries(serviceMap).forEach(([k, v]) => serviceSheet.addRow({ name: k, qty: v }))

  // ---------------- Products Sheet ----------------
  const productSheet = workbook.addWorksheet("Products")
  productSheet.columns = [
    { header: 'Product Name', key: 'name', width: 40 },
    { header: 'Quantity', key: 'qty', width: 12 },
  ]
  const productMap: Record<string, number> = {}
  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        if (it.type === 'product' || it.type === 'products') {
          const name = it.name || 'Product'
          const qty = parseQuantity(it.quantity)
          productMap[name] = (productMap[name] || 0) + qty
        }
      })
    }
  })
  Object.entries(productMap).forEach(([k, v]) => productSheet.addRow({ name: k, qty: v }))

  // ---------------- Appointments Sheet ----------------
  const appointmentSheet = workbook.addWorksheet("Appointments")
  appointmentSheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Completed', key: 'completed', width: 12 },
    { header: 'Cancelled', key: 'cancelled', width: 12 },
  ]
  const apptMap: Record<string, { completed: number; cancelled: number }> = {}
  appts.forEach(a => {
    const dateKey = new Date(a.when).toLocaleDateString()
    if (!apptMap[dateKey]) apptMap[dateKey] = { completed: 0, cancelled: 0 }
    const status = (a.status || '').toLowerCase()
    if (status === 'completed') apptMap[dateKey].completed += 1
    else if (status === 'cancelled') apptMap[dateKey].cancelled += 1
  })
  Object.entries(apptMap).forEach(([date, v]) => appointmentSheet.addRow({ date, completed: v.completed, cancelled: v.cancelled }))

  // ---------------- Barbers Sheet ----------------
  const barberSheet = workbook.addWorksheet("Barbers")
  barberSheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Clients', key: 'clients', width: 12 },
    { header: 'Rating', key: 'rating', width: 10 },
    { header: 'Revenue', key: 'revenue', width: 14 },
  ]
  const barberMap: Record<string, { clients: number; revenue: number }> = {}
  sales.forEach(s => {
    const barber = (s.barber || s.barberName || 'Unknown').toString()
    if (!barberMap[barber]) barberMap[barber] = { clients: 0, revenue: 0 }
    barberMap[barber].clients += 1
    barberMap[barber].revenue += safeNumber(s.total)
  })
  Object.entries(barberMap).forEach(([k, v]) => barberSheet.addRow({ name: k, clients: v.clients, rating: 0, revenue: v.revenue }))

  // ---------------- Transactions Sheet ----------------
  const transactionSheet = workbook.addWorksheet("Transactions")
  transactionSheet.columns = [
    { header: 'Date', key: 'date', width: 22, style: { numFmt: 'mm/dd/yyyy hh:mm:ss' } },
    { header: 'Customer', key: 'customer', width: 28 },
    { header: 'Amount', key: 'amount', width: 14, style: { numFmt: '"Php"#,##0.00' } },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Name', key: 'name', width: 30 },
  ]

  sales.forEach(s => {
    if (Array.isArray(s.items)) {
      s.items.forEach((it: any) => {
        const price = safeNumber(it.price)
        const qty = parseQuantity(it.quantity)
        transactionSheet.addRow({
          date: new Date(s.date),
          customer: s.customer?.name || s.customer?.email || 'Walk-in',
          amount: price * qty,
          type: it.type || 'Unknown',
          name: it.name || 'Item',
        })
      })
    } else {
      transactionSheet.addRow({ date: new Date(s.date), customer: s.customer?.name || s.customer?.email || 'Walk-in', amount: safeNumber(s.total), type: 'Sale', name: 'Sale' })
    }
  })

  // Apply header styling and freeze top row + autofilter for all created sheets
  ;[serviceSheet, productSheet, appointmentSheet, barberSheet, transactionSheet].forEach(ws => {
    // header row
    const header = ws.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.alignment = { vertical: 'middle', horizontal: 'center' }
    header.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F6B9A' } }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }
  })

  // style transaction date column cells (ensure dates are actual dates)
  transactionSheet.getColumn('date').eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return
    if (cell.value instanceof Date) cell.numFmt = 'mm/dd/yyyy hh:mm:ss'
  })

  // style revenue column in barber sheet
  barberSheet.getColumn('revenue').numFmt = '"Php"#,##0.00'

  // final buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

export async function POST(req: NextRequest) {
  const { fromDate, toDate } = await req.json()
  const buffer = await generateWorkbookBuffer(fromDate, toDate)

  const contentLength = typeof (buffer as any).byteLength === 'number' ? (buffer as any).byteLength : (buffer as any).length ?? 0

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // use .xlsx and a sensible filename
      "Content-Disposition": 'attachment; filename="Christians-Barbershop Report.xlsx"',
      "Content-Length": String(contentLength),
    },
  })
}

// Also provide GET so a normal link (or WebView navigation) can download the file via query params
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const from = url.searchParams.get('fromDate') || new Date().toISOString()
  const to = url.searchParams.get('toDate') || new Date().toISOString()
  const buffer = await generateWorkbookBuffer(from, to)

  const contentLength = typeof (buffer as any).byteLength === 'number' ? (buffer as any).byteLength : (buffer as any).length ?? 0

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Christians-Barbershop Report.xlsx"',
      "Content-Length": String(contentLength),
    },
  })
}