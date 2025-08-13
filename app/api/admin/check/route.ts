import { NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET() {
  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"))
    const querySnapshot = await getDocs(q)
    
    return NextResponse.json({ hasAdmin: !querySnapshot.empty })
  } catch (error) {
    console.error('Error checking admin accounts:', error)
    return NextResponse.json({ hasAdmin: false })
  }
} 