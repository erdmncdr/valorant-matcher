"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface RatingFormProps {
  targetUserId: string
  listingId: string
  onSuccess: () => void
  onCancel: () => void
}

const POSITIVE_TAGS = [
  { value: "calm", label: { tr: "Sakin", en: "Calm" } },
  { value: "shotcaller", label: { tr: "İyi Lider", en: "Shotcaller" } },
  { value: "friendly", label: { tr: "Arkadaş Canlısı", en: "Friendly" } },
  { value: "skilled", label: { tr: "Yetenekli", en: "Skilled" } },
  { value: "communicative", label: { tr: "İletişim Halinde", en: "Communicative" } },
  { value: "team-player", label: { tr: "Takım Oyuncusu", en: "Team Player" } },
]

const NEGATIVE_TAGS = [
  { value: "toxic", label: { tr: "Toksik", en: "Toxic" } },
  { value: "tilt", label: { tr: "Sinirli", en: "Tilts Easily" } },
  { value: "quiet", label: { tr: "Sessiz", en: "Too Quiet" } },
  { value: "rage", label: { tr: "Öfkeli", en: "Rage" } },
  { value: "afk", label: { tr: "AFK", en: "AFK" } },
  { value: "bad-comms", label: { tr: "Kötü İletişim", en: "Bad Comms" } },
]

export function RatingForm({ targetUserId, listingId, onSuccess, onCancel }: RatingFormProps) {
  const { toast } = useToast()
  const { t, language } = useLanguage()
  const [score, setScore] = useState<1 | -1 | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableTags = score === 1 ? POSITIVE_TAGS : score === -1 ? NEGATIVE_TAGS : []

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!score) {
      toast({
        variant: "destructive",
        title: t.common.error || "Hata",
        description: t.common.selectRating || "Lütfen pozitif veya negatif seçin",
      })
      return
    }

    if (selectedTags.length === 0) {
      toast({
        variant: "destructive",
        title: t.common.error || "Hata",
        description: t.common.selectAtLeastOneTag || "En az bir etiket seçin",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          listingId,
          score,
          tags: selectedTags,
          comment: comment.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit rating")
      }

      toast({
        title: t.common.success || "Başarılı",
        description: t.common.ratingSubmitted || "Değerlendirmeniz gönderildi",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.common.error || "Hata",
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-valorant-purple/20">
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label className="text-white mb-3 block">
            {t.common.rateThisPlayer || "Bu Oyuncuyu Değerlendirin"}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={score === 1 ? "default" : "outline"}
              className={`h-20 ${
                score === 1
                  ? "bg-green-600 hover:bg-green-700 border-green-500"
                  : "border-green-500/50 hover:border-green-500"
              }`}
              onClick={() => {
                setScore(1)
                setSelectedTags([])
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsUp className="h-6 w-6" />
                <span className="font-semibold">{t.common.positive || "Pozitif"}</span>
              </div>
            </Button>
            <Button
              variant={score === -1 ? "default" : "outline"}
              className={`h-20 ${
                score === -1
                  ? "bg-red-600 hover:bg-red-700 border-red-500"
                  : "border-red-500/50 hover:border-red-500"
              }`}
              onClick={() => {
                setScore(-1)
                setSelectedTags([])
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <ThumbsDown className="h-6 w-6" />
                <span className="font-semibold">{t.common.negative || "Negatif"}</span>
              </div>
            </Button>
          </div>
        </div>

        {score !== null && (
          <>
            <div>
              <Label className="text-white mb-3 block">
                {t.common.selectTags || "Etiketler Seçin"} (En fazla 5)
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag.value}
                    variant={selectedTags.includes(tag.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.value)}
                    className={
                      selectedTags.includes(tag.value)
                        ? score === 1
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                        : ""
                    }
                  >
                    {tag.label[language]}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {selectedTags.length}/5 {t.common.tagsSelected || "etiket seçildi"}
              </p>
            </div>

            <div>
              <Label htmlFor="comment" className="text-white mb-2 block">
                {t.common.comment || "Yorum"} ({t.common.optional || "İsteğe bağlı"})
              </Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t.common.addComment || "Deneyiminizi paylaşın..."}
              />
              <p className="text-xs text-gray-400 mt-1">
                {comment.length}/500
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedTags.length === 0}
                variant="valorant"
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.submitting || "Gönderiliyor..."}
                  </>
                ) : (
                  t.common.submit || "Gönder"
                )}
              </Button>
              <Button
                onClick={onCancel}
                disabled={isSubmitting}
                variant="outline"
                className="flex-1"
              >
                {t.common.cancel || "İptal"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
