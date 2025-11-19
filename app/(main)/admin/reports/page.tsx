"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Navbar } from "@/components/layout/navbar"
import { Loader2, AlertTriangle, CheckCircle, XCircle, Ban, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatTimeAgo } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

export default function AdminReportsPage() {
  usePresence()
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    status: "RESOLVED" as "RESOLVED" | "DISMISSED" | "UNDER_REVIEW",
    reviewNotes: "",
    banUser: false,
    banDuration: 7,
    banReason: "",
  })
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchReports()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)

        // Check if user is admin
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

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory !== "all") params.append("category", filterCategory)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const response = await fetch(`/api/reports?${params.toString()}`)
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewReport = (report: any) => {
    setSelectedReport(report)
    setReviewData({
      status: "RESOLVED",
      reviewNotes: "",
      banUser: false,
      banDuration: 7,
      banReason: "",
    })
    setShowReviewModal(true)
  }

  const submitReview = async () => {
    if (!selectedReport) return

    try {
      const response = await fetch(`/api/reports/${selectedReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData),
      })

      if (response.ok) {
        toast({
          title: t.common.success,
          description: t.reports.reviewSuccess,
        })
        setShowReviewModal(false)
        fetchReports()
      } else {
        const data = await response.json()
        toast({
          title: t.common.error,
          description: data.error || t.reports.reviewError,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.common.error,
        description: t.reports.reviewError,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchReports()
    }
  }, [filterCategory, filterStatus])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{t.reports.statusOpen}</Badge>
      case "UNDER_REVIEW":
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500"><Eye className="h-3 w-3 mr-1" />{t.reports.statusUnderReview}</Badge>
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500"><CheckCircle className="h-3 w-3 mr-1" />{t.reports.statusResolved}</Badge>
      case "DISMISSED":
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500"><XCircle className="h-3 w-3 mr-1" />{t.reports.statusDismissed}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "IN_GAME":
        return <Badge variant="mode">{t.reports.categoryInGame}</Badge>
      case "ON_PLATFORM":
        return <Badge variant="role">{t.reports.categoryOnPlatform}</Badge>
      default:
        return <Badge>{category}</Badge>
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      <Navbar profile={profile} currentPage="admin" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚡ {t.reports.adminTitle}</h1>
          <p className="text-gray-400">{t.reports.adminSubtitle}</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2">{t.reports.category}</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.reports.allCategories}</SelectItem>
                    <SelectItem value="IN_GAME">{t.reports.categoryInGame}</SelectItem>
                    <SelectItem value="ON_PLATFORM">{t.reports.categoryOnPlatform}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white mb-2">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.reports.allStatuses}</SelectItem>
                    <SelectItem value="OPEN">{t.reports.statusOpen}</SelectItem>
                    <SelectItem value="UNDER_REVIEW">{t.reports.statusUnderReview}</SelectItem>
                    <SelectItem value="RESOLVED">{t.reports.statusResolved}</SelectItem>
                    <SelectItem value="DISMISSED">{t.reports.statusDismissed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">{t.reports.noReports}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-valorant-red/20 hover:border-valorant-red/40 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(report.status)}
                        {getCategoryBadge(report.category)}
                        <Badge variant="outline">{report.reason.replace(/_/g, " ")}</Badge>
                      </div>
                      <CardTitle className="text-white text-lg">
                        Report against {report.target?.playerProfile?.nickname || "Unknown"}
                        {report.target?.isBanned && (
                          <Badge variant="destructive" className="ml-2">
                            <Ban className="h-3 w-3 mr-1" />
                            BANNED
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        Reported by {report.reporter?.playerProfile?.nickname || "Unknown"} • {formatTimeAgo(new Date(report.createdAt))}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Description:</p>
                    <p className="text-white bg-valorant-dark/30 rounded p-3">{report.description}</p>
                  </div>

                  {report.reviewNotes && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Admin Notes:</p>
                      <p className="text-white bg-green-500/10 rounded p-3 border border-green-500/20">{report.reviewNotes}</p>
                    </div>
                  )}

                  {report.status === "OPEN" && (
                    <Button
                      onClick={() => handleReviewReport(report)}
                      variant="valorant"
                      className="w-full"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t.reports.reviewReport}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.reports.reviewReport}</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">{t.reports.reportAgainst}:</p>
                <p className="text-white font-semibold">
                  {selectedReport.target?.playerProfile?.nickname || "Unknown"}
                </p>
              </div>

              <div>
                <Label className="text-white">{t.reports.decision}</Label>
                <Select
                  value={reviewData.status}
                  onValueChange={(value: any) => setReviewData({...reviewData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_REVIEW">{t.reports.statusUnderReviewOption}</SelectItem>
                    <SelectItem value="RESOLVED">{t.reports.statusResolvedOption}</SelectItem>
                    <SelectItem value="DISMISSED">{t.reports.statusDismissedOption}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">{t.reports.adminNotes}</Label>
                <Textarea
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData({...reviewData, reviewNotes: e.target.value})}
                  placeholder={t.reports.addReviewNotes}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reviewData.banUser}
                  onChange={(e) => setReviewData({...reviewData, banUser: e.target.checked})}
                  className="w-4 h-4"
                />
                <Label className="text-white">{t.reports.banUser}</Label>
              </div>

              {reviewData.banUser && (
                <>
                  <div>
                    <Label className="text-white">{t.reports.banDuration}</Label>
                    <Input
                      type="number"
                      value={reviewData.banDuration}
                      onChange={(e) => setReviewData({...reviewData, banDuration: parseInt(e.target.value)})}
                      className="mt-2"
                      min={1}
                    />
                  </div>

                  <div>
                    <Label className="text-white">{t.reports.banReason}</Label>
                    <Input
                      value={reviewData.banReason}
                      onChange={(e) => setReviewData({...reviewData, banReason: e.target.value})}
                      placeholder={t.reports.banReasonPlaceholder}
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="valorant" onClick={submitReview}>
              {t.reports.submitReview}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
