"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/hooks/useAdmin'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAdmin, loading } = useAdmin()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/')
    }
  }, [isAdmin, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
} 