"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface BalanceContextType {
  balance: number
  refreshBalance: () => Promise<void>
  setBalance: (balance: number) => void
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const [balance, setBalance] = useState(0)

  const refreshBalance = async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      if (data.profile?.nPoints !== undefined) {
        setBalance(data.profile.nPoints)
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      refreshBalance()
    }
  }, [status])

  return (
    <BalanceContext.Provider value={{ balance, refreshBalance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}
