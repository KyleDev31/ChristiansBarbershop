import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')

    const url = req.nextUrl
    const fromDateStr = url.searchParams.get('fromDate')
    const toDateStr = url.searchParams.get('toDate')

    const snap = await getDocs(collection(db, 'feedback'))
    const feedbacks: any[] = []
    snap.forEach(d => feedbacks.push({ id: d.id, ...d.data() }))

    // Normalize date field
    feedbacks.forEach(f => {
      if (typeof f.date === 'string') f._date = new Date(f.date)
      else if (f.date && typeof f.date.toDate === 'function') f._date = f.date.toDate()
      else f._date = f._date || new Date()
    })

    // Apply date range filter if provided (inclusive)
    let fromDate: Date | null = null
    let toDate: Date | null = null
    if (fromDateStr) {
      const d = new Date(fromDateStr)
      if (!isNaN(d.getTime())) fromDate = d
    }
    if (toDateStr) {
      const d = new Date(toDateStr)
      if (!isNaN(d.getTime())) {
        // make inclusive end of day
        d.setHours(23, 59, 59, 999)
        toDate = d
      }
    }

    const filtered = feedbacks.filter(f => {
      if (!f._date) return false
      if (fromDate && f._date < fromDate) return false
      if (toDate && f._date > toDate) return false
      return true
    })

    // Sort by rating desc, then date desc
    filtered.sort((a, b) => {
      const r = (b.rating || 0) - (a.rating || 0)
      if (r !== 0) return r
      return (b._date?.getTime() || 0) - (a._date?.getTime() || 0)
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Christians Barbershop'
    workbook.created = new Date()

    const summary = workbook.addWorksheet('Summary')
    summary.columns = [{ header: 'Metric', key: 'k', width: 40 }, { header: 'Value', key: 'v', width: 40 }]
    const avgRating = filtered.length ? (filtered.reduce((s, f) => s + (f.rating || 0), 0) / filtered.length) : 0
    const countsByCategory: Record<string, number> = {}
    filtered.forEach(f => { const c = f.category || 'uncategorized'; countsByCategory[c] = (countsByCategory[c] || 0) + 1 })

    summary.addRow({ k: 'Total feedbacks', v: filtered.length })
    summary.addRow({ k: 'Average rating', v: Number(avgRating.toFixed(2)) })
    Object.entries(countsByCategory).forEach(([k, v]) => summary.addRow({ k: `Category: ${k}`, v }))

    const sheet = workbook.addWorksheet('Feedbacks')

    // Title row (merged)
    const title = `Feedbacks${fromDateStr || toDateStr ? ' ' : ''}${fromDateStr ? `from ${fromDateStr}` : ''}${fromDateStr && toDateStr ? ' ' : ''}${toDateStr ? `to ${toDateStr}` : ''}`.trim()
    sheet.mergeCells('A1:E1')
    const titleRow = sheet.getCell('A1')
    titleRow.value = title || 'Feedbacks'
    titleRow.font = { size: 14, bold: true }
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 22

    sheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'User', key: 'user', width: 24 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Comment', key: 'comment', width: 60 },
    ]

    // Add header row (row 2 due to title)
  const headerRow = sheet.getRow(2)
  const headers = sheet.columns.map(c => String(c.header ?? ''))
  // ExcelJS types are a bit permissive at runtime; cast to any for assignment
  headerRow.values = headers as any
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle' }
    headerRow.height = 18
    // header fill (blue) - use ARGB
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    })

    // Add rows starting from row 3
    filtered.forEach(f => {
      sheet.addRow({ date: f._date, user: f.user || f.name || 'Anonymous', rating: f.rating || 0, category: f.category || '', comment: f.comment || '' })
    })

    // Format date column
    sheet.getColumn('date').numFmt = 'yyyy-mm-dd hh:mm'

    // Wrap comment column
    sheet.getColumn('comment').alignment = { wrapText: true, vertical: 'top' }

    // Apply autofilter for header row (row 2)
    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: sheet.columns.length } }

    // Freeze title + header rows
    sheet.views = [{ state: 'frozen', ySplit: 2 }]

    const buffer = await workbook.xlsx.writeBuffer()

    const contentLength = typeof (buffer as any).byteLength === 'number' ? (buffer as any).byteLength : (buffer as any).length ?? 0

    const dateTag = fromDateStr || toDateStr ? `-${fromDateStr || ''}${toDateStr ? (`_to_${toDateStr}`) : ''}` : ''
    const fileName = `Feedbacks-${new Date().toISOString().slice(0,10)}${dateTag}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(contentLength),
      }
    })
  } catch (err) {
    console.error('export-feedbacks error', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
