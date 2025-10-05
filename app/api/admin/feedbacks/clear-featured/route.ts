import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
  const { collection, getDocs, writeBatch, query, doc } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase')

    const feedbacksRef = collection(db, 'feedback')
    const q = query(feedbacksRef)
    const snap = await getDocs(q)
    const ids: string[] = []
    snap.forEach(d => ids.push(d.id))

    // batch unset featured in chunks
    const CHUNK = 450
    const results: any[] = []
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK)
      const batch = writeBatch(db)
      chunk.forEach(id => {
        const docRef = doc(db, 'feedback', id)
        batch.update(docRef, { featured: false })
      })
      await batch.commit()
      results.push({ chunkSize: chunk.length })
    }

    return NextResponse.json({ success: true, processed: ids.length, results })
  } catch (err) {
    console.error('clear-featured error', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
