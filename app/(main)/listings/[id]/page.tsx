"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Send, MapPin, Users, Clock, Mic, MicOff, X, Check } from "lucide-react"
import { getRankBadgeClass, getRoleColor } from "@/lib/constants"
import { formatExpiresIn, formatTimeAgo } from "@/lib/utils"
import { ProfilePreviewCard } from "@/components/profile/profile-preview-card"
import { useLanguage } from "@/lib/i18n/language-context"

export default function ListingDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { t } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [listing, setListing] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [applyMessage, setApplyMessage] = useState("")
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      fetchListing()
      fetchMessages()
    }
  }, [status, router])

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch listing")
      }

      setListing(data.listing)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
      router.push("/listings")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}/messages`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSendingMessage(true)
    try {
      const response = await fetch(`/api/listings/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setMessages([...messages, data.message])
      setNewMessage("")
      scrollToBottom()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const applyToListing = async () => {
    setIsApplying(true)
    try {
      const response = await fetch(`/api/listings/${params.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply")
      }

      toast({
        title: t.listings.applicationSent || "Application sent!",
        description: t.listings.applicationSentDesc || "The listing owner will see your application",
      })

      fetchListing()
      setApplyMessage("")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
    } finally {
      setIsApplying(false)
    }
  }

  const closeListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to close listing")
      }

      toast({
        title: t.listings.listingClosed || "Listing closed",
        description: t.listings.listingClosedDesc || "Your listing has been closed",
      })

      router.push("/my-listings")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Error",
        description: error.message,
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-valorant-darker via-valorant-dark to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-valorant-red" />
      </div>
    )
  }

  if (!listing) {
    return null
  }

  const isOwner = session?.user?.id === listing.ownerUserId
  const profile = listing.owner.playerProfile
  const hasApplied = listing.applications?.some((app: any) => app.applicantUserId === session?.user?.id)

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listing Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-valorant-red/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl text-white">{listing.title}</CardTitle>
                      <Badge variant={listing.listingType === "TEAM" ? "default" : "secondary"}>
                        {listing.listingType === "TEAM" ? t.listings.teamLF1 || "Team LF1" : t.listings.soloLFT || "Solo LFT"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      {formatExpiresIn(new Date(listing.expiresAt))}
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="outline" size="sm" onClick={closeListing}>
                      {t.listings.closeListing || "Close Listing"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="mode">{listing.mode}</Badge>
                  <Badge variant="outline">{listing.seriousness}</Badge>
                  {listing.desiredRole && (
                    <Badge variant="role">{listing.desiredRole}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">{t.listings.region || "Region"}</p>
                    <div className="flex items-center text-white">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.region}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">{t.listings.voice || "Voice"}</p>
                    <div className="flex items-center text-white">
                      {listing.voiceRequired ? (
                        <>
                          <Mic className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-500">{t.listings.required || "Required"}</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="h-4 w-4 mr-1" />
                          {t.listings.optional || "Optional"}
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">{t.listings.rankRange || "Rank Range"}</p>
                    <div className="flex items-center gap-1">
                      <Badge className={`${getRankBadgeClass(listing.minRank)} rank-badge text-xs`}>
                        {listing.minRank}
                      </Badge>
                      <span className="text-gray-400">-</span>
                      <Badge className={`${getRankBadgeClass(listing.maxRank)} rank-badge text-xs`}>
                        {listing.maxRank}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 mb-1">{t.listings.languages || "Languages"}</p>
                  <p className="text-white">{listing.languages.join(", ")}</p>
                </div>

                {listing.description && (
                  <div>
                    <p className="text-gray-400 mb-1">{t.listings.description || "Description"}</p>
                    <p className="text-white">{listing.description}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-gray-400 mb-2">{t.listings.postedBy || "Posted by"}</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        <Avatar className="hover:ring-2 hover:ring-valorant-purple transition-all">
                          <AvatarFallback className="bg-valorant-red text-white">
                            {profile?.nickname?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-medium hover:text-valorant-purple transition-colors">
                            {profile?.nickname || "Unknown"}
                            <span className="text-gray-400">{profile?.tagline}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRankBadgeClass(profile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                              {profile?.rankCurrent}
                            </Badge>
                            <Badge variant="role" className="text-xs">
                              {profile?.mainRole}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <ProfilePreviewCard userId={listing.ownerUserId} listingId={params.id as string} />
                    </PopoverContent>
                  </Popover>
                </div>

                {!isOwner && listing.status === "OPEN" && (
                  <div className="space-y-3 pt-4">
                    <Textarea
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder={t.listings.applicationMessage || "Send a message with your application (optional)"}
                      rows={3}
                      disabled={hasApplied}
                    />
                    <Button
                      onClick={applyToListing}
                      variant="valorant"
                      className="w-full"
                      disabled={isApplying || hasApplied}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t.listings.sending || "Sending..."}
                        </>
                      ) : hasApplied ? (
                        t.listings.alreadyApplied || "Already Applied"
                      ) : (
                        t.listings.applyToJoin || "Apply to Join"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="border-valorant-cyan/20">
              <CardHeader>
                <CardTitle className="text-white">{t.listings.chat || "Chat"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto custom-scrollbar bg-valorant-dark/30 rounded-lg p-4 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">
                        {t.listings.noMessages || "No messages yet. Start the conversation!"}
                      </p>
                    ) : (
                      messages.map((message) => {
                        const isAdmin = message.sender.isAdmin
                        return (
                          <div
                            key={message.id}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                              isAdmin ? 'bg-gradient-to-r from-valorant-red/20 via-valorant-purple/20 to-valorant-cyan/20 border-l-4 border-valorant-red shadow-lg' : ''
                            }`}
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <Avatar
                                  className={`h-8 w-8 cursor-pointer transition-all ${
                                    isAdmin
                                      ? 'ring-2 ring-valorant-red hover:ring-valorant-purple animate-pulse'
                                      : 'hover:ring-2 hover:ring-valorant-purple'
                                  }`}
                                >
                                  <AvatarFallback className={isAdmin ? "bg-gradient-to-br from-valorant-red to-valorant-purple text-white text-xs font-bold" : "bg-valorant-purple text-white text-xs"}>
                                    {message.sender.playerProfile?.nickname?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <ProfilePreviewCard userId={message.sender.id} listingId={params.id as string} />
                              </PopoverContent>
                            </Popover>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      className={`text-sm font-medium transition-colors ${
                                        isAdmin
                                          ? 'text-valorant-red hover:text-valorant-purple font-bold'
                                          : 'text-white hover:text-valorant-purple'
                                      } hover:underline`}
                                    >
                                      {message.sender.playerProfile?.nickname || "Unknown"}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" align="start">
                                    <ProfilePreviewCard userId={message.sender.id} listingId={params.id as string} />
                                  </PopoverContent>
                                </Popover>
                                {isAdmin && (
                                  <Badge className="bg-gradient-to-r from-valorant-red to-valorant-purple text-white text-xs font-bold border-0 shadow-lg animate-pulse">
                                    ⚡ ADMIN
                                  </Badge>
                                )}
                                <span className="text-xs text-gray-400">
                                  {formatTimeAgo(new Date(message.createdAt))}
                                </span>
                              </div>
                              <p className={`text-sm ${isAdmin ? 'text-white font-medium' : 'text-gray-300'}`}>
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t.listings.typeMessage || "Type a message..."}
                      maxLength={1000}
                      disabled={isSendingMessage}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="valorant"
                      disabled={isSendingMessage || !newMessage.trim()}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications */}
          <div>
            <Card className="border-valorant-purple/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.listings.applications || "Applications"} ({listing.applications?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isOwner ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {t.listings.onlyOwnerSeeApplications || "Only the listing owner can see applications"}
                  </p>
                ) : listing.applications?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {t.listings.noApplications || "No applications yet"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {listing.applications.map((application: any) => (
                      <div
                        key={application.id}
                        className="p-3 rounded-lg bg-valorant-dark/30 border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-valorant-purple transition-all">
                                  <AvatarFallback className="bg-valorant-cyan text-white text-xs">
                                    {application.applicant.playerProfile?.nickname?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="start">
                                <ProfilePreviewCard userId={application.applicantUserId} listingId={params.id as string} />
                              </PopoverContent>
                            </Popover>
                            <div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-sm font-medium text-white hover:text-valorant-purple hover:underline transition-colors">
                                    {application.applicant.playerProfile?.nickname}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start">
                                  <ProfilePreviewCard userId={application.applicantUserId} listingId={params.id as string} />
                                </PopoverContent>
                              </Popover>
                              <div>
                                <Badge className={`${getRankBadgeClass(application.applicant.playerProfile?.rankCurrent || "IRON")} rank-badge text-xs`}>
                                  {application.applicant.playerProfile?.rankCurrent}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              application.status === "accepted"
                                ? "default"
                                : application.status === "declined"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                        {application.message && (
                          <p className="text-xs text-gray-300 mb-2">{application.message}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {t.listings.applied || "Applied"} {formatTimeAgo(new Date(application.createdAt))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
