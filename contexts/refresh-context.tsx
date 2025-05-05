"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"

type RefreshContextType = {
  lastRefreshed: Date | null
  isRefreshing: boolean
  refreshData: () => Promise<void>
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (enabled: boolean) => void
  secondsUntilRefresh: number
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined)

// Refresh interval in seconds
const REFRESH_INTERVAL_SECONDS = 60

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL_SECONDS)

  const refreshData = useCallback(async () => {
    if (!user || isRefreshing) return

    setIsRefreshing(true)
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        throw new Error("Failed to refresh data")
      }

      const data = await response.json()
      setLastRefreshed(new Date())
      setSecondsUntilRefresh(REFRESH_INTERVAL_SECONDS)

      // Only show toast for manual refreshes (not auto-refresh)
      if (!refreshInterval) {
        toast({
          title: "Data refreshed",
          description: `Found ${data.matches?.length || 0} matches`,
        })
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      // Only show error toast for manual refreshes
      if (!refreshInterval) {
        toast({
          title: "Error refreshing data",
          description: "Please try again later",
          variant: "destructive",
        })
      }
    } finally {
      setIsRefreshing(false)
    }
  }, [user, isRefreshing, refreshInterval])

  // Set up auto-refresh interval
  useEffect(() => {
    if (autoRefreshEnabled && user) {
      const interval = setInterval(() => {
        refreshData()
      }, REFRESH_INTERVAL_SECONDS * 1000) // Convert to milliseconds
      setRefreshInterval(interval)
      return () => {
        clearInterval(interval)
        setRefreshInterval(null)
      }
    } else if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }, [autoRefreshEnabled, user, refreshData])

  // Set up countdown timer
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setSecondsUntilRefresh(REFRESH_INTERVAL_SECONDS)
      return
    }

    const countdownInterval = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          return REFRESH_INTERVAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [autoRefreshEnabled, lastRefreshed])

  return (
    <RefreshContext.Provider
      value={{
        lastRefreshed,
        isRefreshing,
        refreshData,
        autoRefreshEnabled,
        setAutoRefreshEnabled,
        secondsUntilRefresh,
      }}
    >
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const context = useContext(RefreshContext)
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider")
  }
  return context
}
