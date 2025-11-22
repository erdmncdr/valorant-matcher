"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShoppingCart, Sparkles, Check, X, Coins, Clock, Package, AlertCircle } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useBalance } from "@/lib/balance-context"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface StoreItem {
  id: string
  nameEn: string
  nameTr: string
  descriptionEn: string
  descriptionTr: string
  vpAmount: number
  nPointsCost: number
  icon: string
  sortOrder: number
}

interface Purchase {
  id: string
  vpAmount: number
  nPointsCost: number
  status: string
  vpCode: string | null
  adminNote: string | null
  createdAt: Date
  completedAt: Date | null
  storeItem: StoreItem
}

export default function StorePage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { setBalance } = useBalance()
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<StoreItem[]>([])
  const [nPointsBalance, setNPointsBalance] = useState(0)
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [profileRes, storeRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/store")
      ])

      const profileData = await profileRes.json()
      const storeData = await storeRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (storeData.items) {
        setItems(storeData.items)
      }

      if (storeData.nPointsBalance !== undefined) {
        setNPointsBalance(storeData.nPointsBalance)
      }

      if (storeData.recentPurchases) {
        setRecentPurchases(storeData.recentPurchases)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchaseClick = (item: StoreItem) => {
    setSelectedItem(item)
    setTermsAccepted(false) // Reset checkbox when opening dialog
    setShowConfirmDialog(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return

    setIsPurchasing(true)
    try {
      const response = await fetch("/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: selectedItem.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Purchase failed")
      }

      // Success!
      toast({
        title: language === 'tr' ? "🎉 Sipariş Alındı!" : "🎉 Order Received!",
        description: language === 'tr'
          ? "Siparişiniz alındı. VP kodunuz 1-2 saat içinde hazırlanacak."
          : "Your order has been received. VP code will be ready within 1-2 hours.",
      })

      // Update balance
      setNPointsBalance(data.newBalance)
      setBalance(data.newBalance) // Update global balance

      // Refresh data
      fetchData()

      setShowConfirmDialog(false)
      setSelectedItem(null)
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsPurchasing(false)
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
      <Navbar profile={profile} currentPage="store" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                    <ShoppingCart className="h-10 w-10 text-primary" />
                    {language === 'tr' ? 'Mağaza' : 'Store'}
                  </h1>
                  <p className="text-muted-foreground">
                    {language === 'tr'
                      ? 'N-Points ile Valorant Points satın al'
                      : 'Purchase Valorant Points with N-Points'}
                  </p>
                </div>
                {/* Balance Card */}
                <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10">
                  <CardContent className="pt-6 px-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'tr' ? 'Bakiyeniz' : 'Your Balance'}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        <p className="text-3xl font-bold text-primary">{nPointsBalance.toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">N-Points</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* VP Bundles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {items.map((item) => {
                const name = language === 'tr' ? item.nameTr : item.nameEn
                const description = language === 'tr' ? item.descriptionTr : item.descriptionEn
                const canAfford = nPointsBalance >= item.nPointsCost
                const discount = item.vpAmount > 5000 ? 10 : item.vpAmount > 2000 ? 5 : 0

                return (
                  <Card
                    key={item.id}
                    className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      canAfford
                        ? 'border-primary/40 hover:border-primary/80 cursor-pointer'
                        : 'border-muted/20 opacity-60'
                    }`}
                    onClick={() => canAfford && handlePurchaseClick(item)}
                  >
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {discount}% Bonus
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="relative text-center pb-2">
                      {/* VP Icon */}
                      <div className="text-6xl mb-2 mx-auto">💎</div>
                      <CardTitle className="text-2xl">{name}</CardTitle>
                      <CardDescription className="text-xs">{description}</CardDescription>
                    </CardHeader>

                    <CardContent className="relative text-center space-y-4">
                      {/* VP Amount - Big and Bold */}
                      <div className="py-4 px-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/30">
                        <p className="text-4xl font-bold text-primary">
                          {item.vpAmount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">VP</p>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <p className="text-2xl font-bold text-yellow-500">
                          {item.nPointsCost.toLocaleString()}
                        </p>
                      </div>

                      {/* Buy Button */}
                      <Button
                        variant={canAfford ? "valorant" : "outline"}
                        className="w-full"
                        disabled={!canAfford}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePurchaseClick(item)
                        }}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {language === 'tr' ? 'Satın Al' : 'Purchase'}
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            {language === 'tr' ? 'Yetersiz Bakiye' : 'Insufficient Balance'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Purchase History - Satın Aldıklarım */}
            {recentPurchases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-500" />
                    {language === 'tr' ? 'Satın Aldıklarım' : 'My Purchases'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'tr' ? 'Son siparişleriniz ve durumları' : 'Your recent orders and status'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPurchases.map((purchase) => {
                      const getStatusBadge = () => {
                        switch (purchase.status) {
                          case "PENDING":
                            return (
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {language === 'tr' ? 'Beklemede' : 'Pending'}
                              </Badge>
                            )
                          case "PROCESSING":
                            return (
                              <Badge className="bg-blue-500/20 text-blue-500 border-blue-500">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                {language === 'tr' ? 'Hazırlanıyor' : 'Processing'}
                              </Badge>
                            )
                          case "COMPLETED":
                            return (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500">
                                <Check className="h-3 w-3 mr-1" />
                                {language === 'tr' ? 'Tamamlandı' : 'Completed'}
                              </Badge>
                            )
                          case "FAILED":
                            return (
                              <Badge className="bg-red-500/20 text-red-500 border-red-500">
                                <X className="h-3 w-3 mr-1" />
                                {language === 'tr' ? 'Başarısız' : 'Failed'}
                              </Badge>
                            )
                          default:
                            return <Badge>{purchase.status}</Badge>
                        }
                      }

                      return (
                        <div
                          key={purchase.id}
                          className="p-4 bg-muted/30 rounded-lg border border-border/50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">💎</div>
                              <div>
                                <p className="font-bold text-lg">{purchase.vpAmount.toLocaleString()} VP</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(purchase.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                <Coins className="h-4 w-4" />
                                <p className="font-semibold">{purchase.nPointsCost.toLocaleString()}</p>
                              </div>
                              {getStatusBadge()}
                            </div>
                          </div>

                          {/* VP Code - only show if completed */}
                          {purchase.status === "COMPLETED" && purchase.vpCode && (
                            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <p className="text-sm font-semibold text-green-500">
                                  {language === 'tr' ? 'VP Kodunuz' : 'Your VP Code'}
                                </p>
                              </div>
                              <div className="font-mono text-lg font-bold text-foreground bg-background/50 p-2 rounded text-center">
                                {purchase.vpCode}
                              </div>
                              {purchase.adminNote && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  📝 {purchase.adminNote}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Pending/Processing message */}
                          {(purchase.status === "PENDING" || purchase.status === "PROCESSING") && (
                            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                              <p className="text-sm text-blue-500">
                                {language === 'tr'
                                  ? 'VP kodunuz hazırlanıyor. 1-2 saat içinde bu sayfada görünecektir.'
                                  : 'Your VP code is being prepared. It will appear on this page within 1-2 hours.'}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Online Users Sidebar */}
          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {language === 'tr' ? 'Satın Alma Onayı' : 'Confirm Purchase'}
            </DialogTitle>
            <DialogDescription>
              {language === 'tr'
                ? 'Bu ürünü satın almak istediğinizden emin misiniz?'
                : 'Are you sure you want to purchase this item?'}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="text-6xl">💎</div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-primary">
                  {selectedItem.vpAmount.toLocaleString()} VP
                </p>
                <div className="flex items-center justify-center gap-2 text-yellow-500">
                  <Coins className="h-5 w-5" />
                  <p className="text-xl font-bold">
                    {selectedItem.nPointsCost.toLocaleString()} N-Points
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'tr' ? 'Kalan Bakiye' : 'Remaining Balance'}: {' '}
                  <span className="font-bold text-foreground">
                    {(nPointsBalance - selectedItem.nPointsCost).toLocaleString()}
                  </span> N-Points
                </p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 mt-4 p-3 bg-muted/50 rounded-lg border border-border">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
                >
                  {language === 'tr'
                    ? 'Satın alma koşullarını okudum ve kabul ediyorum. VP kodunun 1-2 saat içinde hazırlanacağını ve iade yapılamayacağını anlıyorum.'
                    : 'I have read and accept the purchase terms. I understand that the VP code will be prepared within 1-2 hours and refunds are not available.'}
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isPurchasing}
            >
              {language === 'tr' ? 'İptal' : 'Cancel'}
            </Button>
            <Button
              variant="valorant"
              onClick={handleConfirmPurchase}
              disabled={isPurchasing || !termsAccepted}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'tr' ? 'İşleniyor...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {language === 'tr' ? 'Satın Al' : 'Confirm Purchase'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
