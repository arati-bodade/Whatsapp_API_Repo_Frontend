import { useState, useEffect, useCallback } from 'react'
import creditService from '@/services/creditService'

export interface CreditData {
  current_balance: number
  credits_used: number
  credits_allocated: number
  plan_name?: string
  plan_expiry?: string
}

export function useCredits(token: string | null) {
  const [credits, setCredits] = useState<CreditData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(0)

  const fetchCredits = useCallback(async () => {
    if (!token) {
      console.log('⚠️ No token available, skipping credit fetch')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      console.log('🔄 Fetching credits from API...')
      const balanceData = await creditService.getUserCurrentBalance(token)
      console.log('✅ Credits fetched successfully:', balanceData)
      setCredits(balanceData)
      setLastUpdate(Date.now())
    } catch (err: any) {
      console.error('❌ Failed to fetch credits:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to fetch credits')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Initial fetch
  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Listen for credit update events
  useEffect(() => {
    const handleCreditUpdate = () => {
      console.log('🔄 Credit update detected, refreshing...')
      fetchCredits()
    }

    // Listen for custom credit update events
    window.addEventListener('credits-updated', handleCreditUpdate)
    window.addEventListener('plan-updated', handleCreditUpdate)
    
    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credits_updated' && e.newValue) {
        handleCreditUpdate()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('credits-updated', handleCreditUpdate)
      window.removeEventListener('plan-updated', handleCreditUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchCredits])

  // Manual refresh function
  const refreshCredits = useCallback(() => {
    fetchCredits()
  }, [fetchCredits])

  // Function to trigger credit update across all tabs
  const triggerCreditUpdate = useCallback(() => {
    localStorage.setItem('credits_updated', Date.now().toString())
    window.dispatchEvent(new CustomEvent('credits-updated'))
  }, [])

  return {
    credits,
    isLoading,
    error,
    refreshCredits,
    triggerCreditUpdate,
    lastUpdate
  }
}
