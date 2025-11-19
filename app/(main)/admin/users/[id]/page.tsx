"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, ArrowLeft, Ban, CheckCircle, Activity, MessageSquare, Star, Flag, FileText, Users as UsersIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/utils"
import { getRankBadgeClass } from "@/lib/constants"

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banData, setBanData] = useState({
    banDuration: 7,
    banReason: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchUser()
      fetchTimeline()
    }
  }, [status, router, params.id])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)

        if (!data.profile.isAdmin) {
          router.push("/")
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchUser = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load user",
          variant: "destructive",
        })
        router.push("/admin/users")
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      toast({
        title: "Error",
        description: "Failed to load user",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/activity`)
      const data = await response.json()

      if (response.ok) {
        setTimeline(data.timeline || [])
      }
    } catch (error) {
      console.error("Failed to fetch timeline:", error)
    }
  }

  const handleBanUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBanned: true,
          banDuration: banData.banDuration,
          banReason: banData.banReason,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User banned successfully",
        })
        setShowBanModal(false)
        fetchUser()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to ban user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      })
    }
  }

  const handleUnbanUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBanned: false,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User unbanned successfully",
        })
        fetchUser()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to unban user",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "listing_created":
        return <FileText className="h-4 w-4" />
      case "application_submitted":
        return <UsersIcon className="h-4 w-4" />
      case "message_sent":
        return <MessageSquare className="h-4 w-4" />
      case "rating_given":
      case "rating_received":
        return <Star className="h-4 w-4" />
      case "report_submitted":
      case "report_received":
        return <Flag className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityText = (activity: any) => {
    switch (activity.type) {
      case "listing_created":
        return `İlan oluşturdu: "${activity.data.title}"`
      case "application_submitted":
        return `Başvuru yaptı: "${activity.data.listing?.title}"`
      case "message_sent":
        return `Mesaj gönderdi: "${activity.data.listing?.title}"`
      case "rating_given":
        return `Rating verdi: ${activity.data.score > 0 ? "+" : ""}${activity.data.score}`
      case "rating_received":
        return `Rating aldı: ${activity.data.score > 0 ? "+" : ""}${activity.data.score}`
      case "report_submitted":
        return `Report gönderdi: ${activity.data.reason}`
      case "report_received":
        return `Report aldı: ${activity.data.reason}`
      default:
        return activity.type
    }
  }

  if (status === "loading" || isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kullanıcı Listesine Dön
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-2">Kullanıcı Detayları</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Kullanıcı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kullanıcı Adı</p>
                  <p className="text-lg font-semibold text-foreground">
                    {user.playerProfile?.nickname || "No Profile"}
                    {user.playerProfile?.tagline && (
                      <span className="text-muted-foreground">{user.playerProfile.tagline}</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-foreground">{user.email}</p>
                </div>

                {user.playerProfile && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Rank</p>
                      <Badge className={`${getRankBadgeClass(user.playerProfile.rankCurrent)} rank-badge`}>
                        {user.playerProfile.rankCurrent}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">İtibar Puanı</p>
                      <p className="text-xl font-bold text-foreground">{user.playerProfile.reputationScore}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Kayıt Tarihi</p>
                  <p className="text-foreground">{formatTimeAgo(new Date(user.createdAt))}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Son Görülme</p>
                  <p className="text-foreground">
                    {user.lastSeenAt ? formatTimeAgo(new Date(user.lastSeenAt)) : "Bilinmiyor"}
                  </p>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  {user.isAdmin && (
                    <Badge variant="default" className="w-full justify-center bg-gradient-to-r from-primary to-accent">
                      Admin Kullanıcı
                    </Badge>
                  )}

                  {user.isBanned ? (
                    <>
                      <Badge variant="destructive" className="w-full justify-center">
                        <Ban className="h-3 w-3 mr-1" />
                        Banned
                      </Badge>
                      {user.banReason && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                          <p className="text-xs text-red-500 font-semibold mb-1">Ban Sebebi:</p>
                          <p className="text-sm text-foreground">{user.banReason}</p>
                          {user.bannedUntil && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Süre: {new Date(user.bannedUntil).toLocaleDateString("tr-TR")}
                            </p>
                          )}
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleUnbanUser}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Banı Kaldır
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowBanModal(true)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Ban At
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-3">İstatistikler</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">İlanlar</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.listingsOwned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Başvurular</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.listingApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mesajlar</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.messagesSent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verilen Ratingler</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.ratingsGiven}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Alınan Ratingler</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.ratingsReceived}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 mt-2">
                      <span className="text-sm text-muted-foreground">Alınan Reportlar</span>
                      <span className="text-sm font-semibold text-red-500">{user._count.reportsReceived}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gönderilen Reportlar</span>
                      <span className="text-sm font-semibold text-foreground">{user._count.reportsSubmitted}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Aktivite Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz aktivite yok</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {timeline.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/40 transition-colors"
                      >
                        <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{getActivityText(activity)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(new Date(activity.timestamp))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Banla</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Ban Süresi (gün)</Label>
              <Input
                type="number"
                value={banData.banDuration}
                onChange={(e) => setBanData({ ...banData, banDuration: parseInt(e.target.value) })}
                className="mt-2"
                min={1}
              />
            </div>

            <div>
              <Label>Ban Sebebi</Label>
              <Textarea
                value={banData.banReason}
                onChange={(e) => setBanData({ ...banData, banReason: e.target.value })}
                placeholder="Ban sebebini yazın..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              Ban At
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
