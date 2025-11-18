"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import {
  VALORANT_RANKS,
  PLAYER_ROLES,
  SERIOUSNESS_LEVELS,
  GAME_MODES,
  REGIONS,
  LANGUAGES,
  EXPIRY_OPTIONS,
} from "@/lib/constants"
import { ValorantRank, PlayerRole, Seriousness, GameMode, ListingType } from "@prisma/client"
import { useLanguage } from "@/lib/i18n/language-context"

export default function CreateListingPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const typeParam = searchParams.get("type")
  const [listingType, setListingType] = useState<ListingType>(
    typeParam === "solo" ? "SOLO" : "TEAM"
  )

  const [formData, setFormData] = useState({
    title: "",
    mode: GameMode.RANKED,
    region: "",
    languages: [] as string[],
    seriousness: Seriousness.NORMAL,
    voiceRequired: true,
    minRank: "" as ValorantRank | "",
    maxRank: "" as ValorantRank | "",
    stackSize: 4,
    desiredRole: "" as PlayerRole | "",
    description: "",
    expiryMinutes: 120,
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l: string) => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!formData.minRank || !formData.maxRank) {
        toast({
          variant: "destructive",
          title: t.createListing.missingRank || "Missing rank",
          description: t.createListing.missingRankDesc || "Please select both minimum and maximum rank",
        })
        setIsLoading(false)
        return
      }

      if (formData.languages.length === 0) {
        toast({
          variant: "destructive",
          title: t.createListing.noLanguagesSelected || "No languages selected",
          description: t.createListing.noLanguagesSelectedDesc || "Please select at least one language",
        })
        setIsLoading(false)
        return
      }

      if (!formData.region) {
        toast({
          variant: "destructive",
          title: t.createListing.noRegionSelected || "No region selected",
          description: t.createListing.noRegionSelectedDesc || "Please select a region",
        })
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingType,
          title: formData.title,
          mode: formData.mode,
          region: formData.region,
          languages: formData.languages,
          seriousness: formData.seriousness,
          voiceRequired: formData.voiceRequired,
          minRank: formData.minRank,
          maxRank: formData.maxRank,
          stackSize: listingType === "TEAM" ? formData.stackSize : undefined,
          desiredRole: formData.desiredRole || undefined,
          description: formData.description || undefined,
          expiryMinutes: formData.expiryMinutes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing")
      }

      toast({
        title: t.createListing.listingCreated || "Listing created!",
        description: t.createListing.listingCreatedDesc || "Your listing has been published",
      })

      router.push(`/listings/${data.listing.id}`)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-valorant-dark/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded bg-valorant-red flex items-center justify-center">
                <span className="text-white font-bold text-xl">N1</span>
              </div>
              <span className="text-white font-bold text-xl">NeedOne</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/listings">
                <Button variant="ghost" className="text-white">{t.listings.browseListing || "Browse Listings"}</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" className="text-white">{t.nav.dashboard || "Dashboard"}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{t.createListing.title || "Create Listing"}</h1>
            <p className="text-gray-400">{t.createListing.subtitle || "Find your perfect teammate"}</p>
          </div>

          {/* Listing Type Selection */}
          <Card className="mb-6 border-valorant-red/20">
            <CardHeader>
              <CardTitle className="text-white">{t.createListing.listingType || "Listing Type"}</CardTitle>
              <CardDescription>{t.createListing.listingTypeDesc || "Are you a team looking for a 5th, or a solo player?"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setListingType("TEAM")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    listingType === "TEAM"
                      ? "border-valorant-red bg-valorant-red/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white mb-1">{t.createListing.team4Stack || "Team (4-Stack)"}</h3>
                  <p className="text-sm text-gray-400">{t.createListing.lookingFor5th || "Looking for a 5th player"}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType("SOLO")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    listingType === "SOLO"
                      ? "border-valorant-cyan bg-valorant-cyan/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-white mb-1">{t.createListing.soloPlayer || "Solo Player"}</h3>
                  <p className="text-sm text-gray-400">{t.createListing.lookingToJoinTeam || "Looking to join a team"}</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">{t.createListing.basicInfo || "Basic Information"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.createListing.titleLabel || "Title"} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={
                      listingType === "TEAM"
                        ? t.createListing.titlePlaceholderTeam || "e.g., Diamond 4-stack LF1 Controller"
                        : t.createListing.titlePlaceholderSolo || "e.g., Platinum Duelist LFT Ranked"
                    }
                    required
                    maxLength={100}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode">{t.createListing.gameMode || "Game Mode"} *</Label>
                    <Select
                      value={formData.mode}
                      onValueChange={(value) => setFormData({ ...formData, mode: value as GameMode })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GAME_MODES.map((mode) => (
                          <SelectItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">{t.createListing.region || "Region"} *</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData({ ...formData, region: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.createListing.selectRegion || "Select region"} />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.createListing.languages || "Languages"} *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <div key={lang.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${lang.value}`}
                          checked={formData.languages.includes(lang.value)}
                          onCheckedChange={() => handleLanguageToggle(lang.value)}
                        />
                        <Label htmlFor={`lang-${lang.value}`} className="text-sm font-normal cursor-pointer">
                          {lang.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t.createListing.description || "Description"}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t.createListing.descriptionPlaceholder || "Tell potential teammates about your playstyle, schedule, or what you're looking for..."}
                    maxLength={500}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/500 {t.createListing.charactersCount || "characters"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">{t.createListing.requirements || "Requirements"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minRank">{t.createListing.minRank || "Minimum Rank"} *</Label>
                    <Select
                      value={formData.minRank}
                      onValueChange={(value) => setFormData({ ...formData, minRank: value as ValorantRank })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.createListing.selectMinRank || "Select minimum rank"} />
                      </SelectTrigger>
                      <SelectContent>
                        {VALORANT_RANKS.map((rank) => (
                          <SelectItem key={rank.value} value={rank.value}>
                            {rank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRank">{t.createListing.maxRank || "Maximum Rank"} *</Label>
                    <Select
                      value={formData.maxRank}
                      onValueChange={(value) => setFormData({ ...formData, maxRank: value as ValorantRank })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.createListing.selectMaxRank || "Select maximum rank"} />
                      </SelectTrigger>
                      <SelectContent>
                        {VALORANT_RANKS.map((rank) => (
                          <SelectItem key={rank.value} value={rank.value}>
                            {rank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desiredRole">
                    {listingType === "TEAM" ? (t.createListing.roleNeeded || "Role Needed") : (t.createListing.yourRole || "Your Role")}
                  </Label>
                  <Select
                    value={formData.desiredRole || undefined}
                    onValueChange={(value) => setFormData({ ...formData, desiredRole: value === "any" ? "" : value as PlayerRole })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.createListing.selectRoleOptional || "Select role (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t.createListing.anyRole || "Any Role"}</SelectItem>
                      {PLAYER_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seriousness">{t.createListing.playstyle || "Playstyle"} *</Label>
                  <Select
                    value={formData.seriousness}
                    onValueChange={(value) => setFormData({ ...formData, seriousness: value as Seriousness })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERIOUSNESS_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="voiceRequired"
                    checked={formData.voiceRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, voiceRequired: checked as boolean })}
                  />
                  <Label htmlFor="voiceRequired" className="text-sm font-normal cursor-pointer">
                    {t.createListing.voiceRequired || "Voice chat required"}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Expiry */}
            <Card>
              <CardHeader>
                <CardTitle className="text-white">{t.createListing.listingDuration || "Listing Duration"}</CardTitle>
                <CardDescription>{t.createListing.listingDurationDesc || "How long should this listing stay active?"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.expiryMinutes.toString()}
                  onValueChange={(value) => setFormData({ ...formData, expiryMinutes: parseInt(value) })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {t.createListing.autoExpireNote || "Your listing will automatically expire after this time"}
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                variant="valorant"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.createListing.creating || "Creating..."}
                  </>
                ) : (
                  t.createListing.createListing || "Create Listing"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                {t.createListing.cancel || "Cancel"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
