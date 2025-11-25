"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, X, Gift } from "lucide-react"
import {
  getValorantRanks,
  getPlayerRoles,
  SERIOUSNESS_LEVELS,
  REGIONS,
  LANGUAGES,
  VALORANT_AGENTS,
} from "@/lib/constants"
import { ValorantRank, PlayerRole, Seriousness } from "@/lib/types"
import { useLanguage } from "@/lib/i18n/language-context"

interface ProfileFormProps {
  initialData?: any
  onSuccess?: () => void
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  // Get translated labels
  const valorantRanks = getValorantRanks(t)
  const playerRoles = getPlayerRoles(t)

  const [formData, setFormData] = useState({
    nickname: initialData?.nickname || "",
    tagline: initialData?.tagline || "",
    region: initialData?.region || "",
    rankCurrent: initialData?.rankCurrent || "",
    rankPeak: initialData?.rankPeak || "",
    mainRole: initialData?.mainRole || "",
    languages: initialData?.languages || [],
    mic: initialData?.mic ?? true,
    seriousness: initialData?.seriousness || Seriousness.NORMAL,
    typicalPlaytime: initialData?.typicalPlaytime || "",
    bio: initialData?.bio || "",
  })

  const [selectedAgents, setSelectedAgents] = useState<Array<{ agentName: string; priority: string }>>(
    initialData?.playerAgents || []
  )

