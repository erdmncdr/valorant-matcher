"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { X, CheckCheck, Trash2, MessageSquare, UserPlus, UserX, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/lib/i18n/language-context"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (notificationId?: string) => void
  onDelete: (notificationId: string) => void
  onClose: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'APPLICATION_RECEIVED':
      return <UserPlus className="h-4 w-4 text-blue-500" />
    case 'APPLICATION_ACCEPTED':
      return <CheckCheck className="h-4 w-4 text-green-500" />
    case 'APPLICATION_DECLINED':
      return <UserX className="h-4 w-4 text-red-500" />
    case 'PRIVATE_MESSAGE':
      return <MessageSquare className="h-4 w-4 text-purple-500" />
    case 'RATING_RECEIVED':
      return <Star className="h-4 w-4 text-yellow-500" />
    case 'LISTING_EXPIRING':
      return <Clock className="h-4 w-4 text-orange-500" />
    default:
      return <MessageSquare className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationDropdownProps) {
  const { language } = useLanguage()
  const locale = language === 'tr' ? tr : enUS

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    if (notification.link) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-lg">
            {language === 'tr' ? 'Bildirimler' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} {language === 'tr' ? 'okunmamış' : 'unread'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead()}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            {language === 'tr' ? 'Tümünü Okundu İşaretle' : 'Mark All Read'}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              {language === 'tr' ? 'Bildirim yok' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent/50 transition-colors ${
                  !notification.isRead ? 'bg-accent/20' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => handleNotificationClick(notification)}
                        className="block"
                      >
                        <p className="font-medium text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale,
                          })}
                        </p>
                      </Link>
                    ) : (
                      <div onClick={() => handleNotificationClick(notification)}>
                        <p className="font-medium text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale,
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(notification.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link href="/notifications" onClick={onClose}>
              <Button variant="ghost" className="w-full text-sm">
                {language === 'tr' ? 'Tüm Bildirimleri Görüntüle' : 'View All Notifications'}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
