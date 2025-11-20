"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShoppingCart, Check, X, Clock, RefreshCw, Send } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"

interface Purchase {
  id: string
  userId: string
  storeItemId: string
  status: string
  nPointsCost: number
  vpAmount: number
  vpCode: string | null
  adminNote: string | null
  createdAt: string
  completedAt: string | null
  user: {
    playerProfile: {
      nickname: string
      tagline: string
    }
  }
  storeItem: {
    nameEn: string
    nameTr: string
  }
}

export default function AdminPurchasesPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showSendCodeDialog, setShowSendCodeDialog] = useState(false)
  const [vpCode, setVpCode] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      initializePage()
    }
  }, [status, router])

  useEffect(() => {
    if (filterStatus === "ALL") {
      setFilteredPurchases(purchases)
    } else {
      setFilteredPurchases(purchases.filter(p => p.status === filterStatus))
    }
  }, [filterStatus, purchases])

  const initializePage = async () => {
    try {
      // First check if user is admin
      const response = await fetch("/api/profile")
      const data = await response.json()

      if (data.profile) {
        setProfile(data.profile)

        if (!data.profile.isAdmin) {
          router.push("/")
          toast({
            title: t.adminPurchases.accessDenied,
            description: t.adminPurchases.noAdminPermissions,
            variant: "destructive",
          })
          return // Stop here if not admin
        }

        // Only fetch purchases if user is admin
        await fetchPurchases()
      }
    } catch (error) {
      console.error("Failed to initialize page:", error)
    }
  }

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      console.log("🔄 Fetching purchases from API...")
      const response = await fetch("/api/admin/purchases")

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API Error:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to fetch purchases")
      }

      const data = await response.json()
      console.log("✅ Purchases received:", data.purchases?.length || 0)

      setPurchases(data.purchases || [])
      setFilteredPurchases(data.purchases || [])
    } catch (error: any) {
      console.error("❌ Failed to fetch purchases:", error)
      toast({
        title: t.adminPurchases.error,
        description: error.message || t.adminPurchases.failedToLoad,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!selectedPurchase || !vpCode.trim()) {
      toast({
        title: t.adminPurchases.error,
        description: t.adminPurchases.vpCodeRequired,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/purchases/${selectedPurchase.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vpCode: vpCode.trim(),
          adminNote: adminNote.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: t.adminPurchases.success,
          description: t.adminPurchases.vpCodeSent,
        })
        setShowSendCodeDialog(false)
        setSelectedPurchase(null)
        setVpCode("")
        setAdminNote("")
        fetchPurchases()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: t.adminPurchases.error,
        description: error.message || t.adminPurchases.failedToSend,
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (purchaseId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: t.adminPurchases.success,
          description: t.adminPurchases.statusUpdated,
        })
        fetchPurchases()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: t.adminPurchases.error,
        description: error.message || t.adminPurchases.failedToUpdate,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">{t.adminPurchases.pending}</Badge>
      case "PROCESSING":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">{t.adminPurchases.processing}</Badge>
      case "COMPLETED":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500">{t.adminPurchases.completed}</Badge>
      case "FAILED":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500">{t.adminPurchases.failed}</Badge>
      case "REFUNDED":
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500">{t.adminPurchases.refunded}</Badge>
      default:
        return <Badge>{status}</Badge>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-purple-500" />
              {t.adminPurchases.title}
            </h1>
            <p className="text-muted-foreground mt-2">{t.adminPurchases.subtitle}</p>
          </div>
          <Button onClick={fetchPurchases} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.adminPurchases.refresh}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                {t.adminPurchases.pendingOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{purchases.filter(p => p.status === "PENDING").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                {t.adminPurchases.processingOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{purchases.filter(p => p.status === "PROCESSING").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {t.adminPurchases.completedOrders}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{purchases.filter(p => p.status === "COMPLETED").length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t.adminPurchases.totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{purchases.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.adminPurchases.filters}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-64">
                <Label>{t.adminPurchases.status}</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t.adminPurchases.allStatuses}</SelectItem>
                    <SelectItem value="PENDING">{t.adminPurchases.pending}</SelectItem>
                    <SelectItem value="PROCESSING">{t.adminPurchases.processing}</SelectItem>
                    <SelectItem value="COMPLETED">{t.adminPurchases.completed}</SelectItem>
                    <SelectItem value="FAILED">{t.adminPurchases.failed}</SelectItem>
                    <SelectItem value="REFUNDED">{t.adminPurchases.refunded}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t.adminPurchases.allPurchases}</CardTitle>
            <CardDescription>{filteredPurchases.length} {t.adminPurchases.orders}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.adminPurchases.date}</TableHead>
                  <TableHead>{t.adminPurchases.user}</TableHead>
                  <TableHead>{t.adminPurchases.item}</TableHead>
                  <TableHead>{t.adminPurchases.vpAmount}</TableHead>
                  <TableHead>{t.adminPurchases.cost}</TableHead>
                  <TableHead>{t.adminPurchases.status}</TableHead>
                  <TableHead>{t.adminPurchases.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t.adminPurchases.noPurchases}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {new Date(purchase.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(purchase.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          {purchase.completedAt && (
                            <span className="text-xs text-green-500">
                              ✓ {new Date(purchase.completedAt).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {purchase.user.playerProfile.nickname}#{purchase.user.playerProfile.tagline}
                      </TableCell>
                      <TableCell>
                        {purchase.vpAmount} VP
                      </TableCell>
                      <TableCell className="text-purple-500 font-bold">
                        {purchase.vpAmount} VP
                      </TableCell>
                      <TableCell className="text-yellow-500 font-bold">
                        {purchase.nPointsCost.toLocaleString()} N-Points
                      </TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {purchase.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(purchase.id, "PROCESSING")}
                            >
                              {t.adminPurchases.markProcessing}
                            </Button>
                          )}
                          {(purchase.status === "PENDING" || purchase.status === "PROCESSING") && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPurchase(purchase)
                                setVpCode(purchase.vpCode || "")
                                setAdminNote(purchase.adminNote || "")
                                setShowSendCodeDialog(true)
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {t.adminPurchases.sendCode}
                            </Button>
                          )}
                          {purchase.status === "COMPLETED" && purchase.vpCode && (
                            <Badge variant="outline" className="font-mono">
                              {purchase.vpCode}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Send VP Code Dialog */}
      <Dialog open={showSendCodeDialog} onOpenChange={setShowSendCodeDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t.adminPurchases.sendVpCode}</DialogTitle>
            <DialogDescription>{t.adminPurchases.enterVpCodeDesc}</DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t.adminPurchases.orderDetails}</Label>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm">
                    <strong>{t.adminPurchases.user}:</strong> {selectedPurchase.user.playerProfile.nickname}#{selectedPurchase.user.playerProfile.tagline}
                  </p>
                  <p className="text-sm">
                    <strong>{t.adminPurchases.item}:</strong> {selectedPurchase.vpAmount} VP
                  </p>
                  <p className="text-sm">
                    <strong>{t.adminPurchases.cost}:</strong> {selectedPurchase.nPointsCost.toLocaleString()} N-Points
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vpCode">{t.adminPurchases.vpCode} *</Label>
                <Input
                  id="vpCode"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={vpCode}
                  onChange={(e) => setVpCode(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="adminNote">{t.adminPurchases.adminNote}</Label>
                <Textarea
                  id="adminNote"
                  placeholder={t.adminPurchases.adminNotePlaceholder}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSendCodeDialog(false)
              setSelectedPurchase(null)
              setVpCode("")
              setAdminNote("")
            }}>
              {t.adminPurchases.cancel}
            </Button>
            <Button onClick={handleSendCode} disabled={!vpCode.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {t.adminPurchases.sendAndComplete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
