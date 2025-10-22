import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { initializeAdminApp } from "@/lib/firebase-admin" // Create this helper

// Initialize Firebase Admin once
if (!admin.apps.length) {
  initializeAdminApp()
}

const db = admin.firestore()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const transactions: any[] = Array.isArray(body?.transactions) ? body.transactions : []
    if (!transactions.length) {
      return NextResponse.json({ success: true, processed: 0, failed: 0 })
    }

    const batchLimit = 450 // Firestore limit is 500, use 450 to be safe
    let processed = 0
    let failed = 0
    
    // Process in chunks to respect batch size limits
    for (let i = 0; i < transactions.length; i += batchLimit) {
      const chunk = transactions.slice(i, i + batchLimit)
      const batch = db.batch()
      
      for (const tx of chunk) {
        try {
          const docRef = db.collection("sales").doc()
          const date = tx.date ? new Date(tx.date) : null
          const payload: any = {
            imported: true,
            amount: Number(tx.amount) || 0,
            barber: tx.barber || null,
            serviceName: tx.serviceName || tx.service || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }
          if (date) {
            payload.date = admin.firestore.Timestamp.fromDate(date)
          }
          batch.set(docRef, payload)
          processed++
        } catch (err) {
          console.error("Failed to add transaction to batch:", err)
          failed++
        }
      }

      try {
        await batch.commit()
      } catch (err) {
        console.error("Batch commit failed:", err)
        failed += chunk.length
        processed -= chunk.length // Rollback processed count for failed batch
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed, 
      failed,
      message: `Imported ${processed} transactions. Failed: ${failed}`
    })

  } catch (err: any) {
    console.error("Import error:", err)
    return NextResponse.json(
      { success: false, message: err?.message || "Import failed" },
      { status: 500 }
    )
  }
}