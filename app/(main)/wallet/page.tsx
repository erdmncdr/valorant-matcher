"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Coins, Calendar } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
}

interface WalletData {
  balance: number
  totalEarned: number
  totalSpent: number
  recentEarned: number
  recentSpent: number
  transactionCount: number
  transactions: Transaction[]
  byType: Record<string, { count: number; total: number }>
}

export default function WalletPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      const [profileRes, walletRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/wallet")
      ])

      const profileData = await profileRes.json()
      const walletData = await walletRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (walletData) {
        setWalletData(walletData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    if (type.startsWith('EARN')) {
      return 'bg-green-500/20 text-green-500 border-green-500'
    }
    return 'bg-red-500/20 text-red-500 border-red-500'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { tr: string; en: string }> = {
      EARN_AIM_TRAINER: { tr: 'Aim Trainer', en: 'Aim Trainer' },
      EARN_ACHIEVEMENT: { tr: 'Başarım', en: 'Achievement' },
      EARN_LEADERBOARD: { tr: 'Lider Tablosu', en: 'Leaderboard' },
      EARN_WHEEL: { tr: 'Şans Çarkı', en: 'Lucky Wheel' },
      EARN_LOOTBOX: { tr: 'Günlük Kutu', en: 'Daily Lootbox' },
      EARN_DAILY: { tr: 'Günlük Bonus', en: 'Daily Bonus' },
      SPEND_STORE: { tr: 'Mağaza', en: 'Store' },
      SPEND_WHEEL: { tr: 'Çark Çevirme', en: 'Wheel Spin' },
      ADMIN_GRANT: { tr: 'Admin Hediye', en: 'Admin Grant' },
      ADMIN_REMOVE: { tr: 'Admin Kesinti', en: 'Admin Remove' },
    }
    return language === 'tr' ? labels[type]?.tr || type : labels[type]?.en || type
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!walletData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-background">
      <Navbar profile={profile} currentPage="wallet" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Wallet className="h-10 w-10 text-yellow-500" />
                {language === 'tr' ? 'Cüzdanım' : 'My Wallet'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'tr'
                  ? 'Bakiyenizi ve işlem geçmişinizi görüntüleyin'
                  : 'View your balance and transaction history'}
              </p>
            </div>

            {/* Balance Card */}
            <Card className="mb-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === 'tr' ? 'Mevcut Bakiye' : 'Current Balance'}
                    </p>
                    <div className="flex items-center gap-3">
                      <Coins className="h-10 w-10 text-yellow-500" />
                      <p className="text-5xl font-bold text-yellow-500">
                        {walletData.balance.toLocaleString()}
                      </p>
                      <span className="text-2xl text-muted-foreground">N-Points</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    {language === 'tr' ? 'Toplam Kazanç' : 'Total Earned'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-500">
                    +{walletData.totalEarned.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    {language === 'tr' ? 'Toplam Harcama' : 'Total Spent'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-500">
                    -{walletData.totalSpent.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    {language === 'tr' ? 'Son 7 Gün' : 'Last 7 Days'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-500">
                    +{walletData.recentEarned.toLocaleString()}
                  </p>
                  <p className="text-sm text-red-500">
                    -{walletData.recentSpent.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-purple-500" />
                    {language === 'tr' ? 'İşlem Sayısı' : 'Transactions'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-500">
                    {walletData.transactionCount}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {language === 'tr' ? 'Kazanç Dağılımı' : 'Earnings Breakdown'}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'N-Points kazanç kaynaklarınız' : 'Your N-Points earning sources'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(walletData.byType)
                    .filter(([type]) => type.startsWith('EARN'))
                    .sort(([, a], [, b]) => b.total - a.total)
                    .map(([type, data]) => (
                      <div
                        key={type}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <p className="text-sm text-muted-foreground mb-1">
                          {getTypeLabel(type)}
                        </p>
                        <p className="text-xl font-bold text-green-500">
                          +{data.total.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {data.count} {language === 'tr' ? 'işlem' : 'transactions'}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'tr' ? 'İşlem Geçmişi' : 'Transaction History'}
                </CardTitle>
                <CardDescription>
                  {language === 'tr' ? 'Son 100 işleminiz' : 'Your last 100 transactions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'tr' ? 'Tarih' : 'Date'}</TableHead>
                      <TableHead>{language === 'tr' ? 'Tür' : 'Type'}</TableHead>
                      <TableHead>{language === 'tr' ? 'Açıklama' : 'Description'}</TableHead>
                      <TableHead className="text-right">{language === 'tr' ? 'Miktar' : 'Amount'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletData.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">
                              {new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(tx.type)}>
                            {getTypeLabel(tx.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold text-lg ${
                            tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                          } flex items-center justify-end gap-1`}>
                            {tx.amount > 0 ? (
                              <ArrowUpRight className="h-4 w-4" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4" />
                            )}
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Online Users Sidebar */}
          <div className="lg:col-span-1">
            <OnlineUsers />
          </div>
        </div>
      </div>
    </div>
  )
}
