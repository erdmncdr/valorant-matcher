import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000)

  if (seconds < 60) return 'just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return `${years}y ago`
}

export function formatExpiresIn(expiresAt: Date | string): string {
  const dateObj = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const seconds = Math.floor((dateObj.getTime() - new Date().getTime()) / 1000)

  if (seconds <= 0) return 'Expired'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m left`

  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m left`
}

export function isListingExpired(expiresAt: Date | string): boolean {
  const dateObj = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return new Date() > dateObj
}
