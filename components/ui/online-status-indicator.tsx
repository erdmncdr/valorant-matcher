"use client"

interface OnlineStatusIndicatorProps {
  lastSeenAt?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function OnlineStatusIndicator({ lastSeenAt, className = "", size = "sm" }: OnlineStatusIndicatorProps) {
  if (!lastSeenAt) return null

  const getOnlineStatus = () => {
    const lastSeen = new Date(lastSeenAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60

    // Online if last seen within 5 minutes
    if (diffMinutes < 5) return { color: "bg-green-500", isOnline: true }
    return { color: "bg-gray-500", isOnline: false }
  }

  const status = getOnlineStatus()

  const sizeClasses = {
    sm: "h-2.5 w-2.5 border-2",
    md: "h-3 w-3 border-2",
    lg: "h-3.5 w-3.5 border-[2.5px]",
  }

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 ${sizeClasses[size]} ${status.color} rounded-full border-valorant-dark ${status.isOnline ? 'animate-pulse' : ''} ${className}`}
      title={status.isOnline ? "Online" : "Offline"}
    />
  )
}
