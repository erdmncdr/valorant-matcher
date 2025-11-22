"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Users, Coins, Gift, Copy, Check, PiggyBank, ArrowDownToLine, Sparkles, Clock, User } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import { OnlineUsers } from "@/components/online-users"
import { usePresence } from "@/hooks/use-presence"
import { useBalance } from "@/lib/balance-context"
import { useToast } from "@/hooks/use-toast"

interface ReferralEarning {
  id: string
  sourceAmount: number
  earnedAmount: number
  transactionType: string
  description: string
  createdAt: string
}

interface ReferredUser {
  userId: string
  nickname: string
  createdAt: string
  totalEarned: number
}

interface ReferralData {
  referralCode: string
  piggyBankBalance: number
  minWithdrawalAmount: number
  canWithdraw: boolean
  referredUsersCount: number
  totalEarnings: number
  referredBy: string | null
  recentEarnings: ReferralEarning[]
  referredUsers: ReferredUser[]
}

export default function ReferralPage() {
  usePresence()
  const { status } = useSession()
  const router = useRouter()
  const { language } = useLanguage()
  const { toast } = useToast()
  const { setBalance } = useBalance()
  const [profile, setProfile] = useState<any>(null)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [referralCodeInput, setReferralCodeInput] = useState("")
  const [isApplying, setIsApplying] = useState(false)

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
      const [profileRes, referralRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/referral")
      ])

      const profileData = await profileRes.json()
      const referralDataRes = await referralRes.json()

      if (profileData.profile) {
        setProfile(profileData.profile)
      }

      if (referralDataRes.referralCode) {
        setReferralData(referralDataRes)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyReferralCode = async () => {
    if (!referralData?.referralCode) return

    try {
      await navigator.clipboard.writeText(referralData.referralCode)
      setCopied(true)
      toast({
        title: language === "tr" ? "Kopyalandı!" : "Copied!",
        description: language === "tr"
          ? "Referans kodunuz panoya kopyalandı."
          : "Your referral code has been copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleWithdraw = async () => {
    if (!referralData?.canWithdraw || isWithdrawing) return

    setIsWithdrawing(true)
    try {
      const response = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Withdrawal failed")
      }

      setBalance(data.newBalance)
      toast({
        title: "🎉 " + (language === "tr" ? "Çekim Başarılı!" : "Withdrawal Successful!"),
        description: language === "tr"
          ? `${data.withdrawnAmount} NP ana bakiyenize aktarıldı.`
          : `${data.withdrawnAmount} NP transferred to your main balance.`,
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: language === "tr" ? "Çekim Başarısız" : "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleApplyReferralCode = async () => {
    if (!referralCodeInput.trim() || isApplying) return

    setIsApplying(true)
    try {
      const response = await fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralCodeInput.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply referral code")
      }

      toast({
        title: "🎉 " + (language === "tr" ? "Referans Kodu Uygulandı!" : "Referral Code Applied!"),
        description: language === "tr"
          ? `${data.bonus} NP bonus kazandınız! (${data.referrerNickname} tarafından davet edildiniz)`
          : `You earned ${data.bonus} NP bonus! (Referred by ${data.referrerNickname})`,
      })

      setReferralCodeInput("")
      fetchData()
    } catch (error: any) {
      toast({
        title: language === "tr" ? "Hata" : "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
      <Navbar profile={profile} currentPage="referral" />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Users className="h-10 w-10 text-primary" />
                {language === "tr" ? "Referans Sistemi" : "Referral System"}
              </h1>
              <p className="text-muted-foreground">
                {language === "tr"
                  ? "Arkadaşlarınızı davet edin, kazançlarının %5'ini alın!"
                  : "Invite friends and earn 5% of their earnings!"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Piggy Bank */}
              <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <PiggyBank className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "tr" ? "Kumbara" : "Piggy Bank"}
                      </p>
                      <p className="text-3xl font-bold text-yellow-500">
                        {referralData?.piggyBankBalance.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total Earnings */}
              <Card className="border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-500/20">
                      <Coins className="h-8 w-8 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "tr" ? "Toplam Kazanç" : "Total Earnings"}
                      </p>
                      <p className="text-3xl font-bold text-green-500">
                        {referralData?.totalEarnings.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referred Users */}
              <Card className="border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "tr" ? "Davet Edilen" : "Referred"}
                      </p>
                      <p className="text-3xl font-bold text-blue-500">
                        {referralData?.referredUsersCount || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Your Referral Code */}
            <Card className="mb-6 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  {language === "tr" ? "Senin Referans Kodun" : "Your Referral Code"}
                </CardTitle>
                <CardDescription>
                  {language === "tr"
                    ? "Bu kodu arkadaşlarınla paylaş. Onlar 100 NP bonus alır, sen de kazançlarının %5'ini!"
                    : "Share this code with friends. They get 100 NP bonus, you earn 5% of their earnings!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={referralData?.referralCode || ""}
                      readOnly
                      className="text-xl font-mono font-bold tracking-wider bg-muted/50 text-center"
                    />
                  </div>
                  <Button
                    variant="valorant"
                    onClick={copyReferralCode}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        {language === "tr" ? "Kopyalandı" : "Copied"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {language === "tr" ? "Kopyala" : "Copy"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Withdraw Section */}
            <Card className="mb-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5 text-yellow-500" />
                  {language === "tr" ? "Kumbaradan Çek" : "Withdraw from Piggy Bank"}
                </CardTitle>
                <CardDescription>
                  {language === "tr"
                    ? `Minimum çekim: ${referralData?.minWithdrawalAmount || 100} NP`
                    : `Minimum withdrawal: ${referralData?.minWithdrawalAmount || 100} NP`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === "tr" ? "Çekilebilir Miktar" : "Withdrawable Amount"}
                    </p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {referralData?.piggyBankBalance.toLocaleString() || 0} NP
                    </p>
                  </div>
                  <Button
                    variant="valorant"
                    size="lg"
                    onClick={handleWithdraw}
                    disabled={!referralData?.canWithdraw || isWithdrawing}
                    className="gap-2"
                  >
                    {isWithdrawing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <PiggyBank className="h-5 w-5" />
                    )}
                    {language === "tr" ? "Çek" : "Withdraw"}
                  </Button>
                </div>
                {!referralData?.canWithdraw && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {language === "tr"
                      ? `En az ${referralData?.minWithdrawalAmount || 100} NP biriktirmeniz gerekiyor.`
                      : `You need at least ${referralData?.minWithdrawalAmount || 100} NP to withdraw.`}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Apply Referral Code (if not already referred) */}
            {!referralData?.referredBy && (
              <Card className="mb-6 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    {language === "tr" ? "Referans Kodu Kullan" : "Use Referral Code"}
                  </CardTitle>
                  <CardDescription>
                    {language === "tr"
                      ? "Bir arkadaşının referans kodunu gir ve 100 NP bonus kazan!"
                      : "Enter a friend's referral code and earn 100 NP bonus!"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Input
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      placeholder={language === "tr" ? "Referans kodunu gir..." : "Enter referral code..."}
                      className="flex-1 font-mono"
                    />
                    <Button
                      variant="valorant"
                      onClick={handleApplyReferralCode}
                      disabled={!referralCodeInput.trim() || isApplying}
                      className="gap-2"
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {language === "tr" ? "Uygula" : "Apply"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referred By */}
            {referralData?.referredBy && (
              <Card className="mb-6 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-500" />
                    <span className="text-muted-foreground">
                      {language === "tr" ? "Davet Eden:" : "Referred By:"}
                    </span>
                    <Badge variant="secondary" className="text-green-500">
                      {referralData.referredBy}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referred Users List */}
            {referralData?.referredUsers && referralData.referredUsers.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === "tr" ? "Davet Ettiklerin" : "Your Referrals"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {referralData.referredUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.nickname}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">+{user.totalEarned} NP</p>
                          <p className="text-xs text-muted-foreground">
                            {language === "tr" ? "Kazandırdı" : "Earned"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Earnings */}
            {referralData?.recentEarnings && referralData.recentEarnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === "tr" ? "Son Kazançlar" : "Recent Earnings"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {referralData.recentEarnings.map((earning) => (
                      <div
                        key={earning.id}
                        className="flex items-center justify-between py-2 px-4 bg-muted/30 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <Coins className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="text-sm">
                              {earning.description || earning.transactionType}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(earning.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">+{earning.earnedAmount} NP</p>
                          <p className="text-xs text-muted-foreground">
                            %5 of {earning.sourceAmount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* How It Works */}
            <Card className="mt-6 border-primary/20">
              <CardHeader>
                <CardTitle>
                  {language === "tr" ? "Nasıl Çalışır?" : "How It Works?"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-semibold mb-1">
                      {language === "tr" ? "Kodunu Paylaş" : "Share Your Code"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "tr"
                        ? "Referans kodunu arkadaşlarınla paylaş"
                        : "Share your referral code with friends"}
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-semibold mb-1">
                      {language === "tr" ? "Arkadaşın Kaydolur" : "Friend Signs Up"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "tr"
                        ? "Arkadaşın senin kodunla 100 NP bonus alır"
                        : "Your friend gets 100 NP bonus with your code"}
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-semibold mb-1">
                      {language === "tr" ? "Kazanmaya Başla" : "Start Earning"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "tr"
                        ? "Arkadaşının kazandığı her NP'nin %5'i senin!"
                        : "You earn 5% of everything your friend earns!"}
                    </p>
                  </div>
                </div>
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
