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
import { useToast } from "@/hooks/use-toast"
import { Loader2, Coins, TrendingUp, TrendingDown, Users, Plus, Minus } from "lucide-react"
import { Navbar } from "@/components/layout/navbar"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  createdAt: string
  user: {
    playerProfile: {
      nickname: string
      tagline: string
    }
  }
}

export default function AdminNPointsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    totalPlayers: 0,
    totalNPointsInCirculation: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [grantAmount, setGrantAmount] = useState(0)
  const [grantReason, setGrantReason] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
      fetchData()
    }
  }, [status, router])

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
            description: "You don't have admin permissions",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/npoints?limit=50")
      if (response.status === 403) {
        router.push("/")
        return
      }
      const data = await response.json()
      setTransactions(data.transactions || [])
      setStats(data.stats || {})
    } catch (error: any) {
      console.error("Failed to fetch N-Points data:", error)
      toast({
        title: "Error",
        description: "Failed to load N-Points data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      })
    }
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setSearchResults([])
    setSearchQuery(`${user.playerProfile.nickname}${user.playerProfile.tagline}`)
  }

  const handleGrant = async () => {
    if (!selectedUser || grantAmount === 0) return

    try {
      const response = await fetch("/api/admin/npoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: grantAmount,
          reason: grantReason || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
        })
        setShowGrantDialog(false)
        setSelectedUser(null)
        setSearchQuery("")
        setGrantAmount(0)
        setGrantReason("")
        fetchData()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process N-Points",
        variant: "destructive",
      })
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
              <Coins className="h-8 w-8 text-yellow-500" />
              N-Points Management
            </h1>
            <p className="text-muted-foreground mt-2">Grant or deduct N-Points from users</p>
          </div>
          <Button onClick={() => setShowGrantDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Grant/Deduct N-Points
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEarned.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time spending</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                In Circulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalNPointsInCirculation.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Total N-Points held</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground mt-1">With profiles</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Last 50 N-Points transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.user.playerProfile.nickname}{tx.user.playerProfile.tagline}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.amount > 0 ? "default" : "destructive"}>
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Grant/Deduct Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Grant or Deduct N-Points</DialogTitle>
            <DialogDescription>Search for a user and modify their N-Points balance</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="search">Search User</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Enter nickname or tagline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                />
                <Button onClick={handleSearchUsers}>Search</Button>
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-md mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-2 hover:bg-accent cursor-pointer"
                      onClick={() => handleSelectUser(user)}
                    >
                      {user.playerProfile.nickname}{user.playerProfile.tagline}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({user.playerProfile.nPoints} N-Points)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Positive to grant, negative to deduct"
                    value={grantAmount || ""}
                    onChange={(e) => setGrantAmount(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current balance: {selectedUser.playerProfile.nPoints} N-Points
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why are you modifying their balance?"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGrantDialog(false)
              setSelectedUser(null)
              setSearchQuery("")
              setGrantAmount(0)
              setGrantReason("")
            }}>
              Cancel
            </Button>
            <Button onClick={handleGrant} disabled={!selectedUser || grantAmount === 0}>
              {grantAmount > 0 ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
              {grantAmount > 0 ? "Grant" : "Deduct"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