  // Referral code (only for new profiles)
  const [referralCode, setReferralCode] = useState("")
  const isNewProfile = !initialData

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l: string) => l !== lang)
        : [...prev.languages, lang]
    }))
  }

  const handleAddAgent = (agentName: string) => {
    if (selectedAgents.length >= 10) {
      toast({
        variant: "destructive",
        title: t.profileEdit.tooManyAgents,
        description: t.profileEdit.maxAgentsDesc,
      })
      return
    }

    if (!selectedAgents.find(a => a.agentName === agentName)) {
      setSelectedAgents([...selectedAgents, {
        agentName,
        priority: selectedAgents.length === 0 ? "main" : "secondary"
      }])
    }
  }

  const handleRemoveAgent = (agentName: string) => {
    setSelectedAgents(selectedAgents.filter(a => a.agentName !== agentName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation
      if (selectedAgents.length === 0) {
        toast({
          variant: "destructive",
          title: t.profileEdit.noAgentsSelected,
          description: t.profileEdit.selectOneAgent,
        })
        setIsLoading(false)
        return
      }

      if (formData.languages.length === 0) {
        toast({
          variant: "destructive",
          title: t.profileEdit.noLanguagesSelected,
          description: t.profileEdit.selectOneLanguage,
        })
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agents: selectedAgents,
          ...(isNewProfile && referralCode ? { referralCode } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      // Show appropriate toast message
      if (data.referralBonusApplied) {
        toast({
          title: "🎉 " + (t.language === 'tr' ? 'Hoş Geldin!' : 'Welcome!'),
          description: t.language === 'tr'
            ? `Profilin oluşturuldu ve referans bonusu olarak ${data.referralBonus} NP kazandın!`
            : `Profile created and you earned ${data.referralBonus} NP referral bonus!`,
        })
      } else {
        toast({
          title: t.common.success,
          description: t.profileEdit.profileUpdateSuccess,
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.profileEdit.profileUpdateError,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.profileEdit.basicInfo}</CardTitle>
          <CardDescription>{t.profileEdit.basicInfoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">{t.profileEdit.nickname} *</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="PlayerName"
                required
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">{t.profileEdit.tagline} *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">#</span>
                <Input
                  id="tagline"
                  value={formData.tagline.replace(/^#/, '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^#/, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 5)
                    setFormData({ ...formData, tagline: `#${value}` })
                  }}
                  placeholder="1234"
                  className="pl-7"
                  required
                  pattern="[A-Za-z0-9]{3,5}"
                  minLength={3}
                  maxLength={5}
                />
              </div>
              <p className="text-xs text-muted-foreground">3-5 alphanumeric characters</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">{t.profileEdit.region} *</Label>
            <Select
              value={formData.region}
              onValueChange={(value) => setFormData({ ...formData, region: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t.profileEdit.selectRegion} />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profileEdit.rankAndRole}</CardTitle>
          <CardDescription>{t.profileEdit.rankAndRoleDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rankCurrent">{t.profileEdit.currentRank} *</Label>
              <Select
                value={formData.rankCurrent}
                onValueChange={(value) => setFormData({ ...formData, rankCurrent: value as ValorantRank })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.profileEdit.selectRank} />
                </SelectTrigger>
                <SelectContent>
                  {valorantRanks.map((rank) => (
                    <SelectItem key={rank.value} value={rank.value}>
                      {rank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rankPeak">{t.profileEdit.peakRank} *</Label>
              <Select
                value={formData.rankPeak}
                onValueChange={(value) => setFormData({ ...formData, rankPeak: value as ValorantRank })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.profileEdit.selectRank} />
                </SelectTrigger>
                <SelectContent>
                  {valorantRanks.map((rank) => (
                    <SelectItem key={rank.value} value={rank.value}>
                      {rank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainRole">{t.profileEdit.mainRole} *</Label>
            <Select
              value={formData.mainRole}
              onValueChange={(value) => setFormData({ ...formData, mainRole: value as PlayerRole })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t.profileEdit.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {playerRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profileEdit.agentPool}</CardTitle>
          <CardDescription>{t.profileEdit.agentPoolDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedAgents.map((agent) => (
              <Badge key={agent.agentName} variant="secondary" className="text-sm py-1.5 px-3">
                {agent.agentName}
                {agent.priority === "main" && " ⭐"}
                <button
                  type="button"
                  onClick={() => handleRemoveAgent(agent.agentName)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <Select onValueChange={handleAddAgent}>
            <SelectTrigger>
              <SelectValue placeholder={t.profileEdit.selectAgent} />
            </SelectTrigger>
            <SelectContent>
              {VALORANT_AGENTS.filter(a => !selectedAgents.find(sa => sa.agentName === a)).map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">First agent selected is marked as your main (⭐)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profileEdit.gameplayPreferences}</CardTitle>
          <CardDescription>{t.profileEdit.gameplayPreferencesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.profileEdit.languages} *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LANGUAGES.map((lang) => (
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="mic"
              checked={formData.mic}
              onCheckedChange={(checked) => setFormData({ ...formData, mic: checked as boolean })}
            />
            <Label htmlFor="mic" className="text-sm font-normal cursor-pointer">
              {t.profileEdit.hasMicrophone}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seriousness">{t.profileEdit.playstyle} *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="typicalPlaytime">{t.profileEdit.typicalPlaytime}</Label>
            <Input
              id="typicalPlaytime"
              value={formData.typicalPlaytime}
              onChange={(e) => setFormData({ ...formData, typicalPlaytime: e.target.value })}
              placeholder={t.profileEdit.playtimeHelper}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t.profileEdit.bio}</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t.profileEdit.bioHelper}
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code - Only for new profiles */}
      {isNewProfile && (
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              {t.language === 'tr' ? 'Referans Kodu (Opsiyonel)' : 'Referral Code (Optional)'}
            </CardTitle>
            <CardDescription>
              {t.language === 'tr'
                ? 'Bir arkadaşının referans kodu varsa buraya gir ve 100 NP bonus kazan!'
                : 'Enter a friend\'s referral code and get 100 NP bonus!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder={t.language === 'tr' ? 'Referans kodunu gir...' : 'Enter referral code...'}
              className="font-mono"
            />
          </CardContent>
        </Card>
      )}

      <Button
        type="submit"
        className="w-full"
        variant="valorant"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.profileEdit.saving}
          </>
        ) : (
          t.profileEdit.saveChanges
        )}
      </Button>
    </form>
  )
}
