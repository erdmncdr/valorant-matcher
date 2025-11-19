"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, Users, Search, Eye, Ban, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"
import { formatTimeAgo } from "@/lib/utils"
import { getRankBadgeClass } from "@/lib/constants"

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchUsers()
    }
  }, [status, router, pagination.page, search, statusFilter])

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

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsers(data.users || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-muted-foreground">Tüm kullanıcıları görüntüle ve yönet</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email veya kullanıcı adı ile ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="banned">Banlı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {user.playerProfile?.nickname || "No Profile"}
                          <span className="text-muted-foreground">
                            {user.playerProfile?.tagline || ""}
                          </span>
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>

                      {user.isAdmin && (
                        <Badge variant="default" className="bg-gradient-to-r from-primary to-accent">
                          Admin
                        </Badge>
                      )}
                      {user.isBanned && (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          Banned
                        </Badge>
                      )}
                      {!user.isBanned && (
                        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {user.playerProfile && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`${getRankBadgeClass(user.playerProfile.rankCurrent)} rank-badge text-xs`}>
                          {user.playerProfile.rankCurrent}
                        </Badge>
                        <Badge variant="outline">İtibar: {user.playerProfile.reputationScore}</Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">İlanlar</p>
                        <p className="font-semibold text-foreground">{user._count.listingsOwned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Başvurular</p>
                        <p className="font-semibold text-foreground">{user._count.listingApplications}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reports Alınan</p>
                        <p className="font-semibold text-red-500">{user._count.reportsReceived}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kayıt Tarihi</p>
                        <p className="font-semibold text-foreground">
                          {formatTimeAgo(new Date(user.createdAt))}
                        </p>
                      </div>
                    </div>

                    {user.isBanned && user.banReason && (
                      <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
                        <p className="text-xs text-red-500 font-semibold mb-1">Ban Sebebi:</p>
                        <p className="text-sm text-foreground">{user.banReason}</p>
                        {user.bannedUntil && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Süre: {new Date(user.bannedUntil).toLocaleDateString("tr-TR")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        Detay
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Önceki
            </Button>
            <span className="text-muted-foreground px-4">
              Sayfa {pagination.page} / {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
            >
              Sonraki
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
