"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  UserPlus,
  UserX,
  Star,
  Clock,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/lib/i18n/language-context"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPLICATION_RECEIVED':
      return <UserPlus className="h-5 w-5 text-blue-500" />
    case 'APPLICATION_ACCEPTED':
      return <CheckCheck className="h-5 w-5 text-green-500" />
    case 'APPLICATION_DECLINED':
      return <UserX className="h-5 w-5 text-red-500" />
    case 'PRIVATE_MESSAGE':
      return <MessageSquare className="h-5 w-5 text-purple-500" />
    case 'RATING_RECEIVED':
      return <Star className="h-5 w-5 text-yellow-500" />
    case 'LISTING_EXPIRING':
      return <Clock className="h-5 w-5 text-orange-500" />
    default:
      return <MessageSquare className="h-5 w-5 text-gray-500" />
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const locale = language === 'tr' ? tr : enUS
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = async () => {
    try {
      const url = filter === 'unread'
        ? '/api/notifications?unreadOnly=true'
        : '/api/notifications'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <CardTitle>
                {language === 'tr' ? 'Bildirimler' : 'Notifications'}
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                {language === 'tr' ? 'Tümü' : 'All'}
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                {language === 'tr' ? 'Okunmamış' : 'Unread'}
              </Button>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="flex justify-end mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkAsRead()}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                {language === 'tr' ? 'Tümünü Okundu İşaretle' : 'Mark All Read'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {language === 'tr' ? 'Bildirim yok' : 'No notifications'}
              </p>
              <p className="text-sm text-muted-foreground">
                {filter === 'unread'
                  ? language === 'tr'
                    ? 'Okunmamış bildiriminiz bulunmuyor'
                    : 'You have no unread notifications'
                  : language === 'tr'
                  ? 'Henüz bildiriminiz bulunmuyor'
                  : 'You don\'t have any notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-accent/20 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-base mb-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale,
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                            >
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
