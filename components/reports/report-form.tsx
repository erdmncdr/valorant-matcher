"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/i18n/language-context"

interface ReportFormProps {
  targetUserId: string
  listingId?: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReportForm({ targetUserId, listingId, onSuccess, onCancel }: ReportFormProps) {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: "ON_PLATFORM" as "IN_GAME" | "ON_PLATFORM",
    reason: "VERBAL_ABUSE" as string,
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.description.length < 10) {
      toast({
        title: t.common.error || "Error",
        description: t.reports.minCharacters || "Please provide at least 10 characters description",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          listingId,
          category: formData.category,
          reason: formData.reason,
          description: formData.description,
        }),
      })

      if (response.ok) {
        toast({
          title: t.common.success || "Success",
          description: t.reports.reportSuccess || "Report submitted successfully. Our team will review it.",
        })
        onSuccess()
      } else {
        const data = await response.json()
        toast({
          title: t.common.error || "Error",
          description: data.error || t.reports.reportError || "Failed to submit report",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.common.error || "Error",
        description: t.reports.reportError || "Failed to submit report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-valorant-red/10 border border-valorant-red/30 rounded-lg p-3 flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-valorant-red flex-shrink-0 mt-0.5" />
        <div className="text-sm text-white">
          <p className="font-semibold mb-1">{t.reports.reportPolicy}</p>
          <p className="text-gray-300">
            {t.reports.reportPolicyDesc}
          </p>
        </div>
      </div>

      <div>
        <Label className="text-white">{t.reports.category}</Label>
        <Select
          value={formData.category}
          onValueChange={(value: "IN_GAME" | "ON_PLATFORM") =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_GAME">{t.reports.categoryInGame}</SelectItem>
            <SelectItem value="ON_PLATFORM">{t.reports.categoryOnPlatform}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          {formData.category === "IN_GAME"
            ? t.reports.categoryInGameDesc
            : t.reports.categoryOnPlatformDesc}
        </p>
      </div>

      <div>
        <Label className="text-white">{t.reports.reason}</Label>
        <Select
          value={formData.reason}
          onValueChange={(value) => setFormData({ ...formData, reason: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOXIC_VOICE">{t.reports.reasonToxicVoice}</SelectItem>
            <SelectItem value="VERBAL_ABUSE">{t.reports.reasonVerbalAbuse}</SelectItem>
            <SelectItem value="INSULTS">{t.reports.reasonInsults}</SelectItem>
            <SelectItem value="RACISM">{t.reports.reasonRacism}</SelectItem>
            <SelectItem value="SEXISM">{t.reports.reasonSexism}</SelectItem>
            <SelectItem value="HARASSMENT">{t.reports.reasonHarassment}</SelectItem>
            <SelectItem value="GRIEFING">{t.reports.reasonGriefing}</SelectItem>
            <SelectItem value="CHEATING_SUSPICION">{t.reports.reasonCheatingSuspicion}</SelectItem>
            <SelectItem value="SPAM">{t.reports.reasonSpam}</SelectItem>
            <SelectItem value="INAPPROPRIATE_CONTENT">{t.reports.reasonInappropriateContent}</SelectItem>
            <SelectItem value="OTHER">{t.reports.reasonOther}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">{t.reports.description}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t.reports.descriptionPlaceholder}
          className="mt-2 min-h-[120px]"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.description.length}/1000 {t.common.characters || "characters"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          {t.common.cancel || "Cancel"}
        </Button>
        <Button
          type="submit"
          variant="valorant"
          disabled={isSubmitting || formData.description.length < 10}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.common.submitting || "Submitting..."}
            </>
          ) : (
            <>
              <AlertTriangle className="mr-2 h-4 w-4" />
              {t.common.submitReport || "Submit Report"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
