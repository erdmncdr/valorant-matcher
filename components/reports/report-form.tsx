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
        description: "Please provide at least 10 characters description",
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
          description: "Report submitted successfully. Our team will review it.",
        })
        onSuccess()
      } else {
        const data = await response.json()
        toast({
          title: t.common.error || "Error",
          description: data.error || "Failed to submit report",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.common.error || "Error",
        description: "Failed to submit report",
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
          <p className="font-semibold mb-1">Report Policy</p>
          <p className="text-gray-300">
            False reports may result in penalties. Only report genuine violations of our community guidelines.
          </p>
        </div>
      </div>

      <div>
        <Label className="text-white">Category</Label>
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
            <SelectItem value="IN_GAME">In-Game Behavior</SelectItem>
            <SelectItem value="ON_PLATFORM">Platform Behavior</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-400 mt-1">
          {formData.category === "IN_GAME"
            ? "Issues during actual gameplay"
            : "Issues on this website/platform"}
        </p>
      </div>

      <div>
        <Label className="text-white">Reason</Label>
        <Select
          value={formData.reason}
          onValueChange={(value) => setFormData({ ...formData, reason: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOXIC_VOICE">Toxic Voice Chat</SelectItem>
            <SelectItem value="VERBAL_ABUSE">Verbal Abuse</SelectItem>
            <SelectItem value="INSULTS">Insults</SelectItem>
            <SelectItem value="RACISM">Racism</SelectItem>
            <SelectItem value="SEXISM">Sexism</SelectItem>
            <SelectItem value="HARASSMENT">Harassment</SelectItem>
            <SelectItem value="GRIEFING">Griefing</SelectItem>
            <SelectItem value="CHEATING_SUSPICION">Cheating Suspicion</SelectItem>
            <SelectItem value="SPAM">Spam</SelectItem>
            <SelectItem value="INAPPROPRIATE_CONTENT">Inappropriate Content</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-white">Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Please describe the issue in detail (minimum 10 characters)..."
          className="mt-2 min-h-[120px]"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.description.length}/1000 characters
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
