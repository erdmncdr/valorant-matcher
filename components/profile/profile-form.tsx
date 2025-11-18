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
import { Loader2, X } from "lucide-react"
import {
  VALORANT_RANKS,
  PLAYER_ROLES,
  SERIOUSNESS_LEVELS,
  REGIONS,
  LANGUAGES,
  VALORANT_AGENTS,
  PRESET_AVATARS,
} from "@/lib/constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ValorantRank, PlayerRole, Seriousness } from "@prisma/client"

interface ProfileFormProps {
  initialData?: any
  onSuccess?: () => void
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    nickname: initialData?.nickname || "",
    tagline: initialData?.tagline || "",
    avatarUrl: initialData?.avatarUrl || PRESET_AVATARS[0].url,
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

  const [showCustomUrl, setShowCustomUrl] = useState(false)

  const [selectedAgents, setSelectedAgents] = useState<Array<{ agentName: string; priority: string }>>(
    initialData?.playerAgents || []
  )

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
        title: "Too many agents",
        description: "You can select up to 10 agents",
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
          title: "No agents selected",
          description: "Please select at least one agent",
        })
        setIsLoading(false)
        return
      }

      if (formData.languages.length === 0) {
        toast({
          variant: "destructive",
          title: "No languages selected",
          description: "Please select at least one language",
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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile")
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your in-game identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label>Profile Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-valorant-red/50">
                <AvatarImage src={formData.avatarUrl} alt="Profile Avatar" />
                <AvatarFallback className="bg-valorant-red text-white text-2xl">
                  {formData.nickname ? formData.nickname.substring(0, 2).toUpperCase() : "??"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2">Choose a preset avatar or enter custom URL</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomUrl(!showCustomUrl)}
                >
                  {showCustomUrl ? "Choose Preset" : "Custom URL"}
                </Button>
              </div>
            </div>

            {showCustomUrl ? (
              <div className="space-y-2">
                <Label htmlFor="customAvatar">Custom Avatar URL</Label>
                <Input
                  id="customAvatar"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm text-gray-400 mb-2 block">Select Avatar</Label>
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                  {PRESET_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: avatar.url })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-110 ${
                        formData.avatarUrl === avatar.url
                          ? "border-valorant-red ring-2 ring-valorant-red/50"
                          : "border-gray-700 hover:border-valorant-cyan"
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={avatar.url} alt={`Avatar ${avatar.id}`} />
                        <AvatarFallback>{avatar.id}</AvatarFallback>
                      </Avatar>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">In-Game Name *</Label>
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
              <Label htmlFor="tagline">Tagline *</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="#1234"
                required
                pattern="^#[A-Za-z0-9]{3,5}$"
              />
              <p className="text-xs text-muted-foreground">Format: #1234</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">Region *</Label>
            <Select
              value={formData.region}
              onValueChange={(value) => setFormData({ ...formData, region: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
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
          <CardTitle>Rank & Role</CardTitle>
          <CardDescription>Your skill level and preferred playstyle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rankCurrent">Current Rank *</Label>
              <Select
                value={formData.rankCurrent}
                onValueChange={(value) => setFormData({ ...formData, rankCurrent: value as ValorantRank })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current rank" />
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
              <Label htmlFor="rankPeak">Peak Rank *</Label>
              <Select
                value={formData.rankPeak}
                onValueChange={(value) => setFormData({ ...formData, rankPeak: value as ValorantRank })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select peak rank" />
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
            <Label htmlFor="mainRole">Main Role *</Label>
            <Select
              value={formData.mainRole}
              onValueChange={(value) => setFormData({ ...formData, mainRole: value as PlayerRole })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select main role" />
              </SelectTrigger>
              <SelectContent>
                {PLAYER_ROLES.map((role) => (
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
          <CardTitle>Agents</CardTitle>
          <CardDescription>Select agents you play (1-10) *</CardDescription>
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
              <SelectValue placeholder="Add agent" />
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
          <CardTitle>Communication & Preferences</CardTitle>
          <CardDescription>How you like to play</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Languages *</Label>
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
              I have a microphone
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seriousness">Playstyle *</Label>
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
            <Label htmlFor="typicalPlaytime">Typical Playtime</Label>
            <Input
              id="typicalPlaytime"
              value={formData.typicalPlaytime}
              onChange={(e) => setFormData({ ...formData, typicalPlaytime: e.target.value })}
              placeholder="e.g., Weekdays 18:00-23:00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell others about yourself..."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

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
            Saving...
          </>
        ) : (
          "Save Profile"
        )}
      </Button>
    </form>
  )
}
