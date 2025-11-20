"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Store, Edit, Trash2, Plus, TrendingUp, DollarSign } from "lucide-react"
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface StoreItem {
  id: string
  nameEn: string
  nameTr: string
  vpAmount: number
  nPointsCost: number
  isActive: boolean
  sortOrder: number
  totalSales: number
  totalRevenue: number
}

export default function AdminStorePage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<StoreItem[]>([])
  const [stats, setStats] = useState({ totalPurchases: 0, totalRevenue: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null)
  const [formData, setFormData] = useState({
    nameEn: '',
    nameTr: '',
    vpAmount: 0,
    nPointsCost: 0,
    sortOrder: 0,
  })

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
      const response = await fetch("/api/admin/store")
      if (response.status === 403) {
        router.push("/")
        return
      }
      const data = await response.json()
      setItems(data.items || [])
      setStats(data.stats || { totalPurchases: 0, totalRevenue: 0 })
    } catch (error: any) {
      console.error("Failed to fetch store data:", error)
      toast({
        title: "Error",
        description: "Failed to load store data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: StoreItem) => {
    setEditingItem(item)
    setFormData({
      nameEn: item.nameEn,
      nameTr: item.nameTr,
      vpAmount: item.vpAmount,
      nPointsCost: item.nPointsCost,
      sortOrder: item.sortOrder,
    })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      const response = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          ...formData,
        }),
      })

      if (response.ok) {
        toast({
          title: t.adminStore.success,
          description: t.adminStore.itemUpdated,
        })
        setShowEditDialog(false)
        fetchData()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: t.adminStore.error,
        description: t.adminStore.updateFailed,
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (item: StoreItem) => {
    try {
      const response = await fetch("/api/admin/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: t.adminStore.success,
          description: item.isActive ? t.adminStore.itemDeactivated : t.adminStore.itemActivated,
        })
        fetchData()
      }
    } catch (error) {
      toast({
        title: t.adminStore.error,
        description: t.adminStore.toggleFailed,
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
              <Store className="h-8 w-8 text-primary" />
              {t.adminStore.title}
            </h1>
            <p className="text-muted-foreground mt-2">{t.adminStore.subtitle}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t.adminStore.totalSales}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPurchases}</div>
              <p className="text-xs text-muted-foreground mt-1">{t.adminStore.allTimePurchases}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {t.adminStore.totalRevenue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{t.adminStore.nPointsCollected}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                {t.adminStore.activeItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{items.filter(i => i.isActive).length}</div>
              <p className="text-xs text-muted-foreground mt-1">{t.adminStore.outOfTotal} {items.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Store Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t.adminStore.storeItems}</CardTitle>
            <CardDescription>{t.adminStore.manageVpBundles}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.adminStore.name}</TableHead>
                  <TableHead>{t.adminStore.vpAmount}</TableHead>
                  <TableHead>{t.adminStore.nPointsCost}</TableHead>
                  <TableHead>{t.adminStore.sales}</TableHead>
                  <TableHead>{t.adminStore.revenue}</TableHead>
                  <TableHead>{t.adminStore.status}</TableHead>
                  <TableHead>{t.adminStore.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nameEn}</TableCell>
                    <TableCell>{item.vpAmount.toLocaleString()} VP</TableCell>
                    <TableCell>{item.nPointsCost.toLocaleString()} N-Points</TableCell>
                    <TableCell>{item.totalSales}</TableCell>
                    <TableCell>{item.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? t.adminStore.active : t.adminStore.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.isActive ? t.adminStore.deactivate : t.adminStore.activate}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.adminStore.editStoreItem}</DialogTitle>
            <DialogDescription>{t.adminStore.updateDetails}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vpAmount">{t.adminStore.vpAmount}</Label>
              <Input
                id="vpAmount"
                type="number"
                value={formData.vpAmount}
                onChange={(e) => setFormData({ ...formData, vpAmount: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nPointsCost">{t.adminStore.nPointsCost}</Label>
              <Input
                id="nPointsCost"
                type="number"
                value={formData.nPointsCost}
                onChange={(e) => setFormData({ ...formData, nPointsCost: parseInt(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">{t.adminStore.sortOrder}</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t.adminStore.cancel}
            </Button>
            <Button onClick={handleSave}>{t.adminStore.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
