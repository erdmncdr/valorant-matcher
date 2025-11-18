import { useEffect } from "react"
import { useSession } from "next-auth/react"

/**
 * Hook to maintain user's online presence
 * Sends heartbeat every 2 minutes to update lastSeenAt
 */
export function usePresence() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== "authenticated") {
      return
    }

    // Send initial heartbeat
    const updatePresence = async () => {
      try {
        await fetch("/api/presence", {
          method: "POST",
        })
      } catch (error) {
        console.error("Failed to update presence:", error)
      }
    }

    updatePresence()

    // Set up interval to send heartbeat every 2 minutes
    const interval = setInterval(updatePresence, 2 * 60 * 1000)

    // Also update on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [status])
}
