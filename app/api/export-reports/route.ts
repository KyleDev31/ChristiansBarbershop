import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"

export async function POST(req: NextRequest) {
  const { serviceData, productData, appointmentData, barberData, recentTransactions } = await req.json()

  const workbook = new ExcelJS.Workbook()

  // Services Sheet
  const serviceSheet = workbook.addWorksheet("Services")
  serviceSheet.addRow(["Service Name", "Value"])
  serviceData.forEach((row: any) => {
    serviceSheet.addRow([row.name, row.value])
  })

  // Products Sheet
  const productSheet = workbook.addWorksheet("Products")
  productSheet.addRow(["Product Name", "Value"])
  productData.forEach((row: any) => {
    productSheet.addRow([row.name, row.value])
  })

  // Appointments Sheet
  const appointmentSheet = workbook.addWorksheet("Appointments")
  appointmentSheet.addRow(["Date", "Completed", "Cancelled"])
  appointmentData.forEach((row: any) => {
    appointmentSheet.addRow([row.date, row.completed, row.cancelled])
  })

  // Barbers Sheet
  const barberSheet = workbook.addWorksheet("Barbers")
  barberSheet.addRow(["Name", "Clients", "Rating", "Revenue"])
  barberData.forEach((row: any) => {
    barberSheet.addRow([row.name, row.clients, row.rating, row.revenue])
  })

  // Transactions Sheet
  const transactionSheet = workbook.addWorksheet("Recent Transactions")
  transactionSheet.addRow(["Date", "Customer", "Amount", "Type", "Name"])
  recentTransactions.forEach((row: any) => {
    transactionSheet.addRow([
      typeof row.date === "string" ? row.date : new Date(row.date).toLocaleString(),
      row.customer,
      row.amount,
      row.type,
      row.name,
    ])
  })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reports.xlsx"',
    },
  })
}